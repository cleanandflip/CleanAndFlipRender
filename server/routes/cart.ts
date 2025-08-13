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
    
    // Return consistent cart structure
    res.json({
      items: cart?.items || [],
      subtotal: cart?.subtotal || 0
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
    
    const cart = await storage.addToCart(userId, data.productId, data.quantity, data.variantId);
    
    res.json({
      items: cart.items,
      subtotal: cart.subtotal
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
    
    const cart = await storage.updateCartItem(userId, itemId, quantity);
    
    res.json({
      items: cart.items,
      subtotal: cart.subtotal
    });
  } catch (error) {
    console.error('PATCH /api/cart/:itemId error:', error);
    res.status(400).json({ message: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/:itemId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    
    const cart = await storage.removeFromCart(userId, itemId);
    
    res.json({
      items: cart.items,
      subtotal: cart.subtotal
    });
  } catch (error) {
    console.error('DELETE /api/cart/:itemId error:', error);
    res.status(400).json({ message: 'Failed to remove from cart' });
  }
});

// Remove by product ID (for Add to Cart button remove functionality)
router.delete('/remove/:productId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;
    
    const cart = await storage.removeFromCartByProductId(userId, productId);
    
    res.json({
      items: cart.items,
      subtotal: cart.subtotal
    });
  } catch (error) {
    console.error('DELETE /api/cart/remove/:productId error:', error);
    res.status(400).json({ message: 'Failed to remove from cart' });
  }
});

// Validate cart (check availability, pricing)
router.post('/validate', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validation = await storage.validateCart(userId);
    
    res.json(validation);
  } catch (error) {
    console.error('POST /api/cart/validate error:', error);
    res.status(400).json({ message: 'Failed to validate cart' });
  }
});

export default router;