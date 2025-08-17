import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";
import { Logger } from './utils/logger';
import { getDatabaseConfig, getCurrentEnvironment } from './config/database';

// Use HTTP-based connection instead of WebSocket to avoid compatibility issues
// This is more reliable for serverless environments

// Use the unified database configuration system
const dbConfig = getDatabaseConfig();
const databaseUrl = dbConfig.url;

// Enhanced database connection logging for production deployment
console.log('[DB] Using unified database configuration...');
console.log('[DB] Environment:', dbConfig.environment);
console.log('[DB] Database name:', dbConfig.name);

// Log database host (safe to log)
try {
  const dbUrl = new URL(databaseUrl);
  console.log('[DB] Connecting to host:', dbUrl.hostname);
  console.log('[DB] Database name:', dbUrl.pathname.substring(1));
} catch (e) {
  console.error('[DB] Invalid database URL format');
  throw new Error('Invalid database URL configuration');
}

// Create HTTP-based Neon client (more reliable for serverless)
const sql = neon(databaseUrl);

// Database wrapper with retry logic for HTTP-based connection
const withRetry = async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      Logger.error(`Database operation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        Logger.info(`Retrying operation (attempt ${attempt + 1})...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
};

export { sql, withRetry };
export const db = drizzle(sql, { schema });

// Test connection on startup and log results for deployment verification
import { sql as drizzleSql } from 'drizzle-orm';
sql`SELECT current_database() as db, current_user as "user", version() as version`
  .then((result: any) => {
    const info = result[0];
    console.log('[DB] ✅ Database connected successfully');
    console.log(`[DB] Database: ${info.db}, User: ${info.user}`);
    console.log(`[DB] PostgreSQL Version: ${info.version?.split(',')[0] || 'unknown'}`);
  })
  .catch((err) => {
    console.error('[DB] ❌ Database connection failed:', err.message);
    console.error('[DB] This will cause authentication and other database features to fail');
  });

// Graceful shutdown (HTTP connections don't need explicit cleanup)
process.on('SIGTERM', async () => {
  Logger.info('Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('Gracefully shutting down...');
  process.exit(0);
});