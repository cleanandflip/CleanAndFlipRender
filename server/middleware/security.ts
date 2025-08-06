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
  // Disable CSP in development to allow Vite
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
        },
      };

  // Only use helmet in production to avoid development conflicts
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
      contentSecurityPolicy: cspConfig,
      crossOriginEmbedderPolicy: false, // Required for Stripe
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));
  }
  // Skip helmet completely in development

  // Additional security headers - only in production to avoid conflicts
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Remove server header for security
      res.removeHeader('X-Powered-By');
      
      next();
    });
  }
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

// CORS configuration for production security with Vercel support
const productionOrigins = [
  'https://cleanandflip.com',
  'https://www.cleanandflip.com',
  'https://clean-and-flip.vercel.app',
  /^https:\/\/clean-and-flip-.+\.vercel\.app$/  // Vercel preview URLs
];

const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://0.0.0.0:5000',
  /\.replit\.dev$/,
  /\.replit\.app$/
];

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? productionOrigins
      : [...productionOrigins, ...developmentOrigins];

    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check regex patterns (for Vercel and Replit domains)
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
};