import winston from 'winston';

// Structured logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'clean-flip-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB  
      maxFiles: 5
    }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userId: req.userId || 'anonymous',
        userAgent: req.get('user-agent')?.substring(0, 100)
      });
      
      // Log slow requests
      if (duration > 1000) {
        logger.warn({
          type: 'slow_request',
          method: req.method,
          url: req.url,
          duration,
          ip: req.ip
        });
      }
    });
    
    next();
  };
}

// Security event logging
export function logSecurityEvent(event: string, details: any) {
  logger.warn({
    type: 'security_event',
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// Performance logging
export function logPerformanceEvent(operation: string, duration: number, metadata?: any) {
  logger.info({
    type: 'performance',
    operation,
    duration,
    ...metadata
  });
}

// Database query logging
export function logDatabaseQuery(query: string, duration: number, params?: any) {
  if (duration > 500) {
    logger.warn({
      type: 'slow_query',
      query: query.substring(0, 200),
      duration,
      params
    });
  }
}

export { logger };