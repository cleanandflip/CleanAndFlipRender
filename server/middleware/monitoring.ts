import { Request, Response, NextFunction } from 'express';

// Performance monitoring middleware
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response time
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      const { Logger } = require('../utils/logger');
      Logger.warn(`SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Timestamp', new Date().toISOString());
    
    return originalSend.call(this, data);
  };

  next();
}

// Database query monitoring
export function logDatabaseQuery(query: string, duration: number) {
  if (duration > 500) { // Log queries slower than 500ms
    const { Logger } = require('../utils/logger');
    Logger.warn(`SLOW QUERY (${duration}ms): ${query.substring(0, 100)}...`);
  }
}

// Health check endpoint
export function createHealthCheck() {
  return async (req: Request, res: Response) => {
    const healthChecks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'checking',
        memory: 'ok',
        disk: 'ok'
      }
    };

    try {
      // Database connectivity check (simplified)
      const { storage } = await import('../storage');
      await storage.getCategories(); // Simple query to test DB
      healthChecks.checks.database = 'ok';
    } catch (error) {
      healthChecks.checks.database = 'error';
      healthChecks.status = 'degraded';
      const { Logger } = require('../utils/logger');
      Logger.error('Health check database error:', error);
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (memUsageMB > 512) { // Alert if using > 512MB
      healthChecks.checks.memory = 'warning';
      const { Logger } = require('../utils/logger');
      Logger.warn(`High memory usage: ${memUsageMB}MB`);
    }

    const statusCode = healthChecks.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthChecks);
  };
}

// Request logging middleware - OPTIMIZED WITH FILTERING
export function requestLogging(req: Request, res: Response, next: NextFunction) {
  const url = req.url;
  
  // Skip patterns for development files and assets
  const skipPatterns = [
    '/@vite', '/@fs', '/@react-refresh', 
    '/node_modules', '.js', '.css', '.map',
    'hot-update', 'chunk-', '/src/', '/@id',
    '.tsx', '.ts', '.jsx', '?import', '?t=', '?v='
  ];
  
  // Skip if URL matches any skip pattern
  if (skipPatterns.some(pattern => url?.includes(pattern))) {
    return next(); // Skip logging development files
  }
  
  // Skip versioned assets and query params
  if (url?.includes('?t=') || url?.includes('?v=') || url?.includes('?import')) {
    return next();
  }
  
  // This middleware now delegates to the main logger system
  // No duplicate logging - the main logger handles all request logging
  next();
}

// Error tracking middleware
export function errorTracking(err: any, req: Request, res: Response, next: NextFunction) {
  const errorId = Math.random().toString(36).substring(2, 15);
  
  const errorDetails = {
    id: errorId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Use Logger instead of console.error
  const { Logger } = require('../utils/logger');
  Logger.error('Error tracked:', errorDetails);

  // In production, you would send this to an error tracking service like Sentry
  // Sentry.captureException(err);

  // Don't expose internal error details to client
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    errorId: errorId, // Reference ID for support
    timestamp: errorDetails.timestamp
  });
}

// Rate limit exceeded handler
export function rateLimitHandler(req: Request, res: Response) {
  const errorDetails = {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please try again later.',
    retryAfter: res.get('Retry-After') || '900', // 15 minutes default
    timestamp: new Date().toISOString(),
    ip: req.ip
  };

  const { Logger } = require('../utils/logger');
  Logger.warn('Rate limit exceeded:', {
    ip: req.ip,
    method: req.method,
    url: req.url,
    timestamp: errorDetails.timestamp
  });

  res.status(429).json(errorDetails);
}