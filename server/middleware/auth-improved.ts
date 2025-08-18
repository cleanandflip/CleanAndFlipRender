// Enhanced authentication middleware with guest-safe responses and better logging
import { Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

// Paths that are expected to receive 401s from guests (no scary logs)
const EXPECTED_ANON_401_PATHS = new Set([
  '/api/user',
  '/api/cart/add',
  '/api/orders',
  '/api/addresses'
]);

export const authImprovements = {
  // Guest-safe user endpoint - returns 200 with auth status instead of 401
  guestSafeUser: async (req: any, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated && req.isAuthenticated() && req.user;
      const hasSession = req.session?.userId || req.session?.passport?.user;
      
      if (!isAuthenticated && !hasSession) {
        // Guest-safe response - no scary 401
        return res.status(200).json({ 
          auth: false, 
          user: null,
          message: "Not authenticated - guest user"
        });
      }
      
      // User is authenticated, proceed normally
      req.userId = req.user?.id || req.session?.userId || req.session?.passport?.user;
      next();
    } catch (error) {
      Logger.error('Error in guestSafeUser middleware:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Improved 401 logging - demotes expected guest 401s to INFO level
  improvedAuthLogging: (req: any, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    
    res.end = function(...args: any[]) {
      if (res.statusCode === 401) {
        const isExpectedGuestPath = EXPECTED_ANON_401_PATHS.has(req.path);
        const hasSession = Boolean(req.session?.userId || req.session?.passport?.user);
        
        if (isExpectedGuestPath && !hasSession) {
          // Expected guest 401 - log as INFO, not WARN
          Logger.info(`[AUTH] Expected guest 401: ${req.method} ${req.path}`, {
            path: req.path,
            userAgent: req.get('User-Agent')?.substring(0, 50),
            ip: req.ip
          });
        } else {
          // Unexpected 401 - log as WARN with details for debugging
          Logger.warn(`[AUTH] Unexpected 401: ${req.method} ${req.path}`, {
            path: req.path,
            hasCookie: Boolean(req.headers.cookie),
            hasSession: Boolean(req.session?.userId),
            hasPassportSession: Boolean(req.session?.passport?.user),
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
            origin: req.headers.origin,
            referer: req.headers.referer,
            userAgent: req.get('User-Agent')?.substring(0, 100)
          });
        }
      }
      
      return originalEnd.apply(this, args as any);
    };
    
    next();
  },

  // Auth state endpoint - never returns 401, just tells UI auth status
  authState: (req: any, res: Response) => {
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated() && req.user;
    const hasSession = req.session?.userId || req.session?.passport?.user;
    
    if (!isAuthenticated && !hasSession) {
      return res.json({ auth: false });
    }
    
    return res.json({ 
      auth: true,
      userId: req.user?.id || req.session?.userId || req.session?.passport?.user
    });
  }
};