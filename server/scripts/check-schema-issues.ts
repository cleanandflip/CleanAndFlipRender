import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkSchemaIssues() {
  console.log('🔍 Checking for current schema issues...\n');
  
  const issues = [];
  
  try {
    // Check 1: Test products table for subcategory
    console.log('1. Testing products table schema...');
    try {
      await db.execute(sql`SELECT id, name, subcategory FROM products LIMIT 1`);
      console.log('✅ Subcategory column exists in products');
    } catch (error: any) {
      if (error.message.includes('column "subcategory" does not exist')) {
        console.log('❌ Subcategory column missing from products table');
        issues.push('products.subcategory');
      }
    }
    
    // Check 2: Test users table for street (address fields)
    console.log('\n2. Testing users table schema...');
    try {
      await db.execute(sql`SELECT id, email, street FROM users LIMIT 1`);
      console.log('✅ Street column exists in users');
    } catch (error: any) {
      if (error.message.includes('column "street" does not exist')) {
        console.log('❌ Street column missing from users table');
        issues.push('users.street');
      }
    }
    
    // Check 3: Verify actual columns in each table
    console.log('\n3. Actual database schema:');
    
    // Products columns
    const productCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    console.log('\nProducts table columns:');
    productCols.rows.forEach((col: any) => 
      console.log(`  - ${col.column_name} (${col.data_type})`)
    );
    
    // Users columns
    const userCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('\nUsers table columns:');
    userCols.rows.forEach((col: any) => 
      console.log(`  - ${col.column_name} (${col.data_type})`)
    );
    
    // Check if addresses table exists (might be separate)
    const addressTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'addresses'
      )
    `);
    
    if (addressTable.rows[0].exists) {
      console.log('\n✅ Addresses table exists (separate from users)');
      const addressCols = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'addresses' 
        ORDER BY ordinal_position
      `);
      console.log('\nAddresses table columns:');
      addressCols.rows.forEach((col: any) => 
        console.log(`  - ${col.column_name} (${col.data_type})`)
      );
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    if (issues.length === 0) {
      console.log('✅ No schema issues detected');
    } else {
      console.log(`❌ Found ${issues.length} schema issues:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

// Run the check
checkSchemaIssues().then(() => {
  console.log('\nSchema check completed.');
  process.exit(0);
});