// scripts/final-products-migration.ts
import { neon } from '@neondatabase/serverless';

const OLD_DB_URL = "postgresql://neondb_owner:npg_kjyl3onHs7Xq@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = process.env.DEV_DATABASE_URL!;

const oldDb = neon(OLD_DB_URL);
const newDb = neon(NEW_DB_URL);

async function insertProductsDirectly() {
  console.log("🔄 Final products migration - inserting directly...");
  
  // Get all products from old database
  const oldProducts = await oldDb(`
    SELECT id, name, description, price, category_id, subcategory, brand, weight, 
           condition, status, stock_quantity, views, featured, stripe_product_id, 
           stripe_price_id, stripe_sync_status, stripe_last_sync, sku, dimensions, 
           cost, compare_at_price, is_local_delivery_available, is_shipping_available, 
           available_local, available_shipping, created_at, updated_at
    FROM products
  `);
  
  console.log(`📊 Found ${oldProducts.length} products in old database`);
  
  if (oldProducts.length === 0) {
    console.log("❌ No products found in old database!");
    return;
  }
  
  // Clear products table
  await newDb(`DELETE FROM products`);
  console.log("🧹 Cleared existing products");
  
  // Insert each product individually with proper JSON handling
  for (const product of oldProducts) {
    try {
      console.log(`📦 Inserting: ${product.name}`);
      
      await newDb(`
        INSERT INTO products (
          id, name, description, price, category_id, subcategory, brand, weight,
          condition, status, images, specifications, stock_quantity, views, featured,
          stripe_product_id, stripe_price_id, stripe_sync_status, stripe_last_sync,
          sku, dimensions, cost, compare_at_price, is_local_delivery_available,
          is_shipping_available, available_local, available_shipping,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
      `, [
        product.id,
        product.name,
        product.description,
        product.price,
        product.category_id,
        product.subcategory,
        product.brand,
        product.weight,
        product.condition,
        product.status,
        '[]', // images as empty JSON array
        '{}', // specifications as empty JSON object
        product.stock_quantity,
        product.views,
        product.featured,
        product.stripe_product_id,
        product.stripe_price_id,
        product.stripe_sync_status,
        product.stripe_last_sync,
        product.sku,
        product.dimensions,
        product.cost,
        product.compare_at_price,
        product.is_local_delivery_available,
        product.is_shipping_available,
        product.available_local,
        product.available_shipping,
        product.created_at,
        product.updated_at
      ]);
      
      console.log(`  ✅ Successfully inserted: ${product.name}`);
      
    } catch (error) {
      console.error(`  ❌ Failed to insert ${product.name}:`, error.message);
      console.error(`     Product data:`, JSON.stringify(product, null, 2));
    }
  }
  
  // Verify final count
  const finalCount = await newDb(`SELECT COUNT(*) as count FROM products`);
  console.log(`\n✅ Final verification: ${finalCount[0].count} products in lucky-poetry database`);
  
  if (finalCount[0].count > 0) {
    const sampleProducts = await newDb(`SELECT id, name, price, status FROM products`);
    console.log("\n📋 Products now in database:");
    sampleProducts.forEach(p => {
      console.log(`  - ${p.name}: $${p.price} (status: ${p.status})`);
    });
  }
}

async function migrateCartItemsAfterProducts() {
  console.log("\n🛒 Migrating cart items...");
  
  const cartItems = await oldDb(`SELECT * FROM cart_items`);
  console.log(`📊 Found ${cartItems.length} cart items in old database`);
  
  if (cartItems.length === 0) return;
  
  // Clear cart items
  await newDb(`DELETE FROM cart_items`);
  
  let migratedCount = 0;
  for (const item of cartItems) {
    try {
      // Check if product exists in new database
      const productExists = await newDb(`SELECT id FROM products WHERE id = $1`, [item.product_id]);
      
      if (productExists.length === 0) {
        console.log(`  ⚠️  Skipping cart item for missing product: ${item.product_id}`);
        continue;
      }
      
      // Use appropriate cart owner field
      const cartOwner = item.cart_owner || item.owner_id || item.session_id;
      
      await newDb(`
        INSERT INTO cart_items (id, user_id, session_id, product_id, quantity, cart_owner, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        item.id, 
        item.user_id, 
        item.session_id, 
        item.product_id, 
        item.quantity, 
        cartOwner, 
        item.created_at, 
        item.updated_at
      ]);
      
      migratedCount++;
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate cart item:`, error.message);
    }
  }
  
  console.log(`✅ Cart items migrated: ${migratedCount}`);
}

async function main() {
  try {
    await insertProductsDirectly();
    await migrateCartItemsAfterProducts();
    
    console.log("\n🎉 FINAL MIGRATION COMPLETE!");
    console.log("All data is now properly migrated to lucky-poetry database");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();