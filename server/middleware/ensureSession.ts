import { v4 as uuid } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export function ensureSession(req: Request, res: Response, next: NextFunction) {
  // If user is authenticated, continue
  if (req.user) {
    return next();
  }
  
  // Check for existing session ID in cookies
  const sid = req.cookies?.sid;
  if (!sid) {
    // Create new guest session
    const newSid = `guest-${Date.now()}-${uuid()}`;
    res.cookie("sid", newSid, {
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    (req as any).sessionId = newSid;
  } else {
    (req as any).sessionId = sid;
  }
  
  next();
}