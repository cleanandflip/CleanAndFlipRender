import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      userId?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export function captureErrors(err: any, req: Request, res: Response, next: NextFunction) {
  // Ship to local ingest
  const port = process.env.PORT || 5000;
  
  fetch(`http://localhost:${port}/api/observability/errors`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "Internal-Error-Capture"
    },
    body: JSON.stringify({
      service: "server",
      level: "error",
      env: process.env.NODE_ENV === "production" ? "production" : "development",
      release: process.env.APP_RELEASE,
      url: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode || 500,
      message: err.message || "Server error",
      type: err.name,
      stack: err.stack,
      user: req.userId ? { id: String(req.userId) } : undefined,
      tags: { 
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get("User-Agent")
      },
      extra: {
        body: req.method !== "GET" ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined
      }
    }),
  }).catch((fetchErr) => {
    console.error("Failed to report server error:", fetchErr.message);
  });

  // Don't expose sensitive error details in production
  const isProduction = process.env.NODE_ENV === "production";
  const errorResponse = {
    error: isProduction ? "Internal server error" : err.message,
    requestId: req.requestId,
    ...(isProduction ? {} : { stack: err.stack })
  };

  if (!res.headersSent) {
    res.status(500).json(errorResponse);
  }
}

export function captureSlowRequests(threshold = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        const port = process.env.PORT || 5000;
        
        fetch(`http://localhost:${port}/api/observability/errors`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "Internal-Slow-Request-Capture"
          },
          body: JSON.stringify({
            service: "server",
            level: "warn",
            env: process.env.NODE_ENV === "production" ? "production" : "development",
            url: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            message: `Slow request: ${duration}ms`,
            type: "SlowRequest",
            user: req.userId ? { id: String(req.userId) } : undefined,
            tags: { 
              requestId: req.requestId,
              duration: duration,
              threshold: threshold
            }
          }),
        }).catch(() => {
          // Silently fail to avoid cascading issues
        });
      }
    });
    
    next();
  };
}