import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';
import { isLocalMiles, guardCartItemAgainstLocality } from '../utils/fulfillment';

const router = Router();

// Add to cart schema
const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  variantId: z.string().optional()
});

// Cart endpoints with optimistic UI support
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = (req as any).sessionId;
    
    // Support both authenticated users and guest sessions
    if (!userId && !sessionId) {
      return res.json({
        ok: true,
        data: { items: [], subtotal: 0, total: 0, id: null, shippingAddressId: null }
      });
    }
    const cart = await storage.getCart(userId || sessionId);
    
    // Return consistent cart structure with ok wrapper
    res.json({
      ok: true,
      data: {
        items: cart?.items || [],
        subtotal: cart?.subtotal || 0
      }
    });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch cart',
      items: [],
      subtotal: 0
    });
  }
});

// Upsert cart item (idempotent add/update) with locality validation
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = addToCartSchema.parse(req.body);
    
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(a => a.isDefault) ?? addresses[0];
    const { isLocal } = defaultAddress
      ? isLocalMiles(Number(defaultAddress.latitude), Number(defaultAddress.longitude))
      : { isLocal: false };

    const product = await storage.getProduct(data.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // New fulfillment enforcement for two-value system
    const { fulfillment_mode } = product;
    if (fulfillment_mode === 'LOCAL_ONLY' && !isLocal) {
      return res.status(403).json({
        code: 'LOCAL_ONLY_RESTRICTED',
        message: 'This item is available for local delivery only.'
      });
    }
    
    const cart = await storage.addToCartLegacy(userId, data.productId, data.quantity);
    
    res.json({
      ok: true,
      data: {
        items: cart.items,
        subtotal: cart.subtotal
      }
    });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    res.status(400).json({ 
      message: error instanceof z.ZodError ? 'Invalid request data' : 'Failed to add to cart'
    });
  }
});

// Update item quantity
router.patch('/:itemId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
    
    const cart = await storage.updateCartItemLegacy(userId, itemId, quantity);
    
    res.json({
      ok: true,
      data: {
        items: cart.items,
        subtotal: cart.subtotal
      }
    });
  } catch (error) {
    console.error('PATCH /api/cart/:itemId error:', error);
    res.status(400).json({ message: 'Failed to update cart item' });
  }
});

// Remove item from cart - standardized RESTful endpoint
router.delete('/:itemId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    
    const cart = await storage.removeFromCartLegacy(userId, itemId);
    
    res.json({
      ok: true,
      data: {
        items: cart.items,
        subtotal: cart.subtotal
      }
    });
  } catch (error) {
    console.error('DELETE /api/cart/:itemId error:', error);
    res.status(400).json({ 
      ok: false,
      error: 'REMOVAL_FAILED',
      message: 'Failed to remove item from cart'
    });
  }
});

// REMOVED - This route was conflicting with the main DELETE route in routes.ts

// Cart validation endpoint
router.post('/validate', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const cart = await storage.getCart(userId);
    
    // Check for availability issues
    const issues: string[] = [];
    for (const item of cart?.items || []) {
      const product = await storage.getProduct(item.productId);
      if (!product) {
        issues.push(`Product ${item.productId} no longer available`);
      } else if ((product.stockQuantity || 0) < item.quantity) {
        issues.push(`${product.name}: Only ${product.stockQuantity || 0} available (requested ${item.quantity})`);
      }
    }
    
    res.json({
      ok: true,
      data: {
        valid: issues.length === 0,
        issues
      }
    });
  } catch (error) {
    console.error('POST /api/cart/validate error:', error);
    res.status(500).json({
      ok: false,
      error: 'VALIDATION_FAILED',
      message: 'Failed to validate cart'
    });
  }
});

export default router;