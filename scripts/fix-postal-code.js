#!/usr/bin/env node

/**
 * Fix missing postal_code column in production addresses table
 */

import { neon } from '@neondatabase/serverless';

async function fixPostalCode() {
  try {
    console.log('🔧 Fixing postal_code column in production');
    console.log('==========================================');
    
    const prodUrl = process.env.DATABASE_URL_PROD;
    if (!prodUrl) {
      throw new Error('DATABASE_URL_PROD environment variable not set');
    }
    
    console.log('✅ Connecting to production database...');
    const sql = neon(prodUrl);
    
    // Check if postal_code exists
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'addresses'
        AND column_name = 'postal_code';
    `;
    
    if (columns.length === 0) {
      console.log('🔧 Adding postal_code column to addresses table...');
      await sql`
        ALTER TABLE addresses 
        ADD COLUMN postal_code varchar(20);
      `;
      console.log('✅ Added postal_code column');
    } else {
      console.log('✅ postal_code column already exists');
    }
    
    // Verify the fix
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'addresses'
        AND column_name IN ('street1', 'street2', 'city', 'state', 'postal_code')
      ORDER BY column_name;
    `;
    
    console.log('\n📊 Final addresses table schema:');
    finalColumns.forEach(col => {
      console.log(`  ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🎉 Production database schema is now COMPLETE!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Failed to fix postal_code column:');
    console.error(error.message);
    return false;
  }
}

// Run fix if called directly
const isMainModule = process.argv[1]?.endsWith('fix-postal-code.js');
if (isMainModule) {
  fixPostalCode()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { fixPostalCode };