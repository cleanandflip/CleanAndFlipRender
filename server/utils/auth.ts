// Centralized user ID extraction from requests
// Handles different session/auth patterns consistently

export function getUserIdFromReq(req: any): string | null {
  return (
    req.user?.id ||
    req.session?.userId ||
    req.auth?.userId ||
    null
  );
}