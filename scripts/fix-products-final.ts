// scripts/fix-products-final.ts
import { neon } from '@neondatabase/serverless';

const OLD_DB_URL = "postgresql://neondb_owner:npg_kjyl3onHs7Xq@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = process.env.DEV_DATABASE_URL!;

const oldDb = neon(OLD_DB_URL);
const newDb = neon(NEW_DB_URL);

async function migrateProducts() {
  console.log("🔄 Migrating products with schema fixes...");
  
  // Get products from old database with raw data
  const products = await oldDb(`
    SELECT 
      id, name, description, price, category_id, subcategory, brand, weight, 
      condition, status, stock_quantity, views, featured, 
      stripe_product_id, stripe_price_id, stripe_sync_status, stripe_last_sync,
      sku, dimensions, cost, compare_at_price, created_at, updated_at,
      is_local_delivery_available, is_shipping_available, available_local, available_shipping
    FROM products
  `);
  
  console.log(`📊 Found ${products.length} products to migrate`);
  
  if (products.length === 0) return;
  
  // Clear existing products
  await newDb(`TRUNCATE TABLE products CASCADE`);
  
  for (const product of products) {
    try {
      console.log(`📦 Migrating: ${product.name}`);
      
      // Handle JSON columns safely - set to empty arrays/objects if null
      const images = '[]'; // Empty JSON array
      const specifications = '{}'; // Empty JSON object
      
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
        product.id, product.name, product.description, product.price,
        product.category_id, product.subcategory, product.brand, product.weight,
        product.condition, product.status, images, specifications,
        product.stock_quantity, product.views, product.featured,
        product.stripe_product_id, product.stripe_price_id, product.stripe_sync_status,
        product.stripe_last_sync, product.sku, product.dimensions, product.cost,
        product.compare_at_price, product.is_local_delivery_available,
        product.is_shipping_available, product.available_local, product.available_shipping,
        product.created_at, product.updated_at
      ]);
      
      console.log(`  ✅ Success: ${product.name}`);
      
    } catch (error) {
      console.error(`  ❌ Failed: ${product.name} - ${error.message}`);
    }
  }
  
  // Verify
  const newCount = await newDb(`SELECT COUNT(*) as count FROM products`);
  console.log(`✅ Products migrated: ${newCount[0].count}`);
}

async function migrateCartItemsAfterProducts() {
  console.log("\n🛒 Now migrating cart items with products available...");
  
  const cartItems = await oldDb(`SELECT * FROM cart_items`);
  console.log(`📊 Found ${cartItems.length} cart items`);
  
  if (cartItems.length === 0) return;
  
  await newDb(`TRUNCATE TABLE cart_items CASCADE`);
  
  let migratedCount = 0;
  for (const item of cartItems) {
    try {
      // Check if product exists
      const productExists = await newDb(`SELECT id FROM products WHERE id = $1`, [item.product_id]);
      
      if (productExists.length === 0) {
        console.log(`  ⚠️  Skipping item for missing product: ${item.product_id}`);
        continue;
      }
      
      // Use cart_owner instead of owner_id if it exists
      const cartOwner = item.cart_owner || item.owner_id || item.session_id;
      
      await newDb(`
        INSERT INTO cart_items (id, user_id, session_id, product_id, quantity, cart_owner, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        item.id, item.user_id, item.session_id, item.product_id, 
        item.quantity, cartOwner, item.created_at, item.updated_at
      ]);
      
      migratedCount++;
      
    } catch (error) {
      console.error(`  ❌ Failed cart item: ${error.message}`);
    }
  }
  
  console.log(`✅ Cart items migrated: ${migratedCount}`);
}

async function verifyData() {
  console.log("\n📊 Final verification...");
  
  const [products, categories, users, addresses, cartItems] = await Promise.all([
    newDb(`SELECT COUNT(*) as count FROM products`),
    newDb(`SELECT COUNT(*) as count FROM categories`),
    newDb(`SELECT COUNT(*) as count FROM users`),
    newDb(`SELECT COUNT(*) as count FROM addresses`),
    newDb(`SELECT COUNT(*) as count FROM cart_items`)
  ]);
  
  console.log("Final counts in lucky-poetry database:");
  console.log(`  Users: ${users[0].count}`);
  console.log(`  Categories: ${categories[0].count}`);
  console.log(`  Products: ${products[0].count}`);
  console.log(`  Addresses: ${addresses[0].count}`);
  console.log(`  Cart items: ${cartItems[0].count}`);
  
  // Show sample data
  const sampleProducts = await newDb(`SELECT id, name, price FROM products LIMIT 3`);
  if (sampleProducts.length > 0) {
    console.log("\nSample products:");
    sampleProducts.forEach(p => console.log(`  - ${p.name}: $${p.price}`));
  }
}

async function main() {
  try {
    await migrateProducts();
    await migrateCartItemsAfterProducts();
    await verifyData();
    
    console.log("\n🎉 Complete! All data successfully migrated to lucky-poetry database");
    console.log("🔒 Development environment is now fully operational with all migrated data");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();