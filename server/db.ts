import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-aware database configuration with schema separation
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.APP_ENV === 'production';

// Use unified Replit database with schema-based separation
const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection with environment-specific schema
const poolConfig = { 
  connectionString: DATABASE_URL,
  // Set search path based on environment
  ...(isProduction ? 
    { options: '-c search_path=production,public' } : 
    { options: '-c search_path=development,public' }
  )
};

// Log configuration for verification
const dbHost = DATABASE_URL.split('@')[1]?.split('/')[0];
const schemaEnv = isProduction ? 'production' : 'development';
console.log(`[DB] Connected to host: ${dbHost}`);
console.log(`[DB] Using schema: ${schemaEnv}`);
console.log(`[DB] Environment: NODE_ENV=${process.env.NODE_ENV}, APP_ENV=${process.env.APP_ENV}`);

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });

// Optional simple health check
export async function ping() {
  await pool.query("select 1");
}