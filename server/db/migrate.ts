import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../config/database";
import { APP_ENV } from "../config/env";

export async function applyMigrations() {
  const sql = neon(DATABASE_URL);
  console.log("[MIGRATIONS] Applying…");
  
  // Apply SQL files directly since we don't use Drizzle Kit migrations
  try {
    console.log("[MIGRATIONS] Dropping retired columns...");
    await sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_completed_at"`;
    await sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_address_id"`;
    
    console.log("[MIGRATIONS] Setting up cart integrity...");
    // Cart FK with cascade (idempotent)
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_items_product') THEN
          ALTER TABLE "cart_items"
          ADD CONSTRAINT "fk_cart_items_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id")
          ON DELETE CASCADE NOT VALID;
          ALTER TABLE "cart_items" VALIDATE CONSTRAINT "fk_cart_items_product";
        END IF;
      END$$;
    `;
    
    // Cart unique constraint (idempotent)
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cart_owner_product"
      ON "cart_items"(COALESCE(user_id::text, session_id), product_id, COALESCE(variant_id,''));
    `;

    // Fix production schema drift - add missing columns
    console.log("[MIGRATIONS] Fixing schema drift...");
    await fixProductionSchemaDrift(sql);
    
  } catch (error: any) {
    // Ignore safe errors
    if (error.message?.includes('already exists') || error.message?.includes('does not exist')) {
      console.log("[MIGRATIONS] Skipping existing objects...");
    } else {
      throw error;
    }
  }
  
  console.log("[MIGRATIONS] Done.");
}

// Fix production schema drift - add missing columns that exist in development
async function fixProductionSchemaDrift(sql: any) {
  try {
    console.log("[MIGRATIONS] Checking and adding missing columns...");

    // Check and add cost column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'cost') THEN
              ALTER TABLE products ADD COLUMN cost DECIMAL(10,2);
              RAISE NOTICE '[MIGRATION] Added cost column to products table';
          END IF;
      END $$;
    `;

    // Check and add compare_at_price column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'compare_at_price') THEN
              ALTER TABLE products ADD COLUMN compare_at_price DECIMAL(10,2);
              RAISE NOTICE '[MIGRATION] Added compare_at_price column to products table';
          END IF;
      END $$;
    `;

    // Check and add sku column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'sku') THEN
              ALTER TABLE products ADD COLUMN sku VARCHAR;
              RAISE NOTICE '[MIGRATION] Added sku column to products table';
          END IF;
      END $$;
    `;

    // Check and add dimensions column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'dimensions') THEN
              ALTER TABLE products ADD COLUMN dimensions JSONB;
              RAISE NOTICE '[MIGRATION] Added dimensions column to products table';
          END IF;
      END $$;
    `;

    // Check and add is_local_delivery_available column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_local_delivery_available') THEN
              ALTER TABLE products ADD COLUMN is_local_delivery_available BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added is_local_delivery_available column to products table';
          END IF;
      END $$;
    `;

    // Check and add is_shipping_available column
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_shipping_available') THEN
              ALTER TABLE products ADD COLUMN is_shipping_available BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added is_shipping_available column to products table';
          END IF;
      END $$;
    `;

    // Check and add available_local column (legacy compatibility)
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'available_local') THEN
              ALTER TABLE products ADD COLUMN available_local BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added available_local column to products table';
          END IF;
      END $$;
    `;

    // Check and add available_shipping column (legacy compatibility)
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'available_shipping') THEN
              ALTER TABLE products ADD COLUMN available_shipping BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added available_shipping column to products table';
          END IF;
      END $$;
    `;

    // Fix cart_items table schema
    console.log("[MIGRATIONS] Fixing cart_items schema...");
    await fixCartItemsSchema(sql);

    console.log("[MIGRATIONS] Schema drift fixes applied successfully");
  } catch (error: any) {
    console.log("[MIGRATIONS] Schema drift fix error (safe to ignore if columns already exist):", error?.message);
  }
}

// Fix cart_items table schema - add missing columns
async function fixCartItemsSchema(sql: any) {
  try {
    // Add owner_id column to cart_items table
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'owner_id') THEN
              ALTER TABLE cart_items ADD COLUMN owner_id VARCHAR;
              RAISE NOTICE '[MIGRATION] Added owner_id column to cart_items table';
          END IF;
      END $$;
    `;

    // Add variant_id column to cart_items table
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'variant_id') THEN
              ALTER TABLE cart_items ADD COLUMN variant_id VARCHAR;
              RAISE NOTICE '[MIGRATION] Added variant_id column to cart_items table';
          END IF;
      END $$;
    `;

    // Add total_price column to cart_items table
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'total_price') THEN
              ALTER TABLE cart_items ADD COLUMN total_price DECIMAL(10,2);
              RAISE NOTICE '[MIGRATION] Added total_price column to cart_items table';
          END IF;
      END $$;
    `;

    console.log("[MIGRATIONS] Cart schema fixes applied successfully");
  } catch (error: any) {
    console.log("[MIGRATIONS] Cart schema fix error (safe to ignore if columns already exist):", error?.message);
  }
}