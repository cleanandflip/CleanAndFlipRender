#!/usr/bin/env tsx
// Database Schema Sync and Purge Script
// Ensures both dev and prod databases match the current codebase exactly

import { Pool } from 'pg';
import * as fs from 'fs';

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL!;
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL!;

// Tables that should exist based on current codebase (from shared/schema.ts)
const REQUIRED_TABLES = [
  'sessions',
  'users', 
  'products',
  'categories',
  'orders',
  'order_items',
  'cart_items',
  'addresses',
  'equipment_submissions',
  'reviews',
  'coupons',
  'email_queue',
  'email_logs',
  'order_tracking',
  'return_requests',
  'password_reset_tokens',
  'user_email_preferences',
  'newsletter_subscribers',
  'wishlists'
];

// Tables that should be purged (not in current codebase or unused)
const TABLES_TO_PURGE = [
  'order_addresses', // Replaced by addresses table
  'service_zones',   // Not used in current implementation
  'activity_logs',   // Removed from codebase
  'error_logs',      // Internal error tracking removed
  'audit_logs',      // Not in current schema
];

async function connectToDatabase(url: string, name: string) {
  console.log(`🔌 Connecting to ${name} database...`);
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query('SELECT 1');
    console.log(`✅ ${name} database connected`);
    return pool;
  } catch (error) {
    console.error(`❌ Failed to connect to ${name} database:`, error);
    throw error;
  }
}

async function getExistingTables(pool: Pool): Promise<string[]> {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map(row => row.table_name);
}

async function purgeTable(pool: Pool, tableName: string, dbName: string): Promise<void> {
  try {
    console.log(`🗑️  Purging table '${tableName}' from ${dbName}...`);
    
    // Drop foreign key constraints first
    await pool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    
    console.log(`✅ Purged '${tableName}' from ${dbName}`);
  } catch (error) {
    console.error(`❌ Failed to purge '${tableName}' from ${dbName}:`, error);
  }
}

async function analyzeSchema(pool: Pool, dbName: string) {
  console.log(`\n📊 Analyzing ${dbName} schema...`);
  
  const existingTables = await getExistingTables(pool);
  console.log(`Tables in ${dbName}:`, existingTables.sort());
  
  const extraTables = existingTables.filter(table => 
    !REQUIRED_TABLES.includes(table) && 
    !table.startsWith('drizzle_') &&
    table !== 'spatial_ref_sys' // PostGIS system table
  );
  
  const tablesToPurge = existingTables.filter(table => 
    TABLES_TO_PURGE.includes(table)
  );
  
  return { existingTables, extraTables, tablesToPurge };
}

async function syncDatabase(pool: Pool, dbName: string) {
  const { existingTables, extraTables, tablesToPurge } = await analyzeSchema(pool, dbName);
  
  console.log(`\n🔧 Syncing ${dbName} database...`);
  
  if (tablesToPurge.length > 0) {
    console.log(`Purging unused tables from ${dbName}:`, tablesToPurge);
    for (const table of tablesToPurge) {
      await purgeTable(pool, table, dbName);
    }
  }
  
  if (extraTables.length > 0) {
    console.log(`⚠️  Extra tables in ${dbName} (review needed):`, extraTables);
  }
  
  // Verify critical tables exist
  const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));
  if (missingTables.length > 0) {
    console.log(`⚠️  Missing required tables in ${dbName}:`, missingTables);
    console.log(`Run 'npm run db:push' to create missing tables`);
  }
  
  return { tablesToPurge, extraTables, missingTables };
}

async function main() {
  console.log('🚀 DATABASE SCHEMA SYNC AND PURGE STARTED');
  console.log('==========================================');
  
  let devPool: Pool | null = null;
  let prodPool: Pool | null = null;
  
  try {
    // Connect to both databases
    devPool = await connectToDatabase(DEV_DATABASE_URL, 'Development');
    prodPool = await connectToDatabase(PROD_DATABASE_URL, 'Production');
    
    // Sync development database
    console.log('\n🔄 SYNCING DEVELOPMENT DATABASE');
    console.log('================================');
    const devResults = await syncDatabase(devPool, 'Development');
    
    // Sync production database
    console.log('\n🔄 SYNCING PRODUCTION DATABASE');
    console.log('==============================');
    const prodResults = await syncDatabase(prodPool, 'Production');
    
    // Generate sync report
    console.log('\n📋 SYNC REPORT');
    console.log('===============');
    console.log(`Development - Purged: ${devResults.tablesToPurge.length}, Extra: ${devResults.extraTables.length}, Missing: ${devResults.missingTables.length}`);
    console.log(`Production - Purged: ${prodResults.tablesToPurge.length}, Extra: ${prodResults.extraTables.length}, Missing: ${prodResults.missingTables.length}`);
    
    if (devResults.missingTables.length > 0 || prodResults.missingTables.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Run database migration');
      console.log('npm run db:push');
    }
    
    console.log('\n✅ DATABASE SYNC COMPLETED SUCCESSFULLY');
    
  } catch (error) {
    console.error('\n❌ DATABASE SYNC FAILED:', error);
    process.exit(1);
  } finally {
    if (devPool) await devPool.end();
    if (prodPool) await prodPool.end();
  }
}

// Auto-run if this is the main module
main();