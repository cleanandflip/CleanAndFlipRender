// V2 Cart Router - SSOT Locality Enforcement
import { Router } from 'express';
import { modeFromProduct } from '../../shared/fulfillment';
import { getLocalityForRequest, getCartOwnerId } from '../services/localityService';
import { computeEffectiveAvailability } from '../../shared/availability';

export const cartRouterV2 = Router();

// Unified cart add with SSOT locality enforcement
cartRouterV2.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body ?? {};
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const ownerId = getCartOwnerId(req);
    const { storage } = await import('../storage');
    const product = await storage.getProduct(productId);
    
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Get SSOT locality evaluation
    const locality = await getLocalityForRequest(req);
    const productMode = modeFromProduct(product);
    const effectiveness = computeEffectiveAvailability(productMode, locality.effectiveModeForUser);

    console.log(`[CART ENFORCE V2] SSOT evaluation: { ownerId:'${ownerId}', productId:'${productId}', productMode:'${productMode}', userMode:'${locality.effectiveModeForUser}', effectiveness:'${effectiveness}' }`);

    // Enforce business rules
    if (effectiveness === 'BLOCKED') {
      console.log(`[CART ELIGIBILITY_REJECT] { productId:'${productId}', ownerId:'${ownerId}', userMode:'${locality.effectiveModeForUser}', productMode:'${productMode}', reasons:${JSON.stringify(locality.reasons)} }`);
      
      return res.status(422).json({
        error: 'INELIGIBLE',
        reasons: locality.reasons,
        locality: locality // Include full locality context
      });
    }
    
    console.log(`[CART ENFORCE V2] ADD_ALLOWED for ${productId} by ${ownerId}`);

    // Add item to cart
    const cartItemData = {
      productId,
      quantity: Number(quantity) || 1,
      userId: req.session?.user?.id || null,
      sessionId: req.session?.id || 'anonymous',
    };

    const item = await storage.addToCart(cartItemData);
    
    // Return item with current locality context for client cache update
    return res.status(200).json({
      ...item,
      locality: locality
    });
    
  } catch (e) { 
    console.error('[CART ENFORCE V2] Error:', e);
    next(e); 
  }
});

// Get cart with SSOT auto-purge
cartRouterV2.get('/', async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { storage } = await import('../storage');
    
    // Get SSOT locality evaluation
    const locality = await getLocalityForRequest(req);
    
    // Auto-purge ineligible items if needed
    let purgeInfo = { purgedLocalOnly: false, removed: 0 };
    
    if (req.session?.user?.id) {
      const { purgeLocalOnlyItemsIfIneligible } = await import('../services/cartCleanup');
      try {
        const purgeResult = await purgeLocalOnlyItemsIfIneligible(ownerId, locality);
        purgeInfo = { purgedLocalOnly: purgeResult.removed > 0, removed: purgeResult.removed };
      } catch (purgeError) {
        console.warn('[CART V2] Auto-purge failed:', purgeError);
      }
    }
    
    const cartItems = await storage.getCartItems(
      req.session?.user?.id || undefined,
      req.session?.id || 'anonymous'
    );
    
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Return cart with locality context for client
    const cart = { 
      items: items, 
      totals: { subtotal, total: subtotal },
      ownerId: ownerId,
      locality: locality,
      ...purgeInfo
    };
    
    res.json(cart);
  } catch (e) {
    console.error('[CART V2] Error in GET:', e);
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

// DELETE by compound key (ownerId, productId)
cartRouterV2.delete('/product/:productId', async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { productId } = req.params;
    const { storage } = await import('../storage');

    // Use compound DELETE by (ownerId, productId) - authenticated users only
    if (!req.session?.user?.id) {
      return res.status(401).json({ 
        error: 'AUTH_REQUIRED', 
        message: 'Sign in required for compound DELETE' 
      });
    }

    // Try to remove by user + product compound key
    let removed = 0;
    try {
      const result = await storage.removeFromCartByUserAndProduct(req.session.user.id, productId);
      removed = result?.rowCount || 0;
    } catch (error) {
      console.warn('[CART V2] Compound DELETE error, falling back to basic delete:', error);
      // Fallback: find item and delete by ID
      const cartItems = await storage.getCartItems(req.session.user.id);
      const targetItem = cartItems.find(item => item.productId === productId);
      if (targetItem) {
        await storage.removeFromCart(targetItem.id);
        removed = 1;
      }
    }

    console.log(`[CART ENFORCE V2] compound DELETE { ownerId:'${ownerId}', productId:'${productId}', removed:${removed} }`);
    return res.json({ ok: true, removed });
    
  } catch (err) { 
    console.error('[CART V2] DELETE error:', err);
    next(err); 
  }
});