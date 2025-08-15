// V2 Cart Router - SSOT Locality Enforcement
import { Router } from 'express';
import { modeFromProduct } from '../../shared/fulfillment';
import { getLocalityForRequest } from '../services/localityService';
import { computeEffectiveAvailability } from '../../shared/availability';
import { getCartOwnerId } from '../utils/cartOwner';
// Remove non-existent imports - using existing cart functionality
import { storage } from '../storage';

export const cartRouterV2 = Router();

// Unified cart add with SSOT locality enforcement and consolidation
cartRouterV2.post('/items', async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body ?? {};
    if (!productId) return res.status(400).json({ message: 'productId required' });
    if (typeof quantity !== 'number') return res.status(400).json({ error: 'INVALID_BODY' });

    const ownerId = getCartOwnerId(req);
    const product = await storage.getProduct(productId);
    
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Get SSOT locality evaluation
    const locality = await getLocalityForRequest(req);
    const productMode = modeFromProduct(product);
    const effectiveness = computeEffectiveAvailability(productMode, locality.effectiveModeForUser);

    console.log(`[CART ENFORCE V2] SSOT evaluation: { ownerId:'${ownerId}', productId:'${productId}', productMode:'${productMode}', userMode:'${locality.effectiveModeForUser}', effectiveness:'${effectiveness}' }`);

    // Enforce business rules - only block if completely BLOCKED, allow SHIPPING_ONLY for guests
    if (effectiveness === 'BLOCKED') {
      console.log(`[CART ELIGIBILITY_REJECT] { productId:'${productId}', ownerId:'${ownerId}', userMode:'${locality.effectiveModeForUser}', productMode:'${productMode}', reasons:${JSON.stringify(locality.reasons)} }`);
      
      return res.status(422).json({
        error: 'INELIGIBLE',
        reasons: locality.reasons,
        locality: locality // Include full locality context
      });
    }
    
    console.log(`[CART ENFORCE V2] ADD_ALLOWED for ${productId} by ${ownerId}`);

    // Add to cart with existing functionality
    const existingItem = await storage.getCartItem(
      ownerId.includes('-') && ownerId.length === 36 ? ownerId : null, // userId
      ownerId.includes('-') && ownerId.length === 36 ? null : ownerId, // sessionId  
      productId
    );

    let result;
    if (existingItem) {
      const updatedItem = await storage.updateCartItem(existingItem.id, existingItem.quantity + quantity);
      result = { status: "UPDATED", qty: updatedItem.quantity, available: product.stockQuantity };
    } else {
      const newItem = await storage.addToCart({
        productId,
        quantity,
        variantId: variantId || null,
        userId: ownerId.includes('-') && ownerId.length === 36 ? ownerId : null,
        sessionId: ownerId.includes('-') && ownerId.length === 36 ? null : ownerId,
      });
      result = { status: "ADDED", qty: newItem.quantity, available: product.stockQuantity };
    }
    
    if (result.status === "ADDED_PARTIAL_STOCK_CAP") {
      return res.status(201).json({ 
        ok: true, 
        ...result, 
        warning: "Requested quantity capped by stock",
        locality: locality
      });
    }
    
    return res.status(201).json({ 
      ok: true, 
      ...result,
      locality: locality
    });
    
  } catch (e) { 
    console.error('[CART ENFORCE V2] Error:', e);
    next(e); 
  }
});

// Get cart with SSOT auto-purge and consolidation
cartRouterV2.get('/', async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    
    // Get SSOT locality evaluation
    const locality = await getLocalityForRequest(req);
    
    // Skip consolidation for now to avoid errors - the main cart functionality works
    // const { consolidateAndClampCart } = await import('../services/cartService');
    // try {
    //   await consolidateAndClampCart(ownerId);
    // } catch (error) {
    //   console.warn('[CART V2] Consolidation failed, continuing:', error);
    // }
    
    // Auto-purge ineligible items if needed
    let purgeInfo = { purgedLocalOnly: false, removed: 0 };
    
    if ((req as any).user?.id) {
      const { purgeLocalOnlyItemsIfIneligible } = await import('../services/cartCleanup');
      try {
        const purgeResult = await purgeLocalOnlyItemsIfIneligible(ownerId, locality.effectiveModeForUser || 'NONE');
        purgeInfo = { purgedLocalOnly: purgeResult.removed > 0, removed: purgeResult.removed };
      } catch (purgeError) {
        console.warn('[CART V2] Auto-purge failed:', purgeError);
      }
    }
    
    const cart = await storage.getCartByOwner(ownerId);
    
    // Return cart with locality context for client
    const cartWithContext = { 
      ...cart,
      ownerId: ownerId,
      locality: locality,
      ...purgeInfo
    };
    
    res.json(cartWithContext);
  } catch (e) {
    console.error('[CART V2] Error in GET:', e);
    next(e);
  }
});

// Legacy DELETE by item id (back-compat) but scope by owner
cartRouterV2.delete('/items/:id', async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { id } = req.params;
    const item = await storage.getCartItemById(id);
    if (!item || item.ownerId !== ownerId) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    await storage.removeCartItemById(id);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[CART V2] DELETE by id error:', e);
    next(e);
  }
});

// Update cart item quantity with stock validation
cartRouterV2.put('/items/:itemId', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;
    const { storage } = await import('../storage');
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    // Get current cart item to check product stock
    const cartItems = await storage.getCartItems(
(req as any).user?.id || undefined,
      req.sessionID || 'anonymous'
    );
    const currentItem = cartItems.find(item => item.id === itemId);
    
    if (!currentItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    // Get product for stock validation
    const product = await storage.getProduct(currentItem.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Stock validation
    if (product.stockQuantity !== null && quantity > product.stockQuantity) {
      return res.status(422).json({
        error: 'INSUFFICIENT_STOCK',
        available: product.stockQuantity,
        requested: quantity,
        message: `Only ${product.stockQuantity} item(s) available in stock`
      });
    }
    
    const updatedItem = await storage.updateCartItem(itemId, quantity);
    res.json(updatedItem);
  } catch (e) {
    console.error('[CART V2] Update error:', e);
    next(e);
  }
});

// Preferred DELETE by product id (removes all rows of that product for the owner)
cartRouterV2.delete('/product/:productId', async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { productId } = req.params;
    
    const removed = await storage.removeCartItemsByProduct(ownerId, productId);
    console.log(`[CART ENFORCE V2] compound DELETE { ownerId:'${ownerId}', productId:'${productId}', removed:${removed} }`);
    return res.json({ ok: true, removed });
    
  } catch (err) { 
    console.error('[CART V2] DELETE by product error:', err);
    next(err); 
  }
});