import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window per IP
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin endpoint rate limiting
export const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 admin requests per window
  message: {
    error: 'Too many admin requests',
    message: 'Please try again later',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    error: 'Too many uploads',
    message: 'Upload limit exceeded. Please try again later.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers configuration
export function setupSecurityHeaders(app: Express) {
  // No external embedding by default; simplify
  const frameAncestors = ["'self'"];

  // Disable CSP in development to allow Vite HMR; otherwise apply strict CSP with optional frame ancestors
  const cspConfig = process.env.NODE_ENV === 'development'
    ? false
    : {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'", 
            "'unsafe-inline'", // Required for Tailwind CSS
            "https://fonts.googleapis.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com"
          ],
          scriptSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://checkout.stripe.com"
          ],
          imgSrc: [
            "'self'",
            "https://res.cloudinary.com",
            "https://images.unsplash.com",
            "data:",
            "blob:"
          ],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://api.cloudinary.com"
          ],
          frameSrc: [
            "https://js.stripe.com",
            "https://hooks.stripe.com"
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https://res.cloudinary.com"],
          manifestSrc: ["'self'"],
          frameAncestors,
        },
      };

  app.use(helmet({
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: false, // Required for Stripe
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Additional security headers
  app.use((req, res, next) => {
    // Prefer CSP frame-ancestors over X-Frame-Options. If no extra ancestors are set, fall back to SAMEORIGIN.
    if (frameAncestors.length > 1) {
      // Do not set X-Frame-Options when we explicitly allow external ancestors via CSP
      // Browsers will honor frame-ancestors from CSP
    } else {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    // X-XSS-Protection removed - deprecated and ineffective in modern browsers
    res.setHeader('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), interest-cohort=(), payment=()');
    
    // Remove server header for security
    res.removeHeader('X-Powered-By');
    
    next();
  });
}

// Input validation middleware
export function sanitizeInput(req: any, res: any, next: any) {
  // Remove potentially dangerous characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove on* event handlers
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}

// CORS configuration for production security
// Build an allowlist from APP_ORIGIN (preferred), FRONTEND_ORIGIN, and FRONTEND_ORIGINS (comma-separated)
const allowedOrigins = (() => {
  const list: string[] = [];
  if (process.env.APP_ORIGIN) list.push(process.env.APP_ORIGIN.trim());
  if (process.env.FRONTEND_ORIGIN) list.push(process.env.FRONTEND_ORIGIN.trim());
  if (process.env.FRONTEND_ORIGINS) {
    list.push(
      ...process.env.FRONTEND_ORIGINS
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    );
  }
  return Array.from(new Set(list));
})();

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
    if (process.env.CORS_ALLOW_ALL === 'true' || appEnv !== 'production') {
      return callback(null, true);
    }
    if (!origin) return callback(null, true); // same-origin or curl
    if (allowedOrigins.some(o => o === origin)) return callback(null, true);
    // Also allow subdomain pattern matches if env uses wildcard (not recommended in prod)
    const ok = allowedOrigins.some(o => {
      if (o.startsWith('*.')) {
        const suffix = o.slice(1); // remove leading '*'
        return origin.endsWith(suffix);
      }
      return false;
    });
    return callback(ok ? null : new Error('CORS: origin not allowed'), ok);
  },
  credentials: true,
  optionsSuccessStatus: 204,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Let cors echo requested headers instead of fixing a static list to avoid blocking custom headers
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
};