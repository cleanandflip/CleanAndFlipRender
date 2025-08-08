import { Request, Response, NextFunction } from 'express';

export const authMiddleware = {
  // Check if user is logged in
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required', message: 'Please log in to continue' });
    }
    next();
  },
  
  // Check if user is admin
  requireAdmin: (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId || req.session?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required', message: 'Admin privileges required for this action' });
    }
    next();
  },
  
  // Optional auth (guest checkout)
  optionalAuth: (req: Request, res: Response, next: NextFunction) => {
    // Attach user if exists, continue regardless
    (req as any).userId = req.session?.userId || `guest-${req.sessionID}`;
    next();
  }
};