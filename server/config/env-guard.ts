// src/config/env-guard.ts
import { APP_ENV, DATABASE_URL, EXPECTED_DB_HOST, dbHostFromUrl } from './env';

export function assertEnvSafety() {
  const host = dbHostFromUrl(DATABASE_URL);
  const banner = `[ENV_GUARD] APP_ENV=${APP_ENV} DB_HOST=${host}`;
  console.log(banner);

  // Refuse to start if the DB host isn't what we expect for this env
  if (EXPECTED_DB_HOST && host !== EXPECTED_DB_HOST) {
    console.error(`❌ ENV_GUARD VIOLATION: Expected DB host '${EXPECTED_DB_HOST}' but got '${host}'`);
    console.error(`❌ This prevents dev/preview from accidentally hitting production database`);
    throw new Error(
      `ENV_GUARD: Refusing to start. APP_ENV=${APP_ENV} but DATABASE_URL host=${host} != EXPECTED_DB_HOST=${EXPECTED_DB_HOST}`
    );
  }

  console.log(`✅ ENV_GUARD: Environment isolation verified`);
}