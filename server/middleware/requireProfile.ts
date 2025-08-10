import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

/**
 * Middleware to require complete profile for protected routes
 */
export function requireCompleteProfile(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = req.user as any;
  
  if (!user.profileComplete) {
    Logger.info('[MIDDLEWARE] Blocking incomplete profile access:', { 
      userId: user.id, 
      path: req.path 
    });
    
    return res.status(403).json({ 
      error: 'Profile incomplete',
      redirect: '/onboarding',
      message: 'You must complete your profile to access this resource'
    });
  }
  
  next();
}

/**
 * Check if user profile is complete (for API responses)
 */
export function checkProfileComplete(user: any): boolean {
  return user?.profileComplete === true;
}