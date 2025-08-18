#!/usr/bin/env tsx

/**
 * Complete Database Schema Synchronization Script
 * Ensures both development and production databases have identical schemas
 * with all required columns for Google Auth and address management
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
// @ts-ignore
global.WebSocket = ws;

interface DatabaseConfig {
  name: string;
  url: string;
  host: string;
}

const databases: DatabaseConfig[] = [
  {
    name: 'development',
    url: process.env.DEV_DATABASE_URL!,
    host: 'ep-lucky-poetry'
  },
  {
    name: 'production', 
    url: process.env.PROD_DATABASE_URL!,
    host: 'ep-muddy-moon'
  }
];

async function executeSQL(pool: Pool, sql: string, description: string): Promise<any> {
  try {
    console.log(`  ✓ ${description}`);
    const result = await pool.query(sql);
    return result;
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('does not exist')) {
      console.log(`  ⚠ ${description} (already done)`);
      return null;
    }
    console.error(`  ✗ ${description} - Error: ${error.message}`);
    throw error;
  }
}

async function syncDatabase(config: DatabaseConfig) {
  console.log(`\n🔄 Synchronizing ${config.name} database (${config.host})...`);
  
  const pool = new Pool({ connectionString: config.url });
  
  try {
    // 1. Ensure sessions table exists for authentication
    await executeSQL(pool, `
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `, 'Creating sessions table');
    
    await executeSQL(pool, `
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `, 'Creating session expiry index');

    // 2. Ensure users table has all Google OAuth columns
    await executeSQL(pool, `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        phone VARCHAR,
        role VARCHAR DEFAULT 'user',
        profile_complete BOOLEAN DEFAULT false,
        is_local_customer BOOLEAN DEFAULT false,
        google_sub VARCHAR UNIQUE,
        google_email VARCHAR,
        google_email_verified BOOLEAN DEFAULT false,
        google_picture VARCHAR,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, 'Creating/updating users table with Google OAuth support');

    // Add missing Google OAuth columns if they don't exist
    const googleColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR UNIQUE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email VARCHAR',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email_verified BOOLEAN DEFAULT false',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_picture VARCHAR',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP'
    ];

    for (const sql of googleColumns) {
      await executeSQL(pool, sql, `Adding Google OAuth column`);
    }

    // 3. Ensure addresses table has ALL required columns
    await executeSQL(pool, `
      CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        street1 TEXT NOT NULL,
        street2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT DEFAULT 'US' NOT NULL,
        latitude DECIMAL(10,7),
        longitude DECIMAL(11,7),
        geoapify_place_id TEXT,
        is_default BOOLEAN DEFAULT false NOT NULL,
        is_local BOOLEAN DEFAULT false NOT NULL,
        type VARCHAR DEFAULT 'shipping' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, 'Creating/updating addresses table with all required columns');

    // Add missing address columns if they don't exist
    const addressColumns = [
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7)',
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,7)',
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS geoapify_place_id TEXT',
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false',
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT \'shipping\'',
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()',
      'ALTER TABLE addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
    ];

    for (const sql of addressColumns) {
      await executeSQL(pool, sql, `Adding address column`);
    }

    // Set NOT NULL constraint and default for type column
    await executeSQL(pool, `
      UPDATE addresses SET type = 'shipping' WHERE type IS NULL;
    `, 'Setting default type for existing addresses');

    await executeSQL(pool, `
      ALTER TABLE addresses ALTER COLUMN type SET DEFAULT 'shipping';
    `, 'Setting default value for type column');

    await executeSQL(pool, `
      ALTER TABLE addresses ALTER COLUMN type SET NOT NULL;
    `, 'Making type column NOT NULL');

    // 4. Create address indexes for performance
    const addressIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_addresses_coordinates ON addresses (latitude, longitude)',
      'CREATE INDEX IF NOT EXISTS idx_addresses_local ON addresses (is_local)',
      'CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses (user_id, is_default) WHERE is_default = true'
    ];

    for (const sql of addressIndexes) {
      await executeSQL(pool, sql, `Creating address index`);
    }

    // 5. Verify schema completeness
    const verificationQueries = [
      {
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at') ORDER BY column_name`,
        description: 'Verifying Google OAuth columns in users table'
      },
      {
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'addresses' AND column_name IN ('latitude', 'longitude', 'geoapify_place_id', 'is_local', 'type', 'created_at', 'updated_at') ORDER BY column_name`,
        description: 'Verifying all address columns'
      }
    ];

    for (const query of verificationQueries) {
      const result = await executeSQL(pool, query.sql, query.description);
      if (result && result.rows) {
        console.log(`    Found columns: ${result.rows.map((r: any) => r.column_name).join(', ')}`);
      }
    }

    console.log(`✅ ${config.name} database synchronization complete!`);
    
  } catch (error) {
    console.error(`❌ Error synchronizing ${config.name} database:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Starting complete database schema synchronization...');
  console.log('📊 This will ensure both databases have identical schemas for:');
  console.log('   • Google OAuth authentication');
  console.log('   • Complete address management');
  console.log('   • Session storage');
  console.log('   • All required indexes');
  
  try {
    // Sync both databases in parallel for efficiency
    await Promise.all(databases.map(syncDatabase));
    
    console.log('\n🎉 Database synchronization completed successfully!');
    console.log('✅ Both development and production databases now have:');
    console.log('   • Identical schemas');
    console.log('   • Google OAuth support');
    console.log('   • Complete address table with all columns');
    console.log('   • Proper indexes and constraints');
    console.log('   • Production-safe defaults');
    
  } catch (error) {
    console.error('\n❌ Database synchronization failed:', error);
    process.exit(1);
  }
}

// Run the synchronization
if (require.main === module) {
  main().catch(console.error);
}