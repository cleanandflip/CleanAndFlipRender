import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Logger } from './logger';

// Server-side DOMPurify setup
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Configure DOMPurify for strict sanitization
purify.addHook('beforeSanitizeElements', function (node: any) {
  // Remove any suspicious attributes
  const el = node as Element;
  if ((el as any).hasAttribute && (el as any).hasAttribute('onclick')) {
    (el as any).removeAttribute('onclick');
  }
  if ((el as any).hasAttribute && (el as any).hasAttribute('onload')) {
    (el as any).removeAttribute('onload');
  }
});

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowLinks?: boolean;
  maxLength?: number;
  stripWhitespace?: boolean;
}

/**
 * Comprehensive input sanitization for user data
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content using DOMPurify
   */
  static sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const {
      allowHtml = false,
      allowLinks = false,
      maxLength = 10000,
      stripWhitespace = true
    } = options;

    try {
      let sanitized = input;

      // Limit input length first
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
        Logger.warn(`Input truncated to ${maxLength} characters`);
      }

      // Strip or sanitize HTML
      if (allowHtml) {
        const allowedTags = allowLinks 
          ? ['b', 'i', 'em', 'strong', 'p', 'br', 'a']
          : ['b', 'i', 'em', 'strong', 'p', 'br'];
        
        const allowedAttributes = allowLinks 
          ? { 'a': ['href', 'title'] }
          : {};

        sanitized = purify.sanitize(sanitized, {
          ALLOWED_TAGS: allowedTags,
          ALLOWED_ATTR: Object.keys(allowedAttributes).length > 0 ? Object.values(allowedAttributes).flat() : [],
          // Use DOMPurify config flags compatible with the current version
          FORBID_TAGS: ['script', 'style'],
          SAFE_FOR_TEMPLATES: true
        } as any);
      } else {
        // Strip all HTML tags
        sanitized = purify.sanitize(sanitized, { ALLOWED_TAGS: [] });
      }

      // Remove dangerous patterns
      sanitized = this.removeDangerousPatterns(sanitized);

      // Optional whitespace cleanup
      if (stripWhitespace) {
        sanitized = sanitized.trim().replace(/\s+/g, ' ');
      }

      return sanitized;

    } catch (error: any) {
      Logger.error('HTML sanitization error:', error);
      // Return empty string on error to be safe
      return '';
    }
  }

  /**
   * Sanitize user input for database storage
   */
  static sanitizeUserInput(input: any): any {
    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item));
    }

    if (typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const cleanKey = this.sanitizeString(key);
        sanitized[cleanKey] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Sanitize a single string value
   */
  private static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove dangerous patterns
    sanitized = this.removeDangerousPatterns(sanitized);

    // Trim and limit length
    sanitized = sanitized.trim();
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }

    return sanitized;
  }

  /**
   * Remove dangerous patterns that could be used for attacks
   */
  private static removeDangerousPatterns(input: string): string {
    // SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\bOR\b|\bAND\b).*?=.*?=?/gi
    ];

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi
    ];

    // LDAP injection patterns
    const ldapPatterns = [
      /[()&|!]/g
    ];

    // Command injection patterns
    const cmdPatterns = [
      /[;&|`$]/g,
      /\b(cat|ls|pwd|rm|mkdir|chmod|chown|ps|kill|curl|wget)\b/gi
    ];

    let sanitized = input;

    // Apply all pattern removals
    [...sqlPatterns, ...xssPatterns, ...ldapPatterns, ...cmdPatterns].forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Sanitize file names for upload
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'unknown';
    }

    // Remove dangerous characters and limit length
    let sanitized = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 255);

    // Ensure it has an extension
    if (!sanitized.includes('.')) {
      sanitized += '.txt';
    }

    return sanitized;
  }
}

// Middleware for automatic sanitization
export const sanitizeRequest = (req: any, res: any, next: any) => {
  try {
    if (req.body) {
      req.body = InputSanitizer.sanitizeUserInput(req.body);
    }
    if (req.query) {
      req.query = InputSanitizer.sanitizeUserInput(req.query);
    }
    if (req.params) {
      req.params = InputSanitizer.sanitizeUserInput(req.params);
    }
    next();
  } catch (error: any) {
    Logger.error('Request sanitization error:', error);
    res.status(400).json({ error: 'Invalid input format' });
  }
};