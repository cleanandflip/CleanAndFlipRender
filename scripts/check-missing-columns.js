#!/usr/bin/env node

/**
 * Check Missing Columns in Production - HTTP Mode
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function checkMissingColumns() {
  console.log('🔍 Checking Missing Columns in Production');
  console.log('=========================================');
  
  const PROD_DATABASE_URL = "postgresql://neondb_owner:NEON_PASSWORD@ep-muddy-moon-a6mxgfe2.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
  
  const sql_conn = neon(PROD_DATABASE_URL);
  const db = drizzle(sql_conn);
  
  try {
    // Check which columns exist in users table
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    console.log('✅ Existing columns in production users table:');
    existingColumns.forEach(col => console.log(`  - ${col}`));
    
    // Check for specific columns mentioned in getUserByEmail
    const requiredColumns = [
      'id', 'email', 'password', 'first_name', 'last_name', 'phone',
      'stripe_customer_id', 'stripe_subscription_id', 'created_at', 'updated_at',
      'role', 'google_id', 'profile_image_url', 'auth_provider', 'is_email_verified',
      'google_email', 'google_picture', 'profile_address_id', 'is_local_customer'
    ];
    
    console.log('\n🔍 Column Status Check:');
    const missingColumns = [];
    
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`  ✅ ${col}: EXISTS`);
      } else {
        console.log(`  ❌ ${col}: MISSING`);
        missingColumns.push(col);
      }
    });
    
    if (missingColumns.length > 0) {
      console.log('\n🚨 MISSING COLUMNS FOUND:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
      console.log('\n💡 These columns need to be added to fix the login error.');
    } else {
      console.log('\n✅ All required columns exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMissingColumns().catch(console.error);