// server/config/env.ts
import * as dotenv from "dotenv";
dotenv.config();

const NODE_ENV = (process.env.NODE_ENV || "development").toLowerCase() as
  | "production" | "development" | "test";

// If APP_ENV is not set, derive it strictly from NODE_ENV.
// NO hostname magic; NO auto-detection.
const APP_ENV = (process.env.APP_ENV ||
  (NODE_ENV === "production" ? "production" : "development")) as
  | "production" | "development";

// Require both URLs, but we'll pick by APP_ENV
const DEV_DATABASE_URL  = process.env.DEV_DATABASE_URL  || "";
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL || "";

if (!DEV_DATABASE_URL)  throw new Error("DEV_DATABASE_URL is required");
if (!PROD_DATABASE_URL) throw new Error("PROD_DATABASE_URL is required");

export const DATABASE_URL =
  APP_ENV === "production" ? PROD_DATABASE_URL : DEV_DATABASE_URL;

// Robust host extractor for postgres DSNs
export function dbHostFromUrl(dsn: string): string {
  try {
    const normalized = dsn.replace(/^postgresql:/, "postgres:");
    return new URL(normalized).hostname;
  } catch {
    const m = dsn.match(/@([^/?#:]+)[/:]/);
    return m?.[1] || "unknown";
  }
}

export const DEV_DB_HOST  = dbHostFromUrl(DEV_DATABASE_URL);
export const PROD_DB_HOST = dbHostFromUrl(PROD_DATABASE_URL);

// Optional: explicit hosts to assert at boot (else we assert from URLs)
export const EXPECTED_DB_HOST_DEV  =
  process.env.EXPECTED_DB_HOST_DEV  || DEV_DB_HOST;
export const EXPECTED_DB_HOST_PROD =
  process.env.EXPECTED_DB_HOST_PROD || PROD_DB_HOST;

export { NODE_ENV, APP_ENV };