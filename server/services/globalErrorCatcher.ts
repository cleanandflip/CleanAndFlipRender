import type { Express, Request, Response, NextFunction } from 'express';
import { ErrorLogger, type ErrorContext } from './errorLogger';

export class GlobalErrorCatcher {
  private static instance: GlobalErrorCatcher;
  
  static init(app: Express) {
    if (!this.instance) {
      this.instance = new GlobalErrorCatcher();
      this.instance.setupHandlers(app);
    }
  }
  
  private setupHandlers(app: Express) {
    // 1. CATCH UNCAUGHT EXCEPTIONS
    process.on('uncaughtException', async (error: Error) => {
      await ErrorLogger.logError(error, {
        metadata: {
          type: 'uncaught_exception',
          environment: process.env.NODE_ENV || 'development'
        }
      });
      // Uncaught exception handled
      // Don't exit - keep running
    });
    
    // 2. CATCH UNHANDLED PROMISE REJECTIONS
    process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await ErrorLogger.logError(error, {
        metadata: {
          type: 'unhandled_rejection',
          environment: process.env.NODE_ENV || 'development'
        }
      });
      // Unhandled rejection handled
    });
    
    // 3. CATCH ALL EXPRESS ERRORS - Global error handler
    app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
      // Log the error
      ErrorLogger.logError(err, {
        req: {
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        user: req.user as { id?: string; email?: string },
        metadata: {
          type: 'express_error',
          status: err.status
        }
      }).catch(logErr => console.error('Failed to log error:', logErr));
      
      // Don't interfere with existing error handling
      next(err);
    });
  }

  // Method to manually log errors from anywhere in the application
  static async logError(error: Error, context: ErrorContext = {}) {
    return await ErrorLogger.logError(error, context);
  }

  // Method to log error data objects (legacy compatibility)
  static async logErrorData(errorData: {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    error_type: string;
    message: string;
    stack_trace?: string;
    file_path?: string;
    line_number?: number;
    column_number?: number;
    user_id?: string;
    user_email?: string;
    user_ip?: string;
    user_agent?: string;
    url?: string;
    method?: string;
    request_body?: unknown;
    response_status?: number;
    browser?: string;
    os?: string;
    device_type?: string;
    session_id?: string;
    environment?: string;
  }) {
    const error = new Error(errorData.message);
    error.stack = errorData.stack_trace;
    return ErrorLogger.logError(error, {
      metadata: errorData
    });
  }
}