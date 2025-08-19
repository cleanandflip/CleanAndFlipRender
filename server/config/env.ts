// server/config/env.ts
import dotenv from "dotenv";

// 1) Capture whatever the CLI/script set first (e.g. NODE_ENV from `npm run dev`)
const CLI_NODE_ENV = process.env.NODE_ENV;

// 2) Load .env files but DO NOT override anything already set by the shell/CLI
dotenv.config({ override: false });

// 3) Restore CLI-provided NODE_ENV if present (prevents .env from flipping it)
if (CLI_NODE_ENV) process.env.NODE_ENV = CLI_NODE_ENV;

// 4) Normalize
const NODE_ENV = (process.env.NODE_ENV ?? "development") as
  | "development"
  | "production"
  | "test";

const PORT = Number(process.env.PORT ?? 5000);

const DATABASE_URL_ENV = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL_ENV) {
  throw new Error("Missing DATABASE_URL");
}

export const ENV = {
  nodeEnv: "development",
  isDev: true,
  isProd: false,
  port: PORT,
  devDbUrl: DATABASE_URL_ENV,
  prodDbUrl: DATABASE_URL_ENV,
} as const;

// Simplified exports
export const APP_ENV = "development";
export const DATABASE_URL = DATABASE_URL_ENV;
export const DB_HOST = DATABASE_URL ? new URL(DATABASE_URL).host : 'localhost';
export const WEBHOOK_PREFIX = process.env.WEBHOOK_PREFIX || '/wh';
export const EXPECTED_DB_HOST = DB_HOST;
export const ENV_BANNER = `${NODE_ENV.toUpperCase()} Environment`;

Object.freeze(ENV);