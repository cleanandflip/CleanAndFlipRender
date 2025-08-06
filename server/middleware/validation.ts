import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from '../config/logger';

// Validation middleware factory
export function validateRequest(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[target];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: 'Validation failed',
          message: 'The provided data is invalid',
          details: errorMessages
        });
      }
      
      // Handle unexpected validation errors
      Logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
}

// Enhanced validation with custom error messages
export function validateWithCustomErrors(
  schema: ZodSchema, 
  customMessages?: Record<string, string>,
  target: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[target];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => {
          const fieldPath = err.path.join('.');
          const customMessage = customMessages?.[fieldPath];
          
          return {
            field: fieldPath,
            message: customMessage || err.message,
            code: err.code,
            received: err.code === 'invalid_type' ? typeof (err as any).received : undefined
          };
        });

        return res.status(400).json({
          error: 'Validation failed',
          message: 'Please check your input and try again',
          details: errorMessages
        });
      }
      
      Logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
}

// File upload validation
export function validateFileUpload(
  maxFiles: number = 12,
  maxFileSize: number = 12 * 1024 * 1024, // 12MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files)) {
      return next();
    }

    const files = req.files as Express.Multer.File[];

    // Check file count
    if (files.length > maxFiles) {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${maxFiles} files allowed`,
        details: { maxFiles, received: files.length }
      });
    }

    // Check individual files
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        return res.status(400).json({
          error: 'File too large',
          message: `File "${file.originalname}" exceeds maximum size`,
          details: { 
            maxSize: `${Math.round(maxFileSize / (1024 * 1024))}MB`,
            fileSize: `${Math.round(file.size / (1024 * 1024))}MB`
          }
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File "${file.originalname}" has unsupported format`,
          details: { 
            allowedTypes,
            received: file.mimetype 
          }
        });
      }
    }

    next();
  };
}

// SQL injection prevention
export function preventSQLInjection(req: Request, res: Response, next: NextFunction) {
  const sqlInjectionPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(\b(OR|AND)\b\s+\b\d+\s*=\s*\d+)/i,
    /(--|;|\||\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b|\bxp_\w+)/i
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (checkValue(value[key])) return true;
      }
    }
    return false;
  };

  // Check all input sources
  const inputs = [req.body, req.query, req.params];
  for (const input of inputs) {
    if (input && checkValue(input)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Potentially dangerous input detected',
        code: 'SECURITY_VIOLATION'
      });
    }
  }

  next();
}

// XSS prevention
export function preventXSS(req: Request, res: Response, next: NextFunction) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ];

  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      let sanitized = value;
      xssPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
      return sanitized;
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  // Sanitize inputs
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);

  next();
}