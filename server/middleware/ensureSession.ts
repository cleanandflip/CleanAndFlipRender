export default function ensureSession(req: any, _res: any, next: any) {
  if (!req.session) return next(new Error("Session not initialized"));
  // Provide an alias only; DO NOT set custom cookies or random IDs
  (req as any).sessionId = req.sessionID; // alias for code that expects sessionId
  return next();
}