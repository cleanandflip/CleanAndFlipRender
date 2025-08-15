// V2 Cart Router - Single Source with Unified Locality Enforcement
import { Router } from 'express';
import { modeFromProduct } from '../../shared/fulfillment';
import { getLocalityForRequest } from '../locality/getLocalityForRequest';
import { getUserIdFromReq } from '../utils/auth';

export const cartRouterV2 = Router();

// Unified cart add with locality enforcement
cartRouterV2.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body ?? {};
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const userId = getUserIdFromReq(req); // may be null (guest)
    const { storage } = await import('../storage');
    const product = await storage.getProduct(productId); // FIXED: Use correct API
    
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Ensure booleans exist for modeFromProduct
    const safeProduct = {
      ...product,
      isLocalDeliveryAvailable: !!product.isLocalDeliveryAvailable,
      isShippingAvailable: !!product.isShippingAvailable,
    };

    const mode = modeFromProduct(safeProduct);
    const locality = await getLocalityForRequest(req); // unified evaluator

    console.log('[CART ENFORCE V2]', {
      user: userId || 'guest',
      productId,
      mode,
      eligible: locality.eligible,
      source: locality.source,
      zip: locality.zipUsed || 'none',
    });

    // Business rule enforcement - return 403, never throw
    if (mode === 'LOCAL_ONLY' && !locality.eligible) {
      console.log(`[CART ENFORCE V2] add { userId:'${userId || 'guest'}', productId:'${productId}', eligible:${locality.eligible}, decision:'BLOCK' }`);
      return res.status(403).json({
        ok: false,
        code: 'LOCALITY_BLOCKED',
        message: 'This item is local delivery only.',
        resolution: 'Add a local address to continue.'
      });
    }
    
    console.log(`[CART ENFORCE V2] add { userId:'${userId || 'guest'}', productId:'${productId}', eligible:${locality.eligible}, decision:'ALLOW' }`);

    // Add item to cart using correct storage API
    const cartItemData = {
      productId,
      quantity: Number(quantity) || 1,
      userId,
      sessionId: req.sessionID,
    };

    const item = await storage.addToCart(cartItemData);
    return res.status(200).json(item);
  } catch (e) { 
    console.error('[CART ENFORCE V2] Error:', e);
    next(e); 
  }
});

// Get cart
cartRouterV2.get('/', async (req, res, next) => {
  try {
    const userId = getUserIdFromReq(req);
    const { storage } = await import('../storage');
    
    // ADDITIVE: Check if we need to auto-purge LOCAL_ONLY items for authenticated users
    let purgeInfo = { purgedLocalOnly: false, removed: 0 };
    
    if (userId) {
      const locality = await getLocalityForRequest(req);
      if (!locality.eligible) {
        // Check if user has LOCAL_ONLY items and purge them
        const items = await storage.getCartItemsWithProducts(userId);
        const hasLocalOnly = items.some(item => {
          if (!item.product) return false;
          const mode = modeFromProduct(item.product);
          return mode === 'LOCAL_ONLY';
        });
        
        if (hasLocalOnly) {
          const { purgeLocalOnlyItemsIfIneligible } = await import('../services/cartCleanup');
          const purgeResult = await purgeLocalOnlyItemsIfIneligible(userId, 'cart_get');
          purgeInfo = { purgedLocalOnly: true, removed: purgeResult.removed };
        }
      }
    }
    
    const cartItems = await storage.getCartItems(
      userId || undefined,
      req.sessionID
    );
    
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Build the cart response with purge info
    const cart = { 
      id: `cart-${userId || req.sessionID}`, 
      items: items, 
      subtotal: subtotal, 
      total: subtotal,
      ...purgeInfo
    };
    
    res.json({ ok: true, data: cart });
  } catch (e) {
    next(e);
  }
});

// Remove from cart
cartRouterV2.delete('/items/:itemId', async (req, res, next) => {
  try {
    const userId = getUserIdFromReq(req);
    const { storage } = await import('../storage');
    await storage.removeFromCart(req.params.itemId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// NEW: alias route – delete by productId for the authenticated user
cartRouterV2.delete('/product/:productId', async (req, res, next) => {
  try {
    const userId = req.session?.user?.id as string | undefined;
    if (!userId) return res.status(401).json({ ok:false, code:'AUTH_REQUIRED', message:'Sign in required' });

    const { productId } = req.params;
    const { storage } = await import('../storage');

    // Use existing storage API with new compound-key helper
    const result = await storage.removeFromCartByUserAndProduct(userId, productId);
    const removed = result.rowCount;
    console.log(`[CART ENFORCE V2] delete by product { userId:'${userId}', productId:'${productId}', removed:${removed} }`);
    return res.json({ ok:true, removed });
  } catch (err) { next(err); }
});