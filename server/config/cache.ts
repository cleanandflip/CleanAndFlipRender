// Use the optimized Redis client from redis.ts
import { getCacheClient, getCached, setCache, clearCache } from './redis';

const getRedis = () => getCacheClient();

// Cache categories (rarely change)
export async function getCachedCategories() {
  return await getCached('categories:active');
}

export async function setCachedCategories(categories: any[]) {
  await setCache('categories:active', categories, 300); // 5 min cache
}

// Cache featured products
export async function getCachedFeaturedProducts() {
  return await getCached('products:featured');
}

export async function setCachedFeaturedProducts(products: any[]) {
  await setCache('products:featured', products, 180); // 3 min cache
}

// Cache individual products
export async function getCachedProduct(productId: string) {
  return await getCached(`product:${productId}`);
}

export async function setCachedProduct(productId: string, product: any) {
  await setCache(`product:${productId}`, product, 120); // 2 min cache
}

// Clear product cache when product is updated
export async function clearProductCache(productId?: string) {
  if (productId) {
    await clearCache(`product:${productId}`);
  }
  // Also clear related caches
  await clearCache('products:featured');
  await clearCache('categories:active');
}

// Graceful shutdown
export async function closeRedisConnection() {
  const redisClient = getRedis();
  if (redisClient) {
    console.log('Closing Redis connection...');
    await redisClient.quit();
  }
}

// Export the Redis client getter for backward compatibility
export const redis = getRedis();