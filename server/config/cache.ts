import Redis from 'ioredis';

// Initialize Redis only if configuration is available
const createRedisClient = () => {
  try {
    return new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  } catch (error) {
    console.warn('Redis configuration not available, running without cache');
    return null;
  }
};

const redis = createRedisClient();

// Connection event handlers
if (redis) {
  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
}

// Cache categories (rarely change)
export async function getCachedCategories() {
  if (!redis) return null;
  
  try {
    const cached = await redis.get('categories:active');
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.warn('Redis cache miss for categories:', error);
    return null;
  }
}

export async function setCachedCategories(categories: any[]) {
  if (!redis) return;
  
  try {
    await redis.setex('categories:active', 300, JSON.stringify(categories)); // 5 min cache
  } catch (error) {
    console.warn('Failed to cache categories:', error);
  }
}

// Cache featured products
export async function getCachedFeaturedProducts() {
  if (!redis) return null;
  
  try {
    const cached = await redis.get('products:featured');
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.warn('Redis cache miss for featured products:', error);
    return null;
  }
}

export async function setCachedFeaturedProducts(products: any[]) {
  if (!redis) return;
  
  try {
    await redis.setex('products:featured', 180, JSON.stringify(products)); // 3 min cache
  } catch (error) {
    console.warn('Failed to cache featured products:', error);
  }
}

// Cache individual products
export async function getCachedProduct(productId: string) {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(`product:${productId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.warn(`Redis cache miss for product ${productId}:`, error);
    return null;
  }
}

export async function setCachedProduct(productId: string, product: any) {
  if (!redis) return;
  
  try {
    await redis.setex(`product:${productId}`, 120, JSON.stringify(product)); // 2 min cache
  } catch (error) {
    console.warn(`Failed to cache product ${productId}:`, error);
  }
}

// Clear product cache when updated
export async function clearProductCache(productId?: string) {
  if (!redis) return;
  
  try {
    if (productId) {
      await redis.del(`product:${productId}`);
    }
    // Clear related caches
    await redis.del('products:featured');
    await redis.del('categories:active');
  } catch (error) {
    console.warn('Failed to clear product cache:', error);
  }
}

// Graceful shutdown
export async function closeRedisConnection() {
  if (redis) {
    console.log('Closing Redis connection...');
    await redis.quit();
  }
}

export { redis };