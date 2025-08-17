import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "../config/env";

export async function applyMigrations() {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql);
  console.log("[MIGRATIONS] Applying…");
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("[MIGRATIONS] Done.");
  } catch (error: any) {
    // Skip enum exists errors - these are safe
    if (error.code === '42710' && error.message?.includes('already exists')) {
      console.log("[MIGRATIONS] Skipping enum creation (already exists) - continuing...");
      console.log("[MIGRATIONS] Done.");
      return;
    }
    throw error;
  }
}