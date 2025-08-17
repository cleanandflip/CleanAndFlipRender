import { env } from "./env";

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
  // Use the env module instead of direct process.env access
  return 'development'; // This function is now legacy; env module handles this
  
  // Default to development for safety
  console.log('[DB] Environment defaulting to development (safest option)');
  return 'development';
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const environment = getCurrentEnvironment();
  
  if (environment === 'production') {
    // PRODUCTION: Prioritize DATABASE_URL_PROD, fallback to DATABASE_URL if production-safe
    let prodUrl = undefined; // Removed process.env access
    
    // Use env module instead of direct process.env access
    prodUrl = env.DATABASE_URL;
    
    // Security: Block development database in production
    if (prodUrl.includes('lingering-flower')) {
      throw new Error('CRITICAL: Cannot use development database (lingering-flower) in production!');
    }
    
    console.log('[DB] ✅ Using PRODUCTION database (muddy-moon)');
    
    return {
      url: prodUrl,
      name: 'production',
      environment: 'production',
      maxRetries: 5,
      retryDelay: 2000
    };
  } else {
    // DEVELOPMENT: Use DATABASE_URL_DEV or DATABASE_URL (localhost)
    const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
    
    if (!devUrl) {
      throw new Error('DATABASE_URL must be set for development environment');
    }
    
    // Security: Warn if development is using production database
    if (devUrl.includes('muddy-moon')) {
      console.warn('[DB] ⚠️  WARNING: Development environment using production database!');
      console.warn('[DB] This is allowed but not recommended for safety');
    }
    
    console.log('[DB] ✅ Using DEVELOPMENT database (localhost environment)');
    
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