// DEPRECATED: This file is replaced by server/config/env.ts for better environment isolation
// Re-export from the new system for backward compatibility
export { DATABASE_URL, APP_ENV as getAppEnv, dbHostFromUrl as getDbHost } from './env';