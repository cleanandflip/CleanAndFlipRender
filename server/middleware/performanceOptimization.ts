import type { Request, Response, NextFunction } from 'express';

// Static asset patterns to ignore in performance monitoring
const IGNORE_PATTERNS = [
  /^\/@/,           // Vite internal
  /^\/src\//,       // Source files  
  /^\/node_modules\//, // Dependencies
  /^\/assets\//,    // Static assets
  /^\/favicon/,     // Favicon requests
  /\.js$/,          // JS files
  /\.css$/,         // CSS files
  /\.map$/,         // Source maps
  /\.png$/,         // Images
  /\.jpg$/,         // Images
  /\.svg$/          // SVG files
];

export function optimizedSlowRequestMonitoring(req: Request, res: Response, next: NextFunction) {
  // Skip monitoring for static assets and development files
  if (IGNORE_PATTERNS.some(pattern => pattern.test(req.path))) {
    return next();
  }
  
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    
    // Only log if it's actually slow (>1000ms) and not a static asset
    if (durationMs > 1000) {
      console.warn(`[PERF] Slow request: ${req.method} ${req.path} took ${durationMs.toFixed(0)}ms`);
    }
  });
  
  next();
}

// Cache headers for static-ish APIs
export function addCacheHeaders(maxAge: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=60`);
    next();
  };
}