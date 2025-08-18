// scripts/test-api-direct.ts
import { DatabaseStorage } from '../server/storage';

async function testStorageDirectly() {
  console.log("🔍 Testing storage methods directly...");
  
  const storage = new DatabaseStorage();
  
  try {
    console.log("📊 Testing getFeaturedProducts...");
    const featured = await storage.getFeaturedProducts(10);
    console.log(`✅ Featured products: ${featured.length}`);
    featured.forEach(p => console.log(`  - ${p.name}: $${p.price} (status: ${p.status}, featured: ${p.featured})`));
    
    console.log("\n📊 Testing getProducts...");
    const products = await storage.getProducts();
    console.log(`✅ All products: ${products.products.length}, total: ${products.total}`);
    products.products.forEach(p => console.log(`  - ${p.name}: $${p.price} (status: ${p.status})`));
    
    console.log("\n🎯 Storage methods are working correctly!");
    
  } catch (error) {
    console.error("❌ Storage error:", error);
  }
}

testStorageDirectly();