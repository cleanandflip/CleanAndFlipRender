import type { Express, Request, Response, NextFunction } from 'express';
import { ErrorLogger } from './errorLogger';

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
      await ErrorLogger.logError({
        severity: 'critical',
        error_type: 'uncaught_exception',
        message: error.message,
        stack_trace: error.stack,
        environment: process.env.NODE_ENV || 'development'
      });
      console.error('Uncaught Exception:', error);
      // Don't exit - keep running
    });
    
    // 2. CATCH UNHANDLED PROMISE REJECTIONS
    process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
      await ErrorLogger.logError({
        severity: 'critical',
        error_type: 'unhandled_rejection',
        message: reason?.message || String(reason),
        stack_trace: reason?.stack,
        environment: process.env.NODE_ENV || 'development'
      });
      console.error('Unhandled Rejection:', reason);
    });
    
    // 3. CATCH ALL EXPRESS ERRORS - Global error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      // Log the error
      ErrorLogger.logError({
        severity: err.status >= 500 ? 'critical' : 'error',
        error_type: 'express_error',
        message: err.message,
        stack_trace: err.stack,
        url: req.url,
        method: req.method,
        user_id: (req as any).user?.id,
        user_ip: req.ip,
        user_agent: req.headers['user-agent']
      }).catch(console.error);
      
      // Don't interfere with existing error handling
      next(err);
    });
  }

  // Method to manually log errors from anywhere in the application
  static async logError(errorData: {
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
    request_body?: any;
    response_status?: number;
    browser?: string;
    os?: string;
    device_type?: string;
    session_id?: string;
    environment?: string;
  }) {
    return ErrorLogger.logError(errorData);
  }
}