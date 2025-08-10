import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";
import { Logger } from './utils/logger';

// Configure Neon with better connection handling
neonConfig.fetchConnectionCache = true;

// Enhanced database connection logging for production deployment
console.log('[DB] Initializing database connection...');
console.log('[DB] NODE_ENV:', process.env.NODE_ENV);
console.log('[DB] Has DATABASE_URL:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('[DB] ❌ CRITICAL: DATABASE_URL is not set!');
  console.error('[DB] Available env vars (non-sensitive):', 
    Object.keys(process.env).filter(k => 
      !k.includes('SECRET') && 
      !k.includes('KEY') && 
      !k.includes('TOKEN') && 
      !k.includes('PASSWORD')
    ).join(', ')
  );
  throw new Error('DATABASE_URL environment variable is not set');
}

// Log database host (safe to log)
try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log('[DB] Connecting to host:', dbUrl.hostname);
  console.log('[DB] Database name:', dbUrl.pathname.substring(1));
} catch (e) {
  console.error('[DB] Invalid DATABASE_URL format');
}

// Create connection using the same method that works in testing
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Simple connection test with proper error handling
export const testConnection = async () => {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error: any) {
    Logger.error('Database connection test failed:', error.message);
    return false;
  }
};

// Test connection on startup with retry logic for deployment verification
import { sql as drizzleSql } from 'drizzle-orm';

const verifyDatabaseConnection = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await db.execute(drizzleSql`SELECT current_database() as db, current_user as user, version() as version`);
      const info = result.rows?.[0] as any;
      console.log('[DB] ✅ Database connected successfully');
      console.log(`[DB] Database: ${info.db}, User: ${info.user}`);
      console.log(`[DB] PostgreSQL Version: ${info.version?.split(',')[0] || 'unknown'}`);
      return true;
    } catch (err: any) {
      console.error(`[DB] ❌ Connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s, 6s delays
        console.log(`[DB] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('[DB] ❌ All connection attempts failed');
        console.error('[DB] This may cause authentication and database features to fail');
        // Don't throw error - allow server to start without database for debugging
        return false;
      }
    }
  }
  return false;
};

// Initialize connection verification (non-blocking)
verifyDatabaseConnection();