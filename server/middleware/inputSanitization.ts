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
      // More precise allowlist - exact path matching
      const ALLOW = [
        /^\/api\/cart$/,
        /^\/api\/cart\/[\w-]+$/,
        /^\/api\/user$/,
        /^\/api\/products$/,
        /^\/api\/track-activity$/,
        /^\/api\/stripe\/webhook$/,
        /^\/api\/health$/,
        /^\/health$/,
        /^\/api\/admin\/logs$/,
        /^\/api\/user\/profile\/image$/,
        /^\/login$/,
        /^\/register$/,
        /^\/auth\//,
        /^\/track-activity$/,
        /^\/errors\//,
        /^\/api\/observability\/errors$/
      ];
      
      // Debug logging
      console.log('Sanitization check - path:', req.path, 'url:', req.url, 'method:', req.method, 'originalUrl:', req.originalUrl);
      
      // Use regex matching for more precise control
      if (ALLOW.some(rx => rx.test(req.path) || rx.test(req.originalUrl))) {
        console.log('Skipping sanitization for:', req.path, 'originalUrl:', req.originalUrl);
        return next();
      }

      // Special case: if this is a cart request that wasn't allowed, log details
      if (req.path.includes('cart') || req.url.includes('cart') || req.originalUrl.includes('cart')) {
        console.log('CART REQUEST BLOCKED:', {
          path: req.path,
          url: req.url,
          originalUrl: req.originalUrl,
          method: req.method,
          body: req.body,
          headers: req.headers['content-type']
        });
      }

      // Improved scanning that handles arrays and only scans strings
      const FORBIDDEN = /(<|>|script:|javascript:|data:|on\w+=)/i;
      
      function scan(val: unknown): boolean {
        if (typeof val === "string") return FORBIDDEN.test(val);
        if (Array.isArray(val)) return val.some(scan);
        if (val && typeof val === "object") return Object.values(val as Record<string, unknown>).some(scan);
        return false; // numbers/booleans/null are fine
      }

      if (scan(req.body) || scan(req.query) || scan(req.params)) {
        console.log('Request blocked by sanitizer - suspicious content detected');
        return res.status(400).json({
          error: "Invalid input data",
          message: "Request contains potentially unsafe content",
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