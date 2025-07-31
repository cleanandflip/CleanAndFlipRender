// Clean cache abstraction with memory fallback
interface CacheInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

class MemoryCache implements CacheInterface {
  private cache = new Map<string, { value: any; expires?: number }>();
  
  async get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key: string, value: any, ttl?: number) {
    const expires = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.cache.set(key, { value, expires });
    
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
  }
  
  async del(key: string) {
    this.cache.delete(key);
  }
  
  async clear() {
    this.cache.clear();
  }
}

class RedisCache implements CacheInterface {
  constructor(private client: any) {}
  
  async get(key: string) {
    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  
  async set(key: string, value: any, ttl?: number) {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
    } catch {
      // Silent fail
    }
  }
  
  async del(key: string) {
    try {
      await this.client.del(key);
    } catch {
      // Silent fail
    }
  }
  
  async clear() {
    try {
      await this.client.flushDb();
    } catch {
      // Silent fail
    }
  }
}

// Initialize cache based on availability
let cacheInstance: CacheInterface;

export function initializeCache(redisClient?: any): CacheInterface {
  if (redisClient && process.env.ENABLE_REDIS === 'true') {
    cacheInstance = new RedisCache(redisClient);
  } else {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}

export function getCache(): CacheInterface {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}