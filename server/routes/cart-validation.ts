import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { getLocalityForRequest } from '../services/localityService';
// guardCartItemAgainstLocality is re-exported at bottom of this module

const router = Router();

// POST /* SSOT-FORBIDDEN /api/cart(?!\.v2) */ /api/cart/validate - Validate entire cart against current locality
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's locality status
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    const localityResult = defaultAddress ? 
      /* SSOT-FORBIDDEN \bisLocalMiles\( */ isLocalMiles(defaultAddress.latitude as any, defaultAddress.longitude as any) : 
      { isLocal: false };
    
    // Get cart items with product details
    const cart = await storage.getCart(userId);
    const restrictedItems: any[] = [];
    const validItems: any[] = [];
    
    for (const item of (cart?.items || [])) {
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
// [MERGED FROM] /home/runner/workspace/server/services/cartGuard.ts
export function guardCartItemAgainstLocality({
  userIsLocal,
  product
}: {
  userIsLocal: boolean;
  product: { is_local_delivery_available?: boolean; is_shipping_available?: boolean };
}) {
  const localOnly = product.is_local_delivery_available && !product.is_shipping_available;
  if (!userIsLocal && localOnly) {
    const err: any = new Error("Local Delivery only. This item isn't available to ship to your address.");
    err.code = "LOCALITY_RESTRICTED";
    err.http = 409;
    throw err;
  }
}
