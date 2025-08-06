import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema.js';

// Intelligent database selection based on environment
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  
  // Parse the base URL first
  const urlParts = baseUrl.match(/^(postgresql:\/\/[^/]+\/)([^?]+)(\?.+)?$/);
  if (!urlParts) {
    console.error('[DB] Invalid DATABASE_URL format');
    return baseUrl;
  }
  
  const [, connectionString, currentDb, queryParams = '?sslmode=require'] = urlParts;
  
  // Determine which database to use
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplitPreview = process.env.REPL_SLUG !== undefined;
  const isDevelopmentEnv = process.env.NODE_ENV === 'development';
  
  // Decide which database to use
  let targetDb: string;
  
  if (isProduction && !isReplitPreview) {
    // TRUE PRODUCTION: Not in Replit and NODE_ENV=production
    targetDb = 'neondb';
    console.log('[DB] 🚀 Using PRODUCTION database (true production)');
  } else if (isDevelopmentEnv || isReplitPreview) {
    // DEVELOPMENT: Either NODE_ENV=development or in Replit
    targetDb = 'development';
    console.log('[DB] 🧪 Using DEVELOPMENT database (testing)');
  } else {
    // DEFAULT: Use whatever is in DATABASE_URL
    targetDb = currentDb;
    console.log(`[DB] Using default database: ${targetDb}`);
  }
  
  const finalUrl = `${connectionString}${targetDb}${queryParams}`;
  console.log(`[DB] Database: ${targetDb} | Production: ${isProduction}`);
  
  return finalUrl;
};

// Initialize database connection
const databaseUrl = getDatabaseUrl();
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

// Log successful connection
sql`SELECT 1`
  .then(() => {
    const dbName = databaseUrl.split('/').pop()?.split('?')[0];
    console.log(`[DB] ✅ Connected to ${dbName} database`);
  })
  .catch(err => {
    console.error('[DB] ❌ Connection failed:', err.message);
  });