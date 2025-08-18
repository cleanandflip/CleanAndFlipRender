import { APP_ENV, DB_HOST, DEV_DB_HOST, PROD_DB_HOST, KNOWN_PROD_HOSTS, ENV_BANNER } from "./universal-env";

export function assertUniversalEnvGuards() {
  console.log(ENV_BANNER);

  // 1) The database host must match the selected APP_ENV
  const expected = APP_ENV === "production" ? PROD_DB_HOST : DEV_DB_HOST;
  if (expected && DB_HOST !== expected) {
    throw new Error(`ENV_GUARD: APP_ENV=${APP_ENV} but DATABASE_URL host=${DB_HOST} != expected=${expected}`);
  }

  // 2) Belt-and-suspenders: prevent dev from writing to known prod hosts even if misconfigured
  if (APP_ENV !== "production" && KNOWN_PROD_HOSTS.includes(DB_HOST)) {
    throw new Error(`ENV_GUARD: ${APP_ENV} cannot run against known PROD host ${DB_HOST}`);
  }

  console.log("✅ UNIVERSAL_ENV_GUARD: ok");
}