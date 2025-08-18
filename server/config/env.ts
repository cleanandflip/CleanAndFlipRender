// server/config/env.ts
import * as process from "node:process";

export type AppEnv = "development" | "preview" | "staging" | "production";

// safer: we compute expected hosts from the DSNs
export const APP_ENV: AppEnv =
  (process.env.APP_ENV as AppEnv) ||
  (process.env.NODE_ENV === "production" ? "production" : "development");

export const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL?.trim() || "";
export const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL?.trim() || "";

function must(...keys: string[]) {
  for (const k of keys) { 
    const v = process.env[k]; 
    if (v && v.trim()) return v.trim(); 
  }
  throw new Error(`Missing env: one of ${keys.join(", ")}`);
}

export const DATABASE_URL =
  APP_ENV === "production" ? must("PROD_DATABASE_URL","DATABASE_URL")
                           : must("DEV_DATABASE_URL","DATABASE_URL");

export function extractHost(v: string): string {
  try { 
    return new URL(v).host; 
  } catch {
    const s = v.replace(/^postgres(ql)?:\/\//, "");
    const afterAt = s.split("@").pop() || s;
    return afterAt.split("/")[0].split("?")[0];
  }
}

export const DB_HOST        = extractHost(DATABASE_URL);
export const DEV_DB_HOST    = DEV_DATABASE_URL ? extractHost(DEV_DATABASE_URL) : "";
export const PROD_DB_HOST   = PROD_DATABASE_URL ? extractHost(PROD_DATABASE_URL) : "";

// API base (server-to-server absolute, or leave blank and use relative on client)
export const API_BASE_URL =
  APP_ENV === "production"
    ? process.env.API_BASE_URL_PROD?.trim() || ""
    : process.env.API_BASE_URL_DEV?.trim() || "";

export const ENV_BANNER = `[ENV_CONFIG] APP_ENV=${APP_ENV}, DATABASE_URL host=${DB_HOST}`;