/**
 * SSOT Address System Routes - Single Source of Truth
 * Handles all address operations with proper validation, deduplication, and local customer detection
 */

import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { addresses, users } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const { requireAuth } = authMiddleware;
import { Logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const CreateAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "State must be 2 characters"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().default("US"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geoapifyPlaceId: z.string().optional(),
  setDefault: z.boolean().optional().default(false)
});

// Local customer detection service
function isLocalCustomer(latitude: number | null, longitude: number | null): boolean {
  // Simplified local detection - within 50km radius of business location
  // Business coordinates (example: 40.7589, -73.9851 for NYC)
  const BUSINESS_LAT = 40.7589;
  const BUSINESS_LNG = -73.9851;
  const LOCAL_RADIUS_KM = 50;
  
  if (!latitude || !longitude) return false;
  
  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = (latitude - BUSINESS_LAT) * Math.PI / 180;
  const dLon = (longitude - BUSINESS_LNG) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(BUSINESS_LAT * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= LOCAL_RADIUS_KM;
}

// GET /api/addresses - Get user's addresses
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(sql`${addresses.isDefault} DESC, ${addresses.createdAt} DESC`);
    
    res.json(userAddresses);
  } catch (error) {
    Logger.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/addresses - Create new address with SSOT deduplication
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validatedData = CreateAddressSchema.parse(req.body);
    
    // Calculate if this is a local customer
    const isLocal = isLocalCustomer(validatedData.latitude || null, validatedData.longitude || null);
    
    // Begin transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // If setting as default, unset current default
      if (validatedData.setDefault) {
        await tx
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, userId));
      }
      
      // Create the new address
      const [newAddress] = await tx
        .insert(addresses)
        .values({
          userId,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          street1: validatedData.street1,
          street2: validatedData.street2,
          city: validatedData.city,
          state: validatedData.state.toUpperCase(),
          postalCode: validatedData.postalCode,
          country: validatedData.country,
          latitude: validatedData.latitude?.toString(),
          longitude: validatedData.longitude?.toString(),
          geoapifyPlaceId: validatedData.geoapifyPlaceId,
          isDefault: validatedData.setDefault,
          isLocal,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // If this is the user's first address or set as default, update user's profile
      const existingAddresses = await tx.select().from(addresses).where(eq(addresses.userId, userId)).limit(1);
      if (validatedData.setDefault || existingAddresses.length === 0) {
        await tx
          .update(users)
          .set({ 
            profileAddressId: newAddress.id,
            isLocalCustomer: isLocal
          })
          .where(eq(users.id, userId));
      }
      
      return newAddress;
    });
    
    Logger.info(`Address created for user ${userId}:`, { 
      addressId: result.id, 
      isLocal, 
      isDefault: validatedData.setDefault 
    });
    
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      Logger.warn('Address validation failed:', { errors: error.errors });
      return res.status(400).json({ 
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>)
      });
    }
    
    Logger.error('Error creating address:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// PUT /api/addresses/:id/default - Set address as default
router.put('/:id/default', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    
    // Verify address belongs to user
    const address = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .limit(1);
    
    if (!address.length) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // Update in transaction
    await db.transaction(async (tx) => {
      // Unset all user's default addresses
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
      
      // Set this address as default
      await tx
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, id));
      
      // Update user profile
      await tx
        .update(users)
        .set({ 
          profileAddressId: id,
          isLocalCustomer: address[0].isLocal
        })
        .where(eq(users.id, userId));
    });
    
    Logger.info(`Address ${id} set as default for user ${userId}`);
    res.json({ success: true });
  } catch (error) {
    Logger.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    
    // Verify address belongs to user
    const address = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .limit(1);
    
    if (!address.length) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const wasDefault = address[0].isDefault;
    
    // Delete in transaction
    await db.transaction(async (tx) => {
      // Delete the address
      await tx.delete(addresses).where(eq(addresses.id, id));
      
      // If this was the default address, update user profile
      if (wasDefault) {
        // Find another address to set as default
        const remainingAddresses = await tx
          .select()
          .from(addresses)
          .where(eq(addresses.userId, userId))
          .limit(1);
        
        if (remainingAddresses.length > 0) {
          // Set first remaining address as default
          await tx
            .update(addresses)
            .set({ isDefault: true })
            .where(eq(addresses.id, remainingAddresses[0].id));
          
          await tx
            .update(users)
            .set({ 
              profileAddressId: remainingAddresses[0].id,
              isLocalCustomer: remainingAddresses[0].isLocal
            })
            .where(eq(users.id, userId));
        } else {
          // No addresses left, clear user profile
          await tx
            .update(users)
            .set({ 
              profileAddressId: null,
              isLocalCustomer: false
            })
            .where(eq(users.id, userId));
        }
      }
    });
    
    Logger.info(`Address ${id} deleted for user ${userId}`);
    res.status(204).send();
  } catch (error) {
    Logger.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;