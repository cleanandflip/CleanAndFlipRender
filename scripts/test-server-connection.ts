// scripts/test-server-connection.ts
import { db } from '../server/db';
import { products } from '../shared/schema';

async function testServerConnection() {
  console.log("🔍 Testing server database connection...");
  
  try {
    const result = await db.select().from(products);
    console.log(`✅ Server query successful: ${result.length} products found`);
    result.forEach(p => {
      console.log(`  - ${p.name}: $${p.price} (status: ${p.status}, featured: ${p.featured})`);
    });
  } catch (error) {
    console.error("❌ Server query failed:", error);
  }
}

testServerConnection();