#!/usr/bin/env tsx
// Test the complete Google Auth integration

import { neon } from "@neondatabase/serverless";

async function testGoogleAuthIntegration() {
  console.log("\n🧪 Testing Google Auth Integration...\n");
  
  const devUrl = process.env.DEV_DATABASE_URL;
  if (!devUrl) {
    console.error("❌ DEV_DATABASE_URL not found");
    process.exit(1);
  }

  const sql = neon(devUrl);
  
  try {
    // 1. Test Google Auth schema compatibility
    console.log("1️⃣ Testing Google Auth schema...");
    const schemaCheck = await sql`
      SELECT 
        'google_sub' as column_name, 
        CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_sub'
      UNION ALL
      SELECT 
        'google_email' as column_name,
        CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_email'
      UNION ALL
      SELECT 
        'google_email_verified' as column_name,
        CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_email_verified'
      UNION ALL
      SELECT 
        'google_picture' as column_name,
        CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_picture'
      UNION ALL
      SELECT 
        'last_login_at' as column_name,
        CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_login_at'
    `;
    
    console.log("   Schema check results:");
    schemaCheck.forEach(row => {
      const status = row.status === 'EXISTS' ? '✅' : '❌';
      console.log(`   ${status} ${row.column_name}: ${row.status}`);
    });
    
    const missingColumns = schemaCheck.filter(row => row.status === 'MISSING');
    if (missingColumns.length > 0) {
      console.error("❌ Google Auth schema incomplete");
      process.exit(1);
    }
    
    // 2. Test Google user creation flow 
    console.log("\n2️⃣ Testing Google user creation flow...");
    const testGoogleSub = `test_google_${Date.now()}`;
    const testEmail = `google.test.${Date.now()}@example.com`;
    
    const createResult = await sql`
      INSERT INTO users (
        email, first_name, last_name,
        google_sub, google_email, google_email_verified,
        google_picture, last_login_at, auth_provider, is_email_verified
      ) VALUES (
        ${testEmail}, 'Google', 'TestUser',
        ${testGoogleSub}, ${testEmail}, true,
        'https://example.com/avatar.jpg', NOW(), 'google', true
      ) RETURNING id, email, google_sub, auth_provider
    `;
    
    console.log("   ✅ Google user created:", createResult[0]);
    
    // 3. Test Google user lookup by google_sub
    console.log("\n3️⃣ Testing Google user lookup...");
    const lookupResult = await sql`
      SELECT id, email, google_sub, google_email, last_login_at, auth_provider
      FROM users 
      WHERE google_sub = ${testGoogleSub}
    `;
    
    if (lookupResult.length === 0) {
      console.error("❌ Google user lookup failed");
      process.exit(1);
    }
    
    console.log("   ✅ Google user lookup successful:", lookupResult[0]);
    
    // 4. Test linking existing email user to Google
    console.log("\n4️⃣ Testing email-to-Google account linking...");
    const existingEmail = `existing.${Date.now()}@example.com`;
    
    // Create regular email user first
    await sql`
      INSERT INTO users (email, first_name, last_name, auth_provider)
      VALUES (${existingEmail}, 'Existing', 'User', 'local')
    `;
    
    // Link to Google
    const linkResult = await sql`
      UPDATE users 
      SET google_sub = ${testGoogleSub + '_linked'},
          google_email = ${existingEmail},
          google_email_verified = true,
          google_picture = 'https://example.com/linked.jpg',
          last_login_at = NOW()
      WHERE email = ${existingEmail}
      RETURNING id, email, google_sub, auth_provider
    `;
    
    console.log("   ✅ Email-to-Google linking successful:", linkResult[0]);
    
    // 5. Test session compatibility  
    console.log("\n5️⃣ Testing session table...");
    const sessionCheck = await sql`
      SELECT COUNT(*) as count FROM sessions LIMIT 1
    `;
    console.log("   ✅ Sessions table accessible");
    
    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await sql`DELETE FROM users WHERE google_sub LIKE 'test_google_%'`;
    await sql`DELETE FROM users WHERE email LIKE 'existing.%@example.com'`;
    
    console.log("\n🎉 All Google Auth integration tests passed!");
    console.log("\n📋 Integration Summary:");
    console.log("   ✅ Google Auth schema complete and compatible");
    console.log("   ✅ Google user creation working");
    console.log("   ✅ Google user lookup by google_sub working");
    console.log("   ✅ Email-to-Google account linking working");
    console.log("   ✅ Session storage compatible");
    console.log("\n🚀 Ready for end-to-end Google authentication testing!");
    
  } catch (error) {
    console.error("❌ Google Auth integration test failed:", error);
    process.exit(1);
  }
}

testGoogleAuthIntegration().catch(console.error);