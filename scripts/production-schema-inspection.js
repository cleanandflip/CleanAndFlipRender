#!/usr/bin/env node

/**
 * Production Schema Inspection - Step B from user instructions
 * This inspects the live production database to identify missing columns
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function inspectProductionSchema() {
  console.log('🔍 Production Schema Inspection');
  console.log('===============================');
  
  // Use production database URL
  const PROD_DATABASE_URL = process.env.DATABASE_URL?.replace('ep-lingering-flower', 'ep-muddy-moon') || 
    process.env.DATABASE_URL;
  
  if (!PROD_DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  console.log(`[BOOT] DB: ${PROD_DATABASE_URL.slice(0, 32)}...`);
  
  const sql_conn = neon(PROD_DATABASE_URL);
  const db = drizzle(sql_conn);
  
  try {
    // Sanity check: where are we?
    console.log('\n🔍 Database Connection Verification:');
    const dbInfo = await db.execute(sql`SELECT current_database(), current_user, version()`);
    const info = dbInfo.rows[0];
    console.log(`  Database: ${info.current_database}`);
    console.log(`  User: ${info.current_user}`);
    console.log(`  Version: ${info.version?.split(' ').slice(0, 2).join(' ')}`);
    
    // Check for missing columns that the code expects
    console.log('\n🔍 Critical Column Check:');
    const columnCheck = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='users'
        AND column_name IN ('profile_address_id','onboarding_completed_at')
      ORDER BY column_name
    `);
    
    const foundColumns = columnCheck.rows.map(row => row.column_name);
    const expectedColumns = ['profile_address_id', 'onboarding_completed_at'];
    
    expectedColumns.forEach(col => {
      if (foundColumns.includes(col)) {
        console.log(`  ✅ users.${col}: EXISTS`);
      } else {
        console.log(`  ❌ users.${col}: MISSING`);
      }
    });
    
    // Check Drizzle migration state
    console.log('\n🔍 Migration State:');
    try {
      const migrations = await db.execute(sql`
        SELECT * FROM "drizzle__migrations" 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      if (migrations.rows.length > 0) {
        console.log('  Recent migrations:');
        migrations.rows.forEach(row => {
          console.log(`    - ${row.hash?.slice(0, 8)}: ${row.created_at}`);
        });
      } else {
        console.log('  ⚠️  No migration records found');
      }
    } catch (migError) {
      console.log('  ⚠️  drizzle__migrations table does not exist');
    }
    
    // Check cart indexes for uniqueness issues
    console.log('\n🔍 Cart Index Check:');
    const indexes = await db.execute(sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('cart_items','users')
      ORDER BY tablename, indexname
    `);
    
    console.log('  Current indexes:');
    indexes.rows.forEach(row => {
      console.log(`    - ${row.indexname}: ${row.indexdef.substring(0, 60)}...`);
    });
    
    // Overall assessment
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));
    
    console.log('\n📊 Assessment:');
    if (missingColumns.length === 0) {
      console.log('  ✅ All required columns present');
      console.log('  🎯 Schema appears up-to-date');
    } else {
      console.log(`  ❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('  🚨 HOTFIX REQUIRED - Proceed to Step C');
      
      console.log('\n💡 Next Steps:');
      console.log('  1. Run the hotfix migration (Step C)');
      console.log('  2. Update schema file (Step D)');
      console.log('  3. Clean build and redeploy (Step E)');
    }
    
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
    console.error('   This may indicate connection issues or missing permissions');
    process.exit(1);
  }
}

inspectProductionSchema().catch(console.error);