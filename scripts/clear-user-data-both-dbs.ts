#!/usr/bin/env tsx
// Clear user data from both databases except admin@cleanandflip.com in development

import { neon } from "@neondatabase/serverless";

async function clearUserDataBothDbs() {
  console.log("[CLEAR] Starting user data cleanup in both databases...");
  
  const devUrl = process.env.DEV_DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;
  
  if (!devUrl || !prodUrl) {
    console.error("[CLEAR] Missing database URLs");
    process.exit(1);
  }

  // Clear development database (preserve admin@cleanandflip.com)
  console.log("[CLEAR] Clearing development database (lucky-poetry)...");
  const devSql = neon(devUrl);
  
  try {
    const devDbInfo = await devSql`SELECT current_database() as name`;
    console.log("[CLEAR] Dev DB:", devDbInfo[0].name);
    
    // Get current user count
    const devUsersBefore = await devSql`SELECT COUNT(*) as count FROM users`;
    console.log("[CLEAR] Dev users before:", devUsersBefore[0].count);
    
    // Clear related data first (preserve referential integrity)
    await devSql`DELETE FROM cart_items WHERE user_id IS NOT NULL AND user_id IN (SELECT id FROM users WHERE email != 'admin@cleanandflip.com')`;
    await devSql`DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@cleanandflip.com')`;
    await devSql`DELETE FROM equipment_submissions WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@cleanandflip.com')`;
    
    // Clear users except admin@cleanandflip.com
    const devDeleteResult = await devSql`DELETE FROM users WHERE email != 'admin@cleanandflip.com' RETURNING email`;
    console.log("[CLEAR] Dev users deleted:", devDeleteResult.length);
    
    const devUsersAfter = await devSql`SELECT COUNT(*) as count FROM users`;
    console.log("[CLEAR] Dev users remaining:", devUsersAfter[0].count);
    
    // Clear sessions
    await devSql`DELETE FROM sessions`;
    console.log("[CLEAR] Dev sessions cleared");
    
  } catch (error) {
    console.error("[CLEAR] Error clearing development database:", error);
  }

  // Clear production database (clear all users)
  console.log("[CLEAR] Clearing production database (muddy-moon)...");
  const prodSql = neon(prodUrl);
  
  try {
    const prodDbInfo = await prodSql`SELECT current_database() as name`;
    console.log("[CLEAR] Prod DB:", prodDbInfo[0].name);
    
    // Get current user count
    const prodUsersBefore = await prodSql`SELECT COUNT(*) as count FROM users`;
    console.log("[CLEAR] Prod users before:", prodUsersBefore[0].count);
    
    // Clear related data first
    await prodSql`DELETE FROM cart_items WHERE user_id IS NOT NULL`;
    await prodSql`DELETE FROM orders`;
    await prodSql`DELETE FROM equipment_submissions`;
    
    // Clear all users
    const prodDeleteResult = await prodSql`DELETE FROM users RETURNING email`;
    console.log("[CLEAR] Prod users deleted:", prodDeleteResult.length);
    
    const prodUsersAfter = await prodSql`SELECT COUNT(*) as count FROM users`;
    console.log("[CLEAR] Prod users remaining:", prodUsersAfter[0].count);
    
    // Clear sessions
    await prodSql`DELETE FROM sessions`;
    console.log("[CLEAR] Prod sessions cleared");
    
  } catch (error) {
    console.error("[CLEAR] Error clearing production database:", error);
  }

  console.log("[CLEAR] ✅ User data cleanup completed in both databases");
}

clearUserDataBothDbs().catch(console.error);