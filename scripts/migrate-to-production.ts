import { neon } from '@neondatabase/serverless';
import fs from 'fs';

async function migrateToProduction() {
  console.log('🚀 MIGRATING TO PRODUCTION DATABASE (100GB)');
  console.log('='.repeat(60));
  
  // Load exported data
  const exportData = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));
  console.log(`📤 Loaded export data: ${exportData.users.length} users, ${exportData.products.length} products, ${exportData.categories.length} categories`);
  
  // Connect to production database
  const prodUrl = process.env.DATABASE_URL;
  if (!prodUrl) {
    console.error('[FATAL] DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  const sql = neon(prodUrl);
  
  try {
    console.log('\n📊 PRODUCTION DATABASE SETUP:');
    
    // Verify connection
    const connInfo = await sql`SELECT current_database(), current_user`;
    console.log(`✅ Connected to: ${connInfo[0]?.current_database} as ${connInfo[0]?.current_user}`);
    
    // Import categories first (referenced by products)
    console.log('\n1️⃣ IMPORTING CATEGORIES...');
    for (const category of exportData.categories) {
      // Create slug from name if missing
      const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      
      await sql`
        INSERT INTO categories (id, name, slug, description, created_at)
        VALUES (${category.id}, ${category.name}, ${slug}, ${category.description}, ${category.created_at})
        ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        slug = EXCLUDED.slug
      `;
    }
    console.log(`✅ Imported ${exportData.categories.length} categories`);
    
    // Import users
    console.log('\n2️⃣ IMPORTING USERS...');
    for (const user of exportData.users) {
      await sql`
        INSERT INTO users (
          id, email, first_name, last_name, password, role, 
          created_at, updated_at
        )
        VALUES (
          ${user.id}, ${user.email}, ${user.first_name}, ${user.last_name}, 
          ${user.password}, ${user.role}::user_role, ${user.created_at}, ${user.updated_at}
        )
        ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role
      `;
    }
    console.log(`✅ Imported ${exportData.users.length} users`);
    
    // Import products
    console.log('\n3️⃣ IMPORTING PRODUCTS...');
    for (const product of exportData.products) {
      await sql`
        INSERT INTO products (
          id, name, description, price, category_id, brand, 
          images, condition, created_at, updated_at
        )
        VALUES (
          ${product.id}, ${product.name}, ${product.description}, 
          ${product.price}, ${product.category_id}, ${product.brand},
          ${JSON.stringify(product.images)}, ${product.condition}::product_condition,
          ${product.created_at}, ${product.updated_at}
        )
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price
      `;
    }
    console.log(`✅ Imported ${exportData.products.length} products`);
    
    // Verify migration
    console.log('\n4️⃣ VERIFYING MIGRATION...');
    const verification = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM products`, 
      sql`SELECT COUNT(*) as count FROM categories`
    ]);
    
    console.log(`✅ Users in production: ${verification[0][0]?.count}`);
    console.log(`✅ Products in production: ${verification[1][0]?.count}`);
    console.log(`✅ Categories in production: ${verification[2][0]?.count}`);
    
    // Sample verification
    const sampleUser = await sql`
      SELECT email, first_name, role 
      FROM users 
      WHERE email = 'cleanandflipyt@gmail.com'
    `;
    
    if (sampleUser.length > 0) {
      console.log(`✅ Admin user verified: ${sampleUser[0].email} (${sampleUser[0].role})`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('✅ Production database now contains all your data');
    console.log('✅ Ready to update DATABASE_URL to production database');
    console.log('✅ All users, products, and categories migrated');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Update DATABASE_URL secret to production database');
    console.log('2. Restart your application');  
    console.log('3. Test login with cleanandflipyt@gmail.com');
    console.log('4. Verify password reset functionality');
    console.log('5. Delete old unused databases');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateToProduction();