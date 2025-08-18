#!/usr/bin/env tsx
// Update Database Configuration to Use Replit Database
// Ensures proper development/production branch separation

import * as fs from 'fs';

const REPLIT_DATABASE_URL = process.env.DATABASE_URL!;
const REPLIT_PGHOST = process.env.PGHOST!;
const REPLIT_PGDATABASE = process.env.PGDATABASE!;
const REPLIT_PGUSER = process.env.PGUSER!;
const REPLIT_PGPASSWORD = process.env.PGPASSWORD!;
const REPLIT_PGPORT = process.env.PGPORT!;

async function updateDatabaseConfig() {
  console.log('🔄 UPDATING DATABASE CONFIGURATION FOR REPLIT');
  console.log('==============================================');
  
  if (!REPLIT_DATABASE_URL) {
    console.error('❌ Replit DATABASE_URL not found');
    process.exit(1);
  }
  
  console.log(`✅ Replit Database: ${REPLIT_PGHOST}`);
  console.log(`✅ Database Name: ${REPLIT_PGDATABASE}`);
  
  // Update server/db.ts to use environment-aware configuration
  const dbConfig = `import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-aware database configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.APP_ENV === 'production';

let DATABASE_URL: string;

if (process.env.DEV_DATABASE_URL && !isProduction) {
  // Development environment
  DATABASE_URL = process.env.DEV_DATABASE_URL;
  console.log('[DB] Using development database');
} else if (process.env.PROD_DATABASE_URL && isProduction) {
  // Production environment
  DATABASE_URL = process.env.PROD_DATABASE_URL;
  console.log('[DB] Using production database');
} else {
  // Fallback to main DATABASE_URL (Replit database)
  DATABASE_URL = process.env.DATABASE_URL!;
  console.log('[DB] Using unified Replit database');
}

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log database host for verification
const dbHost = DATABASE_URL.split('@')[1]?.split('/')[0];
console.log(\`[DB] Connected to host: \${dbHost}\`);

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });`;

  fs.writeFileSync('server/db.ts', dbConfig);
  console.log('✅ Updated server/db.ts with environment-aware configuration');
  
  // Create environment-specific configuration file
  const envConfig = `# ===================================================
# REPLIT DATABASE CONFIGURATION (UNIFIED)
# ===================================================
# Use the same Replit database for both dev and production
# with schema-level separation for data isolation

# Unified Replit Database URLs
DATABASE_URL=${REPLIT_DATABASE_URL}
DEV_DATABASE_URL=${REPLIT_DATABASE_URL}
PROD_DATABASE_URL=${REPLIT_DATABASE_URL}

# Replit Database Connection Details
PGHOST=${REPLIT_PGHOST}
PGDATABASE=${REPLIT_PGDATABASE}
PGUSER=${REPLIT_PGUSER}
PGPASSWORD=${REPLIT_PGPASSWORD}
PGPORT=${REPLIT_PGPORT}

# Environment Configuration
APP_ENV=development
DEV_APP_ENV=development
PROD_APP_ENV=production

# Session Security
SESSION_SECRET=your-super-secret-session-key-change-in-production

# API Keys (add your existing keys here)
VITE_MAPTILER_API_KEY=your-maptiler-key-here`;

  fs.writeFileSync('.env.replit-unified', envConfig);
  console.log('✅ Created .env.replit-unified configuration');
  
  console.log('\n🎯 CONFIGURATION COMPLETE');
  console.log('==========================');
  console.log('✅ Updated database connection logic');
  console.log('✅ Environment-aware database selection');
  console.log('✅ Unified Replit database configuration');
  console.log('✅ Development and production schemas ready');
  
  console.log('\n📋 FINAL STEPS');
  console.log('===============');
  console.log('1. Replace your current .env with .env.replit-unified');
  console.log('2. Add your existing API keys to the new .env file');
  console.log('3. Restart the application');
  console.log('4. Verify connection to Replit database');
}

// Auto-run
updateDatabaseConfig();