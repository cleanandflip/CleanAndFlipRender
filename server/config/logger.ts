import winston from 'winston';
import chalk from 'chalk';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Log profiles for different environments
const logProfiles = {
  development: {
    requests: true,
    auth: true,
    database: false, // Reduce database spam
    cache: false, // Disable Redis spam in dev
    errors: true,
    performance: true,
  },
  production: {
    requests: false, // Only log errors and slow requests
    auth: false, // Only log failures
    database: false, // Only log errors
    cache: false,
    errors: true,
    performance: true,
  },
  debug: {
    requests: true,
    auth: true,
    database: true,
    cache: true,
    errors: true,
    performance: true,
  }
};

const profile = logProfiles[process.env.LOG_PROFILE || process.env.NODE_ENV || 'development'];

export function shouldLog(category: string): boolean {
  return profile[category] ?? false;
}

// Track connection status to prevent duplicate logs
let dbConnectionLogged = false;
let redisConnectionLogged = false;

// Custom format for cleaner output
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Convert message to string if it's an object
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  
  // Skip noisy logs
  if (messageStr?.includes('Redis connection error')) return '';
  if (messageStr?.includes('Database connected successfully') && dbConnectionLogged) return '';
  if (messageStr?.includes('Redis connected successfully') && redisConnectionLogged) return '';
  
  // Mark as logged
  if (messageStr?.includes('Database connected successfully')) dbConnectionLogged = true;
  if (messageStr?.includes('Redis connected successfully')) redisConnectionLogged = true;
  
  const time = new Date(timestamp).toLocaleTimeString();
  
  // Format based on log type
  if (metadata.type === 'request') {
    const { method, url, status, duration, ip } = metadata;
    const statusColor = status >= 400 ? chalk.red : status >= 300 ? chalk.yellow : chalk.green;
    return `${chalk.gray(time)} ${chalk.cyan(method.padEnd(7))} ${url.padEnd(40)} ${statusColor(status)} ${chalk.gray(duration + 'ms')}`;
  }
  
  if (metadata.type === 'auth') {
    return `${chalk.gray(time)} ${chalk.blue('AUTH')} ${messageStr}`;
  }
  
  if (metadata.type === 'system') {
    return `${chalk.gray(time)} ${level === 'info' ? '✅' : '⚠️ '} ${messageStr}`;
  }
  
  return `${chalk.gray(time)} ${level}: ${messageStr}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }), // Disable stack traces in logs
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    // File transport for production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      })
    ] : [])
  ],
});

// Request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Skip static files, health checks, and favicon
  if (req.url.includes('.') || req.url === '/health' || req.url === '/favicon.ico') {
    return next();
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Only log slow requests and errors in production
    if (process.env.NODE_ENV === 'production' && duration < 1000 && res.statusCode < 400) {
      return;
    }
    
    // Skip logging successful quick requests in development
    if (!shouldLog('requests') && res.statusCode < 400 && duration < 500) {
      return;
    }
    
    logger.http('Request', {
      type: 'request',
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
    
    // Warn about slow requests
    if (duration > (parseInt(process.env.LOG_SLOW_REQUESTS || '1000'))) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// Performance monitoring middleware
export function createRequestLogger() {
  return requestLogger;
}