#!/usr/bin/env node

/**
 * Final Products Sync - Using actual column names
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

global.WebSocket = ws;
config();

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL;
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL;

const devPool = new Pool({ connectionString: DEV_DATABASE_URL });
const prodPool = new Pool({ connectionString: PROD_DATABASE_URL });

async function syncProductsSimple() {
  console.log('🔧 Simple products sync...');
  
  try {
    // Get production data using core columns only
    const prodResult = await prodPool.query(`
      SELECT id, name, description, price, category_id, condition,
             created_at, updated_at
      FROM products
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${prodResult.rows.length} products in production`);
    
    // Clear dev products
    await devPool.query('DELETE FROM products');
    
    // Insert with minimal columns
    for (const product of prodResult.rows) {
      try {
        await devPool.query(`
          INSERT INTO products (id, name, description, price, category_id, condition, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          product.id, product.name, product.description, product.price,
          product.category_id, product.condition, product.created_at, product.updated_at
        ]);
        
        console.log(`   ✅ Synced: ${product.name}`);
      } catch (error) {
        console.log(`   ❌ Failed: ${product.name} - ${error.message}`);
      }
    }
    
    // Verify sync
    const devCount = await devPool.query('SELECT COUNT(*) FROM products');
    console.log(`\n🎉 Products sync complete: ${devCount.rows[0].count} records in dev`);
    
  } catch (error) {
    console.error(`❌ Sync failed: ${error.message}`);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

syncProductsSimple();