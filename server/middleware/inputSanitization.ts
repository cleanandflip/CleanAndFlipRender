import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window);

interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  stripTags?: boolean;
  maxLength?: number;
}

class InputSanitizer {
  private static defaultOptions: SanitizationOptions = {
    stripTags: true,
    maxLength: 10000,
    allowedTags: [],
    allowedAttributes: {}
  };

  static sanitizeString(input: string, options: SanitizationOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!input || typeof input !== 'string') return '';
    
    // Truncate if too long
    let sanitized = opts.maxLength ? input.slice(0, opts.maxLength) : input;
    
    // Remove/escape HTML tags
    if (opts.stripTags) {
      sanitized = purify.sanitize(sanitized, {
        ALLOWED_TAGS: opts.allowedTags || [],
        ALLOWED_ATTR: Object.values(opts.allowedAttributes || {}).flat(),
        KEEP_CONTENT: true
      });
    }
    
    // Additional XSS protection
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
    return sanitized.trim();
  }

  static sanitizeObject(obj: any, options: SanitizationOptions = {}): any {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj, options);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize the key as well
        const cleanKey = this.sanitizeString(key, { stripTags: true, maxLength: 100 });
        sanitized[cleanKey] = this.sanitizeObject(value, options);
      }
      return sanitized;
    }
    
    return obj;
  }

  static validateAndSanitize(data: any, schema?: any): any {
    // Basic SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b\d+\s*=\s*\d+\b)/g, // 1=1 type patterns
      /('|"|;|\||&)/g // Common injection characters
    ];

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ];

    const sanitized = this.sanitizeObject(data, {
      stripTags: true,
      maxLength: 5000
    });

    // Check for suspicious patterns in stringified data
    const dataString = JSON.stringify(sanitized).toLowerCase();
    
    for (const pattern of [...sqlInjectionPatterns, ...xssPatterns]) {
      if (pattern.test(dataString)) {
        throw new Error('Input contains potentially malicious content');
      }
    }

    return sanitized;
  }
}

// Middleware for request body sanitization
export function sanitizeInput(options: SanitizationOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body) {
        req.body = InputSanitizer.validateAndSanitize(req.body, options);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = InputSanitizer.sanitizeObject(req.query, {
          stripTags: true,
          maxLength: 500
        });
      }

      // Sanitize route parameters
      if (req.params) {
        req.params = InputSanitizer.sanitizeObject(req.params, {
          stripTags: true,
          maxLength: 100
        });
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'Invalid input data',
        message: 'Request contains potentially unsafe content'
      });
    }
  };
}

// Specific sanitizers for different data types
export const sanitizeUserInput = sanitizeInput({
  allowedTags: [],
  stripTags: true,
  maxLength: 1000
});

export const sanitizeProductInput = sanitizeInput({
  allowedTags: ['b', 'i', 'u', 'br', 'p'],
  allowedAttributes: {},
  stripTags: false,
  maxLength: 5000
});

export const sanitizeSearchInput = sanitizeInput({
  stripTags: true,
  maxLength: 200
});

export { InputSanitizer };