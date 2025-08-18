// server/config/env-guard.ts
import { APP_ENV, DB_HOST, DEV_DB_HOST, PROD_DB_HOST, ENV_BANNER } from "./env";

export function assertEnvSafety() {
  console.log(ENV_BANNER);
  console.log(`[ENV_GUARD] APP_ENV=${APP_ENV} DB_HOST=${DB_HOST}`);

  const expected = APP_ENV === "production" ? PROD_DB_HOST : DEV_DB_HOST;

  // If we know the expected host for this env, enforce it
  if (expected && DB_HOST !== expected) {
    throw new Error(
      `ENV_GUARD: Refusing to start. APP_ENV=${APP_ENV} but DATABASE_URL host=${DB_HOST} != expected(${APP_ENV})=${expected}`
    );
  }

  // Extra belt-and-suspenders: never use the other env's host
  if (APP_ENV === "production" && DEV_DB_HOST && DB_HOST === DEV_DB_HOST) {
    throw new Error(`ENV_GUARD: production cannot use DEV host ${DEV_DB_HOST}`);
  }
  if (APP_ENV !== "production" && PROD_DB_HOST && DB_HOST === PROD_DB_HOST) {
    throw new Error(`ENV_GUARD: ${APP_ENV} cannot use PROD host ${PROD_DB_HOST}`);
  }

  console.log("✅ ENV_GUARD: Environment isolation verified");
}