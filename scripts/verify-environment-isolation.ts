// scripts/verify-environment-isolation.ts
// Verify that environment isolation is working properly
import { APP_ENV, DATABASE_URL, DB_HOST, EXPECTED_DB_HOST } from '../server/config/env';

function verifyEnvironmentIsolation() {
  console.log("🔍 Verifying Environment Isolation...");
  console.log("==========================================");
  
  console.log(`📍 Current APP_ENV: ${APP_ENV}`);
  console.log(`📍 Current DB_HOST: ${DB_HOST}`);
  console.log(`📍 Expected DB_HOST: ${EXPECTED_DB_HOST || 'Not set'}`);
  
  // Verify development configuration
  if (APP_ENV === 'development') {
    if (DB_HOST.includes('lucky-poetry')) {
      console.log("✅ Development: Correctly using lucky-poetry database");
    } else {
      console.log("❌ Development: NOT using lucky-poetry database");
      console.log(`   Current host: ${DB_HOST}`);
    }
  }
  
  // Simulate production environment check
  console.log("\n🔮 Simulating Production Environment...");
  console.log("==========================================");
  
  const prodDbUrl = process.env.PROD_DATABASE_URL;
  if (prodDbUrl) {
    const prodHost = new URL(prodDbUrl).host;
    if (prodHost.includes('muddy-moon')) {
      console.log("✅ Production: Would use muddy-moon database");
    } else {
      console.log("❌ Production: Would NOT use muddy-moon database");
      console.log(`   Production host: ${prodHost}`);
    }
  } else {
    console.log("❌ Production: PROD_DATABASE_URL not set!");
  }
  
  // Security check
  console.log("\n🔒 Security Verification...");
  console.log("==========================================");
  
  if (APP_ENV === 'development' && DB_HOST.includes('muddy-moon')) {
    console.log("🚨 SECURITY ISSUE: Development is using production database!");
  } else if (APP_ENV === 'production' && DB_HOST.includes('lucky-poetry')) {
    console.log("🚨 SECURITY ISSUE: Production would use development database!");
  } else {
    console.log("✅ Security: Environment isolation is proper");
  }
  
  console.log("\n📋 Summary:");
  console.log("==========================================");
  console.log(`Development DB: lucky-poetry (${APP_ENV === 'development' ? 'ACTIVE' : 'inactive'})`);
  console.log(`Production DB: muddy-moon (${APP_ENV === 'production' ? 'ACTIVE' : 'inactive'})`);
  console.log(`Cross-contamination: ${(APP_ENV === 'development' && DB_HOST.includes('lucky-poetry')) || (APP_ENV === 'production' && prodDbUrl?.includes('muddy-moon')) ? 'PREVENTED' : 'RISK'}`);
}

verifyEnvironmentIsolation();