#!/usr/bin/env tsx
// Manual schema fix to add missing columns to development database
// This will ensure both development and production have the same schema

import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../server/config/database";

async function addMissingColumns() {
  const sql = neon(DATABASE_URL);
  
  console.log("[MANUAL MIGRATION] Starting schema fix...");
  console.log("[MANUAL MIGRATION] Database:", DATABASE_URL.split('@')[1]?.split('/')[0]);

  try {
    // Add cost column
    console.log("[MANUAL MIGRATION] Adding cost column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'cost') THEN
              ALTER TABLE products ADD COLUMN cost DECIMAL(10,2);
              RAISE NOTICE 'Added cost column to products table';
          ELSE
              RAISE NOTICE 'Cost column already exists';
          END IF;
      END $$;
    `;

    // Add compare_at_price column
    console.log("[MANUAL MIGRATION] Adding compare_at_price column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'compare_at_price') THEN
              ALTER TABLE products ADD COLUMN compare_at_price DECIMAL(10,2);
              RAISE NOTICE 'Added compare_at_price column to products table';
          ELSE
              RAISE NOTICE 'Compare_at_price column already exists';
          END IF;
      END $$;
    `;

    // Add sku column
    console.log("[MANUAL MIGRATION] Adding sku column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'sku') THEN
              ALTER TABLE products ADD COLUMN sku VARCHAR;
              RAISE NOTICE 'Added sku column to products table';
          ELSE
              RAISE NOTICE 'SKU column already exists';
          END IF;
      END $$;
    `;

    // Add dimensions column
    console.log("[MANUAL MIGRATION] Adding dimensions column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'dimensions') THEN
              ALTER TABLE products ADD COLUMN dimensions JSONB;
              RAISE NOTICE 'Added dimensions column to products table';
          ELSE
              RAISE NOTICE 'Dimensions column already exists';
          END IF;
      END $$;
    `;

    // Add is_local_delivery_available column
    console.log("[MANUAL MIGRATION] Adding is_local_delivery_available column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_local_delivery_available') THEN
              ALTER TABLE products ADD COLUMN is_local_delivery_available BOOLEAN DEFAULT true;
              RAISE NOTICE 'Added is_local_delivery_available column to products table';
          ELSE
              RAISE NOTICE 'is_local_delivery_available column already exists';
          END IF;
      END $$;
    `;

    // Add is_shipping_available column
    console.log("[MANUAL MIGRATION] Adding is_shipping_available column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_shipping_available') THEN
              ALTER TABLE products ADD COLUMN is_shipping_available BOOLEAN DEFAULT true;
              RAISE NOTICE 'Added is_shipping_available column to products table';
          ELSE
              RAISE NOTICE 'is_shipping_available column already exists';
          END IF;
      END $$;
    `;

    // Add available_local column (legacy compatibility)
    console.log("[MANUAL MIGRATION] Adding available_local column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'available_local') THEN
              ALTER TABLE products ADD COLUMN available_local BOOLEAN DEFAULT true;
              RAISE NOTICE 'Added available_local column to products table';
          ELSE
              RAISE NOTICE 'available_local column already exists';
          END IF;
      END $$;
    `;

    // Add available_shipping column (legacy compatibility)
    console.log("[MANUAL MIGRATION] Adding available_shipping column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'available_shipping') THEN
              ALTER TABLE products ADD COLUMN available_shipping BOOLEAN DEFAULT true;
              RAISE NOTICE 'Added available_shipping column to products table';
          ELSE
              RAISE NOTICE 'available_shipping column already exists';
          END IF;
      END $$;
    `;

    // Verify all columns were added
    console.log("[MANUAL MIGRATION] Verifying columns...");
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name IN ('cost', 'compare_at_price', 'sku', 'dimensions', 'is_local_delivery_available', 'is_shipping_available', 'available_local', 'available_shipping')
      ORDER BY column_name;
    `;
    
    console.log("[MANUAL MIGRATION] Added columns:", columns);
    console.log("[MANUAL MIGRATION] ✅ Schema fix completed successfully!");
    
  } catch (error) {
    console.error("[MANUAL MIGRATION] ❌ Error:", error);
    throw error;
  }
}

// Run the migration
addMissingColumns().then(() => {
  console.log("[MANUAL MIGRATION] Done!");
  process.exit(0);
}).catch((error) => {
  console.error("[MANUAL MIGRATION] Failed:", error);
  process.exit(1);
});