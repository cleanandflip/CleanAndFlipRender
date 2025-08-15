import { storage } from "../storage";

export async function getAvailableStock(productId: string): Promise<number> {
  // Get product stock using existing storage interface
  const product = await storage.getProduct(productId);
  if (!product || product.stockQuantity === null || product.stockQuantity === undefined) {
    return Number.MAX_SAFE_INTEGER;
  }
  return typeof product.stockQuantity === "number" ? product.stockQuantity : Number.MAX_SAFE_INTEGER;
}