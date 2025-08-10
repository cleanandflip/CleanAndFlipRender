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
    // For production, try DATABASE_URL_PROD first, fallback to DATABASE_URL if it's production-safe
    let prodUrl = process.env.DATABASE_URL_PROD;
    
    // If DATABASE_URL_PROD is not available in deployment, check if DATABASE_URL is production-safe
    if (!prodUrl) {
      console.log('[DB] DATABASE_URL_PROD not found, checking DATABASE_URL for production compatibility...');
      const fallbackUrl = process.env.DATABASE_URL;
      
      if (fallbackUrl && fallbackUrl.includes('muddy-moon')) {
        console.log('[DB] ✅ DATABASE_URL contains production database (muddy-moon), using it');
        prodUrl = fallbackUrl;
      } else if (fallbackUrl && fallbackUrl.includes('lingering-flower')) {
        console.error('[DB] ❌ CRITICAL: DATABASE_URL points to development database in production!');
        throw new Error('SECURITY: Cannot use development database (lingering-flower) in production!');
      } else {
        console.error('[DB] ❌ CRITICAL: No production database URL available!');
        console.error('[DB] Available URLs:');
        console.error(`[DB]   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
        console.error(`[DB]   DATABASE_URL_PROD: ${process.env.DATABASE_URL_PROD ? 'Set' : 'Missing'}`);
        console.error('[DB] Please set DATABASE_URL to your production database in Replit deployment settings.');
        throw new Error('No production database URL configured. Set DATABASE_URL in deployment environment.');
      }
    }
    
    // Final safety check
    if (prodUrl.includes('lingering-flower')) {
      throw new Error('CRITICAL: Cannot use development database (lingering-flower) in production!');
    }
    
    console.log('[DB] ✅ Using production database for deployment');
    
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