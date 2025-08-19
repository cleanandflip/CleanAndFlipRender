import { IS_PROD } from "./app-env";
import { DATABASE_URL as EXISTING_DATABASE_URL } from "./env";

export function getDatabaseUrl() {
  // Use existing unified database URL logic
  return EXISTING_DATABASE_URL;
}

// Export existing functions for compatibility
export { DATABASE_URL, DB_HOST as getDbHost } from "./env";