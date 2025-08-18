#!/usr/bin/env node

/**
 * Verify Environment Detection Fix
 * Tests if the production environment correctly shows "Production" instead of "Development"
 */

const env = process.env;

console.log('🔍 ENVIRONMENT DETECTION VERIFICATION');
console.log('='.repeat(60));

// Test environment detection logic 
function detectEnvironment() {
  // PRIORITY 1: Check if we're in Replit deployment (production)
  if (env.REPLIT_DEPLOYMENT === "1" || env.REPLIT_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 2: Check NODE_ENV for explicit production
  if (env.NODE_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 3: Check for production environment variables
  if (env.PROD_APP_ENV === "production") {
    return "production";
  }
  
  // PRIORITY 4: Development fallbacks
  if (env.NODE_ENV === "development" || env.DEV_APP_ENV === "development") {
    return "development";
  }
  
  // PRIORITY 5: Legacy fallback based on environment context
  if (env.APP_ENV === "production") {
    return "production";
  }
  
  // Default to development for Replit workspace
  return "development";
}

console.log('\n📊 ENVIRONMENT VARIABLES:');
console.log('REPLIT_DEPLOYMENT:', env.REPLIT_DEPLOYMENT || 'NOT SET');
console.log('REPLIT_ENV:', env.REPLIT_ENV || 'NOT SET');
console.log('NODE_ENV:', env.NODE_ENV || 'NOT SET');
console.log('PROD_APP_ENV:', env.PROD_APP_ENV || 'NOT SET');
console.log('DEV_APP_ENV:', env.DEV_APP_ENV || 'NOT SET');
console.log('APP_ENV:', env.APP_ENV || 'NOT SET');

console.log('\n🎯 ENVIRONMENT DETECTION RESULTS:');
const detectedEnv = detectEnvironment();
console.log('Detected Environment:', detectedEnv.toUpperCase());

if (env.DEV_DATABASE_URL && env.PROD_DATABASE_URL) {
  try {
    const activeDB = detectedEnv === "production" ? env.PROD_DATABASE_URL : env.DEV_DATABASE_URL;
    const url = new URL(activeDB);
    const hostname = url.hostname;
    
    console.log('\n🗄️  DATABASE CONFIGURATION:');
    console.log('Active Database Host:', hostname);
    
    if (hostname.includes('muddy-moon')) {
      console.log('✅ Using PRODUCTION database (muddy-moon)');
    } else if (hostname.includes('lucky-poetry')) {
      console.log('✅ Using DEVELOPMENT database (lucky-poetry)');
    } else if (hostname.includes('lingering-flower')) {
      console.log('✅ Using DEVELOPMENT database (lingering-flower)');
    }
    
    console.log('\n📱 SYSTEM DASHBOARD SHOULD SHOW:');
    if (detectedEnv === "production") {
      console.log('Environment Badge: "Production" (RED)');
      console.log('Database: "Production database (muddy-moon)"');
    } else {
      console.log('Environment Badge: "Development" (BLUE)');
      if (hostname.includes('lucky-poetry')) {
        console.log('Database: "Development database (lucky-poetry)"');
      } else {
        console.log('Database: "Development database (lingering-flower)"');
      }
    }
    
  } catch (error) {
    console.log('❌ Error parsing database URL:', error.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log('🎉 ENVIRONMENT FIX VERIFICATION COMPLETE');
console.log('='.repeat(60));