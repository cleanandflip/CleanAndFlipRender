// scripts/force-data-migration.ts
import { db } from '../server/db';
import { products } from '../shared/schema';

async function forceMigration() {
  console.log("🔄 Force migrating products to server database...");
  
  try {
    // Insert the products directly using Drizzle with all required fields
    const result1 = await db.insert(products).values({
      id: '9e434f75-3fc4-4514-97c4-f943538adeb3',
      name: 'Barbell',
      description: 'High-quality barbell for weightlifting',
      price: 90.00,
      status: 'active',
      featured: true,
      stockQuantity: 1,
      categoryId: null,
      brand: 'Generic',
      imageUrls: [],
      condition: 'new',  // Required field
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
    
    const result2 = await db.insert(products).values({
      id: 'b5781273-48ab-4f11-a9a5-fd00dd20cc00',
      name: 'Adjustable Dumbbells',
      description: 'Adjustable dumbbells for home gym',
      price: 199.99,
      status: 'active',
      featured: true,
      stockQuantity: 2,
      categoryId: null,
      brand: 'Generic',
      imageUrls: [],
      condition: 'new',  // Required field
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
    
    console.log("✅ Products inserted successfully");
    
    // Verify insertion
    const allProducts = await db.select().from(products);
    console.log(`🎯 Verification: ${allProducts.length} products now in database`);
    allProducts.forEach(p => {
      console.log(`  - ${p.name}: $${p.price} (status: ${p.status}, featured: ${p.featured})`);
    });
    
  } catch (error) {
    console.error("❌ Force migration failed:", error);
  }
}

forceMigration();