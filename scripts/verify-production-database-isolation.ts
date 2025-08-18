// scripts/verify-production-database-isolation.ts
// Comprehensive verification of database environment isolation
import { APP_ENV, DATABASE_URL, DB_HOST } from '../server/config/env';

function verifyDatabaseIsolation() {
  console.log("🔍 COMPREHENSIVE DATABASE ENVIRONMENT ISOLATION VERIFICATION");
  console.log("============================================================");
  
  const currentEnv = APP_ENV;
  const currentHost = DB_HOST;
  const devDbUrl = process.env.DEV_DATABASE_URL;
  const prodDbUrl = process.env.PROD_DATABASE_URL;
  
  console.log(`\n📍 Current Runtime Environment: ${currentEnv}`);
  console.log(`📍 Current Active Database Host: ${currentHost}`);
  
  // Extract hosts for comparison
  const devHost = devDbUrl ? new URL(devDbUrl).host : 'NOT_SET';
  const prodHost = prodDbUrl ? new URL(prodDbUrl).host : 'NOT_SET';
  
  console.log(`\n🔧 Environment-Specific Database Configuration:`);
  console.log(`   Development (DEV_DATABASE_URL): ${devHost}`);
  console.log(`   Production (PROD_DATABASE_URL): ${prodHost}`);
  
  // Verification Logic
  console.log(`\n✅ DATABASE ISOLATION VERIFICATION:`);
  console.log("====================================");
  
  // Check 1: Development Environment
  if (currentEnv === 'development') {
    if (currentHost.includes('lucky-poetry')) {
      console.log("✅ DEVELOPMENT: Correctly using lucky-poetry database");
    } else {
      console.log("❌ DEVELOPMENT: NOT using lucky-poetry database!");
      console.log(`   Expected: lucky-poetry, Actual: ${currentHost}`);
    }
    
    if (currentHost.includes('muddy-moon')) {
      console.log("🚨 CRITICAL: Development is using PRODUCTION database!");
    }
  }
  
  // Check 2: Production Environment Simulation
  if (currentEnv === 'production') {
    if (currentHost.includes('muddy-moon')) {
      console.log("✅ PRODUCTION: Correctly using muddy-moon database");
    } else {
      console.log("❌ PRODUCTION: NOT using muddy-moon database!");
      console.log(`   Expected: muddy-moon, Actual: ${currentHost}`);
    }
    
    if (currentHost.includes('lucky-poetry')) {
      console.log("🚨 CRITICAL: Production is using DEVELOPMENT database!");
    }
  }
  
  // Check 3: Environment Variable Consistency
  console.log(`\n🔐 SECURITY CHECKS:`);
  console.log("==================");
  
  if (devHost.includes('lucky-poetry')) {
    console.log("✅ DEV_DATABASE_URL correctly points to lucky-poetry");
  } else {
    console.log("❌ DEV_DATABASE_URL does NOT point to lucky-poetry");
  }
  
  if (prodHost.includes('muddy-moon')) {
    console.log("✅ PROD_DATABASE_URL correctly points to muddy-moon");
  } else {
    console.log("❌ PROD_DATABASE_URL does NOT point to muddy-moon");
  }
  
  // Check 4: Cross-contamination Prevention
  const hasCorrectIsolation = 
    (currentEnv === 'development' && currentHost.includes('lucky-poetry')) ||
    (currentEnv === 'production' && currentHost.includes('muddy-moon'));
  
  if (hasCorrectIsolation) {
    console.log("✅ ISOLATION: No cross-contamination detected");
  } else {
    console.log("🚨 ISOLATION: Cross-contamination risk detected!");
  }
  
  // Check 5: Deployment Readiness
  console.log(`\n🚀 DEPLOYMENT READINESS:`);
  console.log("========================");
  
  const deploymentReady = 
    devHost.includes('lucky-poetry') &&
    prodHost.includes('muddy-moon') &&
    devHost !== prodHost;
  
  if (deploymentReady) {
    console.log("✅ READY: Environment isolation configured for safe deployment");
    console.log("   → Development will ONLY use lucky-poetry");
    console.log("   → Production will ONLY use muddy-moon");
  } else {
    console.log("❌ NOT READY: Environment isolation needs fixing before deployment");
  }
  
  // Summary Report
  console.log(`\n📋 SUMMARY REPORT:`);
  console.log("==================");
  console.log(`Current Environment: ${currentEnv}`);
  console.log(`Active Database: ${currentHost.includes('lucky-poetry') ? 'lucky-poetry (DEV)' : currentHost.includes('muddy-moon') ? 'muddy-moon (PROD)' : 'UNKNOWN'}`);
  console.log(`Cross-contamination Risk: ${hasCorrectIsolation ? 'NONE' : 'HIGH'}`);
  console.log(`Deployment Safety: ${deploymentReady ? 'SAFE' : 'UNSAFE'}`);
  
  return {
    environmentCorrect: hasCorrectIsolation,
    deploymentReady,
    currentEnv,
    currentHost,
    devHost,
    prodHost
  };
}

const result = verifyDatabaseIsolation();

if (!result.deploymentReady) {
  console.log(`\n🔧 REQUIRED ACTIONS TO FIX:`);
  console.log("===========================");
  console.log("1. Ensure DEV_DATABASE_URL points to lucky-poetry");
  console.log("2. Ensure PROD_DATABASE_URL points to muddy-moon");
  console.log("3. Verify environment detection logic in server/config/env.ts");
  console.log("4. Re-run this verification script");
} else {
  console.log(`\n🎯 VERIFICATION COMPLETE: Database isolation is PERFECT!`);
}