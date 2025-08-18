#!/usr/bin/env tsx
// Google Auth database migration - add required columns for Google OAuth

import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../server/config/database";

async function applyGoogleAuthMigration() {
  const sql = neon(DATABASE_URL);
  
  console.log("[GOOGLE AUTH MIGRATION] Starting migration...");
  console.log("[GOOGLE AUTH MIGRATION] Database:", DATABASE_URL.split('@')[1]?.split('/')[0]);

  try {
    // Add Google auth columns to users table
    console.log("[GOOGLE AUTH MIGRATION] Adding Google auth columns to users table...");
    await sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_sub text UNIQUE,
        ADD COLUMN IF NOT EXISTS google_email text,
        ADD COLUMN IF NOT EXISTS google_email_verified boolean,
        ADD COLUMN IF NOT EXISTS google_picture text,
        ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
    `;

    // Add helpful indexes
    console.log("[GOOGLE AUTH MIGRATION] Adding indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`;
    await sql`CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);`;

    // Verify columns were added
    console.log("[GOOGLE AUTH MIGRATION] Verifying columns...");
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name;
    `;
    
    console.log("[GOOGLE AUTH MIGRATION] Added columns:", columns);
    console.log("[GOOGLE AUTH MIGRATION] ✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("[GOOGLE AUTH MIGRATION] ❌ Error:", error);
    throw error;
  }
}

// Run the migration
applyGoogleAuthMigration().then(() => {
  console.log("[GOOGLE AUTH MIGRATION] Done!");
  process.exit(0);
}).catch((error) => {
  console.error("[GOOGLE AUTH MIGRATION] Failed:", error);
  process.exit(1);
});