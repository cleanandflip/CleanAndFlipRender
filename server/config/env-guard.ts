// server/config/env-guard.ts
import { APP_ENV, DB_HOST, EXPECTED_DB_HOST, ENV_BANNER } from "./env";

export function assertEnvSafety() {
  console.log(ENV_BANNER);
  console.log(`[ENV_GUARD] APP_ENV=${APP_ENV} DB_HOST=${DB_HOST}`);

  // If an expectation is provided, enforce it.
  if (EXPECTED_DB_HOST && EXPECTED_DB_HOST !== '<' && DB_HOST !== EXPECTED_DB_HOST) {
    console.error(`❌ ENV_GUARD VIOLATION: Expected DB host '${EXPECTED_DB_HOST}' but got '${DB_HOST}'`);
    console.error(`❌ This prevents cross-environment contamination`);
    throw new Error(
      `ENV_GUARD: Refusing to start. APP_ENV=${APP_ENV} but DATABASE_URL host=${DB_HOST} != EXPECTED_DB_HOST=${EXPECTED_DB_HOST}`
    );
  }

  // Extra opinionated safety rails - prevent cross-environment contamination:
  if (APP_ENV !== "production") {
    // Development MUST use lucky-poetry database
    const devHost = "ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech";
    const prodHost = "ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech";
    const oldDevHost = "ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech";
    
    if (DB_HOST === prodHost) {
      throw new Error(`ENV_GUARD: Development environment cannot use production database (${prodHost})`);
    }
    if (DB_HOST === oldDevHost) {
      throw new Error(`ENV_GUARD: Development environment cannot use old database (${oldDevHost}). Use lucky-poetry only.`);
    }
    if (DB_HOST !== devHost) {
      console.warn(`⚠️  ENV_GUARD: Development should use ${devHost}, but using ${DB_HOST}`);
    }
  } else {
    // Production MUST use muddy-moon database
    const prodHost = "ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech";
    if (DB_HOST !== prodHost) {
      throw new Error(`ENV_GUARD: Production environment MUST use muddy-moon database (${prodHost}), not ${DB_HOST}`);
    }
  }

  console.log("✅ ENV_GUARD: Environment isolation verified");
}