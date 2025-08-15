import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { getLocalityForRequest } from '../services/localityService';
import { guardCartItemAgainstLocality } from '../services/cartGuard';

const router = Router();

// POST /api/cart/validate - Validate entire cart against current locality
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's locality status
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    const localityResult = defaultAddress ? 
      isLocalMiles(defaultAddress.latitude, defaultAddress.longitude) : 
      { isLocal: false };
    
    // Get cart items with product details
    const cart = await storage.getCart(userId);
    const restrictedItems = [];
    const validItems = [];
    
    for (const item of cart.items) {
      try {
        guardCartItemAgainstLocality({
          userIsLocal: localityResult.isLocal,
          product: {
            is_local_delivery_available: item.product.is_local_delivery_available,
            is_shipping_available: item.product.is_shipping_available
          }
        });
        validItems.push(item);
      } catch (error: any) {
        restrictedItems.push({
          ...item,
          restrictionReason: error.message
        });
      }
    }
    
    res.json({
      isLocal: localityResult.isLocal,
      validItems,
      restrictedItems,
      hasRestrictions: restrictedItems.length > 0
    });
    
  } catch (error) {
    console.error('Cart validation error:', error);
    res.status(500).json({ error: 'Failed to validate cart' });
  }
});

export default router;