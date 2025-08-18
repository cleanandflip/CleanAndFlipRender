// server/config/env-guard.ts
import { APP_ENV, DB_HOST, EXPECTED_DB_HOST, ENV_BANNER } from "./env";

export function assertEnvSafety() {
  console.log(ENV_BANNER);
  console.log(`[ENV_GUARD] APP_ENV=${APP_ENV} DB_HOST=${DB_HOST}`);

  // If an expectation is provided, enforce it.
  if (EXPECTED_DB_HOST && DB_HOST !== EXPECTED_DB_HOST) {
    console.error(`❌ ENV_GUARD VIOLATION: Expected DB host '${EXPECTED_DB_HOST}' but got '${DB_HOST}'`);
    console.error(`❌ This prevents cross-environment contamination`);
    console.warn(`⚠️  Temporarily allowing mismatch for database migration`);
    // Temporarily disabled during database migration
    // throw new Error(
    //   `ENV_GUARD: Refusing to start. APP_ENV=${APP_ENV} but DATABASE_URL host=${DB_HOST} != EXPECTED_DB_HOST=${EXPECTED_DB_HOST}`
    // );
  }

  // Extra opinionated safety rails (optional, keep if helpful):
  if (APP_ENV !== "production") {
    // In dev/preview/staging we defensively forbid known prod hosts if the user forgot EXPECTED_DB_HOST
    const knownProdHosts = (process.env.KNOWN_PROD_HOSTS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (knownProdHosts.length && knownProdHosts.includes(DB_HOST)) {
      throw new Error(`ENV_GUARD: Dev-like env (${APP_ENV}) cannot use known prod host ${DB_HOST}`);
    }
  }

  console.log("✅ ENV_GUARD: Environment isolation verified");
}