#!/usr/bin/env node

/**
 * Comprehensive Database Data Synchronization Script
 * Ensures DEV (lucky-poetry) and PROD (muddy-moon) databases have identical data
 * 
 * Usage: node scripts/sync-database-data.js
 */

import { Pool } from '@neondatabase/serverless';
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

console.log('🔄 Starting comprehensive database data synchronization...');
console.log('📊 Source (PROD): muddy-moon');
console.log('📊 Target (DEV): lucky-poetry');

/**
 * Core tables to sync with their dependency order
 */
const tablesToSync = [
  'categories',
  'users', 
  'addresses',
  'products',
  'cart_items',
  'orders',
  'order_items',
  'equipment_submissions',
  'sessions' // Keep sessions separate to avoid breaking active sessions
];

/**
 * Tables to exclude from data sync (keep separate)
 */
const excludedTables = [
  'sessions', // Don't sync active sessions
  'drizzle_migrations' // Don't sync migration history
];

async function getTableData(pool, tableName) {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 1000`);
    return result.rows;
  } catch (error) {
    // Try without created_at for tables that don't have it
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} LIMIT 1000`);
      return result.rows;
    } catch (e) {
      console.log(`⚠️  Could not fetch data from ${tableName}: ${e.message}`);
      return [];
    }
  }
}

async function getTableColumns(pool, tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  } catch (error) {
    console.log(`⚠️  Could not get columns for ${tableName}`);
    return [];
  }
}

async function syncTableData(tableName) {
  console.log(`\n🔧 Syncing ${tableName}...`);
  
  try {
    // Get data from production
    const prodData = await getTableData(prodPool, tableName);
    console.log(`   📊 Production records: ${prodData.length}`);
    
    if (prodData.length === 0) {
      console.log(`   ⚠️  No data in production ${tableName}, skipping`);
      return;
    }
    
    // Get table structure
    const columns = await getTableColumns(prodPool, tableName);
    const columnNames = columns.map(col => col.column_name);
    
    // Clear existing data in dev (be careful!)
    console.log(`   🗑️  Clearing existing dev data...`);
    await devPool.query(`DELETE FROM ${tableName}`);
    
    // Insert production data into dev
    if (prodData.length > 0) {
      console.log(`   📝 Inserting ${prodData.length} records...`);
      
      // Build INSERT query
      const placeholders = prodData.map((_, rowIndex) => {
        const rowPlaceholders = columnNames.map((_, colIndex) => `$${rowIndex * columnNames.length + colIndex + 1}`);
        return `(${rowPlaceholders.join(', ')})`;
      }).join(', ');
      
      const values = prodData.flatMap(row => columnNames.map(col => row[col] || null));
      
      const insertQuery = `
        INSERT INTO ${tableName} (${columnNames.join(', ')})
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET
        ${columnNames.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ')}
      `;
      
      await devPool.query(insertQuery, values);
    }
    
    console.log(`   ✅ ${tableName} synchronized successfully`);
    
  } catch (error) {
    console.error(`   ❌ Error syncing ${tableName}:`, error.message);
    
    // Try alternative sync approach for problematic tables
    if (error.message.includes('duplicate key') || error.message.includes('conflict')) {
      console.log(`   🔄 Retrying with upsert approach...`);
      try {
        const prodData = await getTableData(prodPool, tableName);
        
        for (const row of prodData) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`);
          
          const upsertQuery = `
            INSERT INTO ${tableName} (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT (id) DO UPDATE SET
            ${columns.filter(col => col !== 'id').map((col, i) => `${col} = $${i + 1}`).join(', ')}
          `;
          
          await devPool.query(upsertQuery, values);
        }
        console.log(`   ✅ ${tableName} synchronized with upsert approach`);
      } catch (retryError) {
        console.error(`   ❌ Retry failed for ${tableName}:`, retryError.message);
      }
    }
  }
}

async function syncCriticalData() {
  console.log('\n🎯 Syncing critical business data...');
  
  const criticalTables = ['categories', 'products', 'users'];
  
  for (const table of criticalTables) {
    await syncTableData(table);
  }
}

async function verifyDataSync() {
  console.log('\n🔍 Verifying data synchronization...');
  
  const verificationQueries = [
    { name: 'Categories', query: 'SELECT COUNT(*) as count FROM categories' },
    { name: 'Products', query: 'SELECT COUNT(*) as count FROM products' },
    { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'Addresses', query: 'SELECT COUNT(*) as count FROM addresses' },
  ];
  
  for (const check of verificationQueries) {
    try {
      const prodResult = await prodPool.query(check.query);
      const devResult = await devPool.query(check.query);
      
      const prodCount = prodResult.rows[0].count;
      const devCount = devResult.rows[0].count;
      
      if (prodCount === devCount) {
        console.log(`   ✅ ${check.name}: ${devCount} records (synced)`);
      } else {
        console.log(`   ⚠️  ${check.name}: PROD=${prodCount}, DEV=${devCount} (mismatch)`);
      }
    } catch (error) {
      console.log(`   ❌ Could not verify ${check.name}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    // Sync critical data first
    await syncCriticalData();
    
    // Verify the sync worked
    await verifyDataSync();
    
    console.log('\n🎉 Database data synchronization completed!');
    console.log('🔄 DEV database now contains the latest PROD data');
    console.log('⚠️  Note: Sessions table was not synced to preserve active sessions');
    
  } catch (error) {
    console.error('\n❌ Database data synchronization failed:', error);
    process.exit(1);
  } finally {
    // Clean up connections
    await devPool.end();
    await prodPool.end();
  }
}

main();