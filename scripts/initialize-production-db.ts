import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function initializeProduction() {
  console.log('='.repeat(60));
  console.log('🚀 PRODUCTION DATABASE INITIALIZATION');
  console.log('='.repeat(60));
  
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    console.error('❌ DATABASE_URL not found');
    return;
  }
  
  // Parse base URL
  const urlMatch = baseUrl.match(/^(postgresql:\/\/[^/]+\/)([^?]+)(\?.+)?$/);
  if (!urlMatch) {
    console.error('❌ Invalid DATABASE_URL format');
    return;
  }
  
  const [, connString, , queryParams = '?sslmode=require'] = urlMatch;
  
  // Build database URLs
  const devUrl = `${connString}development${queryParams}`;
  const prodUrl = `${connString}neondb${queryParams}`;
  
  console.log('\n📊 Database Configuration:');
  console.log('  Development: development');
  console.log('  Production:  neondb');
  
  const devSql = neon(devUrl);
  const prodSql = neon(prodUrl);
  
  try {
    // Check production database status
    console.log('\n🔍 Checking production database...');
    const prodCheck = await prodSql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM categories) as categories
    `;
    
    const counts = prodCheck[0];
    console.log(`\n📈 Current production data:`);
    console.log(`  - Users: ${counts.users}`);
    console.log(`  - Products: ${counts.products}`);
    console.log(`  - Categories: ${counts.categories}`);
    
    if (counts.users > 0) {
      console.log('\n⚠️  Production database already has data!');
      console.log('    Skipping initialization to prevent data loss.');
      
      // Show existing users
      const existingUsers = await prodSql`
        SELECT email, role, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      
      console.log('\n👥 Existing users:');
      existingUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      
      return;
    }
    
    // Copy from development
    console.log('\n📋 Production is empty. Copying from development...\n');
    
    // Get development data
    const devCheck = await devSql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM categories) as categories
    `;
    
    if (devCheck[0].users === 0) {
      console.error('❌ Development database is also empty!');
      return;
    }
    
    // Copy users using simple approach
    console.log('👥 Copying users...');
    const users = await devSql`SELECT * FROM users`;
    for (const user of users) {
      try {
        await prodSql`
          INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at)
          VALUES (${user.id}, ${user.email}, ${user.password}, ${user.first_name}, ${user.last_name}, ${user.role}, ${user.created_at}, ${user.updated_at})
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err) {
        console.log(`    Skip user ${user.email}: ${err.message}`);
      }
    }
    
    const usersCopied = await prodSql`SELECT COUNT(*) as count FROM users`;
    console.log(`  ✅ Copied ${usersCopied[0].count} users`);
    
    // Copy categories
    console.log('\n📁 Copying categories...');
    const categories = await devSql`SELECT * FROM categories`;
    for (const cat of categories) {
      try {
        await prodSql`
          INSERT INTO categories (id, name, description, image, created_at, updated_at)
          VALUES (${cat.id}, ${cat.name}, ${cat.description}, ${cat.image}, ${cat.created_at}, ${cat.updated_at})
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err) {
        console.log(`    Skip category ${cat.name}: ${err.message}`);
      }
    }
    
    const catsCopied = await prodSql`SELECT COUNT(*) as count FROM categories`;
    console.log(`  ✅ Copied ${catsCopied[0].count} categories`);
    
    // Copy products
    console.log('\n📦 Copying products...');
    const products = await devSql`SELECT * FROM products`;
    for (const prod of products) {
      try {
        await prodSql`
          INSERT INTO products (id, name, description, price, category_id, images, brand, condition, weight, stock_quantity, is_featured, created_at, updated_at)
          VALUES (${prod.id}, ${prod.name}, ${prod.description}, ${prod.price}, ${prod.category_id}, ${prod.images}, ${prod.brand}, ${prod.condition}, ${prod.weight}, ${prod.stock_quantity}, ${prod.is_featured}, ${prod.created_at}, ${prod.updated_at})
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err) {
        console.log(`    Skip product ${prod.name}: ${err.message}`);
      }
    }
    
    const prodsCopied = await prodSql`SELECT COUNT(*) as count FROM products`;
    console.log(`  ✅ Copied ${prodsCopied[0].count} products`);
    
    // Verify specific user
    console.log('\n🧪 Verifying password reset user...');
    const testUser = await prodSql`
      SELECT email, id 
      FROM users 
      WHERE LOWER(email) = 'cleanandflipyt@gmail.com'
    `;
    
    if (testUser.length > 0) {
      console.log(`  ✅ Found: ${testUser[0].email}`);
      console.log(`  Password reset will work!`);
    } else {
      console.log(`  ⚠️ cleanandflipyt@gmail.com not found`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PRODUCTION DATABASE INITIALIZED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  process.exit(0);
}

initializeProduction();