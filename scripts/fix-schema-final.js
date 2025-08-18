#!/usr/bin/env node

/**
 * Final Schema Fix - Resolve all remaining schema mismatches
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

global.WebSocket = ws;
config();

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL;
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL;

if (!DEV_DATABASE_URL || !PROD_DATABASE_URL) {
  console.error('❌ Missing database URLs');
  process.exit(1);
}

const devPool = new Pool({ connectionString: DEV_DATABASE_URL });
const prodPool = new Pool({ connectionString: PROD_DATABASE_URL });

console.log('🔧 Running final schema fixes...');

const fixQueries = [
  // Fix products table - ensure JSON columns are properly handled
  `
  ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS fulfillment_options JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS condition_details JSONB DEFAULT '{}'::jsonb;
  `,
  
  // Fix addresses table - ensure all column variants exist
  `
  ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
  `,

  // Update products to fix any malformed JSON
  `
  UPDATE products 
  SET fulfillment_options = '{}'::jsonb 
  WHERE fulfillment_options IS NULL OR fulfillment_options::text = 'null';
  `,

  `
  UPDATE products 
  SET features = '[]'::jsonb 
  WHERE features IS NULL OR features::text = 'null';
  `,

  `
  UPDATE products 
  SET condition_details = '{}'::jsonb 
  WHERE condition_details IS NULL OR condition_details::text = 'null';
  `
];

async function runFix(pool, dbName) {
  console.log(`\n🔧 Fixing ${dbName}...`);
  for (const query of fixQueries) {
    try {
      await pool.query(query);
      console.log(`   ✅ Applied fix`);
    } catch (error) {
      console.log(`   ⚠️ Fix error: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await runFix(devPool, 'DEV (lucky-poetry)');
    await runFix(prodPool, 'PROD (muddy-moon)');
    
    console.log('\n✅ Final schema fixes complete');
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();