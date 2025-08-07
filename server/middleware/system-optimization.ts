import express from 'express';
import { Logger } from '../config/logger.js';
import { analyticsService } from '../services/analytics.service.js';

// Enhanced request tracking and optimization
export const systemOptimization = {
  // Request tracking and analytics
  trackRequest: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Add request ID
    (req as any).id = requestId;
    res.set('X-Request-ID', requestId);
    
    // Track the request
    analyticsService.trackActivity(
      (req as any).userId || null,
      'page_view',
      {
        resource: 'api',
        resourceId: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    // Log response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      Logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
  },

  // Performance monitoring
  performanceMonitor: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      // Log slow requests
      if (duration > 1000) {
        Logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
      }
      
      // Track performance metrics
      if (duration > 500) {
        analyticsService.trackActivity(
          (req as any).userId || null,
          'performance_issue',
          {
            resource: 'api',
            resourceId: req.path,
            duration,
            method: req.method
          }
        );
      }
    });
    
    next();
  },

  // Memory and resource optimization
  resourceOptimization: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Set response timeout
    const timeout = 30000; // 30 seconds
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeout);
    
    res.on('finish', () => {
      clearTimeout(timer);
    });
    
    // Monitor memory usage for high-traffic endpoints
    if (req.path.includes('/api/products') || req.path.includes('/api/admin')) {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
        Logger.warn(`High memory usage detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      }
    }
    
    next();
  }
};

// Database connection optimization
export const dbOptimization = {
  // Connection pool monitoring
  monitorConnections: () => {
    setInterval(() => {
      // This would integrate with your database connection pool
      // For now, just log a health check
      Logger.debug('Database connection pool health check');
    }, 60000); // Every minute
  },

  // Query optimization hints
  optimizeQuery: (queryType: string) => {
    const optimizations = {
      'product-search': {
        useIndex: 'idx_products_search',
        limit: 50,
        cacheKey: 'products-search'
      },
      'user-lookup': {
        useIndex: 'idx_users_email',
        limit: 100,
        cacheKey: 'users-lookup'
      }
    };
    
    return optimizations[queryType as keyof typeof optimizations] || {};
  }
};

// Error recovery and resilience
export const errorResilience = {
  // Circuit breaker pattern
  circuitBreaker: (serviceName: string, threshold = 5, timeout = 60000) => {
    let failures = 0;
    let lastFailureTime = 0;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const now = Date.now();
      
      // Check if circuit should reset
      if (state === 'OPEN' && now - lastFailureTime > timeout) {
        state = 'HALF_OPEN';
        failures = 0;
      }
      
      // Block requests if circuit is open
      if (state === 'OPEN') {
        return res.status(503).json({ 
          error: 'Service temporarily unavailable',
          service: serviceName 
        });
      }
      
      // Add error tracking
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 500) {
          failures++;
          lastFailureTime = now;
          
          if (failures >= threshold) {
            state = 'OPEN';
            Logger.error(`Circuit breaker opened for ${serviceName} after ${failures} failures`);
          }
        } else if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
          Logger.info(`Circuit breaker closed for ${serviceName}`);
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  },

  // Automatic retry mechanism
  retryHandler: (maxRetries = 3, delay = 1000) => {
    return async (operation: () => Promise<any>, context: string): Promise<any> => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          Logger.warn(`${context} attempt ${attempt}/${maxRetries} failed:`, error);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
        }
      }
      
      Logger.error(`${context} failed after ${maxRetries} attempts`);
      throw lastError;
    };
  }
};