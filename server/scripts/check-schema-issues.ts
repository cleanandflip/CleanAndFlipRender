import { db } from '../db';
import { sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';

async function checkSchemaIssues() {
  Logger.info('🔍 Checking for current schema issues...\n');
  
  const issues = [];
  
  try {
    // Check 1: Test products table for subcategory
    Logger.info('1. Testing products table schema...');
    try {
      await db.execute(sql`SELECT id, name, subcategory FROM products LIMIT 1`);
      Logger.info('✅ Subcategory column exists in products');
    } catch (error: any) {
      if (error.message.includes('column "subcategory" does not exist')) {
        Logger.info('❌ Subcategory column missing from products table');
        issues.push('products.subcategory');
      }
    }
    
    // Check 2: Test users table for street (address fields)
    Logger.info('\n2. Testing users table schema...');
    try {
      await db.execute(sql`SELECT id, email, street FROM users LIMIT 1`);
      Logger.info('✅ Street column exists in users');
    } catch (error: any) {
      if (error.message.includes('column "street" does not exist')) {
        Logger.info('❌ Street column missing from users table');
        issues.push('users.street');
      }
    }
    
    // Check 3: Verify actual columns in each table
    Logger.info('\n3. Actual database schema:');
    
    // Products columns
    const productCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    Logger.info('\nProducts table columns:');
    productCols.rows.forEach((col: any) => 
      Logger.info(`  - ${col.column_name} (${col.data_type})`)
    );
    
    // Users columns
    const userCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    Logger.info('\nUsers table columns:');
    userCols.rows.forEach((col: any) => 
      Logger.info(`  - ${col.column_name} (${col.data_type})`)
    );
    
    // Check if addresses table exists (might be separate)
    const addressTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'addresses'
      )
    `);
    
    if (addressTable.rows[0].exists) {
      Logger.info('\n✅ Addresses table exists (separate from users)');
      const addressCols = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        ORDER BY ordinal_position
      `);
      Logger.info('\nAddresses table columns:');
      addressCols.rows.forEach((col: any) => 
        Logger.info(`  - ${col.column_name} (${col.data_type})`)
      );
    }
    
    // Summary
    Logger.info('\n📊 SUMMARY:');
    if (issues.length === 0) {
      Logger.info('✅ No schema issues detected');
    } else {
      Logger.info(`❌ Found ${issues.length} schema issues:`);
      issues.forEach(issue => Logger.info(`  - ${issue}`));
    }
    
  } catch (error) {
    Logger.error('Schema check failed:', error);
  }
}

// Run the check
checkSchemaIssues().then(() => {
  Logger.info('\nSchema check completed.');
  process.exit(0);
});