#!/usr/bin/env tsx
// Replit Database Setup Script
// Configures unified Replit database for both development and production

import { Pool } from 'pg';
import * as fs from 'fs';

const REPLIT_DATABASE_URL = process.env.DATABASE_URL!;

async function setupReplitDatabase() {
  console.log('🚀 REPLIT DATABASE SETUP');
  console.log('========================');
  
  if (!REPLIT_DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Please provision a Replit database first.');
    process.exit(1);
  }
  
  console.log('✅ Replit Database URL detected');
  console.log(`📍 Host: ${process.env.PGHOST}`);
  console.log(`📊 Database: ${process.env.PGDATABASE}`);
  console.log(`👤 User: ${process.env.PGUSER}`);
  console.log(`🔌 Port: ${process.env.PGPORT}`);
  
  // Test connection
  const pool = new Pool({ connectionString: REPLIT_DATABASE_URL });
  
  try {
    console.log('\n🔗 Testing database connection...');
    await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Connection successful!');
    
    // Check existing tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log(`\n📋 Existing tables (${existingTables.length}):`, existingTables);
    
    if (existingTables.length === 0) {
      console.log('\n📦 Database is empty - ready for schema migration');
      console.log('Run: npm run db:push');
    } else {
      console.log('\n✅ Database already contains data');
    }
    
    // Update environment configuration
    const envConfig = `
# ===================================================
# REPLIT DATABASE CONFIGURATION (UNIFIED)
# ===================================================
# Single Replit database for both dev and production
# Eliminates external Neon dependencies

DATABASE_URL="${REPLIT_DATABASE_URL}"
DEV_DATABASE_URL="${REPLIT_DATABASE_URL}"
PROD_DATABASE_URL="${REPLIT_DATABASE_URL}"

# Replit database connection details
PGHOST="${process.env.PGHOST}"
PGDATABASE="${process.env.PGDATABASE}"
PGUSER="${process.env.PGUSER}"
PGPASSWORD="${process.env.PGPASSWORD}"
PGPORT="${process.env.PGPORT}"

# Environment markers
APP_ENV=development
DEV_APP_ENV=development
PROD_APP_ENV=production

# Session security
SESSION_SECRET=your-super-secret-session-key-change-in-production
`;

    fs.writeFileSync('.env.replit', envConfig.trim());
    console.log('\n📝 Created .env.replit with unified database configuration');
    
    console.log('\n🎯 SETUP COMPLETE!');
    console.log('==================');
    console.log('✅ Replit database provisioned and ready');
    console.log('✅ Unified configuration for dev/prod');
    console.log('✅ No external database dependencies');
    console.log('\n📋 Next steps:');
    console.log('1. Copy .env.replit to .env');
    console.log('2. Run: npm run db:push');
    console.log('3. Restart your application');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Auto-run
setupReplitDatabase();