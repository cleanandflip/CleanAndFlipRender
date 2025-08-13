import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { isAuthenticated } from '../middleware/auth';
import { isLocalMiles } from '../lib/locality';
import { guardCartItemAgainstLocality } from '../services/cartGuard';

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

// Upsert cart item (idempotent add/update) with locality validation
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = addToCartSchema.parse(req.body);
    
    // Get user's locality status
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault);
    const localityResult = defaultAddress ? 
      isLocalMiles(defaultAddress.latitude, defaultAddress.longitude) : 
      { isLocal: false };
    
    // Get product to check availability
    const product = await storage.getProduct(data.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Guard against locality restrictions
    try {
      guardCartItemAgainstLocality({
        userIsLocal: localityResult.isLocal,
        product: {
          is_local_delivery_available: product.isLocalDeliveryAvailable,
          is_shipping_available: product.isShippingAvailable
        }
      });
    } catch (error: any) {
      if (error.code === 'LOCALITY_RESTRICTED') {
        return res.status(409).json({ 
          error: error.message,
          code: 'LOCALITY_RESTRICTED'
        });
      }
      throw error;
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