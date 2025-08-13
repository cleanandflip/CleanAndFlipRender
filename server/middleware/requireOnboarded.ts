/**
 * Middleware to require completed onboarding for protected actions
 */

import type { Request, Response, NextFunction } from 'express';
import { isUserOnboarded } from '../lib/userOnboarding';

/**
 * Middleware that ensures user has completed onboarding
 * Returns 428 (Precondition Required) if not onboarded
 */
export function requireOnboarded(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ 
      error: 'Unauthenticated',
      message: 'Please log in to continue' 
    });
  }

  if (!isUserOnboarded(req.user as any)) {
    return res.status(428).json({ 
      error: 'Profile incomplete',
      message: 'Please complete your profile setup',
      redirect: '/onboarding?from=' + encodeURIComponent(req.originalUrl)
    });
  }

  next();
}