import { neon } from '@neondatabase/serverless';

async function createDevelopmentDB() {
  console.log('🏗️  CREATING DEVELOPMENT DATABASE');
  console.log('='.repeat(50));
  
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
  
  // Connect to production DB to create development DB
  const prodUrl = `${connString}neondb${queryParams}`;
  const prodSql = neon(prodUrl);
  
  try {
    console.log('\n🔨 Creating development database...');
    
    // Create the development database
    await prodSql`CREATE DATABASE development`;
    console.log('✅ Development database created');
    
    // Now connect to development and set up the schema
    const devUrl = `${connString}development${queryParams}`;
    const devSql = neon(devUrl);
    
    console.log('\n📋 Setting up development schema...');
    
    // Run the schema migrations - copy all tables from production
    const tableQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        images TEXT[],
        brand VARCHAR(100),
        condition VARCHAR(50),
        weight DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Password reset tokens table
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE,
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];
    
    // Execute each table creation
    for (const query of tableQueries) {
      await devSql([query]);
      console.log('  ✅ Table created');
    }
    
    // Copy some sample data from production
    console.log('\n👥 Copying sample users for testing...');
    const sampleUsers = await prodSql`
      SELECT * FROM users 
      WHERE email IN ('cleanandflipyt@gmail.com', 'test3@gmail.com') 
      LIMIT 2
    `;
    
    for (const user of sampleUsers) {
      await devSql`
        INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.password}, ${user.first_name}, ${user.last_name}, ${user.role}, ${user.created_at}, ${user.updated_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    
    const devUserCount = await devSql`SELECT COUNT(*) as count FROM users`;
    console.log(`  ✅ Copied ${devUserCount[0].count} test users`);
    
    // Copy a few sample categories and products
    console.log('\n📁 Copying sample categories...');
    const sampleCats = await prodSql`SELECT * FROM categories LIMIT 3`;
    for (const cat of sampleCats) {
      await devSql`
        INSERT INTO categories (id, name, description, image, created_at, updated_at)
        VALUES (${cat.id}, ${cat.name}, ${cat.description}, ${cat.image}, ${cat.created_at}, ${cat.updated_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    
    const devCatCount = await devSql`SELECT COUNT(*) as count FROM categories`;
    console.log(`  ✅ Copied ${devCatCount[0].count} categories`);
    
    console.log('\n🎯 DEVELOPMENT DATABASE READY!');
    console.log('You can now switch between databases using NODE_ENV');
    console.log('- NODE_ENV=production → neondb (production)');
    console.log('- NODE_ENV=development → development (testing)');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Development database already exists');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  }
  
  process.exit(0);
}

createDevelopmentDB();