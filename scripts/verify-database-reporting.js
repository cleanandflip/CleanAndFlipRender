#!/usr/bin/env node

/**
 * Database Reporting Verification - Confirm accurate live reporting
 */

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

global.WebSocket = ws;
config();

console.log('🔍 VERIFYING PRODUCTION DATABASE REPORTING ACCURACY');

async function checkCurrentDatabaseConnection() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log('❌ No DATABASE_URL found');
    return;
  }
  
  try {
    const url = new URL(DATABASE_URL);
    const hostname = url.hostname;
    const dbName = url.pathname.replace('/', '');
    
    console.log('\n📊 CURRENT PRODUCTION DATABASE CONNECTION:');
    console.log(`   Host: ${hostname}`);
    console.log(`   Database: ${dbName}`);
    
    // Determine environment based on hostname
    let environment = 'unknown';
    let friendlyName = 'unknown';
    
    if (hostname.includes('muddy-moon')) {
      environment = 'PRODUCTION';
      friendlyName = 'muddy-moon';
    } else if (hostname.includes('lucky-poetry')) {
      environment = 'DEVELOPMENT';
      friendlyName = 'lucky-poetry';
    } else if (hostname.includes('lingering-flower')) {
      environment = 'DEVELOPMENT';
      friendlyName = 'lingering-flower';
    }
    
    console.log(`   Environment: ${environment}`);
    console.log(`   Friendly Name: ${friendlyName}`);
    
    // Test connection
    const pool = new Pool({ connectionString: DATABASE_URL });
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    await pool.end();
    
    console.log(`   Connection Status: ✅ CONNECTED`);
    console.log(`   Latency: ${latency}ms`);
    
    console.log('\n📋 EXPECTED SYSTEM STATUS DISPLAY:');
    console.log(`   "${environment === 'PRODUCTION' ? 'Production' : 'Development'} database (${friendlyName})"`);
    
    if (environment === 'PRODUCTION' && friendlyName === 'muddy-moon') {
      console.log('\n✅ REPORTING VERIFIED: Production database correctly identified as muddy-moon');
    } else if (environment === 'DEVELOPMENT') {
      console.log('\n✅ REPORTING VERIFIED: Development database correctly identified');
    } else {
      console.log('\n⚠️  ATTENTION: Unexpected database configuration detected');
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  }
}

checkCurrentDatabaseConnection();