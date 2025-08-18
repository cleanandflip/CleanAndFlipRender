#!/usr/bin/env tsx
// Test environment isolation and database configuration

import { DATABASE_URL, APP_ENV, DB_HOST } from "../server/config/env";

function testEnvironmentIsolation() {
  console.log("[ENV TEST] Environment Isolation Test");
  console.log("=".repeat(50));
  
  console.log("[ENV TEST] Current Configuration:");
  console.log("- APP_ENV:", APP_ENV);
  console.log("- DB_HOST:", DB_HOST);
  console.log("- Database Type:", DATABASE_URL.includes('lucky-poetry') ? 'DEVELOPMENT (lucky-poetry)' : 
                                   DATABASE_URL.includes('muddy-moon') ? 'PRODUCTION (muddy-moon)' : 'UNKNOWN');
  
  console.log("");
  console.log("[ENV TEST] Environment Variables Available:");
  console.log("- PROD_APP_ENV:", process.env.PROD_APP_ENV || 'not set');
  console.log("- DEV_APP_ENV:", process.env.DEV_APP_ENV || 'not set');
  console.log("- PROD_DATABASE_URL:", process.env.PROD_DATABASE_URL ? 'set' : 'not set');
  console.log("- DEV_DATABASE_URL:", process.env.DEV_DATABASE_URL ? 'set' : 'not set');
  
  console.log("");
  console.log("[ENV TEST] Database URLs Configuration Check:");
  if (process.env.PROD_DATABASE_URL) {
    const prodHost = process.env.PROD_DATABASE_URL.match(/host=([^&\s]+)/)?.[1] || 'unknown';
    console.log("- Production DB Host:", prodHost);
    console.log("- Production Type:", prodHost.includes('muddy-moon') ? '✅ CORRECT (muddy-moon)' : '❌ WRONG');
  }
  
  if (process.env.DEV_DATABASE_URL) {
    const devHost = process.env.DEV_DATABASE_URL.match(/host=([^&\s]+)/)?.[1] || 'unknown';
    console.log("- Development DB Host:", devHost);
    console.log("- Development Type:", devHost.includes('lucky-poetry') ? '✅ CORRECT (lucky-poetry)' : '❌ WRONG');
  } else {
    console.log("- Development DB: ❌ NOT CONFIGURED");
  }
  
  console.log("");
  console.log("[ENV TEST] Current Active Database:");
  console.log("- Currently using:", DATABASE_URL.includes('muddy-moon') ? 'PRODUCTION (muddy-moon)' : 
                                   DATABASE_URL.includes('lucky-poetry') ? 'DEVELOPMENT (lucky-poetry)' : 'UNKNOWN');
  
  console.log("");
  console.log("[ENV TEST] Environment Isolation Status:");
  if (APP_ENV === 'production' && DATABASE_URL.includes('muddy-moon')) {
    console.log("✅ CORRECT: Production environment using production database");
  } else if (APP_ENV === 'development' && DATABASE_URL.includes('lucky-poetry')) {
    console.log("✅ CORRECT: Development environment using development database");
  } else {
    console.log("⚠️  WARNING: Environment/database mismatch detected");
  }
  
  console.log("");
  console.log("[ENV TEST] Recommendations:");
  if (!process.env.DEV_DATABASE_URL) {
    console.log("- ADD DEV_DATABASE_URL for development database (lucky-poetry)");
  }
  console.log("- Both databases should have Google Auth columns (already verified for current DB)");
  console.log("- Ensure DEV_APP_ENV=development when using development database");
  
  console.log("=".repeat(50));
}

testEnvironmentIsolation();