import { v4 as uuid } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export function ensureSession(req: Request, res: Response, next: NextFunction) {
  // If user is authenticated, prefer user ID
  if (req.user) {
    return next();
  }
  
  // Prefer express-session ID if available, otherwise use existing sid cookie
  if ((req as any).session?.id) {
    (req as any).sessionId = (req as any).session.id;
    console.log(`[ENSURE SESSION] Using express-session ID: ${(req as any).session.id}`);
    return next();
  }
  
  // Check for existing session ID in cookies
  const existingSid = req.cookies?.sid;
  if (existingSid) {
    (req as any).sessionId = existingSid;
    console.log(`[ENSURE SESSION] Using existing sid: ${existingSid}`);
    return next();
  }
  
  // Only create new guest session if none exists
  const newSid = `guest-${Date.now()}-${uuid()}`;
  res.cookie("sid", newSid, {
    httpOnly: true, 
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  (req as any).sessionId = newSid;
  console.log(`[ENSURE SESSION] Created new guest session: ${newSid}`);
  
  next();
}