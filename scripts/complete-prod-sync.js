#!/usr/bin/env node

/**
 * Complete Production Database Synchronization
 * Ensures ALL tables and schema are synchronized
 */

import { neon } from '@neondatabase/serverless';

async function completeProductionSync() {
  try {
    console.log('🔧 Complete Production Database Synchronization');
    console.log('================================================');
    
    const prodUrl = process.env.DATABASE_URL_PROD;
    if (!prodUrl) {
      throw new Error('DATABASE_URL_PROD environment variable not set');
    }
    
    console.log('✅ Connecting to production database...');
    const sql = neon(prodUrl);
    
    // Check what tables are missing
    const existingTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    const existingTableNames = existingTables.map(t => t.tablename);
    console.log('📊 Current tables:', existingTableNames.join(', '));
    
    // Create error_logs table if missing
    if (!existingTableNames.includes('error_logs')) {
      console.log('\n🔧 Creating error_logs table...');
      await sql`
        CREATE TABLE error_logs (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          error_type varchar NOT NULL,
          severity varchar NOT NULL,
          message text NOT NULL,
          stack_trace text,
          user_id varchar,
          session_id varchar,
          request_url varchar,
          request_method varchar,
          user_agent text,
          ip_address varchar,
          environment varchar NOT NULL DEFAULT 'production',
          occurrence_count integer DEFAULT 1,
          resolved boolean DEFAULT false,
          resolved_by varchar,
          resolved_at timestamp with time zone,
          notes text,
          created_at timestamp with time zone DEFAULT now(),
          last_seen timestamp with time zone DEFAULT now()
        );
      `;
      console.log('✅ Created error_logs table');
    }
    
    // Create error_log_instances table if missing
    if (!existingTableNames.includes('error_log_instances')) {
      console.log('\n🔧 Creating error_log_instances table...');
      await sql`
        CREATE TABLE error_log_instances (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          error_log_id varchar NOT NULL,
          user_id varchar,
          session_id varchar,
          request_url varchar,
          request_method varchar,
          user_agent text,
          ip_address varchar,
          context_data jsonb DEFAULT '{}',
          created_at timestamp with time zone DEFAULT now()
        );
      `;
      console.log('✅ Created error_log_instances table');
    }
    
    // Verify all critical tables now exist
    const finalTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    const requiredTables = [
      'users', 'addresses', 'products', 'categories', 
      'orders', 'cart_items', 'sessions', 'error_logs',
      'error_log_instances'
    ];
    
    console.log('\n📊 Final Table Verification:');
    let allTablesExist = true;
    for (const table of requiredTables) {
      const exists = finalTables.some(t => t.tablename === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allTablesExist = false;
    }
    
    // Test critical functionality
    console.log('\n🔐 Testing Critical Queries:');
    
    try {
      // Test authentication query
      await sql`
        SELECT u.id, u.email, u.profile_address_id
        FROM users u
        LIMIT 1;
      `;
      console.log('  ✅ Authentication queries functional');
    } catch (authError) {
      console.log('  ❌ Authentication query failed:', authError.message);
      allTablesExist = false;
    }
    
    try {
      // Test error logging
      await sql`
        SELECT id, error_type, severity
        FROM error_logs
        LIMIT 1;
      `;
      console.log('  ✅ Error logging queries functional');
    } catch (logError) {
      console.log('  ❌ Error logging query failed:', logError.message);
      allTablesExist = false;
    }
    
    if (allTablesExist) {
      console.log('\n🎉 Production database is FULLY synchronized and ready!');
      console.log('   All critical tables exist and queries are functional');
      return true;
    } else {
      console.log('\n❌ Production database synchronization incomplete');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Production Sync Failed:');
    console.error(error.message);
    return false;
  }
}

// Run sync if called directly
const isMainModule = process.argv[1]?.endsWith('complete-prod-sync.js');
if (isMainModule) {
  completeProductionSync()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { completeProductionSync };