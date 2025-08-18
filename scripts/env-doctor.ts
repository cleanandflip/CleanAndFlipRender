// scripts/env-doctor.ts
import { APP_ENV, DB_HOST, EXPECTED_DB_HOST, API_BASE_URL, ENV_BANNER } from "../server/config/env";

console.log(ENV_BANNER);
console.log({
  APP_ENV,
  DB_HOST,
  EXPECTED_DB_HOST: EXPECTED_DB_HOST || "(not set)",
  API_BASE_URL: API_BASE_URL || "(relative client calls)",
});
if (EXPECTED_DB_HOST && DB_HOST !== EXPECTED_DB_HOST) {
  console.error("❌ EXPECTED_DB_HOST mismatch");
  process.exit(1);
}
console.log("✅ env:doctor OK");