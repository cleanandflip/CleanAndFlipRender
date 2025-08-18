#!/usr/bin/env tsx
// Test Google Auth configuration and database setup

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "../server/config/google";
import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../server/config/database";

async function testGoogleAuthSetup() {
  console.log("[GOOGLE AUTH TEST] Testing configuration...");
  
  // Test Google OAuth config
  console.log("[GOOGLE AUTH TEST] Configuration:");
  console.log("- Google Client ID:", GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 10)}...` : "MISSING");
  console.log("- Google Client Secret:", GOOGLE_CLIENT_SECRET ? `${GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : "MISSING");
  console.log("- Redirect URI:", GOOGLE_REDIRECT_URI);
  
  // Test database columns
  const sql = neon(DATABASE_URL);
  try {
    console.log("[GOOGLE AUTH TEST] Testing database schema...");
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name;
    `;
    
    console.log("[GOOGLE AUTH TEST] Google Auth columns in database:", columns);
    
    if (columns.length === 5) {
      console.log("[GOOGLE AUTH TEST] ✅ All Google Auth columns present");
    } else {
      console.log("[GOOGLE AUTH TEST] ❌ Missing Google Auth columns");
    }
    
  } catch (error) {
    console.error("[GOOGLE AUTH TEST] Database error:", error);
  }
  
  // Test auth routes endpoint
  try {
    console.log("[GOOGLE AUTH TEST] Testing auth start endpoint...");
    const response = await fetch("http://localhost:5000/auth/google/start", {
      method: "GET",
      redirect: "manual" // Don't follow redirects
    });
    
    if (response.status === 302) {
      const location = response.headers.get('location');
      if (location?.includes('accounts.google.com')) {
        console.log("[GOOGLE AUTH TEST] ✅ Auth start endpoint working - redirects to Google");
      } else {
        console.log("[GOOGLE AUTH TEST] ❌ Auth start endpoint not redirecting to Google");
      }
    } else {
      console.log("[GOOGLE AUTH TEST] ❌ Auth start endpoint returned:", response.status);
    }
  } catch (error) {
    console.log("[GOOGLE AUTH TEST] ❌ Cannot test auth endpoint (server may not be running)");
  }
  
  console.log("[GOOGLE AUTH TEST] Test completed!");
}

testGoogleAuthSetup().catch(console.error);