import Redis from "ioredis";
import { logger } from "./logger";

// Types
interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

// Configuration
const CACHE_PREFIX = "cleanflip:";
const DEFAULT_TTL = 3600; // 1 hour
const MAX_RETRY_ATTEMPTS = 1;
const ENABLE_REDIS = process.env.ENABLE_REDIS === "true";

// State
let redisClient: Redis | null = null;
let redisEnabled = false;
let connectionAttempts = 0;
let hasLoggedWarning = false;

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<Redis | null> => {
  // Check if Redis should be disabled
  if (!ENABLE_REDIS || process.env.DISABLE_REDIS === "true") {
    if (!hasLoggedWarning) {
      logger.info("🔸 Redis caching disabled by environment variable", {
        type: "system",
      });
      hasLoggedWarning = true;
    }
    return null;
  }

  if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
    return null; // Stop trying after max attempts
  }

  try {
    connectionAttempts++;
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    // Silent error handling - no spam
    redisClient.on("error", () => {
      if (!hasLoggedWarning) {
        logger.warn("⚠️  Redis unavailable - running without cache layer", {
          type: "system",
        });
        hasLoggedWarning = true;
      }
      redisEnabled = false;
    });

    await redisClient.connect();
    redisEnabled = true;
    logger.info("✅ Redis connected successfully", { type: "system" });
    return redisClient;
  } catch (error) {
    if (!hasLoggedWarning) {
      logger.warn("⚠️  Redis not available - continuing without caching", {
        type: "system",
      });
      hasLoggedWarning = true;
    }
    redisEnabled = false;
    return null;
  }
};

/**
 * Get the Redis client instance
 */
export const getCacheClient = (): Redis | null => {
  return redisEnabled ? redisClient : null;
};

/**
 * Check if Redis is enabled and connected
 */
export const isRedisEnabled = (): boolean => {
  return redisEnabled;
};

/**
 * Get cached value by key
 */
export async function getCached<T = any>(key: string): Promise<T | null> {
  if (!redisEnabled || !redisClient) return null;
  try {
    const cached = await redisClient.get(CACHE_PREFIX + key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Set cache value with TTL
 */
export async function setCache(
  key: string,
  data: any,
  ttl: number = DEFAULT_TTL,
): Promise<void> {
  if (!redisEnabled || !redisClient) return;
  try {
    await redisClient.setex(CACHE_PREFIX + key, ttl, JSON.stringify(data));
  } catch (error) {
    // Silently fail for caching
  }
}

/**
 * Clear cache by pattern
 */
export async function clearCache(pattern: string): Promise<void> {
  if (!redisEnabled || !redisClient) return;
  try {
    const keys = await redisClient.keys(CACHE_PREFIX + pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    // Silently fail for cache clearing
  }
}

/**
 * Delete specific cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redisEnabled || !redisClient) return false;
  try {
    const result = await redisClient.del(CACHE_PREFIX + key);
    return result === 1;
  } catch (error) {
    return false;
  }
}

/**
 * Check if cache key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (!redisEnabled || !redisClient) return false;
  try {
    return (await redisClient.exists(CACHE_PREFIX + key)) === 1;
  } catch {
    return false;
  }
}

/**
 * Get remaining TTL for a key
 */
export async function getCacheTTL(key: string): Promise<number> {
  if (!redisEnabled || !redisClient) return -1;
  try {
    return await redisClient.ttl(CACHE_PREFIX + key);
  } catch {
    return -1;
  }
}

/**
 * Increment a counter
 */
export async function incrementCounter(
  key: string,
  ttl?: number,
): Promise<number> {
  if (!redisEnabled || !redisClient) return 0;
  try {
    const fullKey = CACHE_PREFIX + key;
    const result = await redisClient.incr(fullKey);
    if (ttl) {
      await redisClient.expire(fullKey, ttl);
    }
    return result;
  } catch {
    return 0;
  }
}

/**
 * Cache wrapper for functions
 */
export async function cacheWrapper<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await setCache(key, result, ttl);
  return result;
}

/**
 * Batch get multiple keys
 */
export async function getBatchCached<T = any>(
  keys: string[],
): Promise<(T | null)[]> {
  if (!redisEnabled || !redisClient) {
    return keys.map(() => null);
  }

  try {
    const prefixedKeys = keys.map((k) => CACHE_PREFIX + k);
    const values = await redisClient.mget(...prefixedKeys);
    return values.map((v: any) => (v ? JSON.parse(v) : null));
  } catch {
    return keys.map(() => null);
  }
}

/**
 * Batch set multiple keys
 */
export async function setBatchCache(
  items: Array<{ key: string; data: any; ttl?: number }>,
): Promise<void> {
  if (!redisEnabled || !redisClient) return;

  try {
    const pipeline = redisClient.multi();

    for (const item of items) {
      const fullKey = CACHE_PREFIX + item.key;
      const ttl = item.ttl || DEFAULT_TTL;
      pipeline.setex(fullKey, ttl, JSON.stringify(item.data));
    }

    await pipeline.exec();
  } catch {
    // Silently fail
  }
}

/**
 * Flush all cache (use with caution)
 */
export async function flushCache(): Promise<void> {
  if (!redisEnabled || !redisClient) return;
  try {
    const keys = await redisClient.keys(CACHE_PREFIX + "*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  enabled: boolean;
  connected: boolean;
  keyCount?: number;
  memory?: string;
}> {
  const stats = {
    enabled: ENABLE_REDIS,
    connected: redisEnabled,
  };

  if (redisEnabled && redisClient) {
    try {
      const info = await redisClient.info("memory");
      const keyCount = await redisClient.dbsize();

      return {
        ...stats,
        keyCount,
        memory: info
          .split("\n")
          .find((line) => line.startsWith("used_memory_human"))
          ?.split(":")[1]
          ?.trim(),
      };
    } catch {
      return stats;
    }
  }

  return stats;
}

// Export all functions as a cache object for convenience
export const cache = {
  init: initRedis,
  get: getCached,
  set: setCache,
  delete: deleteCache,
  clear: clearCache,
  exists: cacheExists,
  ttl: getCacheTTL,
  increment: incrementCounter,
  wrapper: cacheWrapper,
  getBatch: getBatchCached,
  setBatch: setBatchCache,
  flush: flushCache,
  stats: getCacheStats,
  isEnabled: isRedisEnabled,
  client: getCacheClient,
};

// Default export
export default cache;
