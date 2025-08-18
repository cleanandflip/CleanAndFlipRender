// scripts/fix-products-migration.ts
import { neon } from '@neondatabase/serverless';

const OLD_DB_URL = "postgresql://neondb_owner:npg_kjyl3onHs7Xq@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = process.env.DEV_DATABASE_URL!;

const oldDb = neon(OLD_DB_URL);
const newDb = neon(NEW_DB_URL);

async function checkSchemas() {
  console.log("🔍 Checking schema differences...");
  
  // Get old products schema
  const oldColumns = await oldDb(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    ORDER BY ordinal_position
  `);
  
  // Get new products schema  
  const newColumns = await newDb(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    ORDER BY ordinal_position
  `);
  
  console.log("\n📋 Old database columns:", oldColumns.map(c => c.column_name));
  console.log("📋 New database columns:", newColumns.map(c => c.column_name));
  
  return { oldColumns, newColumns };
}

async function migrateProductsWithSchemaMapping() {
  console.log("\n🔄 Migrating products with schema mapping...");
  
  // Get products from old database
  const oldProducts = await oldDb(`SELECT * FROM products`);
  console.log(`📊 Found ${oldProducts.length} products to migrate`);
  
  if (oldProducts.length === 0) return;
  
  // Clear existing products
  await newDb(`TRUNCATE TABLE products CASCADE`);
  
  // Map old schema to new schema
  for (const oldProduct of oldProducts) {
    console.log(`📦 Migrating product: ${oldProduct.name}`);
    
    // Map fields from old to new schema
    const mappedProduct = {
      id: oldProduct.id,
      name: oldProduct.name,
      description: oldProduct.description,
      price: oldProduct.price,
      // cost: oldProduct.cost, // This column might not exist in new schema
      inventory_count: oldProduct.inventory_count || 0,
      category_id: oldProduct.category_id,
      image_url: oldProduct.image_url,
      is_featured: oldProduct.is_featured || false,
      is_active: oldProduct.is_active !== false,
      slug: oldProduct.slug,
      brand: oldProduct.brand || null,
      condition_rating: oldProduct.condition_rating || null,
      dimensions: oldProduct.dimensions || null,
      weight_lbs: oldProduct.weight_lbs || null,
      stripe_product_id: oldProduct.stripe_product_id || null,
      stripe_price_id: oldProduct.stripe_price_id || null,
      stock_threshold_low: oldProduct.stock_threshold_low || 5,
      stock_threshold_critical: oldProduct.stock_threshold_critical || 1,
      // fulfillment_local_only: oldProduct.is_local_only || false, // Map old field to new
      fulfillment_shipping_only: false,
      fulfillment_local_delivery: true,
      created_at: oldProduct.created_at,
      updated_at: oldProduct.updated_at
    };
    
    try {
      // Insert with only the columns that exist in new schema
      await newDb(`
        INSERT INTO products (
          id, name, description, price, inventory_count, category_id, 
          image_url, is_featured, is_active, slug, brand, condition_rating,
          dimensions, weight_lbs, stripe_product_id, stripe_price_id,
          stock_threshold_low, stock_threshold_critical,
          fulfillment_local_only, fulfillment_shipping_only, fulfillment_local_delivery,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
      `, [
        mappedProduct.id, mappedProduct.name, mappedProduct.description, 
        mappedProduct.price, mappedProduct.inventory_count, mappedProduct.category_id,
        mappedProduct.image_url, mappedProduct.is_featured, mappedProduct.is_active,
        mappedProduct.slug, mappedProduct.brand, mappedProduct.condition_rating,
        mappedProduct.dimensions, mappedProduct.weight_lbs, mappedProduct.stripe_product_id,
        mappedProduct.stripe_price_id, mappedProduct.stock_threshold_low, 
        mappedProduct.stock_threshold_critical, oldProduct.is_local_only || false,
        false, true, mappedProduct.created_at, mappedProduct.updated_at
      ]);
      
      console.log(`  ✅ Migrated: ${oldProduct.name}`);
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate ${oldProduct.name}:`, error.message);
    }
  }
}

async function migrateCartItems() {
  console.log("\n🛒 Migrating cart items...");
  
  // Get cart items from old database
  const oldCartItems = await oldDb(`SELECT * FROM cart_items`);
  console.log(`📊 Found ${oldCartItems.length} cart items`);
  
  if (oldCartItems.length === 0) return;
  
  // Clear existing cart items
  await newDb(`TRUNCATE TABLE cart_items CASCADE`);
  
  let migratedCount = 0;
  for (const item of oldCartItems) {
    try {
      // Check if product exists in new database
      const productExists = await newDb(`SELECT id FROM products WHERE id = $1`, [item.product_id]);
      
      if (productExists.length === 0) {
        console.log(`  ⚠️  Skipping cart item for missing product: ${item.product_id}`);
        continue;
      }
      
      await newDb(`
        INSERT INTO cart_items (
          id, cart_owner, product_id, quantity, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        item.id, item.cart_owner, item.product_id, 
        item.quantity, item.created_at, item.updated_at
      ]);
      
      migratedCount++;
      
    } catch (error) {
      console.error(`  ❌ Failed to migrate cart item:`, error.message);
    }
  }
  
  console.log(`  ✅ Migrated ${migratedCount} cart items`);
}

async function main() {
  try {
    await checkSchemas();
    await migrateProductsWithSchemaMapping();
    await migrateCartItems();
    
    console.log("\n✅ Products and cart items migration completed!");
    
    // Verify migration
    const productCount = await newDb(`SELECT COUNT(*) as count FROM products`);
    const cartCount = await newDb(`SELECT COUNT(*) as count FROM cart_items`);
    
    console.log(`📊 Final counts:`);
    console.log(`  Products: ${productCount[0].count}`);
    console.log(`  Cart items: ${cartCount[0].count}`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();