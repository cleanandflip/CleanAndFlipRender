#!/usr/bin/env tsx
// Apply Google Auth schema specifically to development database

import { neon } from "@neondatabase/serverless";
import fs from "fs";

async function applyGoogleSchemaToDevDb() {
  console.log("[DEV SCHEMA] Applying Google Auth schema to development database...");
  
  const devDatabaseUrl = process.env.DEV_DATABASE_URL;
  
  if (!devDatabaseUrl) {
    console.error("[DEV SCHEMA] DEV_DATABASE_URL not found");
    process.exit(1);
  }

  console.log("[DEV SCHEMA] Connecting to development database...");
  const sql = neon(devDatabaseUrl);
  
  try {
    // Verify we're connected to the right database
    const dbInfo = await sql`
      SELECT 
        current_database() as db_name,
        current_setting('server_version') as version
    `;
    console.log("[DEV SCHEMA] Connected to:", dbInfo[0]);
    
    // Check existing columns
    console.log("[DEV SCHEMA] Checking existing Google Auth columns...");
    const existingColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name
    `;
    
    console.log("[DEV SCHEMA] Existing Google Auth columns:", existingColumns.map(c => c.column_name));
    
    // Apply the schema migration
    console.log("[DEV SCHEMA] Applying Google Auth schema migration...");
    
    const googleAuthSql = `
    -- Add Google Auth columns to users table
    DO $$
    BEGIN
        -- Add google_sub column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_sub') THEN
            ALTER TABLE users ADD COLUMN google_sub TEXT UNIQUE;
            RAISE NOTICE 'Added google_sub column';
        END IF;

        -- Add google_email column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_email') THEN
            ALTER TABLE users ADD COLUMN google_email VARCHAR;
            RAISE NOTICE 'Added google_email column';
        END IF;

        -- Add google_email_verified column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_email_verified') THEN
            ALTER TABLE users ADD COLUMN google_email_verified BOOLEAN;
            RAISE NOTICE 'Added google_email_verified column';
        END IF;

        -- Add google_picture column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_picture') THEN
            ALTER TABLE users ADD COLUMN google_picture TEXT;
            RAISE NOTICE 'Added google_picture column';
        END IF;

        -- Add last_login_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
            ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added last_login_at column';
        END IF;

        RAISE NOTICE 'Google Auth schema migration completed successfully';
    END $$;
    `;
    
    await sql(googleAuthSql);
    
    // Verify all columns are now present
    console.log("[DEV SCHEMA] Verifying Google Auth columns after migration...");
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name
    `;
    
    console.log("[DEV SCHEMA] Final Google Auth columns:", finalColumns);
    
    if (finalColumns.length === 5) {
      console.log("[DEV SCHEMA] ✅ SUCCESS: All 5 Google Auth columns are now present in development database");
    } else {
      console.log("[DEV SCHEMA] ❌ ERROR: Missing Google Auth columns after migration");
    }
    
    // Test the schema with a quick insert/delete
    console.log("[DEV SCHEMA] Testing Google Auth schema with test operations...");
    const testEmail = `test_dev_${Date.now()}@example.com`;
    const testSub = `google_test_${Date.now()}`;
    
    const testResult = await sql`
      INSERT INTO users (email, first_name, last_name, google_sub, google_email, google_email_verified, google_picture, last_login_at)
      VALUES (${testEmail}, 'Test', 'User', ${testSub}, ${testEmail}, true, 'https://example.com/test.jpg', NOW())
      RETURNING id, email, google_sub, last_login_at
    `;
    
    console.log("[DEV SCHEMA] Test insert successful:", testResult[0]);
    
    // Clean up test data
    await sql`DELETE FROM users WHERE email = ${testEmail}`;
    console.log("[DEV SCHEMA] Test data cleaned up");
    
    console.log("[DEV SCHEMA] 🎉 Google Auth schema successfully applied to development database!");
    
  } catch (error) {
    console.error("[DEV SCHEMA] Error applying Google Auth schema:", error);
    process.exit(1);
  }
}

applyGoogleSchemaToDevDb().catch(console.error);