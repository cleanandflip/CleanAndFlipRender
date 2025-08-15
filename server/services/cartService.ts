import { storage } from "../storage";
import { getAvailableStock } from "./stockService";

type CartItem = {
  id: string;
  ownerId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
};

function keyOf(i: CartItem) {
  return `${i.productId}::${i.variantId ?? "NOVAR"}`;
}

// Merge duplicates and clamp by stock
export async function consolidateAndClampCart(ownerId: string) {
  const items: CartItem[] = await storage.getCartItemsByOwner(ownerId);

  // Group by (productId, variantId)
  const byKey = new Map<string, CartItem>();
  for (const it of items) {
    const k = keyOf(it);
    if (!byKey.has(k)) byKey.set(k, { ...it });
    else byKey.get(k)!.quantity += it.quantity;
  }

  // Clamp by stock and apply writes
  for (const [k, merged] of byKey) {
    const stock = await getAvailableStock(merged.productId);
    const clampedQty = Math.max(0, Math.min(merged.quantity, stock));

    // Remove all duplicates for this key
    const dupes = items.filter((i) => keyOf(i) === k);
    for (let idx = 0; idx < dupes.length; idx++) {
      const d = dupes[idx];
      if (idx === 0) {
        // First one becomes the canonical row
        await storage.updateCartItemQty(d.id, clampedQty);
      } else {
        await storage.removeCartItemById(d.id);
      }
    }

    // If clamped to 0, remove canonical too
    if (clampedQty === 0) {
      const canonical = dupes[0];
      if (canonical) await storage.removeCartItemById(canonical.id);
    }
  }
}

// Add or increase, consolidating and validating stock
export async function addToCartConsolidating(ownerId: string, productId: string, qty: number, variantId?: string | null) {
  if (qty <= 0) throw new Error("Quantity must be positive");

  const stock = await getAvailableStock(productId);

  // Find existing canonical item (first match)
  const items: CartItem[] = await storage.findCartItems(ownerId, productId, variantId ?? null);
  const existing = items[0];

  const newQty = Math.min(stock, (existing?.quantity ?? 0) + qty);
  if (newQty <= 0) {
    if (existing) await storage.removeCartItemById(existing.id);
    return { status: "REMOVED_EMPTY_OR_OUT_OF_STOCK", qty: 0, available: stock };
  }

  if (existing) {
    await storage.updateCartItemQty(existing.id, newQty);
    // Remove any extras beyond the first one (duplicates)
    for (let i = 1; i < items.length; i++) await storage.removeCartItemById(items[i].id);
  } else {
    await storage.createCartItem({ ownerId, productId, variantId: variantId ?? null, quantity: newQty });
  }

  const capped = newQty < ((existing?.quantity ?? 0) + qty);
  return { status: capped ? "ADDED_PARTIAL_STOCK_CAP" : "ADDED", qty: newQty, available: stock };
}

// Clamp cart on demand (e.g., GET /api/cart)
export async function clampCartToStock(ownerId: string) {
  await consolidateAndClampCart(ownerId);
}