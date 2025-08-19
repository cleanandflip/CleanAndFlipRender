import session from "express-session";
import connectPg from "connect-pg-simple";
import { IS_PROD } from "../config/app-env";
import { getDatabaseUrl } from "../config/database";

const PgSession = connectPg(session);

// Single source of truth for cookie options - used for both setting and clearing
export const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: IS_PROD, // Works with trust proxy = 1
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  domain: undefined // Let browser handle domain
};

export const unifiedSessionMiddleware = session({
  name: "cf.sid", // Stable, single cookie name
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false, // Don't create sessions for guests unless needed
  store: new PgSession({
    conString: getDatabaseUrl(),
    tableName: "sessions",
    createTableIfMissing: true,
    ttl: 30 * 24 * 60 * 60, // 30 days in seconds
    pruneSessionInterval: 60 * 60, // Prune every hour
  }),
  cookie: cookieOptions
});

// Middleware to prevent caching of auth endpoints
export const preventAuthCache = (req: any, res: any, next: any) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};