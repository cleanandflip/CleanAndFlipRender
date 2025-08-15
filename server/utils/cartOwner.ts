export function getCartOwnerId(req: any): string {
  // Prefer authenticated user; else use session.id or sessionId from ensureSession
  const userId = req.user?.id;
  const sessionId = req.session?.id || (req as any).sessionId;
  const ownerId = userId ?? sessionId;
  
  console.log(`[CART OWNER] userId: ${userId}, session.id: ${req.session?.id}, req.sessionId: ${(req as any).sessionId}, final ownerId: ${ownerId}`);
  
  if (!ownerId) throw new Error("No cart owner id (user/session) on request");
  return ownerId;
}