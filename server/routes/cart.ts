import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Add to cart schema
const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  variantId: z.string().optional()
});

// Cart endpoints with optimistic UI support
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const cart = await storage.getCart(userId);
    
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

// Upsert cart item (idempotent add/update)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = addToCartSchema.parse(req.body);
    
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

// Alternative route for legacy compatibility
router.delete('/items/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;
    
    const cart = await storage.removeFromCartLegacy(userId, productId);
    
    res.json({
      ok: true,
      data: {
        items: cart.items,
        subtotal: cart.subtotal
      }
    });
  } catch (error) {
    console.error('DELETE /api/cart/items/:productId error:', error);
    res.status(400).json({ 
      ok: false,
      error: 'REMOVAL_FAILED',
      message: 'Failed to remove item from cart'
    });
  }
});

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