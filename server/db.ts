import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";
import { Logger } from './utils/logger';

// Configure Neon with better connection handling
neonConfig.fetchConnectionCache = true;

// Robust database connection handling for deployment credential sync issues
const getDatabaseUrl = () => {
  console.log('[DB] Initializing database connection...');
  console.log('[DB] NODE_ENV:', process.env.NODE_ENV);
  console.log('[DB] Has DATABASE_URL:', !!process.env.DATABASE_URL);
  
  // Primary method: Direct DATABASE_URL (should work in both dev and prod)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fallback: Build from components (for deployment secret sync issues)
  if (process.env.PGUSER && process.env.PGPASSWORD && process.env.PGHOST && process.env.PGDATABASE) {
    const fallbackUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require`;
    console.log('[DB] Using fallback URL construction from PG components');
    return fallbackUrl;
  }
  
  console.error('[DB] ❌ CRITICAL: No database configuration found!');
  console.error('[DB] Available env vars (non-sensitive):', 
    Object.keys(process.env).filter(k => 
      !k.includes('SECRET') && 
      !k.includes('KEY') && 
      !k.includes('TOKEN') && 
      !k.includes('PASSWORD')
    ).join(', ')
  );
  throw new Error('No database configuration found - DATABASE_URL or PG components missing');
};

const DATABASE_URL = getDatabaseUrl();

// Log database host (safe to log)
try {
  const dbUrl = new URL(DATABASE_URL);
  console.log('[DB] Connecting to host:', dbUrl.hostname);
  console.log('[DB] Database name:', dbUrl.pathname.substring(1));
} catch (e) {
  console.error('[DB] Invalid DATABASE_URL format');
}

// Create connection using the resolved DATABASE_URL
const sql = neon(DATABASE_URL);
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