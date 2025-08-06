import { createClient } from 'redis';
import { logger } from './logger';
import { Logger } from '../utils/logger';

let redisClient: any = null;
let redisEnabled = false;
let connectionAttempts = 0;
let hasLoggedWarning = false;
const MAX_RETRY_ATTEMPTS = 1; // Only try once to eliminate spam

const ENABLE_REDIS = process.env.ENABLE_REDIS === 'true';

export const initRedis = async () => {
  // Check if Redis should be disabled
  if (!ENABLE_REDIS || process.env.DISABLE_REDIS === 'true') {
    if (!hasLoggedWarning) {
      logger.info('🔸 Redis caching disabled by environment variable', { type: 'system' });
      hasLoggedWarning = true;
    }
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
        reconnectStrategy: () => false, // Disable reconnection to prevent spam
        connectTimeout: 1000, // Quick timeout
      }
    });

    // Silent error handling - no spam
    redisClient.on('error', () => {
      if (!hasLoggedWarning) {
        logger.warn('⚠️  Redis unavailable - running without cache layer', { type: 'system' });
        hasLoggedWarning = true;
      }
      redisEnabled = false;
    });

    await redisClient.connect();
    redisEnabled = true;
    logger.info('✅ Redis connected successfully', { type: 'system' });
    return redisClient;
  } catch (error) {
    if (!hasLoggedWarning) {
      logger.warn('⚠️  Redis not available - continuing without caching', { type: 'system' });
      hasLoggedWarning = true;
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