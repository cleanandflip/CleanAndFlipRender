import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { WebSocket } from "ws";
import * as schema from "../shared/schema";
import { Logger } from './utils/logger';

// Configure Neon with better connection handling
neonConfig.webSocketConstructor = WebSocket;
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;

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

// Enhanced pool configuration with error handling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
};

let pool = new Pool(poolConfig);

// Pool error handling
pool.on('error', (err: any) => {
  Logger.error('Database pool error:', err.message);
  // Don't exit the application, just log the error
  if (err.code === '57P01' || err.message?.includes('terminating connection')) {
    Logger.info('Connection terminated, creating new pool...');
    pool = new Pool(poolConfig);
  }
});

pool.on('connect', () => {
  // Database connection success handled by logger
});

// Enhanced keep-alive function with better error handling
const keepAlive = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (error: any) {
    // For serverless databases like Neon, connection timeouts are normal
    // Only log in development to avoid production log spam
    if (process.env.NODE_ENV !== 'production') {
      Logger.error('Keep-alive query failed:', error.message);
      if (error.code === '57P01' || error.message?.includes('connection')) {
        Logger.info('Recreating pool due to connection issues...');
        pool = new Pool(poolConfig);
      }
    }
  }
};

// Keep-alive ping - different intervals for dev vs production
// Production: Every 10 minutes (serverless databases auto-disconnect)
// Development: Every 5 minutes
const keepAliveInterval = process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 5 * 60 * 1000;
setInterval(keepAlive, keepAliveInterval);

// Database wrapper with retry logic
const withRetry = async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      Logger.error(`Database operation attempt ${attempt} failed:`, error.message);
      
      if (error.code === '57P01' || error.message?.includes('terminating connection')) {
        if (attempt < maxRetries) {
          Logger.info(`Retrying operation (attempt ${attempt + 1})...`);
          pool = new Pool(poolConfig);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          continue;
        }
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
};

export { pool, withRetry };
export const db = drizzle({ client: pool, schema });

// Test connection on startup and log results for deployment verification
import { sql } from 'drizzle-orm';
db.execute(sql`SELECT current_database() as db, current_user as user, version() as version`)
  .then((result) => {
    const info = result.rows[0] as any;
    console.log('[DB] ✅ Database connected successfully');
    console.log(`[DB] Database: ${info.db}, User: ${info.user}`);
    console.log(`[DB] PostgreSQL Version: ${info.version?.split(',')[0] || 'unknown'}`);
  })
  .catch((err) => {
    console.error('[DB] ❌ Database connection failed:', err.message);
    console.error('[DB] This will cause authentication and other database features to fail');
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('Gracefully shutting down database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('Gracefully shutting down database connections...');
  await pool.end();
  process.exit(0);
});