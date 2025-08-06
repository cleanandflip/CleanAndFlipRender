import { db } from '../db.js';
import { products, categories } from '../../shared/schema.js';
import { StripeProductSync } from '../services/stripe-sync.js';
import { eq } from 'drizzle-orm';
import { Logger } from '../config/logger';

const testProducts = [
  {
    name: "Olympic Barbell - 45lb Chrome",
    description: "Professional grade Olympic barbell, 45 pounds, chrome finish with aggressive knurling. Perfect for powerlifting and Olympic weightlifting.",
    price: "299.99",
    brand: "Rogue Fitness",
    condition: "like_new" as const,
    stockQuantity: 3,
    categoryName: "Barbells",
    images: [
      "https://res.cloudinary.com/demo/image/upload/v1/samples/barbell-chrome.jpg"
    ],
    sku: "BAR-001",
    weight: 45, // pounds
    dimensions: { length: 220, width: 5, height: 5 } // cm
  },
  {
    name: "Adjustable Dumbbell Set - 5-50lb",
    description: "PowerBlock adjustable dumbbells with stand. Space-saving design replaces 10 pairs of dumbbells. Excellent condition.",
    price: "449.99",
    brand: "PowerBlock",
    condition: "good" as const,
    stockQuantity: 2,
    categoryName: "Dumbbells",
    images: [
      "https://res.cloudinary.com/demo/image/upload/v1/samples/powerblock-dumbbells.jpg"
    ],
    sku: "DB-001",
    weight: 100, // pounds (50 lbs each)
    dimensions: { length: 30, width: 20, height: 20 }
  },
  {
    name: "Power Rack with Pull-up Bar",
    description: "Heavy-duty power rack with integrated pull-up bar, J-hooks, and safety bars. 1000lb capacity. Minor cosmetic wear.",
    price: "899.99",
    brand: "Rep Fitness",
    condition: "good" as const,
    stockQuantity: 1,
    categoryName: "Racks & Cages",
    images: [
      "https://res.cloudinary.com/demo/image/upload/v1/samples/power-rack.jpg"
    ],
    sku: "RACK-001",
    weight: 250, // pounds
    dimensions: { length: 122, width: 122, height: 213 }
  },
  {
    name: "Competition Kettlebell Set - 16kg",
    description: "Competition style steel kettlebell, 16kg (35lb). Uniform size regardless of weight. Perfect for kettlebell sport.",
    price: "129.99",
    brand: "Kettlebell Kings",
    condition: "like_new" as const,
    stockQuantity: 4,
    categoryName: "Kettlebells",
    images: [
      "https://res.cloudinary.com/demo/image/upload/v1/samples/kettlebell-competition.jpg"
    ],
    sku: "KB-001",
    weight: 35, // pounds (16kg)
    dimensions: { length: 30, width: 30, height: 30 }
  },
  {
    name: "Professional Bench Press - Adjustable",
    description: "Heavy-duty adjustable bench with 7 back positions and 4 seat positions. 1000lb capacity. Commercial grade construction.",
    price: "649.99",
    brand: "REP Fitness",
    condition: "new" as const,
    stockQuantity: 2,
    categoryName: "Benches",
    images: [
      "https://res.cloudinary.com/demo/image/upload/v1/samples/adjustable-bench.jpg"
    ],
    sku: "BENCH-001",
    weight: 85, // pounds
    dimensions: { length: 150, width: 60, height: 120 }
  }
];

async function createTestProducts() {
  try {
    console.info('Creating test products with Stripe sync...');
    
    // Get or create categories
    const categoryMap = new Map();
    
    for (const testProduct of testProducts) {
      let category = categoryMap.get(testProduct.categoryName);
      
      if (!category) {
        // Check if category exists
        const existingCategory = await db
          .select()
          .from(categories)
          .where(eq(categories.name, testProduct.categoryName))
          .limit(1);
        
        if (existingCategory.length > 0) {
          category = existingCategory[0];
        } else {
          // Create new category
          const [newCategory] = await db
            .insert(categories)
            .values({
              name: testProduct.categoryName,
              slug: testProduct.categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
              description: `Premium ${testProduct.categoryName.toLowerCase()} equipment`,
              isActive: true
            })
            .returning();
          category = newCategory;
        }
        
        categoryMap.set(testProduct.categoryName, category);
      }
      
      // Create product
      const [newProduct] = await db
        .insert(products)
        .values({
          name: testProduct.name,
          description: testProduct.description,
          price: testProduct.price,
          categoryId: category.id,
          brand: testProduct.brand,
          condition: testProduct.condition,
          stockQuantity: testProduct.stockQuantity,
          images: testProduct.images,
          sku: testProduct.sku,
          weight: testProduct.weight,
          dimensions: testProduct.dimensions,
          status: 'active'
        })
        .returning();
      
      console.info(`Created product: ${newProduct.name} (ID: ${newProduct.id})`);
      
      // Sync to Stripe
      try {
        await StripeProductSync.syncProduct(newProduct.id);
        console.info(`✅ Successfully synced ${newProduct.name} to Stripe`);
      } catch (error) {
        console.error(`❌ Failed to sync ${newProduct.name} to Stripe:`, error);
      }
      
      // Add delay between products
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.info('\n🎉 All test products created and synced to Stripe!');
    console.info('You can now view them in your Stripe dashboard and on the website.');
    
  } catch (error) {
    console.error('Failed to create test products:', error);
  }
}

// Export for use in other scripts
export { createTestProducts, testProducts };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestProducts();
}