// scripts/test-direct-connection.ts
import { DATABASE_URL } from '../server/config/env';
import { neon } from '@neondatabase/serverless';

async function testConnection() {
  console.log("🔍 Testing direct database connection...");
  console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/password=[^&\s]+/g, 'password=***')}`);
  
  const sql = neon(DATABASE_URL);
  
  try {
    const result = await sql`SELECT id, name, price, status, featured FROM products`;
    console.log(`✅ Direct query successful: ${result.length} products found`);
    result.forEach(p => {
      console.log(`  - ${p.name}: $${p.price} (status: ${p.status}, featured: ${p.featured})`);
    });
  } catch (error) {
    console.error("❌ Direct query failed:", error);
  }
}

testConnection();