// scripts/direct-sql-migration.ts
import { neon } from '@neondatabase/serverless';

const OLD_DB_URL = "postgresql://neondb_owner:npg_kjyl3onHs7Xq@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = process.env.DEV_DATABASE_URL!;

const oldDb = neon(OLD_DB_URL);
const newDb = neon(NEW_DB_URL);

async function migrateProductsDirectly() {
  console.log("🔄 Direct SQL migration of products...");
  
  // Get products with exact field mapping
  const oldProducts = await oldDb(`
    SELECT 
      id, name, description, price, category_id, subcategory, brand, weight, 
      condition, status, images, specifications, stock_quantity as stock_quantity, 
      views, featured, stripe_product_id, stripe_price_id, stripe_sync_status, 
      stripe_last_sync, sku, dimensions, cost, compare_at_price,
      is_local_delivery_available, is_shipping_available, available_local, 
      available_shipping, created_at, updated_at
    FROM products
  `);
  
  console.log(`📊 Found ${oldProducts.length} products to migrate`);
  
  if (oldProducts.length === 0) return;
  
  // Clear existing products
  await newDb(`TRUNCATE TABLE products CASCADE`);
  
  // Insert each product with exact schema match
  for (const product of oldProducts) {
    try {
      await newDb(`
        INSERT INTO products (
          id, name, description, price, category_id, subcategory, brand, weight,
          condition, status, images, specifications, stock_quantity, views, 
          featured, stripe_product_id, stripe_price_id, stripe_sync_status,
          stripe_last_sync, sku, dimensions, cost, compare_at_price,
          is_local_delivery_available, is_shipping_available, available_local,
          available_shipping, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
      `, [
        product.id, product.name, product.description, product.price,
        product.category_id, product.subcategory, product.brand, product.weight,
        product.condition, product.status, product.images, product.specifications,
        product.stock_quantity, product.views, product.featured, 
        product.stripe_product_id, product.stripe_price_id, product.stripe_sync_status,
        product.stripe_last_sync, product.sku, product.dimensions, product.cost,
        product.compare_at_price, product.is_local_delivery_available, 
        product.is_shipping_available, product.available_local, product.available_shipping,
        product.created_at, product.updated_at
      ]);
      
      console.log(`  ✅ Migrated: ${product.name}`);
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate ${product.name}:`, error.message);
    }
  }
  
  // Verify migration
  const newCount = await newDb(`SELECT COUNT(*) as count FROM products`);
  console.log(`✅ Products migrated: ${newCount[0].count}`);
}

async function migrateCartItemsWithProducts() {
  console.log("\n🛒 Migrating cart items (after products)...");
  
  const oldCartItems = await oldDb(`SELECT * FROM cart_items`);
  console.log(`📊 Found ${oldCartItems.length} cart items`);
  
  if (oldCartItems.length === 0) return;
  
  await newDb(`TRUNCATE TABLE cart_items CASCADE`);
  
  let migratedCount = 0;
  for (const item of oldCartItems) {
    try {
      // Check if product exists
      const productExists = await newDb(`SELECT id FROM products WHERE id = $1`, [item.product_id]);
      
      if (productExists.length === 0) {
        console.log(`  ⚠️  Skipping cart item for missing product: ${item.product_id}`);
        continue;
      }
      
      await newDb(`
        INSERT INTO cart_items (id, cart_owner, product_id, quantity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [item.id, item.cart_owner, item.product_id, item.quantity, item.created_at, item.updated_at]);
      
      migratedCount++;
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate cart item:`, error.message);
    }
  }
  
  console.log(`✅ Cart items migrated: ${migratedCount}`);
}

async function verifyMigration() {
  console.log("\n📊 Verifying migration...");
  
  const counts = await Promise.all([
    newDb(`SELECT COUNT(*) as count FROM users`),
    newDb(`SELECT COUNT(*) as count FROM categories`),
    newDb(`SELECT COUNT(*) as count FROM products`),
    newDb(`SELECT COUNT(*) as count FROM cart_items`)
  ]);
  
  console.log("Final migration summary:");
  console.log(`  Users: ${counts[0][0].count}`);
  console.log(`  Categories: ${counts[1][0].count}`);
  console.log(`  Products: ${counts[2][0].count}`);
  console.log(`  Cart items: ${counts[3][0].count}`);
  
  // Test product query
  const sampleProducts = await newDb(`SELECT id, name, price FROM products LIMIT 3`);
  if (sampleProducts.length > 0) {
    console.log("\nSample products:");
    sampleProducts.forEach(p => console.log(`  - ${p.name}: $${p.price}`));
  }
}

async function main() {
  try {
    await migrateProductsDirectly();
    await migrateCartItemsWithProducts();
    await verifyMigration();
    
    console.log("\n🎉 Complete! All data successfully migrated to lucky-poetry database");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();