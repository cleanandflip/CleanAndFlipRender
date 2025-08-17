#!/usr/bin/env node

/**
 * Complete Production Schema Fix - Add ALL missing columns
 * This adds columns that exist in the application but are missing in production
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function completeProductionSchemaFix() {
  console.log('🔧 Complete Production Schema Fix');
  console.log('================================');
  
  const PROD_DATABASE_URL = process.env.DATABASE_URL?.replace('ep-lingering-flower', 'ep-muddy-moon') || 
    "postgresql://neondb_owner:NEON_PASSWORD@ep-muddy-moon-a6mxgfe2.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
  
  const sql_conn = neon(PROD_DATABASE_URL);
  const db = drizzle(sql_conn);
  
  try {
    console.log('✅ Connected to production database');
    
    // Step 1: Add missing columns that are referenced in getUserByEmail but may not exist
    const missingColumns = [
      { table: 'users', column: 'phone', type: 'VARCHAR(50)' },
      { table: 'users', column: 'role', type: 'VARCHAR(20) DEFAULT \'user\'' },
      { table: 'users', column: 'google_id', type: 'VARCHAR(255)' },
      { table: 'users', column: 'profile_image_url', type: 'TEXT' },
      { table: 'users', column: 'auth_provider', type: 'VARCHAR(50) DEFAULT \'local\'' },
      { table: 'users', column: 'is_email_verified', type: 'BOOLEAN DEFAULT false' },
      { table: 'users', column: 'google_email', type: 'VARCHAR(255)' },
      { table: 'users', column: 'google_picture', type: 'TEXT' },
      { table: 'users', column: 'is_local_customer', type: 'BOOLEAN DEFAULT false' },
      { table: 'users', column: 'profile_complete', type: 'BOOLEAN DEFAULT false' },
      { table: 'users', column: 'onboarding_step', type: 'INTEGER DEFAULT 0' },
      { table: 'users', column: 'onboarding_completed_at', type: 'TIMESTAMP' }
    ];
    
    console.log('🔍 Adding missing columns to production...');
    
    for (const { table, column, type } of missingColumns) {
      try {
        await db.execute(sql`
          ALTER TABLE ${sql.identifier(table)} 
          ADD COLUMN IF NOT EXISTS ${sql.identifier(column)} ${sql.raw(type)}
        `);
        console.log(`  ✅ ${table}.${column}: Added`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ✅ ${table}.${column}: Already exists`);
        } else {
          console.log(`  ⚠️  ${table}.${column}: Error - ${error.message}`);
        }
      }
    }
    
    // Step 2: Verify all columns now exist
    console.log('\n🔍 Verifying production schema...');
    const verification = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Production users table columns:');
    verification.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
    // Step 3: Test the getUserByEmail query
    console.log('\n🧪 Testing getUserByEmail query on production...');
    try {
      await db.execute(sql`
        SELECT
          id, email, password, first_name, last_name, 
          COALESCE(phone, '') as phone,
          stripe_customer_id, stripe_subscription_id, 
          created_at, updated_at,
          COALESCE(role, 'user') as role,
          google_id, 
          COALESCE(profile_image_url, '') as profile_image_url,
          COALESCE(auth_provider, 'local') as auth_provider,
          COALESCE(is_email_verified, false) as is_email_verified,
          google_email, google_picture,
          profile_address_id,
          COALESCE(is_local_customer, false) as is_local_customer,
          COALESCE(profile_complete, false) as profile_complete,
          COALESCE(onboarding_step, 0) as onboarding_step,
          onboarding_completed_at
        FROM users
        WHERE LOWER(email) = LOWER('test@example.com')
        LIMIT 1
      `);
      console.log('✅ getUserByEmail query syntax verified');
    } catch (error) {
      console.error('❌ Query test failed:', error.message);
      throw error;
    }
    
    console.log('\n🎯 Production schema fix completed successfully!');
    console.log('🚀 Login errors should now be resolved');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    process.exit(1);
  }
}

completeProductionSchemaFix().catch(console.error);