import { modeFromProduct } from '../../shared/fulfillment';

export async function purgeLocalOnlyItemsIfIneligible(userId: string) {
  try {
    const { storage } = await import('../storage');
    const items = await storage.getCartItems(userId, /* include product */ undefined);

    const localOnlyItemIds = items
      .filter(i => i.product && modeFromProduct(i.product) === 'LOCAL_ONLY')
      .map(i => i.id);

    let removed = 0;
    for (const id of localOnlyItemIds) {
      await storage.removeFromCart(id); // use existing method; do not rename it
      removed++;
    }
    return { removed };
  } catch (e) {
    console.error('[cartCleanup] purge error', e);
    return { removed: 0 };
  }
}