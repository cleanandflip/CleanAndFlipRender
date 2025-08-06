import { Request, Response, NextFunction } from 'express';
import { Logger } from '../config/logger';

// Performance monitoring middleware
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response time
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      Logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
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
      Logger.error('Health check database error:', error);
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (memUsageMB > 512) { // Alert if using > 512MB
      healthChecks.checks.memory = 'warning';
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

  // Skip logging for development/asset requests
  if (skipPatterns.some(pattern => url.includes(pattern))) {
    return next();
  }

  // Skip frequent polling endpoints
  if (url.includes('/api/cart') || url.includes('/api/user') || url.includes('/api/admin/stats')) {
    return next();
  }

  const timestamp = new Date().toLocaleTimeString();
  Logger.info(`${timestamp} ${req.method.padEnd(6)} ${req.path.padEnd(40)} ${res.statusCode || ''}${res.get('X-Response-Time') || ''}`);
  
  next();
}

// Error tracking middleware
export function errorTracking(err: Error, req: Request, res: Response, next: NextFunction) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };

  Logger.error('Application error:', errorInfo);
  
  next(err);
}

// Rate limiting monitoring
export function rateLimitMonitoring(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log suspicious activity patterns
  if (userAgent.toLowerCase().includes('bot') && !userAgent.includes('googlebot')) {
    Logger.warn(`Potential bot detected: ${ip} - ${userAgent}`);
  }
  
  next();
}