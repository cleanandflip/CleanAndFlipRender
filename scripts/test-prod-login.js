#!/usr/bin/env node

/**
 * Production Login Test - Direct test to reproduce ERROR 42703
 * This script tests the exact query that's failing in production
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function testProductionLogin() {
  console.log('🔍 Testing Production Login Query');
  console.log('===================================');
  
  // Production database connection
  const PROD_DATABASE_URL = "postgresql://neondb_owner:NEON_PASSWORD@ep-muddy-moon-a6mxgfe2.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
  
  const pool = new Pool({ connectionString: PROD_DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    // First, check what columns actually exist
    console.log('📊 Checking users table columns...');
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Users table columns in production:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Now test the exact query from getUserByEmail that's failing
    console.log('\n🧪 Testing getUserByEmail query...');
    const testEmail = 'test@example.com';
    
    try {
      const result = await db.execute(sql`
        SELECT
          id, email, password, first_name, last_name, phone,
          stripe_customer_id, stripe_subscription_id, created_at, updated_at,
          role, google_id, profile_image_url, auth_provider, is_email_verified,
          google_email, google_picture, profile_address_id, is_local_customer,
          profile_complete, onboarding_step, onboarding_completed_at
        FROM users
        WHERE LOWER(email) = LOWER(${testEmail})
        LIMIT 1
      `);
      console.log('✅ Query executed successfully');
      console.log(`📊 Found ${result.rows.length} user(s)`);
    } catch (queryError) {
      console.error('❌ Query failed with error:');
      console.error(`   Code: ${queryError.code}`);
      console.error(`   Message: ${queryError.message}`);
      console.error(`   Position: ${queryError.position}`);
      
      // Try to identify which column is causing the issue
      if (queryError.code === '42703') {
        console.log('\n🔍 Identifying problematic column...');
        
        // Test individual columns
        const testColumns = [
          'id', 'email', 'password', 'first_name', 'last_name', 'phone',
          'stripe_customer_id', 'stripe_subscription_id', 'created_at', 'updated_at',
          'role', 'google_id', 'profile_image_url', 'auth_provider', 'is_email_verified',
          'google_email', 'google_picture', 'profile_address_id', 'is_local_customer',
          'profile_complete', 'onboarding_step', 'onboarding_completed_at'
        ];
        
        for (const column of testColumns) {
          try {
            await db.execute(sql`SELECT ${sql.identifier(column)} FROM users LIMIT 1`);
            console.log(`  ✅ ${column}: EXISTS`);
          } catch (colError) {
            console.log(`  ❌ ${column}: MISSING (${colError.message})`);
          }
        }
      }
    }
    
    await pool.end();
    console.log('\n🎯 Test completed');
    
  } catch (error) {
    console.error('❌ Connection or general error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testProductionLogin().catch(console.error);