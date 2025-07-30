import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon with better connection handling
neonConfig.webSocketConstructor = ws;
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
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
  console.error('Database pool error:', err.message);
  // Don't exit the application, just log the error
  if (err.code === '57P01' || err.message?.includes('terminating connection')) {
    console.log('Connection terminated, creating new pool...');
    pool = new Pool(poolConfig);
  }
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Keep-alive function to prevent connection timeouts
const keepAlive = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (error: any) {
    console.error('Keep-alive query failed:', error.message);
    if (error.code === '57P01' || error.message?.includes('connection')) {
      console.log('Recreating pool due to connection issues...');
      pool = new Pool(poolConfig);
    }
  }
};

// Run keep-alive every 60 seconds
setInterval(keepAlive, 60000);

// Database wrapper with retry logic
const withRetry = async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`Database operation attempt ${attempt} failed:`, error.message);
      
      if (error.code === '57P01' || error.message?.includes('terminating connection')) {
        if (attempt < maxRetries) {
          console.log(`Retrying operation (attempt ${attempt + 1})...`);
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Gracefully shutting down database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Gracefully shutting down database connections...');
  await pool.end();
  process.exit(0);
});