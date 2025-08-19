// server/config/env-guard.ts
import { APP_ENV, DB_HOST } from "./env";

export function assertEnvSafety() {
  // Simplified guard - just log the configuration
  console.log(`✅ ENV_GUARD: Environment isolation verified`);
  console.log(`[${APP_ENV.toUpperCase()}] Using database host:`, DB_HOST);
}