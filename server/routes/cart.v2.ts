import express from "express";
import { getCartOwnerId } from "../utils/cartOwner";
import { db } from "../db";

const router = express.Router();

// GET /api/cart - Get cart for current owner
router.get("/api/cart", async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    console.log(`[CART V2] GET cart for owner: ${ownerId}`);
    
    // Use global storage instance
    const storage = global.storage;
    if (storage.consolidateAndClampCart) {
      await storage.consolidateAndClampCart(ownerId);
    }
    
    const cart = await storage.getCartByOwner(ownerId);
    return res.json(cart);
  } catch (error) {
    console.error('[CART V2] GET error:', error);
    next(error);
  }
});

// POST /api/cart - Add/update cart item
router.post("/api/cart", async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { productId, qty, variantId } = req.body || {};
    
    if (!productId || typeof qty !== "number" || qty <= 0) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }
    
    console.log(`[CART V2] POST add item:`, { ownerId, productId, qty });
    
    // Use global storage instance
    const storage = global.storage;
    const result = await storage.addOrUpdateCartItem(ownerId, productId, variantId ?? null, qty);
    return res.status(201).json({ 
      ok: true, 
      status: result.upserted === 'updated' ? 'UPDATED' : 'ADDED',
      item: result.item 
    });
  } catch (error) {
    console.error('[CART V2] POST error:', error);
    next(error);
  }
});

// PATCH /api/cart/product/:productId - Set absolute quantity
router.patch("/api/cart/product/:productId", async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { productId } = req.params;
    const { qty } = req.body || {};
    
    if (typeof qty !== "number" || qty < 0) {
      return res.status(400).json({ error: "INVALID_QTY" });
    }
    
    console.log(`[CART V2] PATCH set qty:`, { ownerId, productId, qty });
    
    // Use global storage instance
    const storage = global.storage;
    const result = await storage.setCartItemQty(ownerId, productId, null, qty);
    return res.json({ ok: true, qty: result.qty || 0 });
  } catch (error) {
    console.error('[CART V2] PATCH error:', error);
    next(error);
  }
});

// DELETE /api/cart/product/:productId - Remove product from cart
router.delete("/api/cart/product/:productId", async (req, res, next) => {
  try {
    const ownerId = getCartOwnerId(req);
    const { productId } = req.params;
    
    console.log(`[CART V2] DELETE product:`, { ownerId, productId });
    
    // Use global storage instance
    const storage = global.storage;
    const result = await storage.removeCartItemsByProduct(ownerId, productId);
    return res.json({ ok: true, removed: result.removed });
  } catch (error) {
    console.error('[CART V2] DELETE error:', error);
    next(error);
  }
});

export default router;
export const cartRouterV2 = router;