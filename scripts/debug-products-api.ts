// scripts/debug-products-api.ts
import { db } from '../server/config/database';
import { products } from '../shared/schema';

async function debugProducts() {
  console.log("🔍 Debugging products API issue...");
  
  // Check raw data
  const allProducts = await db.select().from(products);
  console.log("\n📋 All products in database:");
  allProducts.forEach(p => {
    console.log(`  - ${p.name}: status=${p.status}, featured=${p.featured}, stock=${p.stockQuantity}`);
  });
  
  // Check featured products specifically
  const featuredProducts = await db.select().from(products).where(({ status, featured }) => 
    status === 'active' && featured === true
  );
  console.log(`\n⭐ Featured products query result: ${featuredProducts.length}`);
  featuredProducts.forEach(p => {
    console.log(`  - ${p.name}: $${p.price}`);
  });
  
  // Test the actual storage function
  const { DatabaseStorage } = await import('../server/storage');
  const storage = new DatabaseStorage();
  
  try {
    const storageResult = await storage.getProducts();
    console.log(`\n📦 Storage.getProducts() result: ${storageResult.products.length} products, total: ${storageResult.total}`);
    
    const featuredResult = await storage.getFeaturedProducts();
    console.log(`⭐ Storage.getFeaturedProducts() result: ${featuredResult.length} products`);
    
  } catch (error) {
    console.error("❌ Storage error:", error.message);
  }
}

debugProducts().catch(console.error);