// Unified session configuration with consistent cookie options
import session from "express-session";
import { APP_ENV } from "../config/env";
import { db } from "../db";
import { SESSION_SECRET } from "../config/universal-env";

import connectPg from 'connect-pg-simple';
const PgSession = connectPg(session);

const isProd = APP_ENV === 'production';

// Single source of truth for cookie options - used for both setting and clearing
export const cookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,         // Works with trust proxy = 1
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  domain: isProd ? undefined : undefined // Let browser handle domain
};

export const sessionMiddleware = session({
  name: 'cf.sid',         // Stable, single cookie name
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Don't create sessions for guests unless needed
  store: new PgSession({
    conString: process.env.DATABASE_URL,
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