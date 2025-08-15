export function getCartOwnerId(req: any): string {
  return req.user?.id ?? req.sessionID; // user > guest session
}