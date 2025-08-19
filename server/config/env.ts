// server/config/env.ts
import * as process from "node:process";

export type AppEnv = "development" | "preview" | "staging" | "production";

// SINGLE SOURCE OF TRUTH ENVIRONMENT DETECTION - No runtime overrides
export const APP_ENV: AppEnv = (() => {
  // PRIORITY 1: Explicit APP_ENV environment variable (highest priority)
  if (process.env.APP_ENV) {
    return process.env.APP_ENV as AppEnv;
  }
  
  // PRIORITY 2: Replit deployment detection
  const repl_url = process.env.REPL_URL || '';
  const replit_domains = process.env.REPLIT_DOMAINS || '';
  
  // Replit deployments (.replit.dev or .replit.app) are production
  if (repl_url.includes('.replit.dev') || replit_domains.includes('.replit.dev') ||
      repl_url.includes('.replit.app') || replit_domains.includes('.replit.app')) {
    return "production";
  }
  
  // PRIORITY 3: Explicit production environment variables
  if (process.env.REPLIT_DEPLOYMENT === "1" || process.env.REPLIT_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 4: NODE_ENV fallback (for local development)
  return process.env.NODE_ENV === "production" ? "production" : "development";
})();

// Require at least one of these to be set per env.
function must(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  throw new Error(`Missing required env: one of ${keys.join(", ")}`);
}

// WEBHOOK PREFIX - Single source of truth for webhook routing
export const WEBHOOK_PREFIX = APP_ENV === "production" ? "/wh/prod" : "/wh/dev";

// Use dedicated DSNs per env; DO NOT point both to the same DB.
export const DATABASE_URL =
  APP_ENV === "production"
    ? must("PROD_DATABASE_URL", "DATABASE_URL")
    : must("DEV_DATABASE_URL", "DATABASE_URL");

// Database host extraction for logging and verification
export const DB_HOST = (() => {
  try {
    return new URL(DATABASE_URL).host;
  } catch {
    const s = DATABASE_URL.replace(/^postgres(ql)?:\/\//, "");
    const afterAt = s.split("@").pop() || s;
    return afterAt.split("/")[0].split("?")[0];
  }
})();

// Single environment banner - the only one that should exist
console.log(`[ENV] app=${APP_ENV} node=${process.env.NODE_ENV || 'unknown'} dbHost=${DB_HOST}`);

// Optional: a DSN or a bare hostname you *expect* for this env.
// We accept either to reduce human error.
export const EXPECTED_DB = (process.env.EXPECTED_DB_URL || process.env.EXPECTED_DB_HOST || "").trim();

export function extractHost(value: string): string {
  try {
    // Works for postgres:// and postgresql:// DSNs
    return new URL(value).host;
  } catch {
    // Not a URL; treat as already a host, or a DSN w/o protocol
    // Strip creds, path, and query if present
    const s = value.replace(/^postgres(ql)?:\/\//, "");
    const afterAt = s.split("@").pop() || s;
    return afterAt.split("/")[0].split("?")[0];
  }
}

export const EXPECTED_DB_HOST = EXPECTED_DB ? extractHost(EXPECTED_DB) : "";

// API base (server-to-server absolute, or leave blank and use relative on client)
export const API_BASE_URL =
  APP_ENV === "production"
    ? process.env.API_BASE_URL_PROD?.trim() || ""
    : process.env.API_BASE_URL_DEV?.trim() || "";

// Helpful banner
export const ENV_BANNER = `[ENV_CONFIG] APP_ENV=${APP_ENV}, DATABASE_URL host=${DB_HOST}`;