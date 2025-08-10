import { Request, Response, NextFunction } from 'express';

// Enhanced security headers middleware for production
export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    const isProduction = process.env.NODE_ENV === 'production';
    const isDev = process.env.NODE_ENV === 'development';
    
    // Development CSP allows WebSocket for HMR
    const developmentCSP = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com *.stripe.com js.stripe.com;
      style-src 'self' 'unsafe-inline' *.googleapis.com fonts.googleapis.com;
      font-src 'self' fonts.gstatic.com;
      img-src 'self' data: blob: *.cloudinary.com *.stripe.com *.googleusercontent.com;
      connect-src 'self' ws: wss: *.stripe.com api.stripe.com *.neon.tech vitals.vercel-insights.com;
      frame-src 'self' *.stripe.com js.stripe.com;
      object-src 'none';
      base-uri 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();

    // Production CSP is more restrictive
    const productionCSP = `
      default-src 'self';
      script-src 'self' *.googleapis.com *.gstatic.com *.stripe.com js.stripe.com 'sha256-[YOUR-SCRIPT-HASH]';
      style-src 'self' 'unsafe-inline' *.googleapis.com fonts.googleapis.com;
      font-src 'self' fonts.gstatic.com;
      img-src 'self' data: blob: *.cloudinary.com *.stripe.com *.googleusercontent.com;
      connect-src 'self' wss: *.stripe.com api.stripe.com *.neon.tech vitals.vercel-insights.com;
      frame-src 'self' *.stripe.com js.stripe.com;
      object-src 'none';
      base-uri 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();

    res.setHeader('Content-Security-Policy', isDev ? developmentCSP : productionCSP);
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // X-XSS-Protection (legacy but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict Transport Security (HTTPS only)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Permissions Policy (Feature Policy)
    res.setHeader('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=(self), fullscreen=(self)'
    );
    
    // Remove powered-by header
    res.removeHeader('X-Powered-By');
    
    next();
  };
}

// Specific security headers for API routes
export function apiSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // API-specific headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    
    // CORS headers for API
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    next();
  };
}