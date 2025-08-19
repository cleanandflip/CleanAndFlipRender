import { IS_PROD } from "./app-env";
import { ENV } from "./env";

export function getDatabaseUrl() {
  // Use existing unified database URL logic
  return ENV.devDbUrl;
}

// Export existing functions for compatibility
export const DATABASE_URL = ENV.devDbUrl;
export const getDbHost = () => new URL(ENV.devDbUrl).host;