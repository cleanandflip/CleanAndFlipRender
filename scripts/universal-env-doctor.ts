import "dotenv/config";
import { APP_ENV, DB_HOST, DEV_DB_HOST, PROD_DB_HOST, WEBHOOK_PREFIX, CORS_ORIGINS } from "../server/config/universal-env.js";

console.log("🏥 Universal Environment Doctor Report");
console.log("=====================================");
console.log({
  APP_ENV,
  DB_HOST,
  expected: APP_ENV === "production" ? PROD_DB_HOST : DEV_DB_HOST,
  WEBHOOK_PREFIX,
  CORS_ORIGINS,
  timestamp: new Date().toISOString()
});