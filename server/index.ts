// server/index.ts
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import { assertEnvSafety } from "./config/env-guard";
import { DATABASE_URL, APP_ENV, dbHostFromUrl } from './config/env';
import { applyMigrations } from "./db/migrate";
import { ping } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

// CRITICAL: Environment isolation check - prevents dev from hitting prod DB
assertEnvSafety();

const env = APP_ENV;
const host = dbHostFromUrl();

// 1) Boot logs that must appear once
console.log("[BOOT]", { env, nodeEnv: process.env.NODE_ENV });
console.log(`[DB_ISOLATION] APP_ENV=${env} DB_HOST=${host}`);

if (env === 'production') {
  // Guard: production must be on the expected production host
  if (!host.includes('muddy-moon') || !host.includes('pooler')) {
    console.error('[CRITICAL] ❌ Production attempted to use non-prod DB host:', host);
    process.exit(1);
  }
  console.log('[PRODUCTION] ✅ Using production DB host:', host);
} else {
  console.log('[DEV] Using development DB host:', host);
}

// 2) Migrations with production control
const shouldRunMigrations = process.env.RUN_MIGRATIONS === 'true' || env === 'development';

if (shouldRunMigrations) {
  console.log("[MIGRATIONS] Running migrations...");
  await applyMigrations().catch((e) => {
    console.error("[MIGRATIONS] Failed:", e);
    process.exit(1); // fail fast; no crash loops from half-booted servers
  });
} else {
  console.log("[MIGRATIONS] Skipped (RUN_MIGRATIONS not set)");
}

// Optional DB reachability check
await ping().catch((e) => {
  console.error("[DB] Ping failed:", e);
  process.exit(1);
});

// 3) Express app
const app = express();
app.set("trust proxy", 1);

app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

// Session configuration moved to setupAuth() in routes.ts
// This prevents duplicate session middleware

app.use(express.json());

// Register API routes - they handle server startup internally  
await registerRoutes(app);