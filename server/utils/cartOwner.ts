export function getCartOwnerId(req: any): string {
  const userId = req.user?.id;
  const ownerId = userId ?? req.sessionID;  // express-session connect.sid
  if (!ownerId) throw new Error("No cart owner available");
  return ownerId;
}