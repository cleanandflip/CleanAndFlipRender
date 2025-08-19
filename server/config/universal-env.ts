import * as process from "node:process";

export type AppEnv = "development" | "production" | "preview" | "staging";

// Import environment detection from the single source of truth
import { APP_ENV as ENV_FROM_CONFIG } from './env';
export const APP_ENV: AppEnv = ENV_FROM_CONFIG;

function must(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function opt(name: string, def = ""): string {
  const v = process.env[name]; 
  return (v ?? def).trim();
}

export function hostOf(u: string): string {
  try { 
    return new URL(u).host; 
  } catch {
    const s = u.replace(/^postgres(ql)?:\/\//, "");
    const afterAt = s.split("@").pop() || s;
    return afterAt.split("/")[0].split("?")[0];
  }
}

export const DEV_DATABASE_URL = opt("DEV_DATABASE_URL", process.env.DATABASE_URL || "");
export const PROD_DATABASE_URL = opt("PROD_DATABASE_URL", process.env.DATABASE_URL || "");
export const DATABASE_URL = APP_ENV === "production" ? PROD_DATABASE_URL : DEV_DATABASE_URL;

// Import DB_HOST from single source
import { DB_HOST } from './env';
export { DB_HOST };
export const DEV_DB_HOST = hostOf(DEV_DATABASE_URL);
export const PROD_DB_HOST = hostOf(PROD_DATABASE_URL);

export const KNOWN_PROD_HOSTS = opt("KNOWN_PROD_HOSTS")
  .split(",").map(s => s.trim()).filter(Boolean);

export const SESSION_SECRET = must("SESSION_SECRET");
export const SESSION_COOKIE_DOMAIN = APP_ENV === "production" ? opt("SESSION_COOKIE_DOMAIN") : undefined;

export const CORS_ORIGINS =
  APP_ENV === "production"
    ? opt("CORS_ORIGINS_PROD").split(",").map(s=>s.trim()).filter(Boolean)
    : opt("CORS_ORIGINS_DEV").split(",").map(s=>s.trim()).filter(Boolean);

// Webhook prefix - imported from single source
import { WEBHOOK_PREFIX } from './env';
export { WEBHOOK_PREFIX };

// Provider secrets (extend as you add providers) - optional for now
export const WEBHOOKS = {
  stripe: {
    secret: APP_ENV === "production" 
      ? opt("STRIPE_WEBHOOK_SECRET_PROD", "dummy-prod-secret") 
      : opt("STRIPE_WEBHOOK_SECRET_DEV", "dummy-dev-secret"),
  },
  generic: {
    secret: APP_ENV === "production" 
      ? opt("GENERIC_WEBHOOK_SECRET_PROD", "dummy-prod-secret") 
      : opt("GENERIC_WEBHOOK_SECRET_DEV", "dummy-dev-secret"),
    signatureHeader: "x-signature", // HMAC-SHA256 of raw body
  },
};

export const ENV_BANNER =
  `[ENV] app=${APP_ENV} node=${process.env.NODE_ENV} dbHost=${DB_HOST}`;