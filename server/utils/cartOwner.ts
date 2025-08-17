// server/utils/cartOwner.ts
export function getCartOwnerId(req: any): string {
  return req.user?.id ?? req.sessionID; // user ID if logged in, else session ID
}