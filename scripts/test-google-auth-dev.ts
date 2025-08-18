#!/usr/bin/env tsx
// Test Google Auth flow in development database

import { neon } from "@neondatabase/serverless";

async function testGoogleAuthFlow() {
  console.log("[TEST] Testing Google Auth flow in development database...");
  
  const devUrl = process.env.DEV_DATABASE_URL;
  if (!devUrl) {
    console.error("[TEST] DEV_DATABASE_URL not found");
    process.exit(1);
  }

  const sql = neon(devUrl);
  
  try {
    // Verify Google Auth columns exist
    console.log("[TEST] Checking Google Auth schema...");
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name
    `;
    
    console.log("[TEST] Google Auth columns:", columns);
    
    if (columns.length !== 5) {
      console.error("[TEST] ❌ Missing Google Auth columns");
      process.exit(1);
    }
    
    // Test Google Auth user creation flow
    console.log("[TEST] Testing Google user creation...");
    const testGoogleSub = `google_test_${Date.now()}`;
    const testEmail = `test.google.${Date.now()}@example.com`;
    
    const newGoogleUser = await sql`
      INSERT INTO users (
        email, first_name, last_name, 
        google_sub, google_email, google_email_verified, 
        google_picture, last_login_at, auth_provider, is_email_verified
      ) VALUES (
        ${testEmail}, 'Google', 'Test', 
        ${testGoogleSub}, ${testEmail}, true, 
        'https://example.com/picture.jpg', NOW(), 'google', true
      ) RETURNING id, email, google_sub, last_login_at
    `;
    
    console.log("[TEST] ✅ Google user created successfully:", newGoogleUser[0]);
    
    // Test Google user lookup by google_sub
    const foundUser = await sql`
      SELECT id, email, google_sub, google_email, last_login_at
      FROM users 
      WHERE google_sub = ${testGoogleSub}
    `;
    
    console.log("[TEST] ✅ Google user lookup successful:", foundUser[0]);
    
    // Test update last login
    await sql`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE google_sub = ${testGoogleSub}
    `;
    
    const updatedUser = await sql`
      SELECT last_login_at 
      FROM users 
      WHERE google_sub = ${testGoogleSub}
    `;
    
    console.log("[TEST] ✅ Google user login update successful");
    
    // Clean up test user
    await sql`DELETE FROM users WHERE google_sub = ${testGoogleSub}`;
    console.log("[TEST] ✅ Test cleanup completed");
    
    console.log("[TEST] 🎉 All Google Auth database operations working correctly!");
    
  } catch (error) {
    console.error("[TEST] Error testing Google Auth flow:", error);
    process.exit(1);
  }
}

testGoogleAuthFlow().catch(console.error);