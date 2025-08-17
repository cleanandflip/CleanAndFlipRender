import { env } from "./env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../shared/schema";

export interface DatabaseConfig {
  url: string;
  name: string;
  environment: 'development' | 'production';
  maxRetries: number;
  retryDelay: number;
}

/**
 * Detect current environment based on multiple factors
 */
export function getCurrentEnvironment(): 'development' | 'production' {
  // If we're in Replit development workspace, always use development mode for database selection
  // even if APP_ENV=production (which is for testing production behavior)
  if (env.NODE_ENV === 'development') {
    return 'development';
  }
  
  // Use APP_ENV from env module for environment detection
  return env.APP_ENV === 'production' ? 'production' : 'development';
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const environment = getCurrentEnvironment();
  
  if (environment === 'production') {
    // PRODUCTION: ONLY use PROD_DATABASE_URL
    const prodUrl = env.PROD_DATABASE_URL;
    
    if (!prodUrl) {
      throw new Error('PROD_DATABASE_URL must be set for production environment');
    }
    
    // Security: Block development database in production
    if (prodUrl.includes('lingering-flower')) {
      throw new Error('CRITICAL: Cannot use development database (lingering-flower) in production!');
    }
    
    console.log(`[DB] ✅ Using PRODUCTION database from PROD_DATABASE_URL`);
    
    return {
      url: prodUrl,
      name: 'production',
      environment: 'production',
      maxRetries: 5,
      retryDelay: 2000
    };
  } else {
    // DEVELOPMENT: ONLY use DEV_DATABASE_URL
    const devUrl = env.DEV_DATABASE_URL;
    
    if (!devUrl) {
      throw new Error('DEV_DATABASE_URL must be set for development environment');
    }
    
    // Security: Warn if development is using production database
    if (devUrl.includes('muddy-moon')) {
      console.warn('[DB] ⚠️  WARNING: Development environment using production database!');
      console.warn('[DB] This is allowed but not recommended for safety');
    }
    
    console.log(`[DB] ✅ Using DEVELOPMENT database from DEV_DATABASE_URL`);
    
    return {
      url: devUrl,
      name: 'development',
      environment: 'development',
      maxRetries: 3,
      retryDelay: 1000
    };
  }
}

/**
 * Create database connection with retry logic
 */
export async function createDatabaseConnection() {
  const config = getDatabaseConfig();
  
  console.log(`[DB] Initializing ${config.environment} database connection...`);
  console.log(`[DB] NODE_ENV: ${env.NODE_ENV}`);
  console.log(`[DB] APP_ENV: ${env.APP_ENV}`);
  console.log(`[DB] Environment detected: ${config.environment}`);
  console.log(`[DB] Has PROD_DATABASE_URL: ${!!env.PROD_DATABASE_URL}`);
  console.log(`[DB] Has DEV_DATABASE_URL: ${!!env.DEV_DATABASE_URL}`);
  
  // Extract host info for logging (without credentials)
  const url = new URL(config.url);
  console.log(`[DB] Connecting to host: ${url.hostname}`);
  console.log(`[DB] Database name: ${url.pathname.slice(1)}`);
  
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < config.maxRetries) {
    try {
      const sql = neon(config.url);
      const db = drizzle(sql, { schema });
      
      // Test connection
      await sql`SELECT 1 as test`;
      
      console.log(`[DB] ✅ ${config.environment.toUpperCase()} database connected successfully`);
      
      return { sql, db, config };
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      if (attempt < config.maxRetries) {
        console.log(`[DB] Connection attempt ${attempt} failed, retrying in ${config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  console.error(`[DB] ❌ Failed to connect after ${config.maxRetries} attempts`);
  throw new Error(`Database connection failed: ${lastError?.message}`);
}

/**
 * Validate database environment
 */
export async function validateDatabaseEnvironment() {
  const config = getDatabaseConfig();
  const environment = getCurrentEnvironment();
  
  console.log(`[DB] Environment: ${environment}`);
  console.log(`[DB] Database: ${config.name}`);
  
  if (environment === 'production') {
    // Additional production validations
    if (!env.PROD_DATABASE_URL) {
      console.warn('[DB] Warning: PROD_DATABASE_URL not set for production');
    }
  }
  
  return config;
}

export default createDatabaseConnection;