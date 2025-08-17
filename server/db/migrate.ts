/**
 * Runtime Migration System - Step F from user instructions
 * Ensures migrations run at server boot to prevent schema drift
 */

import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
// Using console.log for migration logging to avoid circular dependencies

export async function runMigrations() {
  try {
    console.log("[MIGRATIONS] Applying database migrations...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Apply all pending migrations
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    console.log("[MIGRATIONS] ✅ All migrations applied successfully");
    
    // Log migration state for debugging
    try {
      const migrationStatus = await db.execute(sql`
        SELECT hash, created_at 
        FROM "drizzle__migrations" 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log("[MIGRATIONS] Recent migrations:");
      migrationStatus.rows.forEach((row: any) => {
        const hash = row.hash || 'unknown';
        console.log(`  - ${hash.slice(0, 8)}: ${row.created_at}`);
      });
    } catch (statusError) {
      // Migration table might not exist yet - that's ok
      console.log("[MIGRATIONS] Migration tracking table not yet available");
    }
    
  } catch (error: any) {
    console.error("[MIGRATIONS] Failed to apply migrations:", error.message);
    console.error("[MIGRATIONS] Stack:", error.stack);
    
    // Fail fast if schema is wrong - prevents app from starting with incompatible DB
    console.error("[MIGRATIONS] ❌ Migration failure - server cannot start safely");
    process.exit(1);
  }
}

export async function validateSchema() {
  try {
    console.log("[SCHEMA] Validating required database columns...");
    
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    
    // Check for critical columns that the application requires
    const requiredColumns = [
      { table: 'users', column: 'profile_address_id' },
      // REMOVED: onboarding_completed_at column no longer exists
      { table: 'addresses', column: 'street1' },
      { table: 'addresses', column: 'street2' }
    ];
    
    for (const { table, column } of requiredColumns) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = ${table} AND column_name = ${column}
        )
      `);
      
      const exists = (result.rows[0] as any).exists;
      if (!exists) {
        throw new Error(`Required column ${table}.${column} is missing from database`);
      }
      
      console.log(`[SCHEMA] ✅ ${table}.${column}: verified`);
    }
    
    console.log("[SCHEMA] ✅ All required columns present");
    
  } catch (error: any) {
    console.error("[SCHEMA] Validation failed:", error.message);
    console.error("[SCHEMA] ❌ Schema validation failure - check database migrations");
    process.exit(1);
  }
}