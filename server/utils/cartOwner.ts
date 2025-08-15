export function getCartOwnerId(req: any): string {
  const userId = req.user?.id;
  // Use express-session ID for guests (stable connect.sid)
  const sessionOwner = req.sessionID;
  const ownerId = userId ?? sessionOwner;
  if (!ownerId) throw new Error("No cart owner available");
  return ownerId;
}