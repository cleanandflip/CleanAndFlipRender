#!/usr/bin/env node

/**
 * Production Database Schema Synchronization Script
 * Directly applies missing schema changes to production database
 */

import { neon } from '@neondatabase/serverless';

async function syncProductionSchema() {
  try {
    console.log('🔧 Production Database Schema Synchronization');
    console.log('==============================================');
    
    const prodUrl = process.env.DATABASE_URL_PROD;
    if (!prodUrl) {
      throw new Error('DATABASE_URL_PROD environment variable not set');
    }
    
    console.log('✅ Connecting to production database...');
    const sql = neon(prodUrl);
    
    // Check current database info
    const dbInfo = await sql`SELECT current_database() as db_name, current_user as username`;
    console.log(`📍 Connected to: ${dbInfo[0].db_name} as ${dbInfo[0].username}`);
    
    // Check if critical columns exist
    const columnCheck = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'addresses')
        AND column_name IN ('profile_address_id', 'street1', 'street2')
      ORDER BY table_name, column_name;
    `;
    
    console.log('\n📊 Current Production Schema:');
    columnCheck.forEach(col => {
      console.log(`  ${col.table_name}.${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check what columns are missing
    const hasProfileAddressId = columnCheck.some(c => c.column_name === 'profile_address_id');
    const hasStreet1 = columnCheck.some(c => c.column_name === 'street1');
    const hasStreet2 = columnCheck.some(c => c.column_name === 'street2');
    
    console.log('\n🔍 Schema Gap Analysis:');
    console.log(`  users.profile_address_id: ${hasProfileAddressId ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  addresses.street1: ${hasStreet1 ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  addresses.street2: ${hasStreet2 ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Apply missing schema changes
    let changesApplied = 0;
    
    if (!hasProfileAddressId) {
      console.log('\n🔧 Adding users.profile_address_id column...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN profile_address_id varchar;
      `;
      console.log('✅ Added users.profile_address_id');
      changesApplied++;
    }
    
    if (!hasStreet1) {
      console.log('\n🔧 Adding addresses.street1 column...');
      await sql`
        ALTER TABLE addresses 
        ADD COLUMN street1 text NOT NULL DEFAULT '';
      `;
      console.log('✅ Added addresses.street1');
      changesApplied++;
    }
    
    if (!hasStreet2) {
      console.log('\n🔧 Adding addresses.street2 column...');
      await sql`
        ALTER TABLE addresses 
        ADD COLUMN street2 text;
      `;
      console.log('✅ Added addresses.street2');
      changesApplied++;
    }
    
    // Verify final schema
    const finalCheck = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'addresses')
        AND column_name IN ('profile_address_id', 'street1', 'street2', 'id')
      ORDER BY table_name, column_name;
    `;
    
    console.log('\n✅ Final Production Schema:');
    finalCheck.forEach(col => {
      console.log(`  ${col.table_name}.${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check type compatibility
    const userProfileAddress = finalCheck.find(c => c.table_name === 'users' && c.column_name === 'profile_address_id');
    const addressId = finalCheck.find(c => c.table_name === 'addresses' && c.column_name === 'id');
    
    if (userProfileAddress && addressId) {
      const compatible = userProfileAddress.data_type === addressId.data_type;
      console.log('\n🔗 Type Compatibility Check:');
      console.log(`  users.profile_address_id: ${userProfileAddress.data_type}`);
      console.log(`  addresses.id: ${addressId.data_type}`);
      console.log(`  ${compatible ? '✅' : '❌'} Compatibility: ${compatible ? 'COMPATIBLE' : 'MISMATCH'}`);
    }
    
    console.log(`\n🎯 Production Schema Sync Complete!`);
    console.log(`   Applied ${changesApplied} schema changes`);
    console.log(`   Production database ready for deployment`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Production Schema Sync Failed:');
    console.error(error.message);
    console.error('\nStack:', error.stack);
    return false;
  }
}

// Run sync if called directly
const isMainModule = process.argv[1]?.endsWith('sync-prod-schema.js');
if (isMainModule) {
  syncProductionSchema()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { syncProductionSchema };