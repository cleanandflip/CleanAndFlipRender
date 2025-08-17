#!/usr/bin/env node

/**
 * Production Database Schema Validation Script
 * Comprehensive validation of production database schema
 */

import { neon } from '@neondatabase/serverless';

async function validateProductionSchema() {
  try {
    console.log('🔍 Production Database Schema Validation');
    console.log('=========================================');
    
    const prodUrl = process.env.DATABASE_URL_PROD;
    if (!prodUrl) {
      throw new Error('DATABASE_URL_PROD environment variable not set');
    }
    
    console.log('✅ Connecting to production database...');
    const sql = neon(prodUrl);
    
    // Test basic connectivity
    const connectionTest = await sql`SELECT 1 as test, current_database() as db_name, current_user as username`;
    console.log(`📍 Connected to: ${connectionTest[0].db_name} as ${connectionTest[0].username}`);
    
    // Check all critical tables exist
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    const requiredTables = [
      'users', 'addresses', 'products', 'categories', 
      'orders', 'cart_items', 'sessions', 'error_logs',
      'user_onboarding', 'order_items', 'password_reset_tokens'
    ];
    
    console.log('\n📊 Table Validation:');
    let missingTables = [];
    for (const table of requiredTables) {
      const exists = tables.some(t => t.tablename === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) missingTables.push(table);
    }
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    // Check critical columns in users table
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users'
      ORDER BY column_name;
    `;
    
    console.log('\n🔍 Users Table Schema:');
    const requiredUserColumns = ['id', 'email', 'first_name', 'last_name', 'profile_address_id'];
    let missingUserColumns = [];
    
    for (const col of requiredUserColumns) {
      const exists = userColumns.some(c => c.column_name === col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) missingUserColumns.push(col);
    }
    
    // Check critical columns in addresses table
    const addressColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'addresses'
      ORDER BY column_name;
    `;
    
    console.log('\n🔍 Addresses Table Schema:');
    const requiredAddressColumns = ['id', 'user_id', 'street1', 'street2', 'city', 'state', 'postal_code'];
    let missingAddressColumns = [];
    
    for (const col of requiredAddressColumns) {
      const exists = addressColumns.some(c => c.column_name === col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) missingAddressColumns.push(col);
    }
    
    // Check foreign key constraints
    const foreignKeys = await sql`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('users', 'addresses', 'cart_items', 'orders')
      ORDER BY tc.table_name;
    `;
    
    console.log('\n🔗 Foreign Key Constraints:');
    for (const fk of foreignKeys) {
      console.log(`  ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    }
    
    // Test Passport-critical query
    console.log('\n🔐 Authentication Query Test:');
    try {
      const authTest = await sql`
        SELECT u.id, u.email, u.profile_address_id, a.id as address_id
        FROM users u
        LEFT JOIN addresses a ON u.profile_address_id = a.id
        LIMIT 1;
      `;
      console.log('  ✅ Passport authentication query structure valid');
    } catch (authError) {
      console.log('  ❌ Authentication query failed:', authError.message);
      return false;
    }
    
    // Type compatibility check
    const userProfileAddressCol = userColumns.find(c => c.column_name === 'profile_address_id');
    const addressIdCol = addressColumns.find(c => c.column_name === 'id');
    
    console.log('\n🔗 Type Compatibility:');
    if (userProfileAddressCol && addressIdCol) {
      const compatible = userProfileAddressCol.data_type === addressIdCol.data_type;
      console.log(`  users.profile_address_id: ${userProfileAddressCol.data_type}`);
      console.log(`  addresses.id: ${addressIdCol.data_type}`);
      console.log(`  ${compatible ? '✅' : '❌'} Compatibility: ${compatible ? 'COMPATIBLE' : 'MISMATCH'}`);
      
      if (!compatible) {
        console.log('  ❌ Type mismatch detected - this will cause authentication errors');
        return false;
      }
    }
    
    // Final validation summary
    const hasErrors = missingTables.length > 0 || missingUserColumns.length > 0 || missingAddressColumns.length > 0;
    
    console.log('\n🎯 Production Schema Validation Summary:');
    console.log(`  Tables: ${missingTables.length === 0 ? '✅ All present' : '❌ Missing: ' + missingTables.join(', ')}`);
    console.log(`  User columns: ${missingUserColumns.length === 0 ? '✅ All present' : '❌ Missing: ' + missingUserColumns.join(', ')}`);
    console.log(`  Address columns: ${missingAddressColumns.length === 0 ? '✅ All present' : '❌ Missing: ' + missingAddressColumns.join(', ')}`);
    console.log(`  Type compatibility: ✅ Compatible`);
    console.log(`  Authentication queries: ✅ Functional`);
    console.log(`  Foreign keys: ✅ ${foreignKeys.length} constraints active`);
    
    if (!hasErrors) {
      console.log('\n🎉 Production database schema is FULLY VALIDATED and ready for deployment!');
      return true;
    } else {
      console.log('\n❌ Production database schema has validation errors');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Production Schema Validation Failed:');
    console.error(error.message);
    return false;
  }
}

// Run validation if called directly
const isMainModule = process.argv[1]?.endsWith('validate-prod-schema.js');
if (isMainModule) {
  validateProductionSchema()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { validateProductionSchema };