import * as process from "node:process";

export type AppEnv = "development" | "production" | "preview" | "staging";

// Simplified environment - always development
export const APP_ENV = "development";

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

// Simplified database - always use development database
export const DATABASE_URL = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || "";
export const DB_HOST = hostOf(DATABASE_URL);

export const KNOWN_PROD_HOSTS = opt("KNOWN_PROD_HOSTS")
  .split(",").map(s => s.trim()).filter(Boolean);

export const SESSION_SECRET = must("SESSION_SECRET");
// Simplified session and CORS - development mode
export const SESSION_COOKIE_DOMAIN = undefined;
export const CORS_ORIGINS: string[] = [];

// Webhook prefix - imported from single source
import { WEBHOOK_PREFIX } from './env';
export { WEBHOOK_PREFIX };

// Provider secrets (extend as you add providers) - optional for now
// Simplified webhooks - development mode
export const WEBHOOKS = {
  stripe: {
    secret: "dummy-dev-secret",
  },
  generic: {
    secret: "dummy-dev-secret",
    signatureHeader: "x-signature",
  },
};

export const ENV_BANNER =
  `[ENV] app=development node=${process.env.NODE_ENV} dbHost=${DB_HOST}`;