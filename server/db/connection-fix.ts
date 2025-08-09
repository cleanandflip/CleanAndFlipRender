import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { Logger } from '../utils/logger';
import * as schema from '../../shared/schema';

// Enhanced database connection with comprehensive retry logic
export async function createDatabaseConnection() {
  const maxRetries = 3;
  let retries = 0;
  
  // Validate DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    Logger.error('[DB] CRITICAL: DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL is required for database connection');
  }

  // Log connection attempt (sanitized)
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    Logger.info(`[DB] Attempting connection to host: ${dbUrl.hostname}`);
    Logger.info(`[DB] Database: ${dbUrl.pathname.substring(1)}`);
    Logger.info(`[DB] SSL Mode: ${dbUrl.searchParams.get('sslmode') || 'not specified'}`);
  } catch (e) {
    Logger.error('[DB] Invalid DATABASE_URL format:', e);
    throw new Error('Invalid DATABASE_URL format');
  }
  
  while (retries < maxRetries) {
    try {
      Logger.info(`[DB] Connection attempt ${retries + 1}/${maxRetries}`);
      
      // Create Neon connection
      const sql = neon(process.env.DATABASE_URL);
      
      // Test the connection with a simple query
      const testResult = await sql`SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        NOW() as timestamp`;
      
      Logger.info('[DB] ✅ Database connected successfully');
      Logger.info(`[DB] Connected as: ${testResult[0].user}`);
      Logger.info(`[DB] Database: ${testResult[0].database}`);
      Logger.info(`[DB] PostgreSQL: ${testResult[0].version.split(',')[0]}`);
      
      // Create and return Drizzle instance
      const db = drizzle(sql, { schema });
      
      return { db, sql };
    } catch (error: any) {
      retries++;
      Logger.error(`[DB] Connection attempt ${retries} failed:`, {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      
      // Specific error handling for common Neon issues
      if (error.message?.includes('password authentication failed')) {
        Logger.error('[DB] AUTHENTICATION ERROR: Check DATABASE_URL credentials in Replit Secrets');
        Logger.error('[DB] - Verify password in Neon Console');
        Logger.error('[DB] - Ensure complete connection string is copied');
        Logger.error('[DB] - Check for special characters that need encoding');
        throw new Error('Database authentication failed - check credentials');
      }
      
      if (error.message?.includes('database') && error.message?.includes('does not exist')) {
        Logger.error('[DB] DATABASE NOT FOUND: Check database name in connection string');
        throw new Error('Database does not exist - check connection string');
      }
      
      if (error.message?.includes('timeout') || error.code === 'ECONNREFUSED') {
        Logger.warn('[DB] Connection timeout - this may be a temporary network issue');
        if (retries < maxRetries) {
          const backoffMs = Math.pow(2, retries) * 1000;
          Logger.info(`[DB] Retrying in ${backoffMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }
      
      if (retries === maxRetries) {
        Logger.error('[DB] FATAL: Database connection failed after maximum retries');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff for retries
      const backoffMs = Math.pow(2, retries) * 1000;
      Logger.info(`[DB] Waiting ${backoffMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  throw new Error('Database connection failed - maximum retries exceeded');
}

// Test database connection health
export async function testDatabaseHealth(db: any): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as health_check');
    return result.rows.length > 0;
  } catch (error) {
    Logger.error('[DB] Health check failed:', error);
    return false;
  }
}

// Database reconnection with fallback
export async function reconnectDatabase() {
  try {
    Logger.info('[DB] Attempting database reconnection...');
    const connection = await createDatabaseConnection();
    Logger.info('[DB] ✅ Database reconnected successfully');
    return connection;
  } catch (error) {
    Logger.error('[DB] ❌ Database reconnection failed:', error);
    throw error;
  }
}