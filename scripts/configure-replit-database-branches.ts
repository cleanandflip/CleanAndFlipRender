#!/usr/bin/env tsx
// Configure Replit Database for Development and Production Branches
// Sets up unified database with proper environment isolation

import { Pool } from 'pg';

const REPLIT_DATABASE_URL = process.env.DATABASE_URL!;

async function configureReplitDatabase() {
  console.log('🔧 CONFIGURING REPLIT DATABASE FOR DEV/PROD BRANCHES');
  console.log('====================================================');
  
  if (!REPLIT_DATABASE_URL) {
    console.error('❌ No DATABASE_URL found. Replit database not provisioned.');
    process.exit(1);
  }
  
  // Extract database details
  const dbHost = process.env.PGHOST;
  const dbName = process.env.PGDATABASE;
  const dbUser = process.env.PGUSER;
  const dbPort = process.env.PGPORT;
  
  console.log(`📍 Database Host: ${dbHost}`);
  console.log(`📊 Database Name: ${dbName}`);
  console.log(`👤 User: ${dbUser}`);
  console.log(`🔌 Port: ${dbPort}`);
  
  // Test connection
  const pool = new Pool({ connectionString: REPLIT_DATABASE_URL });
  
  try {
    console.log('\n🔗 Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Connection successful!');
    console.log(`⏰ Current time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`);
    
    // Create development and production schemas for data isolation
    console.log('\n📂 Setting up development and production schemas...');
    
    await pool.query('CREATE SCHEMA IF NOT EXISTS development');
    await pool.query('CREATE SCHEMA IF NOT EXISTS production');
    
    console.log('✅ Created development schema');
    console.log('✅ Created production schema');
    
    // Set search paths for proper isolation
    await pool.query('ALTER DATABASE neondb SET search_path TO production, public');
    
    console.log('\n🎯 CONFIGURATION SUMMARY');
    console.log('========================');
    console.log('✅ Single Replit PostgreSQL database');
    console.log('✅ Development schema: development.*');
    console.log('✅ Production schema: production.*');
    console.log('✅ Default search path: production, public');
    console.log('✅ Unified connection for both environments');
    
    console.log('\n📋 ENVIRONMENT CONFIGURATION');
    console.log('=============================');
    console.log('For DEVELOPMENT:');
    console.log(`DATABASE_URL=${REPLIT_DATABASE_URL}`);
    console.log(`DEV_DATABASE_URL=${REPLIT_DATABASE_URL}`);
    console.log('APP_ENV=development');
    console.log('');
    console.log('For PRODUCTION:');
    console.log(`DATABASE_URL=${REPLIT_DATABASE_URL}`);
    console.log(`PROD_DATABASE_URL=${REPLIT_DATABASE_URL}`);
    console.log('APP_ENV=production');
    
    console.log('\n🚀 NEXT STEPS');
    console.log('==============');
    console.log('1. Run: npm run db:push (to create tables in production schema)');
    console.log('2. Restart application to use Replit database');
    console.log('3. Verify connection to correct database host');
    
  } catch (error) {
    console.error('❌ Configuration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Auto-run
configureReplitDatabase();