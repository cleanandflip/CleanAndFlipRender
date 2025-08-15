export function getCartOwnerId(req: any): string {
  // Prefer authenticated user; else stable anonymous sessionId (ensure ensureSession sets req.sessionId)
  const userId = req.user?.id;
  const sessionId = (req as any).sessionId;
  const ownerId = userId ?? sessionId;
  if (!ownerId) throw new Error("No cart owner id (user/session) on request");
  return ownerId;
}