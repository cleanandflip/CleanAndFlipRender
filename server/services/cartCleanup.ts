// ADDITIVE: Cart cleanup service for locality enforcement
import { modeFromProduct } from '../../shared/fulfillment';

export async function purgeLocalOnlyItemsIfIneligible(userId: string, reason: string = 'unknown'): Promise<{ removed: number }> {
  console.log(`[CART CLEANUP] Starting purge for user=${userId} reason=${reason}`);
  
  try {
    const { storage } = await import('../storage');
    
    // 1) Get all cart items with products joined
    const items = await storage.getCartItemsWithProducts(userId);
    console.log(`[CART CLEANUP] Found ${items.length} cart items for user=${userId}`);
    
    // 2) Filter LOCAL_ONLY items
    const localOnlyItems = items.filter(item => {
      if (!item.product) return false;
      const mode = modeFromProduct(item.product);
      return mode === 'LOCAL_ONLY';
    });
    
    console.log(`[CART CLEANUP] Found ${localOnlyItems.length} LOCAL_ONLY items for user=${userId}`);
    
    // 3) Remove each LOCAL_ONLY item
    let removed = 0;
    for (const item of localOnlyItems) {
      const rowCount = await storage.removeFromCartByUserAndProduct(userId, item.productId);
      if (rowCount > 0) {
        removed++;
      }
    }
    
    console.log(`[CART CLEANUP] user=${userId} removed=${removed} reason=${reason}`);
    return { removed };
    
  } catch (error) {
    console.error(`[CART CLEANUP] Error for user=${userId}:`, error);
    return { removed: 0 };
  }
}