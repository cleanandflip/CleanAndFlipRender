#!/usr/bin/env node

/**
 * Check Current Database Configuration - Development vs Production
 */

const env = process.env;

console.log('🔍 CURRENT DATABASE CONFIGURATION VERIFICATION');
console.log('='.repeat(60));

console.log('\n📊 ENVIRONMENT VARIABLES:');
console.log('APP_ENV:', env.APP_ENV || 'NOT SET');
console.log('NODE_ENV:', env.NODE_ENV || 'NOT SET');
console.log('DEV_APP_ENV:', env.DEV_APP_ENV ? 'SET' : 'NOT SET');
console.log('PROD_APP_ENV:', env.PROD_APP_ENV ? 'SET' : 'NOT SET');

console.log('\n🗄️  DATABASE URLS:');
console.log('DEV_DATABASE_URL:', env.DEV_DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PROD_DATABASE_URL:', env.PROD_DATABASE_URL ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', env.DATABASE_URL ? 'SET' : 'NOT SET');

if (env.DATABASE_URL) {
  try {
    const url = new URL(env.DATABASE_URL);
    const hostname = url.hostname;
    
    console.log('\n🔗 CURRENT ACTIVE DATABASE:');
    console.log('Host:', hostname);
    
    let environment = 'UNKNOWN';
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
    
    console.log('Environment:', environment);
    console.log('Friendly Name:', friendlyName);
    
    console.log('\n📱 SYSTEM STATUS SHOULD DISPLAY:');
    console.log(`"${environment === 'PRODUCTION' ? 'Production' : 'Development'} database (${friendlyName})"`);
    
  } catch (error) {
    console.log('\n❌ Error parsing DATABASE_URL:', error.message);
  }
}

console.log('\n' + '='.repeat(60));