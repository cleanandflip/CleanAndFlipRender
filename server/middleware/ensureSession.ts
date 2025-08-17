export default function ensureSession(req: any, _res: any, next: any) {
  if (!req.session) return next(new Error("Session not initialized"));
  (req as any).sessionId = req.sessionID; // mirror only
  return next();
}