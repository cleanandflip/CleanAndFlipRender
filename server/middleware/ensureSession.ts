import type { Request, Response, NextFunction } from 'express';

// server/middleware/ensureSession.ts
export function ensureSession(req: Request, _res: Response, next: NextFunction) {
  if (!req.session) return next(new Error("Session not initialized"));
  // Do NOT create or set any custom cookie. NEVER rotate IDs here.
  // Normalize an alias for legacy code that expects req.sessionId:
  (req as any).sessionId = req.sessionID; // mirror of express-session ID
  return next();
}