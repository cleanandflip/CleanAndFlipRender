#!/usr/bin/env tsx
// Verify Google Auth schema in current database

import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../server/config/database";

async function verifyGoogleAuthSchema() {
  console.log("[VERIFY] Checking Google Auth schema in current database...");
  
  try {
    const sql = neon(DATABASE_URL);
    
    // Check current database info
    const dbInfo = await sql`
      SELECT 
        current_database() as database_name,
        current_setting('server_version') as postgres_version,
        split_part(current_setting('listen_addresses'), ':', 1) as host
    `;
    
    console.log("[VERIFY] Database Info:", {
      name: dbInfo[0].database_name,
      version: dbInfo[0].postgres_version,
      host: dbInfo[0].host
    });
    
    // Check Google Auth columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name
    `;
    
    console.log("[VERIFY] Google Auth columns found:", columns.length);
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    if (columns.length === 5) {
      console.log("[VERIFY] ✅ All Google Auth columns present and verified");
    } else {
      console.log("[VERIFY] ❌ Missing Google Auth columns - migration needed");
    }
    
    // Test basic Google Auth functionality
    const testEmail = "test@example.com";
    const testSub = "test_google_sub_" + Date.now();
    
    console.log("[VERIFY] Testing Google Auth insert/update operations...");
    
    // Test insert with Google Auth fields
    const insertResult = await sql`
      INSERT INTO users (email, first_name, last_name, google_sub, google_email, google_email_verified, google_picture, last_login_at)
      VALUES (${testEmail}, 'Test', 'User', ${testSub}, ${testEmail}, true, 'https://example.com/pic.jpg', NOW())
      ON CONFLICT (email) DO UPDATE SET 
        google_sub = EXCLUDED.google_sub,
        last_login_at = EXCLUDED.last_login_at
      RETURNING id, email, google_sub
    `;
    
    console.log("[VERIFY] ✅ Google Auth insert/update test successful:", insertResult[0]);
    
    // Clean up test user
    await sql`DELETE FROM users WHERE email = ${testEmail}`;
    console.log("[VERIFY] ✅ Test cleanup completed");
    
  } catch (error) {
    console.error("[VERIFY] Error:", error);
    process.exit(1);
  }
}

verifyGoogleAuthSchema().catch(console.error);