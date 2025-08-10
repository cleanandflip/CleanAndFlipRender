import { detectEnvironment, validateEnvironment } from '../../server/config/environment';
import { validateSecurityConfig } from '../../server/config/security';

/**
 * Comprehensive Environment Validation
 * Checks all required environment variables and configurations
 */
async function checkEnvironment() {
  console.log('🔍 ENVIRONMENT CONFIGURATION CHECK');
  console.log('='.repeat(65));
  
  const environment = detectEnvironment();
  console.log(`Current Environment: ${environment.toUpperCase()}`);
  
  // Environment Detection
  console.log('\n🎯 ENVIRONMENT DETECTION:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`   REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT || 'undefined'}`);
  console.log(`   Detected Environment: ${environment}`);
  
  // Database Configuration
  console.log('\n🗄️ DATABASE CONFIGURATION:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   DATABASE_URL_DEV: ${process.env.DATABASE_URL_DEV ? '✅ Set' : '❌ Missing'}`);
  console.log(`   DATABASE_URL_PROD: ${process.env.DATABASE_URL_PROD ? '✅ Set' : '❌ Missing'}`);
  
  // Validate database URLs are different
  if (process.env.DATABASE_URL_DEV && process.env.DATABASE_URL_PROD) {
    if (process.env.DATABASE_URL_DEV === process.env.DATABASE_URL_PROD) {
      console.log('   ❌ WARNING: Dev and Prod URLs are identical!');
    } else {
      console.log('   ✅ Dev and Prod URLs are different');
    }
    
    // Check for development database in production URL
    if (process.env.DATABASE_URL_PROD.includes('lingering-flower')) {
      console.log('   ❌ CRITICAL: Production URL contains development database identifier!');
    } else {
      console.log('   ✅ Production URL does not contain development identifiers');
    }
  }
  
  // Developer/User Configuration
  console.log('\n👨‍💻 DEVELOPER CONFIGURATION:');
  console.log('   Developer user will be migrated from development database');
  console.log('   No additional secrets required for developer authentication');
  
  // Service Configuration
  console.log('\n🔌 SERVICE CONFIGURATION:');
  const serviceVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PUBLISHABLE_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY'
  ];
  
  for (const varName of serviceVars) {
    const isSet = !!process.env[varName];
    const isRequired = environment === 'production';
    const status = isSet ? '✅ Set' : (isRequired ? '❌ Missing' : '⚠️  Optional');
    console.log(`   ${varName}: ${status}`);
  }
  
  // Security Configuration
  console.log('\n🔐 SECURITY CONFIGURATION:');
  const securityVars = [
    'SESSION_SECRET',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  for (const varName of securityVars) {
    const value = process.env[varName];
    if (value) {
      const length = value.length;
      const isSecure = length >= 32;
      console.log(`   ${varName}: ✅ Set (${length} chars) ${isSecure ? '✅' : '⚠️  Short'}`);
    } else {
      const isRequired = environment === 'production' && varName === 'SESSION_SECRET';
      console.log(`   ${varName}: ${isRequired ? '❌ Missing' : '⚠️  Optional'}`);
    }
  }
  
  // Additional Settings
  console.log('\n⚙️  ADDITIONAL SETTINGS:');
  console.log(`   FORCE_SSL: ${process.env.FORCE_SSL || 'default'}`);
  console.log(`   ENABLE_DEBUG_LOGGING: ${process.env.ENABLE_DEBUG_LOGGING || 'default'}`);
  console.log(`   ENABLE_REDIS: ${process.env.ENABLE_REDIS || 'default'}`);
  console.log(`   CORS_ORIGINS: ${process.env.CORS_ORIGINS ? 'Set' : 'default'}`);
  
  // Validation Results
  console.log('\n📋 VALIDATION RESULTS:');
  
  const envValidation = validateEnvironment();
  if (envValidation.isValid) {
    console.log('   ✅ Environment validation: PASSED');
  } else {
    console.log('   ❌ Environment validation: FAILED');
    envValidation.errors.forEach(error => {
      console.log(`      - ${error}`);
    });
  }
  
  const securityValidation = validateSecurityConfig();
  if (securityValidation.isValid) {
    console.log('   ✅ Security validation: PASSED');
  } else {
    console.log('   ❌ Security validation: FAILED');
    securityValidation.errors.forEach(error => {
      console.log(`      - ${error}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (environment === 'development') {
    console.log('   🛠️  Development Environment:');
    console.log('      - Use test data freely');
    console.log('      - Debug logging is enabled');
    console.log('      - Rate limiting is relaxed');
    
    if (!process.env.DATABASE_URL_DEV) {
      console.log('      - Consider setting DATABASE_URL_DEV for explicit dev database');
    }
  }
  
  if (environment === 'production') {
    console.log('   🚀 Production Environment:');
    console.log('      - Ensure all secrets are properly configured');
    console.log('      - Verify SSL is enabled');
    console.log('      - Monitor rate limiting');
    
    if (!process.env.DATABASE_URL_PROD) {
      console.log('      - CRITICAL: Set DATABASE_URL_PROD for production database');
    }
  }
  
  // Missing Secrets for Production
  if (environment === 'production') {
    const missingSecrets = [];
    
    if (!process.env.DATABASE_URL_PROD) missingSecrets.push('DATABASE_URL_PROD');
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-session-secret-change-in-production') {
      missingSecrets.push('SESSION_SECRET');
    }
    
    if (missingSecrets.length > 0) {
      console.log('\n❌ MISSING PRODUCTION SECRETS:');
      console.log('   Add these to your Replit Secrets:');
      missingSecrets.forEach((secret: string) => {
        console.log(`      ${secret} = [your-value-here]`);
      });
    }
  }
  
  // Final Status
  const overallValid = envValidation.isValid && securityValidation.isValid;
  
  console.log('\n' + '='.repeat(65));
  console.log(`🎯 OVERALL STATUS: ${overallValid ? '✅ READY' : '❌ NEEDS ATTENTION'}`);
  
  if (overallValid) {
    console.log('✅ Environment is properly configured');
    if (environment === 'production') {
      console.log('🚀 Ready for production deployment');
    } else {
      console.log('🛠️  Ready for development work');
    }
  } else {
    console.log('⚠️  Fix the issues above before proceeding');
  }
  
  return {
    environment,
    isValid: overallValid,
    envValidation,
    securityValidation
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEnvironment().catch(console.error);
}

export default checkEnvironment;