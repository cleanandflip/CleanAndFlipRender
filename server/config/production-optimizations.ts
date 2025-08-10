import compression from 'compression';
import { Express } from 'express';
import { Logger } from '../utils/logger';

// Production-ready compression configuration
export const setupProductionCompression = (app: Express) => {
  app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress images or already compressed content
      if (req.headers['x-no-compression']) return false;
      
      const contentType = res.getHeader('content-type') as string;
      if (contentType && (
        contentType.startsWith('image/') || 
        contentType.includes('gzip') ||
        contentType.includes('compress')
      )) {
        return false;
      }
      
      return true; // Default compression for other content types
    }
  }));
  
  Logger.info('[COMPRESSION] Production compression configured');
};

// Database connection pooling optimization
export const optimizeDatabaseConnections = () => {
  // These settings should be in the Neon connection string or pool config
  const optimizations = {
    max: 20,                    // Maximum connections in pool
    min: 5,                     // Minimum connections in pool
    acquireTimeoutMillis: 30000, // 30s timeout for acquiring connection
    createTimeoutMillis: 30000,  // 30s timeout for creating connection
    destroyTimeoutMillis: 5000,  // 5s timeout for destroying connection
    idleTimeoutMillis: 300000,   // 5 minutes idle timeout
    reapIntervalMillis: 1000,    // Check for idle connections every 1s
    createRetryIntervalMillis: 200,
    propagateCreateError: false
  };
  
  Logger.info('[DATABASE] Connection pool optimization configured', optimizations);
  return optimizations;
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const formatBytes = (bytes: number) => {
      return Math.round(bytes / 1024 / 1024 * 100) / 100;
    };
    
    const memoryStats = {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external),
      heapUsedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
    
    // Log warning if memory usage is high
    if (memoryStats.heapUsedPercent > 85) {
      Logger.warn('[MEMORY] High memory usage detected', memoryStats);
    } else {
      Logger.debug('[MEMORY] Memory usage normal', memoryStats);
    }
  }, 60000); // Check every minute
};

// Graceful shutdown handling
export const setupGracefulShutdown = (server: any) => {
  const shutdown = (signal: string) => {
    Logger.info(`[SHUTDOWN] Received ${signal}, starting graceful shutdown...`);
    
    server.close((err: any) => {
      if (err) {
        Logger.error('[SHUTDOWN] Error during server shutdown:', err);
        process.exit(1);
      }
      
      Logger.info('[SHUTDOWN] Server closed gracefully');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      Logger.error('[SHUTDOWN] Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  Logger.info('[SHUTDOWN] Graceful shutdown handlers configured');
};

// Request logging optimization
export const createOptimizedRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    // Skip logging for certain paths to reduce noise
    const skipPaths = ['/health', '/favicon.ico', '/@vite', '/@react-refresh'];
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
    
    if (shouldSkip) {
      return next();
    }
    
    const startTime = Date.now();
    const { method, path, ip } = req;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      // Log with appropriate level based on status and duration
      const logLevel = statusCode >= 400 ? 'error' : 
                      duration > 3000 ? 'warn' : 'info';
      
      const logData = {
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        ip: ip?.replace(/::ffff:/g, '') // Clean IPv4-mapped IPv6
      };
      
      if (logLevel === 'error') {
        Logger.error(`${method} ${path} - ${statusCode} (${duration}ms)`, logData);
      } else if (logLevel === 'warn') {
        Logger.warn(`Slow request: ${method} ${path} - ${statusCode} (${duration}ms)`, logData);
      } else {
        Logger.info(`${method} ${path} - ${statusCode} (${duration}ms)`);
      }
    });
    
    next();
  };
};

// Error handling optimization
export const createProductionErrorHandler = () => {
  return (err: any, req: any, res: any, next: any) => {
    Logger.error('Unhandled application error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      error: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { stack: err.stack })
    });
  };
};