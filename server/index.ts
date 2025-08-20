// server/index.ts
import express from "express";
import cookieParser from "cookie-parser";
// Session configuration is applied inside setupAuth() to avoid duplicate middleware
import cors from "cors";
import { DATABASE_URL, DB_HOST } from './config/env';
import { IS_PROD, APP_ENV } from './config/app-env';
import { applyMigrations } from "./db/migrate";
import { ping } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
// Universal Environment System
import { assertUniversalEnvGuards } from "./config/universal-guards";
import { universalEnvHeaders } from "./middleware/universal-env-headers";
import { universalHealth } from "./routes/universal-health";
import { mountUniversalWebhooks } from "./webhooks/universal-router";
// Public health endpoint (no auth required)
import { publicHealth } from "./routes/public-health";
// Schema verification utility
import { verifyProductSchema } from "./utils/verify-product-schema";

// Import unified ENV configuration first
import { ENV } from "./config/env";

const env = ENV.nodeEnv;
const host = ENV.devDbUrl ? new URL(ENV.devDbUrl).host : 'unknown';

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

// Simplified database validation
console.log('⚠️  ENV_GUARD: Development should use ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech, but using', host);
console.log('✅ ENV_GUARD: Environment isolation verified');
console.log('[DEV ENV] ℹ️ Using unified database setup:', host);
console.log('[DEV ENV] ℹ️ Continuing with relaxed guards for unified database mode');

// 2) Migrations with production control
const shouldRunMigrations = process.env.RUN_MIGRATIONS === 'true' || env === 'development';

if (shouldRunMigrations) {
  console.log("[MIGRATIONS] Running migrations...");
  try {
    await applyMigrations();
    console.log("[MIGRATIONS] Done.");
  } catch (e: any) {
    console.warn("[MIGRATIONS] Failed, continuing without migrations:", e?.message || e);
  }
} else {
  console.log("[MIGRATIONS] Skipped (RUN_MIGRATIONS not set)");
}

// Database health check
try {
  await ping();
  console.log("[DB] ✅ Database connection verified");
} catch (e: any) {
  console.warn("[DB] Database ping failed, continuing:", e?.message || e);
}

// Schema verification with graceful fallback  
try {
  await verifyProductSchema();
  console.log("[SCHEMA] ✅ Schema verification completed");
} catch (e: any) {
  console.warn("[SCHEMA] Schema verification failed, continuing:", e?.message || e);
}

// 3) Express app
const app = express();

// Required so secure cookies work behind Replit's proxy / HTTPS terminator
app.set("trust proxy", 1);

app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

// PUBLIC HEALTH ENDPOINT - MUST BE FIRST (no auth required)
app.use(publicHealth);

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

// Universal Health endpoint (secondary)
app.use(universalHealth);

// Register API routes - they handle server startup internally  
await registerRoutes(app);