/**
 * Shipping Quotes API - Implementation from punch list
 */

import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { addresses } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { haversineMiles } from '../../shared/geo';

const { requireAuth } = authMiddleware;
const router = express.Router();

// Warehouse coordinates (example - adjust to your actual location)
const WAREHOUSE_COORDS = { lat: 40.7128, lon: -74.0060 }; // NYC example
const LOCAL_DELIVERY_MAX_MILES = 30;

const ShippingQuoteSchema = z.object({
  addressId: z.string().optional(),
  // For "new address" flow
  street1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// POST /api/shipping/quote
router.post('/quote', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validatedData = ShippingQuoteSchema.parse(req.body);

    let addressCoords: { lat: number; lon: number } | null = null;

    if (validatedData.addressId) {
      // Use saved address
      const address = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, validatedData.addressId))
        .limit(1);

      if (!address.length) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (address[0].latitude && address[0].longitude) {
        addressCoords = { 
          lat: parseFloat(address[0].latitude), 
          lon: parseFloat(address[0].longitude) 
        };
      }
    } else if (validatedData.latitude && validatedData.longitude) {
      // Use provided coordinates for "new address"
      addressCoords = { 
        lat: validatedData.latitude, 
        lon: validatedData.longitude 
      };
    }

    const methods = [];

    if (addressCoords) {
      const distanceMiles = haversineMiles(WAREHOUSE_COORDS, addressCoords);
      
      if (distanceMiles <= LOCAL_DELIVERY_MAX_MILES) {
        methods.push({
          code: "LOCAL",
          label: `Local delivery (≤30 miles - ${distanceMiles.toFixed(1)} miles from warehouse)`,
          cost: 0,
          eta: "24–48h"
        });
      }
      
      // Always offer pickup
      methods.push({
        code: "PICKUP",
        label: "Pickup at warehouse",
        cost: 0,
        eta: "Ready for pickup"
      });

      // For distant addresses, offer freight
      if (distanceMiles > LOCAL_DELIVERY_MAX_MILES) {
        methods.push({
          code: "FREIGHT_TBD",
          label: "Freight shipping (quoted after order)",
          cost: null,
          eta: "5-10 business days"
        });
      }
    } else {
      // Fallback when no coordinates available
      methods.push({
        code: "FREIGHT_TBD",
        label: "Freight shipping (quoted after order)",
        cost: null,
        eta: "5-10 business days"
      });
      methods.push({
        code: "PICKUP",
        label: "Pickup at warehouse",
        cost: 0,
        eta: "Ready for pickup"
      });
    }

    res.json({ methods });
  } catch (error) {
    console.error('Error generating shipping quote:', error);
    res.status(500).json({ error: 'Failed to generate shipping quote' });
  }
});

// GET /api/user/locality - Check if user is local based on default address
router.get('/user/locality', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    
    const defaultAddress = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .where(eq(addresses.isDefault, true))
      .limit(1);

    if (!defaultAddress.length || !defaultAddress[0].latitude || !defaultAddress[0].longitude) {
      return res.json({ isLocal: false, distanceMiles: null });
    }

    const addressCoords = {
      lat: parseFloat(defaultAddress[0].latitude),
      lon: parseFloat(defaultAddress[0].longitude)
    };

    const distanceMiles = haversineMiles(WAREHOUSE_COORDS, addressCoords);
    const isLocal = distanceMiles <= LOCAL_DELIVERY_MAX_MILES;

    res.json({ isLocal, distanceMiles });
  } catch (error) {
    console.error('Error checking locality:', error);
    res.status(500).json({ error: 'Failed to check locality' });
  }
});

export default router;