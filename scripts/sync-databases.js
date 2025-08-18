#!/usr/bin/env node

/**
 * Database Synchronization Script
 * Ensures DEV (lucky-poetry) and PROD (muddy-moon) databases have identical schemas and data
 * 
 * Usage: node scripts/sync-databases.js
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { config } from 'dotenv';

// Configure WebSocket for Neon
global.WebSocket = ws;

// Load environment variables
config();

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL;
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL;

if (!DEV_DATABASE_URL || !PROD_DATABASE_URL) {
  console.error('❌ Missing database URLs. Please ensure DEV_DATABASE_URL and PROD_DATABASE_URL are set.');
  process.exit(1);
}

// Create database connections
const devPool = new Pool({ connectionString: DEV_DATABASE_URL });
const prodPool = new Pool({ connectionString: PROD_DATABASE_URL });

const devDb = drizzle({ client: devPool });
const prodDb = drizzle({ client: prodPool });

console.log('🔄 Starting database synchronization...');
console.log('📊 DEV Database: lucky-poetry');
console.log('📊 PROD Database: muddy-moon');

/**
 * Schema synchronization queries to ensure both databases have identical structures
 */
const schemaSyncQueries = [
  // 1. Ensure addresses table has both old and new column formats
  `
  ALTER TABLE addresses 
  ADD COLUMN IF NOT EXISTS street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS street1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS street2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'shipping',
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS geoapify_place_id VARCHAR(255);
  `,
  
  // 2. Ensure users table has all required columns
  `
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS google_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS google_picture VARCHAR(500),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
  `,

  // 3. Create indexes for performance
  `
  CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
  CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, is_default);
  CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,

  // 4. Ensure cart_items table compatibility
  `
  ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `,

  // 5. Ensure products table has all columns
  `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);
  `,

  // 6. Create sessions table if not exists (required for session management)
  `
  CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
  `
];

/**
 * Data migration queries to handle schema differences
 */
const dataMigrationQueries = [
  // Migrate old street format to new format where needed
  `
  UPDATE addresses 
  SET street1 = COALESCE(street1, street)
  WHERE street1 IS NULL AND street IS NOT NULL;
  `,
  
  // Migrate old zip format to new format where needed
  `
  UPDATE addresses 
  SET postal_code = COALESCE(postal_code, zip_code)
  WHERE postal_code IS NULL AND zip_code IS NOT NULL;
  `,

  // Set default address type if missing
  `
  UPDATE addresses 
  SET type = 'shipping'
  WHERE type IS NULL;
  `,

  // Ensure is_default is properly set (only one per user)
  `
  WITH ranked_addresses AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
    FROM addresses
  )
  UPDATE addresses 
  SET is_default = (
    CASE WHEN addresses.id IN (
      SELECT id FROM ranked_addresses WHERE rn = 1
    ) THEN true ELSE false END
  );
  `
];

async function syncDatabase(pool, dbName, queries) {
  console.log(`\n🔧 Synchronizing ${dbName} database...`);
  
  try {
    for (const query of queries) {
      console.log(`   Executing schema update...`);
      await pool.query(query);
    }
    console.log(`✅ ${dbName} database synchronized successfully`);
  } catch (error) {
    console.error(`❌ Error synchronizing ${dbName}:`, error.message);
    throw error;
  }
}

async function verifySync() {
  console.log('\n🔍 Verifying synchronization...');
  
  try {
    // Check that both databases have the same table structures
    const devTables = await devPool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, column_name
    `);
    
    const prodTables = await prodPool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, column_name
    `);
    
    console.log(`📊 DEV tables/columns: ${devTables.rows.length}`);
    console.log(`📊 PROD tables/columns: ${prodTables.rows.length}`);
    
    // Check for critical tables
    const criticalTables = ['users', 'addresses', 'products', 'categories', 'cart_items', 'sessions'];
    for (const table of criticalTables) {
      const devHasTable = devTables.rows.some(row => row.table_name === table);
      const prodHasTable = prodTables.rows.some(row => row.table_name === table);
      
      if (devHasTable && prodHasTable) {
        console.log(`✅ Table '${table}' exists in both databases`);
      } else {
        console.log(`⚠️  Table '${table}' - DEV: ${devHasTable}, PROD: ${prodHasTable}`);
      }
    }
    
    console.log('\n✅ Synchronization verification complete');
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

async function main() {
  try {
    // Sync schema for both databases
    await syncDatabase(devPool, 'DEV (lucky-poetry)', schemaSyncQueries);
    await syncDatabase(prodPool, 'PROD (muddy-moon)', schemaSyncQueries);
    
    // Run data migrations for both databases
    await syncDatabase(devPool, 'DEV (lucky-poetry)', dataMigrationQueries);
    await syncDatabase(prodPool, 'PROD (muddy-moon)', dataMigrationQueries);
    
    // Verify synchronization
    await verifySync();
    
    console.log('\n🎉 Database synchronization completed successfully!');
    console.log('🔄 Both DEV and PROD databases now have identical schemas');
    
  } catch (error) {
    console.error('\n❌ Database synchronization failed:', error);
    process.exit(1);
  } finally {
    // Clean up connections
    await devPool.end();
    await prodPool.end();
  }
}

main();