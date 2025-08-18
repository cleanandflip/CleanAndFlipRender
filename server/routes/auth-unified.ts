// Unified authentication endpoints with consistent session handling
import { Router } from "express";
import { Logger } from "../utils/logger";
import { cookieOptions } from "../middleware/session-config";
import { storage } from "../storage";

const router = Router();

// Unified user endpoint - single source of truth
router.get('/api/user', async (req: any, res) => {
  try {
    // Check authentication status
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated() && req.user;
    const hasSession = req.session?.userId || req.session?.passport?.user;
    
    if (!isAuthenticated && !hasSession) {
      // Guest response - always 200, never 401
      return res.status(200).json({
        authenticated: false,
        user: null,
        session: { id: req.sessionID, guest: true }
      });
    }

    // User is authenticated - fetch user data
    const userId = req.user?.id || req.session?.userId || req.session?.passport?.user;
    const user = await storage.getUser(userId);
    
    if (!user) {
      Logger.warn(`[AUTH] User ${userId} not found in database`);
      return res.status(200).json({
        authenticated: false,
        user: null,
        session: { id: req.sessionID, guest: true }
      });
    }

    return res.json({
      authenticated: true,
      user,
      session: { id: req.sessionID, guest: false }
    });

  } catch (error) {
    Logger.error('[AUTH] Error in /api/user endpoint:', error);
    return res.status(200).json({
      authenticated: false,
      user: null,
      session: { id: req.sessionID, guest: true, error: true }
    });
  }
});

// Reliable logout with consistent cookie clearing
router.post('/api/logout', async (req: any, res) => {
  try {
    const sessionId = req.sessionID;
    Logger.info(`[AUTH] Logout attempt for session: ${sessionId}`);

    // Destroy server-side session
    req.session.destroy((err: any) => {
      // Always clear cookie with EXACT same attributes used for setting
      res.clearCookie('cf.sid', cookieOptions);
      
      // Additional cookie clearing for stubborn cases
      res.clearCookie('cf.sid', { path: '/' });
      
      // Optional: nuclear option for dev environments
      if (process.env.NODE_ENV === 'development') {
        res.set('Clear-Site-Data', '"cookies"');
      }

      if (err) {
        Logger.warn(`[AUTH] Session destroy error: ${err.message}`);
        return res.status(200).json({ 
          ok: true, 
          note: 'cookie cleared, session destroy had issues', 
          sessionId 
        });
      }

      Logger.info(`[AUTH] Logout successful for session: ${sessionId}`);
      return res.status(200).json({ ok: true, sessionId });
    });

  } catch (error) {
    Logger.error('[AUTH] Logout error:', error);
    // Still clear cookie even on errors
    res.clearCookie('cf.sid', cookieOptions);
    return res.status(200).json({ 
      ok: true, 
      note: 'cookie cleared with error' 
    });
  }
});

// Auth state endpoint for quick checks
router.get('/api/auth/state', async (req: any, res) => {
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated() && req.user;
  const hasSession = req.session?.userId || req.session?.passport?.user;
  
  return res.json({
    authenticated: !!(isAuthenticated || hasSession),
    sessionId: req.sessionID
  });
});

// Legacy endpoint redirect (temporary guard)
router.get('/user', (req, res) => {
  Logger.warn('[AUTH] Legacy /user endpoint accessed, redirecting to /api/user');
  res.redirect(307, '/api/user');
});

// Development-only cookie clearing (escape hatch)
if (process.env.NODE_ENV !== 'production') {
  router.post('/api/dev/clear-cookies', (req, res) => {
    res.clearCookie('cf.sid', cookieOptions);
    res.clearCookie('cf.sid', { path: '/' });
    res.set('Clear-Site-Data', '"cookies"');
    Logger.info('[DEV] Emergency cookie clear executed');
    res.json({ ok: true, note: 'All cookies cleared' });
  });
}

export default router;