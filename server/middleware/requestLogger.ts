import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  contentLength?: number;
  error?: string;
}

class RequestLogger {
  private static isSpamEndpoint(url: string): boolean {
    const spamPatterns = [
      /^\/api\/products\/featured$/,
      /^\/api\/categories/,
      /^\/api\/cart$/,
      /^\/clean-flip-logo/,
      /^\/api\/user$/,
      /^\/@vite/,
      /^\/@react-refresh/,
      /\.js$|\.css$|\.png$|\.jpg$|\.jpeg$|\.gif$|\.svg$|\.ico$/
    ];
    
    return spamPatterns.some(pattern => pattern.test(url));
  }

  private static shouldLogRequest(req: Request): boolean {
    // Always log admin requests
    if (req.url.startsWith('/api/admin/')) return true;
    
    // Always log error requests
    if (req.url.startsWith('/api/errors/')) return true;
    
    // Always log auth requests
    if (req.url.startsWith('/api/auth/')) return true;
    
    // Skip spam endpoints in development
    if (process.env.NODE_ENV === 'development' && this.isSpamEndpoint(req.url)) {
      return false;
    }
    
    // Log all other requests
    return true;
  }

  private static extractUserInfo(req: Request): { userId?: string; ip: string } {
    const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return { userId, ip };
  }

  static requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!RequestLogger.shouldLogRequest(req)) {
        return next();
      }

      const startTime = Date.now();
      const { userId, ip } = RequestLogger.extractUserInfo(req);

      // Log request start
      const requestData: RequestLogData = {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip,
        userId
      };

      // Override res.end to capture response data
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        const contentLength = res.get('Content-Length');

        const responseData = {
          ...requestData,
          duration,
          statusCode: res.statusCode,
          contentLength: contentLength ? parseInt(contentLength) : undefined
        };

        // Log based on status code
        if (res.statusCode >= 500) {
          Logger.error(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, responseData);
        } else if (res.statusCode >= 400) {
          Logger.warn(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, responseData);
        } else if (res.statusCode >= 300) {
          Logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        } else {
          Logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        }

        // Call original end
        originalEnd.apply(this, args);
      };

      next();
    };
  }

  static apiRequestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const { userId, ip } = RequestLogger.extractUserInfo(req);

      // Log API requests with more detail
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        
        const logData: RequestLogData = {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          ip,
          userId,
          duration,
          statusCode: res.statusCode,
          contentLength: res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined
        };

        // Enhanced logging for API routes
        if (res.statusCode >= 400) {
          Logger.warn(`API ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, logData);
        } else {
          Logger.info(`API ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, logData);
        }

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  static adminRequestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const { userId, ip } = RequestLogger.extractUserInfo(req);

      // Always log admin requests
      Logger.info(`ADMIN REQUEST: ${req.method} ${req.url}`, {
        userId,
        ip,
        userAgent: req.get('User-Agent')
      });

      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        
        Logger.info(`ADMIN RESPONSE: ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
          userId,
          ip,
          duration,
          statusCode: res.statusCode
        });

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  static errorLogger() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const { userId, ip } = RequestLogger.extractUserInfo(req);
      
      Logger.error(`Request Error: ${req.method} ${req.url}`, {
        error: error.message,
        stack: error.stack,
        userId,
        ip,
        userAgent: req.get('User-Agent'),
        body: req.method !== 'GET' ? req.body : undefined
      });

      next(error);
    };
  }
}

export const { requestLogger, apiRequestLogger, adminRequestLogger, errorLogger } = RequestLogger;