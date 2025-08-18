#!/usr/bin/env tsx
// Setup Proper Database Branch Separation
// Creates schema-based separation for development and production

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL!;

async function setupDatabaseBranches() {
  console.log('🌳 SETTING UP DATABASE BRANCH SEPARATION');
  console.log('=========================================');
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Create schemas for proper separation
    console.log('📂 Creating database schemas...');
    await pool.query('CREATE SCHEMA IF NOT EXISTS development');
    await pool.query('CREATE SCHEMA IF NOT EXISTS production');
    
    console.log('✅ Development schema ready');
    console.log('✅ Production schema ready');
    
    // Set up search paths for each environment
    console.log('\n🎯 Configuring search paths...');
    
    // Default to production schema in search path
    await pool.query('ALTER DATABASE neondb SET search_path TO production, public');
    
    console.log('✅ Production schema set as default');
    
    // Check current tables in public schema
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Current tables in public schema: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    // Create development and production copies
    console.log('\n🔄 Setting up environment-specific tables...');
    
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      
      // Skip system tables
      if (tableName.startsWith('drizzle') || tableName === 'sessions') {
        continue;
      }
      
      try {
        // Create development copy
        await pool.query(`
          CREATE TABLE IF NOT EXISTS development.${tableName} 
          (LIKE public.${tableName} INCLUDING ALL)
        `);
        
        // Create production copy  
        await pool.query(`
          CREATE TABLE IF NOT EXISTS production.${tableName} 
          (LIKE public.${tableName} INCLUDING ALL)
        `);
        
        console.log(`   ✅ ${tableName} -> development & production schemas`);
      } catch (error) {
        console.log(`   ⚠️  ${tableName} -> Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 BRANCH SEPARATION COMPLETE');
    console.log('==============================');
    console.log('✅ Development schema: development.*');
    console.log('✅ Production schema: production.*');
    console.log('✅ Public schema: shared tables (sessions, etc.)');
    
    console.log('\n📝 ENVIRONMENT USAGE');
    console.log('=====================');
    console.log('Development Environment:');
    console.log('  - Tables: development.products, development.users, etc.');
    console.log('  - Search path: development, public');
    console.log('');
    console.log('Production Environment:');
    console.log('  - Tables: production.products, production.users, etc.');
    console.log('  - Search path: production, public');
    
    console.log('\n🚀 NEXT STEPS');
    console.log('==============');
    console.log('1. Update database connection to use environment-specific schemas');
    console.log('2. Configure APP_ENV to switch between schemas');
    console.log('3. Test both environments work independently');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Auto-run
setupDatabaseBranches();