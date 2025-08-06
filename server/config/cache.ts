// Use the clean cache abstraction
import { getCache } from '../lib/cache';

const cache = getCache();

// Cache categories (rarely change)
export async function getCachedCategories() {
  return await cache.get('categories:active');
}

export async function setCachedCategories(categories: any[]) {
  await cache.set('categories:active', categories, 300); // 5 min cache
}

// Cache featured products
export async function getCachedFeaturedProducts() {
  return await cache.get('products:featured');
}

export async function setCachedFeaturedProducts(products: any[]) {
  await cache.set('products:featured', products, 180); // 3 min cache
}

// Cache individual products
export async function getCachedProduct(productId: string) {
  return await cache.get(`product:${productId}`);
}

export async function setCachedProduct(productId: string, product: any) {
  await cache.set(`product:${productId}`, product, 120); // 2 min cache
}

// Clear product cache when product is updated
export async function clearProductCache(productId?: string) {
  if (productId) {
    await cache.del(`product:${productId}`);
  }
  // Also clear related caches
  await cache.del('products:featured');
  await cache.del('categories:active');
}

// Graceful shutdown
export async function closeRedisConnection() {
  // No-op for memory cache, Redis cleanup handled in initRedis
}

// Export cache for backward compatibility
export const redis = null;