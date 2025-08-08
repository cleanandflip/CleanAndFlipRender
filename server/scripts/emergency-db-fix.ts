// Emergency Database Fix Script
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';

async function emergencyFix() {
  console.log('🚨 STARTING EMERGENCY DATABASE FIX...\n');

  try {
    // 1. Check what columns actually exist
    const tables = ['products', 'categories', 'users'];
    
    for (const table of tables) {
      console.log(`\nChecking ${table} table...`);
      try {
        const result = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position
        `);
        console.log(`Columns in ${table}:`, result.rows?.map(r => r.column_name) || 'No rows returned');
      } catch (e) {
        console.error(`Error checking ${table}:`, e.message);
      }
    }

    // 2. Add missing columns if needed
    console.log('\n📝 Adding missing columns...');
    
    // Fix products table - Add commonly referenced columns
    try {
      await db.execute(sql`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
        ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
        ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good',
        ADD COLUMN IF NOT EXISTS size VARCHAR(50)
      `);
      console.log('✅ Products table columns added');
    } catch (e) {
      console.error('❌ Products table fix failed:', e.message);
    }

    // Fix categories table
    try {
      await db.execute(sql`
        ALTER TABLE categories 
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);
      console.log('✅ Categories table columns added');
    } catch (e) {
      console.error('❌ Categories table fix failed:', e.message);
    }

    // 3. Verify password reset tokens table exists
    console.log('\n🔑 Checking password reset tokens table...');
    try {
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'password_reset_tokens'
        )
      `);
      
      if (!tableExists.rows?.[0]?.exists) {
        console.log('Creating password_reset_tokens table...');
        await db.execute(sql`
          CREATE TABLE password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Password reset tokens table created');
      } else {
        console.log('✅ Password reset tokens table already exists');
      }
    } catch (e) {
      console.error('❌ Password reset table check failed:', e.message);
    }

    // 4. Test basic queries
    console.log('\n🧪 Testing basic queries...');
    
    try {
      const productTest = await db.execute(sql`SELECT id, name, price FROM products LIMIT 1`);
      console.log('✅ Products query working');
    } catch (e) {
      console.error('❌ Products query failed:', e.message);
    }

    try {
      const categoryTest = await db.execute(sql`SELECT id, name FROM categories LIMIT 1`);
      console.log('✅ Categories query working');
    } catch (e) {
      console.error('❌ Categories query failed:', e.message);
    }

    console.log('\n✅ EMERGENCY DATABASE FIX COMPLETED!');
    
  } catch (error) {
    console.error('🚨 CRITICAL ERROR during emergency fix:', error);
    process.exit(1);
  }
}

// Run the fix
emergencyFix().then(() => {
  console.log('Emergency fix completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Emergency fix failed:', error);
  process.exit(1);
});