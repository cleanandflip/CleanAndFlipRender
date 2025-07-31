import { createClient } from 'redis';
import { logger } from './logger';

let redisClient: any = null;
let redisEnabled = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

export const initRedis = async () => {
  // Check if Redis should be disabled
  if (process.env.DISABLE_REDIS === 'true') {
    logger.info('🔸 Redis caching disabled by environment variable', { type: 'system' });
    return null;
  }

  if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
    return null; // Stop trying after max attempts
  }

  try {
    connectionAttempts++;
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (attempts) => {
          if (attempts > MAX_RETRY_ATTEMPTS) {
            redisEnabled = false;
            return false; // Stop reconnecting
          }
          return Math.min(attempts * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err: any) => {
      // Only log once, not every error
      if (err.code === 'ECONNREFUSED' && connectionAttempts === 1) {
        logger.warn('⚠️  Redis unavailable - running without cache layer', { type: 'system' });
      }
    });

    await redisClient.connect();
    redisEnabled = true;
    logger.info('✅ Redis connected successfully', { type: 'system' });
    return redisClient;
  } catch (error) {
    if (connectionAttempts === 1) {
      logger.warn('⚠️  Redis not available - continuing without caching', { type: 'system' });
    }
    redisEnabled = false;
    return null;
  }
};

export const getCacheClient = () => redisEnabled ? redisClient : null;
export const isRedisEnabled = () => redisEnabled;

// Export cache functions with Redis client fallback
export async function getCached(key: string) {
  if (!redisEnabled || !redisClient) return null;
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

export async function setCache(key: string, data: any, ttl: number) {
  if (!redisEnabled || !redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    // Silently fail for caching
  }
}

export async function clearCache(pattern: string) {
  if (!redisEnabled || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    // Silently fail for cache clearing
  }
}