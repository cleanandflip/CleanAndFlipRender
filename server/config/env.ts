// server/config/env.ts
import * as process from "node:process";

export type AppEnv = "development" | "preview" | "staging" | "production";

// Decide app env explicitly using environment-specific secrets
export const APP_ENV: AppEnv = (() => {
  // PRIORITY 1: Check if we're in Replit deployment (production)
  if (process.env.REPLIT_DEPLOYMENT === "1" || process.env.REPLIT_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 2: Check NODE_ENV for explicit production
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 3: Check for production environment variables
  if (process.env.PROD_APP_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 4: Development fallbacks
  if (process.env.NODE_ENV === "development" || process.env.DEV_APP_ENV === "development") {
    return "development";
  }
  
  // PRIORITY 5: Legacy fallback based on environment context
  if (process.env.APP_ENV === "production") {
    return "production";
  }
  
  // Default to development for Replit workspace
  return "development";
})();

// Require at least one of these to be set per env.
function must(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  throw new Error(`Missing required env: one of ${keys.join(", ")}`);
}

// Use dedicated DSNs per env; DO NOT point both to the same DB.
export const DATABASE_URL =
  APP_ENV === "production"
    ? must("PROD_DATABASE_URL", "DATABASE_URL")
    : must("DEV_DATABASE_URL", "DATABASE_URL");

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

export const DB_HOST = extractHost(DATABASE_URL);
export const EXPECTED_DB_HOST = EXPECTED_DB ? extractHost(EXPECTED_DB) : "";

// API base (server-to-server absolute, or leave blank and use relative on client)
export const API_BASE_URL =
  APP_ENV === "production"
    ? process.env.API_BASE_URL_PROD?.trim() || ""
    : process.env.API_BASE_URL_DEV?.trim() || "";

// Helpful banner
export const ENV_BANNER = `[ENV_CONFIG] APP_ENV=${APP_ENV}, DATABASE_URL host=${DB_HOST}`;