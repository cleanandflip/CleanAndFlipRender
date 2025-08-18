import { Router } from "express";
import { getSessionCookieName, getCookieOptions } from "../config/session";
import { authImprovements } from "../middleware/auth-improved";
import { storage } from "../storage";
import { Logger } from "../utils/logger";

const router = Router();

// Guest-safe user endpoint - always returns 200
router.get("/user", async (req: any, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");  
  res.setHeader("Expires", "0");

  try {
    // Check authentication status
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated() && req.user;
    const hasValidSession = req.session?.userId || req.session?.passport?.user;

    if (!isAuthenticated && !hasValidSession) {
      // Guest response - never 401
      return res.json({ 
        auth: false, 
        user: null 
      });
    }

    // User is authenticated - get full user data
    const userId = req.user?.id || req.session?.userId || req.session?.passport?.user;
    if (userId) {
      const user = await storage.getUser(userId);
      if (user) {
        return res.json({
          auth: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profileImageUrl: user.profileImageUrl
          }
        });
      }
    }

    // Fallback for edge cases
    return res.json({ auth: false, user: null });
    
  } catch (error) {
    Logger.error('Error in /api/user endpoint:', error);
    return res.json({ auth: false, user: null }); // Never crash, always return safe response
  }
});

// Bullet-proof logout endpoint
router.post("/logout", (req: any, res) => {
  const cookieName = getSessionCookieName();
  const cookieOpts = getCookieOptions();

  // Destroy server session first
  if (req.session) {
    req.session.destroy((err: any) => {
      // Clear cookie using EXACTLY the same settings (name/path/sameSite/secure/domain)
      res.clearCookie(cookieName, cookieOpts);
      
      // Clear any legacy cookies too
      res.clearCookie('connect.sid', cookieOpts);
      res.clearCookie('cf.sid', cookieOpts);
      res.clearCookie('sessionId', cookieOpts);
      
      if (err) {
        Logger.warn('Logout: session destroy error (may already be gone):', err);
        return res.status(200).json({ ok: true, hint: "session row may already be gone" });
      }
      return res.status(200).json({ ok: true });
    });
  } else {
    // No session to destroy, just clear cookies
    res.clearCookie(cookieName, cookieOpts);
    res.clearCookie('connect.sid', cookieOpts);
    res.clearCookie('cf.sid', cookieOpts);
    res.clearCookie('sessionId', cookieOpts);
    return res.status(200).json({ ok: true });
  }
});

// Authentication state endpoint (explicit auth checking)
router.get("/auth/state", (req: any, res) => {
  res.setHeader("Cache-Control", "no-store");
  
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated() && req.user;
  const hasValidSession = req.session?.userId || req.session?.passport?.user;
  
  res.json({
    authenticated: !!(isAuthenticated || hasValidSession),
    sessionExists: !!req.session,
    sessionId: req.sessionID || null,
    userId: req.user?.id || req.session?.userId || null
  });
});

// Debug endpoints (dev only)
if (process.env.NODE_ENV === 'development') {
  router.get("/session/debug", (req: any, res) => {
    res.json({
      hasSession: !!req.session,
      sessionID: req.sessionID,
      userId: req.user?.id ?? null,
      cookie: {
        name: getSessionCookieName(),
        options: getCookieOptions(),
      }
    });
  });

  router.post("/session/reset", (req: any, res) => {
    const name = getSessionCookieName();
    const opts = getCookieOptions();
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie(name, opts);
        res.json({ ok: true });
      });
    } else {
      res.clearCookie(name, opts);
      res.json({ ok: true });
    }
  });
}

export default router;