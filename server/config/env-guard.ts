// server/config/env-guard.ts
import { APP_ENV, DATABASE_URL, DEV_DB_HOST, PROD_DB_HOST, dbHostFromUrl } from "./env";

export function assertEnvSafety() {
  const host = dbHostFromUrl(DATABASE_URL);
  console.log(`[ENV_GUARD] app=${APP_ENV} node=${process.env.NODE_ENV} dbHost=${host}`);

  if (APP_ENV === "development" && host === PROD_DB_HOST) {
    throw new Error(
      `ENV_GUARD: dev app is pointing at PROD DB (${host}). Refusing to start.`
    );
  }
  if (APP_ENV === "production" && host !== PROD_DB_HOST) {
    throw new Error(
      `ENV_GUARD: production app must point at PROD DB (${PROD_DB_HOST}) but got ${host}`
    );
  }
  console.log("✅ ENV_GUARD: Environment isolation verified");
}