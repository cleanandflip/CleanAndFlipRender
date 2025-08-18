#!/usr/bin/env node

/**
 * Smart Data Synchronization - Handles schema differences intelligently
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

console.log('🔄 Smart data synchronization starting...');

async function syncProducts() {
  console.log('\n🔧 Smart sync: Products...');
  
  try {
    // Get production products with safe JSON handling
    const prodResult = await prodPool.query(`
      SELECT 
        id, name, description, price, category_id, image_url,
        condition, availability, created_at, updated_at,
        stripe_price_id, stripe_product_id,
        -- Handle JSON fields safely
        CASE 
          WHEN fulfillment_options IS NULL THEN '{}'::jsonb
          WHEN fulfillment_options::text = 'null' THEN '{}'::jsonb
          ELSE fulfillment_options
        END as fulfillment_options,
        CASE 
          WHEN features IS NULL THEN '[]'::jsonb
          WHEN features::text = 'null' THEN '[]'::jsonb
          ELSE features
        END as features,
        CASE 
          WHEN condition_details IS NULL THEN '{}'::jsonb
          WHEN condition_details::text = 'null' THEN '{}'::jsonb
          ELSE condition_details
        END as condition_details
      FROM products
    `);
    
    console.log(`   📊 Found ${prodResult.rows.length} products in production`);
    
    // Clear dev products
    await devPool.query('DELETE FROM products');
    
    // Insert each product individually with error handling
    let synced = 0;
    for (const product of prodResult.rows) {
      try {
        await devPool.query(`
          INSERT INTO products (
            id, name, description, price, category_id, image_url,
            condition, availability, created_at, updated_at,
            stripe_price_id, stripe_product_id,
            fulfillment_options, features, condition_details
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
        `, [
          product.id, product.name, product.description, product.price,
          product.category_id, product.image_url, product.condition,
          product.availability, product.created_at, product.updated_at,
          product.stripe_price_id, product.stripe_product_id,
          product.fulfillment_options, product.features, product.condition_details
        ]);
        synced++;
      } catch (error) {
        console.log(`   ⚠️  Failed to sync product ${product.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Successfully synced ${synced}/${prodResult.rows.length} products`);
    
  } catch (error) {
    console.error(`   ❌ Products sync error: ${error.message}`);
  }
}

async function syncUsers() {
  console.log('\n🔧 Smart sync: Users...');
  
  try {
    // Get production users - exclude problematic columns
    const prodResult = await prodPool.query(`
      SELECT 
        id, email, password_hash, first_name, last_name, role,
        created_at, updated_at, google_sub, google_email,
        google_email_verified, google_picture, last_login_at,
        profile_image_url
      FROM users
    `);
    
    console.log(`   📊 Found ${prodResult.rows.length} users in production`);
    
    // Clear dev users
    await devPool.query('DELETE FROM users');
    
    // Insert users without the problematic 'street' column
    let synced = 0;
    for (const user of prodResult.rows) {
      try {
        await devPool.query(`
          INSERT INTO users (
            id, email, password_hash, first_name, last_name, role,
            created_at, updated_at, google_sub, google_email,
            google_email_verified, google_picture, last_login_at,
            profile_image_url
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
        `, [
          user.id, user.email, user.password_hash, user.first_name,
          user.last_name, user.role, user.created_at, user.updated_at,
          user.google_sub, user.google_email, user.google_email_verified,
          user.google_picture, user.last_login_at, user.profile_image_url
        ]);
        synced++;
      } catch (error) {
        console.log(`   ⚠️  Failed to sync user ${user.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Successfully synced ${synced}/${prodResult.rows.length} users`);
    
  } catch (error) {
    console.error(`   ❌ Users sync error: ${error.message}`);
  }
}

async function syncAddresses() {
  console.log('\n🔧 Smart sync: Addresses...');
  
  try {
    const prodResult = await prodPool.query(`
      SELECT 
        id, user_id, street1, street2, city, state, postal_code,
        country, is_default, created_at, updated_at, type,
        latitude, longitude, geoapify_place_id
      FROM addresses
    `);
    
    console.log(`   📊 Found ${prodResult.rows.length} addresses in production`);
    
    await devPool.query('DELETE FROM addresses');
    
    let synced = 0;
    for (const address of prodResult.rows) {
      try {
        await devPool.query(`
          INSERT INTO addresses (
            id, user_id, street1, street2, city, state, postal_code,
            country, is_default, created_at, updated_at, type,
            latitude, longitude, geoapify_place_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
        `, [
          address.id, address.user_id, address.street1, address.street2,
          address.city, address.state, address.postal_code, address.country,
          address.is_default, address.created_at, address.updated_at,
          address.type, address.latitude, address.longitude, address.geoapify_place_id
        ]);
        synced++;
      } catch (error) {
        console.log(`   ⚠️  Failed to sync address ${address.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Successfully synced ${synced}/${prodResult.rows.length} addresses`);
    
  } catch (error) {
    console.error(`   ❌ Addresses sync error: ${error.message}`);
  }
}

async function verifySync() {
  console.log('\n🔍 Final verification...');
  
  const checks = [
    { table: 'categories', query: 'SELECT COUNT(*) as count FROM categories' },
    { table: 'products', query: 'SELECT COUNT(*) as count FROM products' },
    { table: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { table: 'addresses', query: 'SELECT COUNT(*) as count FROM addresses' }
  ];
  
  for (const check of checks) {
    try {
      const [prodResult, devResult] = await Promise.all([
        prodPool.query(check.query),
        devPool.query(check.query)
      ]);
      
      const prodCount = parseInt(prodResult.rows[0].count);
      const devCount = parseInt(devResult.rows[0].count);
      
      if (prodCount === devCount) {
        console.log(`   ✅ ${check.table}: ${devCount} records (perfect sync)`);
      } else {
        console.log(`   ⚠️  ${check.table}: PROD=${prodCount}, DEV=${devCount}`);
      }
    } catch (error) {
      console.log(`   ❌ ${check.table}: verification failed`);
    }
  }
}

async function main() {
  try {
    await syncProducts();
    await syncUsers();
    await syncAddresses();
    await verifySync();
    
    console.log('\n🎉 Smart data synchronization complete!');
    console.log('✅ Both databases should now have identical data');
    
  } catch (error) {
    console.error('\n❌ Smart sync failed:', error);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();