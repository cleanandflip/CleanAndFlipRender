// scripts/env-doctor.ts
import { APP_ENV, DB_HOST, DEV_DB_HOST, PROD_DB_HOST, API_BASE_URL, ENV_BANNER } from "../server/config/env";

console.log(ENV_BANNER);
console.log({
  APP_ENV,
  DB_HOST,
  DEV_DB_HOST: DEV_DB_HOST || "(not set)",
  PROD_DB_HOST: PROD_DB_HOST || "(not set)",
  API_BASE_URL: API_BASE_URL || "(relative client calls)",
});

const expected = APP_ENV === "production" ? PROD_DB_HOST : DEV_DB_HOST;
if (expected && DB_HOST !== expected) {
  console.error(`❌ Host mismatch: expected(${APP_ENV})=${expected} but got ${DB_HOST}`);
  process.exit(1);
}

// Cross-contamination check
if (APP_ENV === "production" && DEV_DB_HOST && DB_HOST === DEV_DB_HOST) {
  console.error(`❌ Production using DEV host ${DEV_DB_HOST}`);
  process.exit(1);
}
if (APP_ENV !== "production" && PROD_DB_HOST && DB_HOST === PROD_DB_HOST) {
  console.error(`❌ ${APP_ENV} using PROD host ${PROD_DB_HOST}`);
  process.exit(1);
}

console.log("✅ env:doctor OK");