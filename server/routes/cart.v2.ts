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
    const product = await storage.getProductById(productId);
    
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const mode = modeFromProduct(product);
    const locality = await getLocalityForRequest(req); // unified evaluator

    console.log('[CART ENFORCE V2]', {
      user: userId || 'guest',
      productId,
      mode,
      eligible: locality.eligible,
      source: locality.source,
      zip: locality.zipUsed || 'none',
    });

    if (mode === 'LOCAL_ONLY' && !locality.eligible) {
      return res.status(403).json({
        code: 'LOCAL_ONLY_NOT_ELIGIBLE',
        message: 'This item is local delivery only and not available in your area.',
        resolution: 'Set a default local address in Asheville ZIPs (28801, 28803, 28804, 28805, 28806, 28808) or enter a local ZIP.',
      });
    }

    // Add item to cart using storage layer
    const item = await storage.addToCart(userId || req.sessionID, productId, quantity);
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
    const cart = await storage.getCart(userId || req.sessionID);
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
    await storage.removeFromCart(userId || req.sessionID, req.params.itemId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});