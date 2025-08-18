// server/config/env.ts
import * as process from "node:process";

export type AppEnv = "development" | "preview" | "staging" | "production";

// EXTREMELY ADVANCED AND FOOLPROOF ENVIRONMENT DETECTION
export const APP_ENV: AppEnv = (() => {
  // CRITICAL: Localhost preview detection - if we're running on localhost, we're ALWAYS development
  const hostname = process.env.HOSTNAME || '';
  const isLocalhost = hostname.includes('localhost') || 
                     hostname.includes('127.0.0.1') || 
                     hostname.includes('0.0.0.0') ||
                     process.env.REPLIT_DEV_DOMAIN;  // Replit preview domain
  
  if (isLocalhost) {
    console.log('[ENV_DETECTION] 🔍 LOCALHOST DETECTED - Forcing DEVELOPMENT mode');
    return "development";
  }
  
  // PRIORITY 1: EXPLICIT PRODUCTION - Only if we have clear production indicators
  const isExplicitProduction = process.env.REPLIT_DEPLOYMENT === "1" || 
                              process.env.REPLIT_ENV === "production" ||
                              (process.env.NODE_ENV === "production" && !process.env.DEV_APP_ENV);
  
  if (isExplicitProduction) {
    console.log('[ENV_DETECTION] 🚀 EXPLICIT PRODUCTION DETECTED');
    return "production";
  }
  
  // PRIORITY 2: DEVELOPMENT INDICATORS - Strong development signals
  const isDevelopment = process.env.NODE_ENV === "development" || 
                       process.env.DEV_APP_ENV === "development" ||
                       process.env.REPLIT_DEV === "1" ||
                       !process.env.PROD_APP_ENV;  // No production env set = development
  
  if (isDevelopment) {
    console.log('[ENV_DETECTION] 💻 DEVELOPMENT INDICATORS FOUND');
    return "development";
  }
  
  // PRIORITY 3: URL/Domain Analysis for advanced detection
  const repl_url = process.env.REPL_URL || '';
  const replit_domains = process.env.REPLIT_DOMAINS || '';
  
  // If we have .replit.app domains, we're in production deployment
  if (repl_url.includes('.replit.app') || replit_domains.includes('.replit.app')) {
    console.log('[ENV_DETECTION] 🚀 REPLIT.APP DOMAIN DETECTED - PRODUCTION');
    return "production";
  }
  
  // If we have .replit.dev domains, we're ALSO in production deployment (not development preview)
  if (repl_url.includes('.replit.dev') || replit_domains.includes('.replit.dev')) {
    console.log('[ENV_DETECTION] 🚀 REPLIT.DEV DOMAIN DETECTED - PRODUCTION DEPLOYMENT');
    return "production";
  }
  
  // FALLBACK: If all else fails, default to development for safety
  console.log('[ENV_DETECTION] ⚠️  FALLBACK TO DEVELOPMENT (Safe Default)');
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