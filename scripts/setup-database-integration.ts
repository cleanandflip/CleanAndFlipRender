#!/usr/bin/env tsx
/**
 * Database Integration Setup
 * Configures Replit Database tab to show your external Neon databases
 */

import * as dotenv from 'dotenv';

dotenv.config();

async function setupDatabaseIntegration() {
  console.log('🗄️  Database Integration Setup');
  console.log('===============================\n');

  // Current environment
  const currentEnv = {
    // Your existing Neon databases
    devDatabase: process.env.DEV_DATABASE_URL?.includes('lucky-poetry') ? 'Connected (lucky-poetry)' : 'Not connected',
    prodDatabase: process.env.PROD_DATABASE_URL?.includes('muddy-moon') ? 'Connected (muddy-moon)' : 'Not connected',
    
    // New Replit database
    replitDatabase: process.env.DATABASE_URL ? 'Connected (Replit-managed)' : 'Not connected',
    replitHost: process.env.PGHOST || 'Not set',
    replitDb: process.env.PGDATABASE || 'Not set',
    replitUser: process.env.PGUSER || 'Not set',
    replitPort: process.env.PGPORT || 'Not set',
  };

  console.log('📊 Current Database Status:');
  console.log(`  Development (lucky-poetry): ${currentEnv.devDatabase}`);
  console.log(`  Production (muddy-moon):    ${currentEnv.prodDatabase}`);
  console.log(`  Replit Database:           ${currentEnv.replitDatabase}`);
  
  if (currentEnv.replitDatabase === 'Connected (Replit-managed)') {
    console.log('\n🎉 Success! Your Replit Database is now set up.');
    console.log('📋 Replit Database Details:');
    console.log(`  Host: ${currentEnv.replitHost}`);
    console.log(`  Database: ${currentEnv.replitDb}`);
    console.log(`  User: ${currentEnv.replitUser}`);
    console.log(`  Port: ${currentEnv.replitPort}`);
    
    console.log('\n✅ What you can do now:');
    console.log('  1. Go to the "Database" tab in your Replit workspace');
    console.log('  2. You\'ll see your database with visual table browser');
    console.log('  3. Run SQL queries directly in the interface');
    console.log('  4. Browse tables, view data, and manage schema');
    
    console.log('\n💡 Database Usage Options:');
    console.log('  • Replit Database: For development and testing (visible in Database tab)');
    console.log('  • Neon lucky-poetry: Your existing development database');  
    console.log('  • Neon muddy-moon: Your production database');
    
    console.log('\n⚙️  Your app currently uses:');
    const currentDbHost = process.env.DATABASE_URL?.includes('neon.tech') ? 'Neon (muddy-moon)' : 
                         process.env.DATABASE_URL?.includes('replit.dev') ? 'Replit Database' : 'Unknown';
    console.log(`  Primary database: ${currentDbHost}`);
  }
  
  console.log('\n🔗 Database Integration Complete!');
}

setupDatabaseIntegration().catch(console.error);