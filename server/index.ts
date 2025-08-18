// server/index.ts
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import { DATABASE_URL, getDbHost, getAppEnv } from './config/database';
import { applyMigrations } from "./db/migrate";
import { ping } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
// Universal Environment System
import { assertUniversalEnvGuards } from "./config/universal-guards";
import { universalEnvHeaders } from "./middleware/universal-env-headers";
import { universalHealth } from "./routes/universal-health";
import { mountUniversalWebhooks } from "./webhooks/universal-router";

const env = getAppEnv();
const host = getDbHost();

// 1) Boot logs that must appear once
// Environment banner is handled in env.ts - no duplicate logging

// Add environment safety guard
import { assertEnvSafety } from "./config/env-guard";
assertEnvSafety();

// Universal Environment System Guards
try {
  assertUniversalEnvGuards();
} catch (error: any) {
  console.error("🔴 Universal Environment Guard Failed:", error?.message || error);
  // Don't exit - fall back to existing system
}

// CRITICAL: Database Environment Safety Guards
if (env === 'production') {
  // Production MUST use muddy-moon database only
  if (!host.includes('muddy-moon')) {
    console.error('[CRITICAL SECURITY] ❌ Production attempted to use NON-PRODUCTION database!');
    console.error('[CRITICAL SECURITY] Expected: muddy-moon, Got:', host);
    console.error('[CRITICAL SECURITY] Deployment BLOCKED to prevent data corruption');
    process.exit(1);
  }
  
  // Ensure production uses pooled connection
  if (!host.includes('pooler')) {
    console.error('[CRITICAL] ❌ Production must use pooled connection');
    process.exit(1);
  }
  
  console.log('[PRODUCTION] ✅ Using production DB host (muddy-moon):', host);
} else {
  // Development MUST use lucky-poetry database only
  if (!host.includes('lucky-poetry')) {
    console.error('[CRITICAL DEV] ❌ Development attempted to use NON-DEVELOPMENT database!');
    console.error('[CRITICAL DEV] Expected: lucky-poetry, Got:', host);
    console.error('[CRITICAL DEV] Startup BLOCKED to prevent cross-contamination');
    process.exit(1);
  }
  
  console.log('[DEV] ✅ Using development DB host (lucky-poetry):', host);
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

// Universal Environment System headers
app.use(universalEnvHeaders);

// Mount Universal Environment System webhooks FIRST (they need raw body)
try {
  mountUniversalWebhooks(app);
} catch (error: any) {
  console.warn("🟡 Universal Webhooks failed to mount:", error?.message || error);
}

// Session configuration moved to setupAuth() in routes.ts
// This prevents duplicate session middleware

app.use(express.json());

// Universal Health endpoint
app.use(universalHealth);

// Register API routes - they handle server startup internally  
await registerRoutes(app);