import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export interface DatabaseConfig {
  url: string;
  name: string;
  environment: 'development' | 'production';
  maxRetries: number;
  retryDelay: number;
}

/**
 * Detect current environment
 */
export function getCurrentEnvironment(): 'development' | 'production' {
  // Check for Replit deployment flag first (most reliable for Replit deployments)
  if (process.env.REPLIT_DEPLOYMENT === 'true') {
    console.log('[DB] Environment detected via REPLIT_DEPLOYMENT=true');
    return 'production';
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    console.log('[DB] Environment detected via NODE_ENV=production');
    return 'production';
  }
  
  // Default to development
  console.log('[DB] Environment defaulting to development');
  return 'development';
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const environment = getCurrentEnvironment();
  
  if (environment === 'production') {
    // Prioritize DATABASE_URL_PROD for production
    const prodUrl = process.env.DATABASE_URL_PROD;
    
    if (!prodUrl) {
      console.error('[DB] ❌ CRITICAL: DATABASE_URL_PROD is required for production!');
      console.error('[DB] Available database URLs:');
      console.error(`[DB]   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
      console.error(`[DB]   DATABASE_URL_PROD: ${process.env.DATABASE_URL_PROD ? 'Set' : 'Missing'}`);
      throw new Error('DATABASE_URL_PROD must be set for production environment. Add it to Replit Secrets.');
    }
    
    // Safety check: ensure we're not using dev database in production
    if (prodUrl.includes('lingering-flower')) {
      throw new Error('CRITICAL: Cannot use development database (lingering-flower) in production!');
    }
    
    console.log('[DB] ✅ Using DATABASE_URL_PROD for production environment');
    
    return {
      url: prodUrl,
      name: 'production',
      environment: 'production',
      maxRetries: 5,
      retryDelay: 2000
    };
  } else {
    const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
    
    if (!devUrl) {
      throw new Error('DATABASE_URL_DEV must be set for development environment');
    }
    
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
  console.log(`[DB] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[DB] REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}`);
  console.log(`[DB] Environment detected: ${config.environment}`);
  console.log(`[DB] Has DATABASE_URL: ${!!process.env.DATABASE_URL}`);
  console.log(`[DB] Has DATABASE_URL_PROD: ${!!process.env.DATABASE_URL_PROD}`);
  
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
    if (!process.env.DEVELOPER_EMAIL) {
      console.warn('[DB] Warning: DEVELOPER_EMAIL not set for production');
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[DB] Warning: STRIPE_SECRET_KEY not set for production');
    }
  }
  
  return config;
}

export default createDatabaseConnection;