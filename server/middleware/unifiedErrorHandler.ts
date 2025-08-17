import { Request, Response, NextFunction } from 'express';
import { ErrorLogger } from '../services/errorLogger';
import { Logger } from '../utils/logger';

export interface CustomRequest extends Request {
  user?: Express.User;
}

export class UnifiedErrorHandler {
  static async handleError(error: Error, req: CustomRequest, res: Response, next: NextFunction) {
    try {
      // Log error to database with full context
      const errorId = await ErrorLogger.logError(error, {
        req: {
          url: req.url,
          method: req.method,
          body: req.body,
          headers: req.headers,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        res: {
          statusCode: res.statusCode
        },
        user: req.user
      });

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        Logger.error('Unhandled error:', {
          errorId,
          message: error.message,
          stack: error.stack,
          url: req.url,
          method: req.method
        });
      }

      // Send appropriate response
      const statusCode = this.getStatusCode(error);
      const message = this.getErrorMessage(error, process.env.NODE_ENV === 'production');

      res.status(statusCode).json({
        error: message,
        errorId: errorId || undefined,
        timestamp: new Date().toISOString()
      });

      // Don't call next() - we've handled the error
    } catch (handlerError) {
      Logger.error('Error in error handler:', handlerError);
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async handleAsyncErrors(fn: Function) {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        UnifiedErrorHandler.handleError(error, req, res, next);
      });
    };
  }

  private static getStatusCode(error: any): number {
    if (error.status) return error.status;
    if (error.statusCode) return error.statusCode;
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'UnauthorizedError') return 401;
    if (error.name === 'ForbiddenError') return 403;
    if (error.name === 'NotFoundError') return 404;
    if (error.name === 'ConflictError') return 409;
    return 500;
  }

  private static getErrorMessage(error: Error, isProduction: boolean): string {
    if (!isProduction) {
      return error.message || 'An error occurred';
    }

    // Production-safe messages
    const statusCode = this.getStatusCode(error);
    switch (statusCode) {
      case 400: return 'Bad request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not found';
      case 409: return 'Conflict';
      case 500: return 'Internal server error';
      default: return 'An error occurred';
    }
  }
}

// Middleware function
export const unifiedErrorHandler = UnifiedErrorHandler.handleError;