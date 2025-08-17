import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getDatabaseConfig } from "../config/database";

export async function applyMigrations() {
  const dbConfig = getDatabaseConfig();
  const sql = neon(dbConfig.url);
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