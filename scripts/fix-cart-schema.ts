#!/usr/bin/env tsx
// Fix cart_items table schema - add missing owner_id and other columns

import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../server/config/database";

async function fixCartSchema() {
  const sql = neon(DATABASE_URL);
  
  console.log("[CART SCHEMA FIX] Starting cart schema fix...");
  console.log("[CART SCHEMA FIX] Database:", DATABASE_URL.split('@')[1]?.split('/')[0]);

  try {
    // Add owner_id column to cart_items table
    console.log("[CART SCHEMA FIX] Adding owner_id column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'owner_id') THEN
              ALTER TABLE cart_items ADD COLUMN owner_id VARCHAR;
              RAISE NOTICE 'Added owner_id column to cart_items table';
          ELSE
              RAISE NOTICE 'owner_id column already exists';
          END IF;
      END $$;
    `;

    // Add variant_id column to cart_items table
    console.log("[CART SCHEMA FIX] Adding variant_id column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'variant_id') THEN
              ALTER TABLE cart_items ADD COLUMN variant_id VARCHAR;
              RAISE NOTICE 'Added variant_id column to cart_items table';
          ELSE
              RAISE NOTICE 'variant_id column already exists';
          END IF;
      END $$;
    `;

    // Add total_price column to cart_items table
    console.log("[CART SCHEMA FIX] Adding total_price column...");
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'total_price') THEN
              ALTER TABLE cart_items ADD COLUMN total_price DECIMAL(10,2);
              RAISE NOTICE 'Added total_price column to cart_items table';
          ELSE
              RAISE NOTICE 'total_price column already exists';
          END IF;
      END $$;
    `;

    // Verify cart_items columns
    console.log("[CART SCHEMA FIX] Verifying cart_items columns...");
    const cartColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cart_items'
      ORDER BY column_name;
    `;
    
    console.log("[CART SCHEMA FIX] Cart columns:", cartColumns);
    console.log("[CART SCHEMA FIX] ✅ Cart schema fix completed successfully!");
    
  } catch (error) {
    console.error("[CART SCHEMA FIX] ❌ Error:", error);
    throw error;
  }
}

// Run the migration
fixCartSchema().then(() => {
  console.log("[CART SCHEMA FIX] Done!");
  process.exit(0);
}).catch((error) => {
  console.error("[CART SCHEMA FIX] Failed:", error);
  process.exit(1);
});