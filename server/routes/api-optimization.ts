import express from 'express';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      rateLimit?: {
        resetTime?: number;
      };
    }
  }
}
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// API optimization middleware
export const apiOptimization = {
  // Compression middleware
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return true;
    }
  }),

  // Advanced rate limiting
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000)
      });
    }
  }),

  // Request consolidation middleware
  requestConsolidation: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Add cache headers for GET requests
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Vary': 'Accept-Encoding'
      });
    }
    
    // Add request ID for tracking
    req.id = Math.random().toString(36).substring(2, 15);
    res.set('X-Request-ID', req.id);
    
    next();
  },

  // Response optimization
  responseOptimization: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(obj: any) {
      // Add pagination helpers
      if (obj && typeof obj === 'object' && obj.data && Array.isArray(obj.data)) {
        obj.meta = {
          total: obj.total || obj.data.length,
          page: obj.page || 1,
          limit: obj.limit || obj.data.length,
          hasNext: obj.data.length === (obj.limit || 20),
          timestamp: new Date().toISOString()
        };
      }
      
      return originalJson.call(this, obj);
    };
    
    next();
  }
};

// Request batching helper
export class RequestBatcher {
  private batches = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  
  batch(key: string, request: any, batchSize = 10, delay = 100): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }
      
      const batch = this.batches.get(key)!;
      batch.push({ request, resolve, reject });
      
      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }
      
      // Set new timer or execute if batch is full
      if (batch.length >= batchSize) {
        this.executeBatch(key);
      } else {
        this.timers.set(key, setTimeout(() => {
          this.executeBatch(key);
        }, delay));
      }
    });
  }
  
  private async executeBatch(key: string) {
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) return;
    
    this.batches.delete(key);
    this.timers.delete(key);
    
    try {
      // Execute batch operation
      const results = await this.processBatch(key, batch.map(b => b.request));
      
      // Resolve individual promises
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises on error
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
  
  private async processBatch(key: string, requests: any[]): Promise<any[]> {
    // Implement specific batch processing logic based on key
    switch (key) {
      case 'product-fetch':
        return this.batchProductFetch(requests);
      case 'user-lookup':
        return this.batchUserLookup(requests);
      default:
        throw new Error(`Unknown batch key: ${key}`);
    }
  }
  
  private async batchProductFetch(requests: any[]): Promise<any[]> {
    // Implement batch product fetching
    return requests.map(req => ({ id: req.id, data: 'batched-result' }));
  }
  
  private async batchUserLookup(requests: any[]): Promise<any[]> {
    // Implement batch user lookup
    return requests.map(req => ({ id: req.id, data: 'batched-result' }));
  }
}

export const requestBatcher = new RequestBatcher();