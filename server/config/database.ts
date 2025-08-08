import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { Logger } from '../utils/logger';

// Optimized connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
});

// Single database instance with connection pooling
export const db = drizzle(pool, { schema });

// Connection health monitoring
pool.on('connect', () => {
  Logger.info('Database connection established');
});

pool.on('error', (err) => {
  Logger.error('Database pool error:', err);
});

// Graceful shutdown handler
export async function closeDatabasePool() {
  Logger.info('Closing database connection pool...');
  await pool.end();
}

// Query performance monitoring
export function logSlowQuery(query: string, duration: number) {
  if (duration > 1000) { // Log queries slower than 1 second
    Logger.warn(`SLOW QUERY (${duration}ms): ${query.substring(0, 100)}...`);
  }
}

// Set statement timeout for all queries
export async function initializeDatabase() {
  try {
    await db.execute(sql`SET statement_timeout = '30s'`);
    Logger.info('Database initialized with optimized settings');
  } catch (error) {
    Logger.error('Database initialization error:', error);
  }
}