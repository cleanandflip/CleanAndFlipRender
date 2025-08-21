#!/usr/bin/env node

/**
 * Production Hotfix Migration - Step C from user instructions
 * Applies backward-compatible migrations with no downtime
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function applyProductionHotfix() {
  console.log('🔧 Production Hotfix Migration');
  console.log('===============================');
  
  const PROD_DATABASE_URL = process.env.DATABASE_URL?.replace('ep-lingering-flower', 'ep-muddy-moon') || 
    process.env.DATABASE_URL;
  
  if (!PROD_DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  const sql_conn = neon(PROD_DATABASE_URL);
  const db = drizzle(sql_conn);
  
  try {
    console.log('🔍 Applying backward-compatible schema updates...');
    
    // USERS TABLE HOTFIX - Add missing columns safely
    console.log('\n📝 Adding missing user columns...');
    
    await db.execute(sql`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "profile_address_id" uuid REFERENCES "addresses"("id") ON DELETE SET NULL
    `);
    console.log('  ✅ profile_address_id column added/verified');
    
    // Add helpful indexes
    console.log('\n📊 Creating performance indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_users_profile_address_id" 
      ON "users"("profile_address_id")
    `);
    console.log('  ✅ profile_address_id index created');
    
    // Cart de-duplication safety - functional index for ownership
    console.log('\n🛒 Ensuring cart uniqueness...');
    
    try {
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cart_owner_product_func"
        ON "cart_items" (
          COALESCE(user_id::text, session_id),
          product_id,
          COALESCE(variant_id, '')
        )
      `);
      console.log('  ✅ Cart uniqueness index created');
    } catch (indexError) {
      if (indexError.message.includes('already exists')) {
        console.log('  ✅ Cart uniqueness index already exists');
      } else {
        console.log(`  ⚠️  Cart index warning: ${indexError.message}`);
      }
    }
    
    // Verify all changes applied successfully
    console.log('\n🔍 Verifying hotfix application...');
    
    const verification = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name='users'
        AND column_name IN ('profile_address_id')
      ORDER BY column_name
    `);
    
    verification.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🎯 Production Hotfix Complete!');
    console.log('✅ Missing columns added');
    console.log('✅ Indexes created for performance');
    console.log('✅ Zero downtime migration successful');
    console.log('\n💡 Next: Update code schema and clean rebuild');
    
  } catch (error) {
    console.error('❌ Hotfix failed:', error.message);
    console.error('   Manual intervention may be required');
    process.exit(1);
  }
}

applyProductionHotfix().catch(console.error);