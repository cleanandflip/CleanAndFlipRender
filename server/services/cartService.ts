import { storage } from "../storage";

type Item = { id: string; ownerId: string; productId: string; variantId: string | null; quantity: number; };

const key = (i: Item) => `${i.productId}::${i.variantId ?? "NOVAR"}`;

export async function consolidateAndClampCart(ownerId: string) {
  const items: Item[] = await storage.getCartItemsByOwner(ownerId);
  const byKey = new Map<string, Item>();
  
  for (const it of items) {
    const k = key(it);
    if (!byKey.has(k)) {
      byKey.set(k, { ...it });
    } else {
      byKey.get(k)!.quantity += it.quantity;
    }
  }
  
  for (const [k, merged] of byKey) {
    const product = await storage.getProduct(merged.productId);
    const stock = product?.stock ?? 0;
    const clampedQty = Math.max(0, Math.min(merged.quantity, stock));
    
    const dupes = items.filter(i => key(i) === k);
    
    // First row is canonical
    if (dupes[0]) {
      await storage.updateCartItemQuantity(dupes[0].id, clampedQty);
    }
    
    // Remove duplicates
    for (let i = 1; i < dupes.length; i++) {
      await storage.removeCartItem(dupes[i].id);
    }
    
    // Remove if quantity is 0
    if (!clampedQty && dupes[0]) {
      await storage.removeCartItem(dupes[0].id);
    }
  }
}

export async function mergeSessionCartIntoUser(sessionOwner: string, userId: string) {
  if (!sessionOwner || !userId || sessionOwner === userId) return;
  
  const items: Item[] = await storage.getCartItemsByOwner(sessionOwner);
  if (!items.length) return;

  // Re-key to userId
  for (const it of items) {
    await storage.updateCartItemOwner(it.id, userId);
  }

  // De-dupe + clamp at user
  await consolidateAndClampCart(userId);
}