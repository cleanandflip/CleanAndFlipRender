// Deprecated - migrated to server/config/env.ts for better environment isolation
// This file is kept for backward compatibility during transition
import { DATABASE_URL, APP_ENV, DEV_DB_HOST, PROD_DB_HOST, dbHostFromUrl } from './env';

export { DATABASE_URL, APP_ENV };

export function getDbHost(): string {
  return dbHostFromUrl(DATABASE_URL);
}

export function getAppEnv(): string {
  return APP_ENV;
}