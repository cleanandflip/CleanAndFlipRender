// Use the clean cache abstraction
import { getCache } from '../lib/cache';

const cache = getCache();

// Cache categories (rarely change)
export async function getCachedCategories() {
  try {
    return await cache.get('categories:active');
  } catch (error) {
    console.error('Cache get operation failed:', error);
    return null; // Return null if cache fails (graceful degradation)
  }
}

export async function setCachedCategories(categories: any[]) {
  try {
    await cache.set('categories:active', categories, 300); // 5 min cache
  } catch (error) {
    console.error('Cache set operation failed:', error);
    // Continue without caching - non-critical failure
  }
}

// Cache featured products
export async function getCachedFeaturedProducts() {
  try {
    return await cache.get('products:featured');
  } catch (error) {
    console.error('Cache get operation failed:', error);
    return null; // Return null if cache fails (graceful degradation)
  }
}

export async function setCachedFeaturedProducts(products: any[]) {
  try {
    await cache.set('products:featured', products, 180); // 3 min cache
  } catch (error) {
    console.error('Cache set operation failed:', error);
    // Continue without caching - non-critical failure
  }
}

// Cache individual products
export async function getCachedProduct(productId: string) {
  try {
    return await cache.get(`product:${productId}`);
  } catch (error) {
    console.error('Cache get operation failed:', error);
    return null; // Return null if cache fails (graceful degradation)
  }
}

export async function setCachedProduct(productId: string, product: any) {
  try {
    await cache.set(`product:${productId}`, product, 120); // 2 min cache
  } catch (error) {
    console.error('Cache set operation failed:', error);
    // Continue without caching - non-critical failure
  }
}

// Clear product cache when product is updated
export async function clearProductCache(productId?: string) {
  try {
    if (productId) {
      await cache.del(`product:${productId}`);
    }
    // Also clear related caches
    await cache.del('products:featured');
    await cache.del('categories:active');
  } catch (error) {
    console.error('Cache clear operation failed:', error);
    // Continue - cache clear failure is non-critical
  }
}

// Graceful shutdown
export async function closeRedisConnection() {
  // No-op for memory cache, Redis cleanup handled in initRedis
}

// Export cache for backward compatibility
export const redis = null;