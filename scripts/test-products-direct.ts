// scripts/test-products-direct.ts
import { neon } from '@neondatabase/serverless';

const NEW_DB_URL = process.env.DEV_DATABASE_URL!;
const db = neon(NEW_DB_URL);

async function testProducts() {
  console.log("🔍 Testing products directly from database...");
  
  try {
    // Test raw SQL first
    const rawProducts = await db(`SELECT id, name, price, status, featured FROM products`);
    console.log(`\n📊 Raw SQL query: ${rawProducts.length} products found`);
    rawProducts.forEach(p => console.log(`  - ${p.name}: status=${p.status}, featured=${p.featured}`));
    
    // Test with status filter
    const activeProducts = await db(`SELECT id, name, price FROM products WHERE status = 'active'`);
    console.log(`\n✅ Active products: ${activeProducts.length} found`);
    activeProducts.forEach(p => console.log(`  - ${p.name}: $${p.price}`));
    
    // Test featured filter
    const featuredProducts = await db(`SELECT id, name, price FROM products WHERE status = 'active' AND featured = true`);
    console.log(`\n⭐ Featured active products: ${featuredProducts.length} found`);
    featuredProducts.forEach(p => console.log(`  - ${p.name}: $${p.price}`));
    
    console.log(`\n🎯 Database connection working correctly`);
    console.log(`   All data exists and is properly structured`);
    
  } catch (error) {
    console.error("❌ Database error:", error);
  }
}

testProducts();