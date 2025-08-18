// scripts/debug-schema.ts
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function debugSchema() {
  console.log("🔍 Debugging schema and table structure...");
  
  try {
    // Check what tables exist
    const tablesResult = await db.execute(sql`
      SELECT schemaname, tablename, tableowner 
      FROM pg_tables 
      WHERE tablename LIKE '%product%' 
      ORDER BY schemaname, tablename
    `);
    
    console.log("📋 Tables matching 'product':");
    console.log(tablesResult);
    
    // Check if products table exists in public schema
    const publicTablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log("\n📋 All public schema tables:");
    console.log(publicTablesResult);
    
    // Try direct count
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
    console.log("\n🔢 Direct count query:");
    console.log(countResult);
    
  } catch (error) {
    console.error("❌ Schema debug failed:", error);
  }
}

debugSchema();