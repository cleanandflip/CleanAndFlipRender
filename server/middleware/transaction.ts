import { db } from "../db";
import { Request, Response, NextFunction } from 'express';
import { eq, and } from "drizzle-orm";
import { products, cartItems, orders } from "@shared/schema";

// Database transaction wrapper for race condition prevention
export async function withTransaction<T>(
  operation: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    return await operation(tx as any);
  });
}

// Stock management with atomic operations
export async function atomicStockUpdate(
  productId: string,
  quantityToReduce: number,
  tx: any = db
): Promise<{ success: boolean; availableStock?: number; error?: string }> {
  try {
    // Lock the product row for update
    const product = await tx
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .for('update')
      .limit(1);

    if (product.length === 0) {
      return { success: false, error: 'Product not found' };
    }

    const currentStock = product[0].stockQuantity || 0;

    if (currentStock < quantityToReduce) {
      return { 
        success: false, 
        availableStock: currentStock,
        error: `Insufficient stock. Only ${currentStock} available` 
      };
    }

    // Update stock atomically
    await tx
      .update(products)
      .set({ 
        stockQuantity: currentStock - quantityToReduce,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId));

    return { success: true, availableStock: currentStock - quantityToReduce };
  } catch (error) {
    console.error('Atomic stock update error:', error);
    return { success: false, error: 'Database error during stock update' };
  }
}

// Cart operation with race condition protection
export async function atomicCartOperation(
  userId: string,
  productId: string,
  quantity: number,
  operation: 'add' | 'update' | 'remove'
): Promise<{ success: boolean; error?: string; cartItem?: any }> {
  return await withTransaction(async (tx) => {
    try {
      // Lock cart item if it exists
      const existingCartItem = await tx
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        ))
        .for('update')
        .limit(1);

      if (operation === 'remove') {
        if (existingCartItem.length === 0) {
          return { success: false, error: 'Cart item not found' };
        }
        
        await tx
          .delete(cartItems)
          .where(eq(cartItems.id, existingCartItem[0].id));
        
        return { success: true };
      }

      if (operation === 'add' || operation === 'update') {
        // Check product availability with lock
        const stockResult = await atomicStockUpdate(productId, 0, tx); // Just check, don't reduce yet
        if (!stockResult.success) {
          return { success: false, error: stockResult.error };
        }

        if ((stockResult.availableStock || 0) < quantity) {
          return { 
            success: false, 
            error: `Only ${stockResult.availableStock} items available` 
          };
        }

        if (existingCartItem.length > 0) {
          // Update existing cart item
          const newQuantity = operation === 'add' 
            ? existingCartItem[0].quantity + quantity 
            : quantity;

          if ((stockResult.availableStock || 0) < newQuantity) {
            return { 
              success: false, 
              error: `Only ${stockResult.availableStock} items available` 
            };
          }

          const [updatedItem] = await tx
            .update(cartItems)
            .set({ 
              quantity: newQuantity,
              updatedAt: new Date()
            })
            .where(eq(cartItems.id, existingCartItem[0].id))
            .returning();

          return { success: true, cartItem: updatedItem };
        } else {
          // Create new cart item
          const [newItem] = await tx
            .insert(cartItems)
            .values({
              userId,
              productId,
              quantity,
              sessionId: null
            })
            .returning();

          return { success: true, cartItem: newItem };
        }
      }

      return { success: false, error: 'Invalid operation' };
    } catch (error) {
      console.error('Atomic cart operation error:', error);
      return { success: false, error: 'Database error during cart operation' };
    }
  });
}

// Order creation with stock reservation
export async function atomicOrderCreation(
  userId: string,
  cartItemsData: Array<{ productId: string; quantity: number; price: number }>
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  return await withTransaction(async (tx) => {
    try {
      // First, lock all products and verify stock
      for (const item of cartItemsData) {
        const stockResult = await atomicStockUpdate(item.productId, item.quantity, tx);
        if (!stockResult.success) {
          return { success: false, error: stockResult.error };
        }
      }

      // Create order with correct schema
      const totalAmount = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: userId,
          status: 'pending' as any,
          total: totalAmount.toString(),
          subtotal: totalAmount.toString(),
          items: cartItemsData as any
        } as any)
        .returning();

      // Clear user's cart
      await tx
        .delete(cartItems)
        .where(eq(cartItems.userId, userId));

      return { success: true, orderId: order.id };
    } catch (error) {
      console.error('Atomic order creation error:', error);
      return { success: false, error: 'Failed to create order' };
    }
  });
}

// Middleware for automatic transaction handling
export function transactionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add transaction helper to request object
  (req as any).withTransaction = withTransaction;
  (req as any).atomicStockUpdate = atomicStockUpdate;
  (req as any).atomicCartOperation = atomicCartOperation;
  (req as any).atomicOrderCreation = atomicOrderCreation;
  
  next();
}

// Deadlock retry wrapper
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a deadlock or serialization failure
      if (error.code === '40P01' || error.code === '40001') {
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Non-retryable error or max retries reached
      throw error;
    }
  }
  
  throw lastError!;
}