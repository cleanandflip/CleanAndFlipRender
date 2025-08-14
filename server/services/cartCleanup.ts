import { modeFromProduct } from '../../shared/fulfillment';

export async function purgeLocalOnlyItemsIfIneligible(userId: string) {
  try {
    const { storage } = await import('../storage');
    
    // Get all cart items for user
    const items = await storage.getCartItems(userId, undefined);
    
    // Filter for LOCAL_ONLY items
    const localOnlyItems = items.filter(item => {
      if (!item.product) return false;
      return modeFromProduct(item.product) === 'LOCAL_ONLY';
    });

    if (localOnlyItems.length === 0) return { removed: 0 };

    // Remove LOCAL_ONLY items
    let removed = 0;
    for (const item of localOnlyItems) {
      await storage.removeFromCart(item.id);
      removed++;
    }

    return { removed };
  } catch (error) {
    console.error('Error purging local-only cart items:', error);
    return { removed: 0 };
  }
}