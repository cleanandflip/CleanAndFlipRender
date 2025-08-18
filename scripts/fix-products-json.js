#!/usr/bin/env node

/**
 * Fix Products JSON Data - Resolve JSON parsing errors
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

console.log('🔧 Fixing products JSON data...');

async function fixProductsSync() {
  try {
    // Get production products with safe JSON conversion
    const prodResult = await prodPool.query(`
      SELECT 
        id, name, description, price, category_id, condition, availability,
        created_at, updated_at, stripe_price_id, stripe_product_id,
        -- Handle image_urls column safely
        COALESCE(image_urls, '[]'::jsonb) as image_urls,
        COALESCE(image_url, '') as image_url,
        -- Convert problematic JSON fields to safe defaults
        '[]'::jsonb as features,
        '{}'::jsonb as fulfillment_options,
        '{}'::jsonb as condition_details
      FROM products
    `);
    
    console.log(`Found ${prodResult.rows.length} products in production`);
    
    // Clear dev products
    await devPool.query('DELETE FROM products');
    
    // Insert each product safely
    let synced = 0;
    for (const product of prodResult.rows) {
      try {
        await devPool.query(`
          INSERT INTO products (
            id, name, description, price, category_id, condition, availability,
            created_at, updated_at, stripe_price_id, stripe_product_id,
            image_urls, image_url, features, fulfillment_options, condition_details
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `, [
          product.id, product.name, product.description, product.price,
          product.category_id, product.condition, product.availability,
          product.created_at, product.updated_at, product.stripe_price_id,
          product.stripe_product_id, product.image_urls, product.image_url,
          product.features, product.fulfillment_options, product.condition_details
        ]);
        synced++;
        console.log(`   ✅ Synced product: ${product.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to sync ${product.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully synced ${synced}/${prodResult.rows.length} products`);
    
  } catch (error) {
    console.error(`❌ Products fix failed: ${error.message}`);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

fixProductsSync();