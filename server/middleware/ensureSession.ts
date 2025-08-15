export default function ensureSession(req: any, res: any, next: any) {
  // Extract session ID from connect.sid cookie if available
  if (!req.sessionID && req.headers.cookie) {
    const sidMatch = req.headers.cookie.match(/connect\.sid=([^;]+)/);
    if (sidMatch) {
      try {
        let sessionId = decodeURIComponent(sidMatch[1]);
        // Remove 's:' prefix and signature if present (signed cookie)
        if (sessionId.startsWith('s:')) {
          sessionId = sessionId.slice(2).split('.')[0];
        }
        
        // Use this extracted session ID
        req.sessionID = sessionId;
        
        console.log('[ENSURE SESSION] Using cookie session ID:', sessionId);
      } catch (e) {
        console.warn('[ENSURE SESSION] Failed to parse session cookie:', e);
      }
    }
  }
  
  // If we still don't have a session ID and session middleware didn't create one
  if (!req.sessionID) {
    // Generate a fallback session ID
    const fallbackId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    req.sessionID = fallbackId;
    console.log('[ENSURE SESSION] Generated fallback session ID:', fallbackId);
  }
  
  // Provide an alias for code that expects sessionId
  (req as any).sessionId = req.sessionID;
  
  return next();
}