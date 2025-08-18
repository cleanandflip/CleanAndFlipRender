#!/usr/bin/env tsx

/**
 * Direct Schema Synchronization Script
 * Manually applies schema changes without using pg_dump due to version mismatch
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
// @ts-ignore
global.WebSocket = ws;

const DEV_URL = process.env.DEV_DATABASE_URL!;
const PROD_URL = process.env.PROD_DATABASE_URL!;

async function syncSchemas() {
  console.log('🔄 Direct schema synchronization starting...');
  
  const devPool = new Pool({ connectionString: DEV_URL });
  const prodPool = new Pool({ connectionString: PROD_URL });
  
  try {
    // Get development schema for addresses table
    console.log('📊 Analyzing development addresses schema...');
    const devSchema = await devPool.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      ORDER BY ordinal_position
    `);
    
    // Get production schema for addresses table
    console.log('📊 Analyzing production addresses schema...');
    const prodSchema = await prodPool.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      ORDER BY ordinal_position
    `);
    
    const devColumns = new Set(devSchema.rows.map(r => r.column_name));
    const prodColumns = new Set(prodSchema.rows.map(r => r.column_name));
    
    // Find missing columns in production
    const missingInProd = [...devColumns].filter(col => !prodColumns.has(col));
    
    if (missingInProd.length === 0) {
      console.log('✅ Production schema is already up to date!');
    } else {
      console.log(`🔧 Adding ${missingInProd.length} missing columns to production:`, missingInProd);
      
      // Add missing columns to production
      for (const col of missingInProd) {
        const devCol = devSchema.rows.find(r => r.column_name === col);
        if (!devCol) continue;
        
        let addColumnSql = `ALTER TABLE addresses ADD COLUMN IF NOT EXISTS ${col}`;
        
        // Build column definition based on development schema
        if (devCol.data_type === 'character varying') {
          addColumnSql += ` VARCHAR${devCol.character_maximum_length ? `(${devCol.character_maximum_length})` : ''}`;
        } else if (devCol.data_type === 'text') {
          addColumnSql += ' TEXT';
        } else if (devCol.data_type === 'boolean') {
          addColumnSql += ' BOOLEAN';
        } else if (devCol.data_type === 'numeric') {
          addColumnSql += ' DECIMAL(10,7)'; // For lat/lng
        } else if (devCol.data_type === 'timestamp without time zone') {
          addColumnSql += ' TIMESTAMP';
        } else {
          addColumnSql += ` ${devCol.data_type.toUpperCase()}`;
        }
        
        // Add default value if exists
        if (devCol.column_default) {
          if (devCol.column_default === 'false') {
            addColumnSql += ' DEFAULT false';
          } else if (devCol.column_default === 'true') {
            addColumnSql += ' DEFAULT true';
          } else if (devCol.column_default.includes('now()') || devCol.column_default.includes('NOW()')) {
            addColumnSql += ' DEFAULT NOW()';
          } else if (devCol.column_default.includes("'shipping'")) {
            addColumnSql += " DEFAULT 'shipping'";
          } else if (devCol.column_default.includes("'US'")) {
            addColumnSql += " DEFAULT 'US'";
          }
        }
        
        // Add NOT NULL constraint if needed
        if (devCol.is_nullable === 'NO' && devCol.column_default) {
          addColumnSql += ' NOT NULL';
        }
        
        console.log(`  Adding column: ${col}`);
        await prodPool.query(addColumnSql);
      }
    }
    
    // Ensure critical constraints are in place
    console.log('🔒 Ensuring critical constraints...');
    
    // Make sure type column has proper default and NOT NULL
    await prodPool.query(`
      UPDATE addresses SET type = 'shipping' WHERE type IS NULL;
    `);
    
    await prodPool.query(`
      ALTER TABLE addresses ALTER COLUMN type SET DEFAULT 'shipping';
    `);
    
    try {
      await prodPool.query(`
        ALTER TABLE addresses ALTER COLUMN type SET NOT NULL;
      `);
      console.log('  ✓ Type column constraint applied');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        console.log('  ⚠ Type column constraint already exists or not applicable');
      }
    }
    
    // Verify final schema
    console.log('✅ Final verification...');
    const finalProdSchema = await prodPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Production addresses table columns:');
    finalProdSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
    console.log('🎉 Schema synchronization completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema synchronization failed:', error);
    throw error;
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

// Run the synchronization
if (require.main === module) {
  syncSchemas().catch(console.error);
}