export function getCartOwnerId(req: any): string {
  const userId = req.user?.id;
  let sessionId = req.sessionID;
  
  // If no sessionID from express-session, extract from cookie
  if (!sessionId && req.headers.cookie) {
    const sidMatch = req.headers.cookie.match(/connect\.sid=([^;]+)/);
    if (sidMatch) {
      try {
        let cookieSessionId = decodeURIComponent(sidMatch[1]);
        // Remove 's:' prefix and signature if present (signed cookie)
        if (cookieSessionId.startsWith('s:')) {
          cookieSessionId = cookieSessionId.slice(2).split('.')[0];
        }
        sessionId = cookieSessionId;
      } catch (e) {
        console.warn('[CART OWNER] Failed to parse session cookie:', e);
      }
    }
  }
  
  const ownerId = userId ?? sessionId;
  if (!ownerId) throw new Error("No cart owner available");
  
  console.log(`[CART OWNER] Owner ID: ${ownerId} (${userId ? 'user' : 'session'})`);
  return ownerId;
}