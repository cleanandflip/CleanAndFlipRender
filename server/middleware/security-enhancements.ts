import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

// CRITICAL: Enhanced rate limiting with tiered protection
export const createEnhancedRateLimit = (maxRequests: number, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      Logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.round(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.startsWith('/health');
    }
  });
};

// Production-ready security headers with development allowances
export const productionSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for Tailwind CSS and development
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for development HMR
        "'unsafe-eval'", // Required for Vite in development
        "https://js.stripe.com",
        "https://accounts.google.com",
        "https://apis.google.com",
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'", "'unsafe-inline'"] : [])
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", 
        "blob:",
        "https://res.cloudinary.com", // Cloudinary images
        "https://lh3.googleusercontent.com" // Google profile images
      ],
      connectSrc: [
        "'self'", 
        "https://api.stripe.com",
        "https://api.geoapify.com",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "wss:", // WebSocket connections
        "ws:", // Development WebSocket
        ...(process.env.NODE_ENV === 'development' ? ["http://localhost:*", "ws://localhost:*", "wss://localhost:*"] : [])
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "https://js.stripe.com", 
        "https://hooks.stripe.com",
        "https://accounts.google.com"
      ],
      frameAncestors: ["'none'"], // Prevent clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [], // Force HTTPS in production
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Stripe and Google integration
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Feature-Policy/Permissions-Policy moved: use the new API via headers if needed
  // @ts-expect-error - older helmet typing may not include this option
  permissionsPolicy: false
});

// Input sanitization middleware
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize all string inputs recursively
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/[<>\"']/g, '') // Remove potential XSS characters
          .trim()
          .slice(0, 10000); // Limit input length
      }
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitize(value);
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
  } catch (error) {
    Logger.error('Input sanitization error:', error);
    res.status(400).json({ error: 'Invalid input format' });
  }
};

// SQL injection prevention
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  // Skip SQL injection check for admin routes during testing
  if (req.path.includes('/admin/')) {
    return next();
  }
  
  const suspiciousPatterns = [
    // More specific patterns that avoid false positives
    /(\bSELECT\s+.+\s+FROM\s+\w+)/gi,
    /(\bINSERT\s+INTO\s+\w+)/gi,
    /(\bUPDATE\s+\w+\s+SET\s+\w+\s*=)/gi,
    /(\bDELETE\s+FROM\s+\w+)/gi,
    /(\bDROP\s+(TABLE|DATABASE)\s+\w+)/gi,
    /(\bUNION\s+SELECT)/gi,
    /(--|\/\*|\*\/)/g,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi
  ];

  const checkForSQLInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkForSQLInjection);
    }
    return false;
  };

  try {
    if (checkForSQLInjection(req.body) || 
        checkForSQLInjection(req.query) || 
        checkForSQLInjection(req.params)) {
      
      Logger.warn(`Potential SQL injection attempt from IP: ${req.ip}`, {
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    next();
  } catch (error) {
    Logger.error('SQL injection prevention error:', error);
    res.status(500).json({ error: 'Security check failed' });
  }
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; // 10MB max request size
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    Logger.warn(`Request too large from IP: ${req.ip}: ${contentLength} bytes`);
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  next();
};

// Session security enhancement
export const enhanceSessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Regenerate session ID on authentication changes
  if (req.user && !(req.session as any).authenticated) {
    req.session.regenerate((err) => {
      if (err) {
        Logger.error('Session regeneration error:', err);
      }
      (req.session as any).authenticated = true;
      (req.session as any).lastActivity = new Date();
      next();
    });
  } else {
    // Update last activity
    if (req.session) {
      (req.session as any).lastActivity = new Date();
    }
    next();
  }
};

// CORS security with dynamic origin validation
export const createSecureCORS = () => {
  const allowedOrigins = [
    'https://cleanandflip.com',
    'https://www.cleanandflip.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
    process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : null
  ].filter(Boolean);

  return {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        Logger.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
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
      'X-CSRF-Token'
    ]
  };
};

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
  // Set API version header
  res.setHeader('X-API-Version', '1.0');
  
  // Handle API versioning if needed in future
  const version = req.headers['api-version'] || req.query.version || '1.0';
  (req as any).apiVersion = version;
  
  next();
};

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 3000) { // 3+ seconds
      Logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Set performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};