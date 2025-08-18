import session from "express-session";
import PgSimple from "connect-pg-simple";
import { universalPool } from "../db/universal-pool";
import { APP_ENV, SESSION_SECRET, SESSION_COOKIE_DOMAIN } from "../config/universal-env";

const PgSession = PgSimple(session);
const isProd = APP_ENV === "production";

export const universalSessionMiddleware = session({
  store: new PgSession({
    pool: universalPool,
    tableName: "sessions",
    createTableIfMissing: true,
    ttl: 7*24*60*60,
    pruneSessionInterval: 60*60,
  }),
  secret: SESSION_SECRET,
  name: "cf.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: SESSION_COOKIE_DOMAIN,      // undefined in dev → hostOnly
    maxAge: 7*24*60*60*1000,
  },
});