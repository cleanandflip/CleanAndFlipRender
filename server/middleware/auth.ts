import { Request, Response, NextFunction } from 'express';

export const authMiddleware = {
  // Check if user is logged in (compatible with Passport authentication)
  requireAuth: (req: any, res: Response, next: NextFunction) => {
    // Check Passport authentication first
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    
    // Fallback to session check for compatibility
    if (req.session?.userId || req.session?.passport?.user) {
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required', message: 'Please log in to continue' });
  },
  
  // Check if user is admin (compatible with Passport authentication)
  requireAdmin: (req: any, res: Response, next: NextFunction) => {
    // Check Passport authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = req.user as any;
      if (user.role === 'admin' || user.isAdmin) {
        return next();
      }
    }
    
    // Fallback to session check for compatibility
    if (req.session?.userId && req.session?.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ error: 'Admin access required', message: 'Admin privileges required for this action' });
  },
  
  // Optional auth (guest checkout) - compatible with Passport
  optionalAuth: (req: any, res: Response, next: NextFunction) => {
    // Attach user if exists, continue regardless
    let userId = null;
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      userId = req.user.id;
    } else if (req.session?.passport?.user) {
      userId = req.session.passport.user;
    } else if (req.session?.userId) {
      userId = req.session.userId;
    } else {
      userId = `guest-${req.sessionID}`;
    }
    
    req.userId = userId;
    next();
  }
};