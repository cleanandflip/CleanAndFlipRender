import session from "express-session";
import pgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { APP_ENV } from "./env";
import { DATABASE_URL } from "./env";

export function getSessionCookieName() {
  return APP_ENV === "production" ? "CF_SID_PROD" : "CF_SID_DEV";
}

// IMPORTANT: Replit is HTTPS-terminated at the proxy.
// We must trust proxy so express-session can mark cookies secure.
export const TRUST_PROXY_HOPS = 1;

export function getCookieOptions() {
  // Replit public URLs are HTTPS; local dev via Replit preview is also HTTPS through the proxy.
  const secure = true; // keep true; we trust the proxy so Secure is okay
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    // Do NOT set 'domain' unless you absolutely need cross-subdomain cookies.
    // Leaving it undefined scopes the cookie to the current host correctly in Replit.
  };
}

export function buildSessionMiddleware() {
  const PgStore = pgSimple(session);

  const pool = new Pool({ connectionString: DATABASE_URL });
  const store = new PgStore({
    pool,
    tableName: "sessions",
    // prune every hour
    pruneSessionInterval: 60 * 60,
  });

  return session({
    name: getSessionCookieName(),
    store,
    secret: process.env.SESSION_SECRET || "change-me-in-replit-secrets",
    resave: false,
    // CRITICAL: don't set a cookie for anonymous visitors unless we modify req.session
    saveUninitialized: false,
    proxy: true,
    cookie: {
      ...getCookieOptions(),
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days for signed-in sessions
    },
    unset: "destroy",
  });
}