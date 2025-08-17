import { Router } from "express";
import { z } from "zod";
import { storage } from '../storage';
import { authMiddleware } from '../middleware/auth';
import { getLocalityForRequest } from '../services/localityService';

const router = Router();

const AddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().default("US"),
});

// Get shipping quote
// Shipping quote endpoint for checkout v2
router.post("/quote", authMiddleware.optionalAuth, async (req, res) => {
  try {
    // Handle both addressId and address input formats for checkout v2
    const { addressId, address } = req.body;
    
    let addressData = address;
    
    // If using existing address, fetch it
    if (addressId && !address) {
      const userId = (req as any).user?.id || (req.session as any)?.passport?.user || null;
      if (!userId) return res.status(401).json({ error: 'Authentication required' });
      const fetched = await storage.getAddress(userId, addressId);
      addressData = fetched || null;
    }
    
    if (!addressData) {
      return res.status(400).json({ error: "Address information required" });
    }

    // Get cart total (implement based on session/user)
    const subtotal = 50; // Placeholder - get from actual cart
    
    // Calculate shipping based on location
    let shippingOptions = [];
    
    // Standard shipping always available
    shippingOptions.push({
      id: "standard",
      service: "standard",
      label: "Standard Shipping (5-7 business days)",
      price: 1500, // $15.00 in cents
      eta: "5-7 business days"
    });
    
    // Check if user is in local delivery area via SSOT service
    const locality = await getLocalityForRequest(req);
      
    if (locality.eligible) {
      shippingOptions.push({
        id: "local",
        service: "local",
        label: "Free Local Delivery (1-2 business days)",
        price: 0, // Free local delivery
        eta: "1-2 business days"
      });
    }
    
    // Express shipping
    shippingOptions.push({
      id: "express",
      service: "express", 
      label: "Express Shipping (2-3 business days)",
      price: 2500, // $25.00 in cents
      eta: "2-3 business days"
    });

    const response = {
      quotes: shippingOptions,
      subtotal: subtotal * 100, // Convert to cents
      tax: Math.round(subtotal * 0.08 * 100), // 8% tax in cents
      currency: "USD"
    };

    res.json(response);
  } catch (error) {
    console.error("Error calculating shipping quote:", error);
    res.status(500).json({ error: "Failed to calculate shipping quote" });
  }
});

// Checkout submit endpoint for checkout v2
router.post("/submit", async (req, res) => {
  try {
    const { addressId, quoteId, contact, deliveryInstructions } = req.body;
    
    if (!addressId || !quoteId) {
      return res.status(400).json({ error: "Address and shipping method required" });
    }
    
    // Here you would:
    // 1. Create/update the order with shipping address
    // 2. Lock in the shipping method
    // 3. Create Stripe payment intent
    // 4. Return payment URL
    
    // For now, simulate a successful response
    const paymentUrl = `/payment?session=checkout_session_${Date.now()}`;
    
    res.json({ url: paymentUrl });
  } catch (error) {
    console.error("Error submitting checkout:", error);
    res.status(500).json({ error: "Failed to submit checkout" });
  }
});

export default router;