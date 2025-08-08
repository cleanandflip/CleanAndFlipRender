// System Health Check Script
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';

async function healthCheck() {
  console.log('🏥 STARTING SYSTEM HEALTH CHECK...\n');
  
  const results = {
    database: false,
    products: false,
    categories: false,
    auth: false,
    passwordReset: false,
    users: false
  };

  // Test database connection
  try {
    await db.execute(sql`SELECT 1`);
    results.database = true;
    console.log('✅ Database connection: OK');
  } catch (e) {
    console.error('❌ Database connection failed:', e.message);
  }

  // Test products table
  try {
    const productCount = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
    const sampleProduct = await db.execute(sql`SELECT id, name, price FROM products LIMIT 1`);
    results.products = true;
    console.log(`✅ Products table: OK (${productCount.rows?.[0]?.count || 0} products)`);
  } catch (e) {
    console.error('❌ Products query failed:', e.message);
  }

  // Test categories table
  try {
    const categoryCount = await db.execute(sql`SELECT COUNT(*) as count FROM categories`);
    const sampleCategory = await db.execute(sql`SELECT id, name FROM categories LIMIT 1`);
    results.categories = true;
    console.log(`✅ Categories table: OK (${categoryCount.rows?.[0]?.count || 0} categories)`);
  } catch (e) {
    console.error('❌ Categories query failed:', e.message);
  }

  // Test users table
  try {
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    results.users = true;
    console.log(`✅ Users table: OK (${userCount.rows?.[0]?.count || 0} users)`);
  } catch (e) {
    console.error('❌ Users table check failed:', e.message);
  }

  // Test password reset tokens table
  try {
    const resetCount = await db.execute(sql`SELECT COUNT(*) as count FROM password_reset_tokens`);
    results.passwordReset = true;
    console.log(`✅ Password reset tokens: OK (${resetCount.rows?.[0]?.count || 0} tokens)`);
  } catch (e) {
    console.error('❌ Password reset tokens check failed:', e.message);
  }

  // Test auth functionality
  try {
    // Check if we can query both users and password reset tokens
    await db.execute(sql`SELECT id FROM users LIMIT 1`);
    await db.execute(sql`SELECT id FROM password_reset_tokens LIMIT 1`);
    results.auth = true;
    console.log('✅ Auth tables: OK');
  } catch (e) {
    console.error('❌ Auth tables check failed:', e.message);
  }

  console.log('\n📊 HEALTH CHECK RESULTS:');
  console.log('================================');
  Object.entries(results).forEach(([key, status]) => {
    console.log(`${status ? '✅' : '❌'} ${key}: ${status ? 'HEALTHY' : 'FAILED'}`);
  });
  
  const overallHealth = Object.values(results).every(Boolean);
  console.log(`\n🎯 OVERALL SYSTEM: ${overallHealth ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);
  
  return results;
}

// Run the health check
healthCheck().then((results) => {
  const healthy = Object.values(results).every(Boolean);
  process.exit(healthy ? 0 : 1);
}).catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});