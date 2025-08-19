// Deprecated - migrated to server/config/env.ts for better environment isolation
// This file is kept for backward compatibility during transition
import { DATABASE_URL, APP_ENV, DB_HOST } from './env';

export { DATABASE_URL };
export const getDbHost = () => DB_HOST;
export const getAppEnv = () => APP_ENV;