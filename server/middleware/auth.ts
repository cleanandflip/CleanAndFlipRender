import { Request, Response, NextFunction } from 'express';

// Check if user is logged in (compatible with Passport authentication)
export const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
    // Check Passport authentication first
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    
    // Fallback to session check for compatibility
    if (req.session?.userId || req.session?.passport?.user) {
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required', message: 'Please log in to continue' });
};

export const authMiddleware = {
  // Check if user is logged in (compatible with Passport authentication)
  requireAuth: (req: any, res: Response, next: NextFunction) => {
    // Check Passport authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      req.userId = req.user.id; // Set userId for downstream middleware
      return next();
    }
    
    // Fallback to session check for compatibility
    if (req.session?.userId || req.session?.passport?.user) {
      req.userId = req.session.userId || req.session.passport.user.id;
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required', message: 'Please log in to continue' });
  },
  
  // Check if user is developer (compatible with Passport authentication)
  requireDeveloper: (req: any, res: Response, next: NextFunction) => {
    // Check Passport authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = req.user as any;
      if (user.role === 'developer') {
        return next();
      }
    }
    
    // Fallback to session check for compatibility
    if (req.session?.userId && req.session?.role === 'developer') {
      return next();
    }
    
    return res.status(403).json({ error: 'Developer access required', message: 'Developer privileges required for this action' });
  },
  
  // Optional auth (guest checkout) - compatible with Passport
  optionalAuth: (req: any, res: Response, next: NextFunction) => {
    // Attach user if exists, continue regardless
    let userId = null;
    
    // Check Passport authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      userId = req.user.id;
      req.userId = userId;
    } else if (req.session?.userId) {
      // Fallback to session-based auth
      userId = req.session.userId;
      req.userId = userId;
    }
    
    next(); // Always continue for optional auth
    
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