import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';

async function fixProduction() {
  console.log('🔧 FIXING PRODUCTION DATABASE COMPLETELY');
  console.log('='.repeat(60));
  
  try {
    console.log('\n📝 Step 1: Adding missing columns to users table...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS street VARCHAR(255),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(2),
      ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
      ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100)
    `);
    console.log('✅ Address columns added to users table');
    
    console.log('\n📝 Step 2: Adding missing columns to other tables...');
    await db.execute(sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255)
    `);
    
    await db.execute(sql`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `);
    console.log('✅ Additional columns added');
    
    console.log('\n📝 Step 3: Creating password reset tokens table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        token VARCHAR(255) UNIQUE,
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Password reset tokens table created');
    
    console.log('\n📝 Step 4: Creating performance indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email))`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)`);
    console.log('✅ Performance indexes created');
    
    console.log('\n📝 Step 5: Creating admin user...');
    const hashedPassword = await bcryptjs.hash('Admin123!', 12);
    
    await db.execute(sql`
      INSERT INTO users (
        id,
        email,
        password,
        first_name,
        last_name,
        role,
        street,
        city,
        state,
        zip_code,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        'cleanandflipyt@gmail.com',
        ${hashedPassword},
        'Admin',
        'User',
        'admin',
        '123 Main St',
        'Asheville',
        'NC',
        '28801',
        NOW(),
        NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        password = ${hashedPassword},
        role = 'admin',
        updated_at = NOW()
    `);
    
    console.log('✅ Admin user created/updated');
    console.log('   📧 Email: cleanandflipyt@gmail.com');
    console.log('   🔑 Password: Admin123!');
    
    console.log('\n📝 Step 6: Creating test user...');
    await db.execute(sql`
      INSERT INTO users (
        id,
        email,
        password,
        first_name,
        last_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        'test@test.com',
        ${hashedPassword},
        'Test',
        'User',
        'user',
        NOW(),
        NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        password = ${hashedPassword},
        updated_at = NOW()
    `);
    console.log('✅ Test user created/updated');
    
    console.log('\n📝 Step 7: Adding basic categories...');
    await db.execute(sql`
      INSERT INTO categories (id, name, slug, description, is_active, created_at)
      VALUES 
        (gen_random_uuid(), 'Weightlifting Equipment', 'weightlifting-equipment', 'Barbells, plates, and weightlifting accessories', true, NOW()),
        (gen_random_uuid(), 'Cardio Equipment', 'cardio-equipment', 'Treadmills, bikes, and cardio machines', true, NOW()),
        (gen_random_uuid(), 'Fitness Accessories', 'fitness-accessories', 'Gym accessories and workout gear', true, NOW())
      ON CONFLICT (slug) DO NOTHING
    `);
    console.log('✅ Categories added');
    
    console.log('\n📝 Step 8: Verification - checking database structure...');
    
    // Verify users
    const users = await db.execute(sql`SELECT email, role, city FROM users ORDER BY created_at DESC`);
    console.log(`\n👥 USERS (${users.rows.length}):`);
    users.rows.forEach(u => {
      console.log(`   - ${u.email} (${u.role})${u.city ? ` - ${u.city}` : ''}`);
    });
    
    // Verify categories
    const categories = await db.execute(sql`SELECT name FROM categories WHERE is_active = true`);
    console.log(`\n📁 CATEGORIES (${categories.rows.length}):`);
    categories.rows.forEach(c => {
      console.log(`   - ${c.name}`);
    });
    
    // Verify columns exist
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('street', 'city', 'state', 'zip_code', 'latitude', 'longitude')
      ORDER BY column_name
    `);
    
    console.log(`\n📋 ADDRESS COLUMNS (${columns.rows.length}):`);
    columns.rows.forEach(c => {
      console.log(`   - ${c.column_name} (${c.data_type})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCTION DATABASE SETUP COMPLETE!');
    console.log('');
    console.log('✅ All address columns added');
    console.log('✅ Password reset system ready');
    console.log('✅ Admin user ready for login');
    console.log('✅ Performance indexes created');
    console.log('✅ Basic categories populated');
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('   Email: cleanandflipyt@gmail.com');
    console.log('   Password: Admin123!');
    console.log('');
    console.log('🚀 Ready for production deployment!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Production fix failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixProduction();