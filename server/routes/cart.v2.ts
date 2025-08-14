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
      return res.status(403).json({
        code: 'LOCAL_ONLY_NOT_ELIGIBLE',
        message: 'This item is local delivery only and not available in your area.',
        resolution: 'Set a default local address in Asheville ZIPs (28801, 28803, 28804, 28805, 28806, 28808) or enter a local ZIP.',
      });
    }

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
    
    const cartItems = await storage.getCartItems(
      userId || undefined,
      req.sessionID
    );
    
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const cart = { 
      id: `cart-${userId || req.sessionID}`, 
      items: items, 
      subtotal: subtotal, 
      total: subtotal
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