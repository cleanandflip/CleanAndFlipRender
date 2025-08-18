#!/usr/bin/env tsx
// Sync Google Auth schema to both development and production databases

import { neon } from "@neondatabase/serverless";
import fs from "fs";

async function syncBothDatabases() {
  console.log("[DATABASE SYNC] Starting Google Auth schema sync for both environments...");
  
  const devDatabaseUrl = process.env.DEV_DATABASE_URL;
  const prodDatabaseUrl = process.env.PROD_DATABASE_URL;
  
  if (!devDatabaseUrl || !prodDatabaseUrl) {
    console.error("[DATABASE SYNC] Missing database URLs");
    console.log("DEV_DATABASE_URL:", devDatabaseUrl ? "✅ Set" : "❌ Missing");
    console.log("PROD_DATABASE_URL:", prodDatabaseUrl ? "✅ Set" : "❌ Missing");
    process.exit(1);
  }

  // Read the migration SQL
  const migrationSQL = fs.readFileSync('./scripts/ensure-google-auth-schema.sql', 'utf8');

  // Sync development database (lucky-poetry)
  try {
    console.log("[DATABASE SYNC] Syncing development database (lucky-poetry)...");
    const devSql = neon(devDatabaseUrl);
    
    // Check current database
    const devDbInfo = await devSql`SELECT current_database() as db_name`;
    console.log("[DATABASE SYNC] Development DB:", devDbInfo[0].db_name);
    
    // Apply migration
    await devSql(migrationSQL);
    
    // Verify columns
    const devColumns = await devSql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name
    `;
    console.log("[DATABASE SYNC] Development Google Auth columns:", devColumns.map(c => c.column_name));
    
  } catch (error) {
    console.error("[DATABASE SYNC] Development database sync failed:", error);
  }

  // Sync production database (muddy-moon)
  try {
    console.log("[DATABASE SYNC] Syncing production database (muddy-moon)...");
    const prodSql = neon(prodDatabaseUrl);
    
    // Check current database
    const prodDbInfo = await prodSql`SELECT current_database() as db_name`;
    console.log("[DATABASE SYNC] Production DB:", prodDbInfo[0].db_name);
    
    // Apply migration
    await prodSql(migrationSQL);
    
    // Verify columns
    const prodColumns = await prodSql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('google_sub', 'google_email', 'google_email_verified', 'google_picture', 'last_login_at')
      ORDER BY column_name
    `;
    console.log("[DATABASE SYNC] Production Google Auth columns:", prodColumns.map(c => c.column_name));
    
  } catch (error) {
    console.error("[DATABASE SYNC] Production database sync failed:", error);
  }

  console.log("[DATABASE SYNC] Database synchronization completed!");
}

syncBothDatabases().catch(console.error);