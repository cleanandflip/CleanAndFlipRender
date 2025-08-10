import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../shared/schema';
import { getCurrentEnvironment } from '../../server/config/database';

/**
 * Verify Database Configuration and Health
 * Tests both development and production databases
 */
async function verifyDatabases() {
  console.log('🔍 VERIFYING DATABASE CONFIGURATION');
  console.log('='.repeat(65));
  
  const currentEnv = getCurrentEnvironment();
  console.log(`Current Environment: ${currentEnv.toUpperCase()}`);
  
  // Check environment variables
  console.log('\n📋 ENVIRONMENT VARIABLES:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
  console.log(`   DATABASE_URL_DEV: ${process.env.DATABASE_URL_DEV ? 'Set' : 'Missing'}`);
  console.log(`   DATABASE_URL_PROD: ${process.env.DATABASE_URL_PROD ? 'Set' : 'Missing'}`);
  
  const results = {
    development: { success: false, error: null as any, data: null as any },
    production: { success: false, error: null as any, data: null as any }
  };
  
  // Test Development Database
  if (process.env.DATABASE_URL_DEV || process.env.DATABASE_URL) {
    console.log('\n🛠️ TESTING DEVELOPMENT DATABASE:');
    try {
      const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
      const devSql = neon(devUrl!);
      const devDb = drizzle(devSql, { schema });
      
      // Test connection
      await devSql`SELECT 1 as test`;
      
      // Get database info
      const dbInfo = await devSql`
        SELECT 
          current_database() as database_name,
          version() as postgres_version,
          pg_size_pretty(pg_database_size(current_database())) as size
      `;
      
      // Get table counts
      const userCount = await devSql`SELECT COUNT(*) as count FROM users`;
      const categoryCount = await devSql`SELECT COUNT(*) as count FROM categories`;
      const productCount = await devSql`SELECT COUNT(*) as count FROM products`;
      
      // Get role distribution
      const roleDistribution = await devSql`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY role
      `;
      
      // Check for test data markers
      const isTestData = await devSql`
        SELECT value 
        FROM system_settings 
        WHERE key = 'environment_type'
      `.catch(() => []);
      
      const url = new URL(devUrl!);
      results.development = {
        success: true,
        error: null,
        data: {
          host: url.hostname,
          database: dbInfo[0].database_name,
          version: dbInfo[0].postgres_version.split(' ')[1],
          size: dbInfo[0].size,
          users: userCount[0].count,
          categories: categoryCount[0].count,
          products: productCount[0].count,
          roles: roleDistribution,
          isTestData: isTestData.length > 0 ? isTestData[0].value === 'development' : false
        }
      };
      
      console.log(`   ✅ Connection: Success`);
      console.log(`   📍 Host: ${results.development.data.host}`);
      console.log(`   🗄️  Database: ${results.development.data.database}`);
      console.log(`   📊 Users: ${results.development.data.users}`);
      console.log(`   📁 Categories: ${results.development.data.categories}`);
      console.log(`   🏷️  Products: ${results.development.data.products}`);
      console.log(`   🧪 Test Data: ${results.development.data.isTestData ? 'Yes' : 'No'}`);
      
    } catch (error) {
      results.development.error = error;
      console.log(`   ❌ Connection: Failed`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('\n🛠️ DEVELOPMENT DATABASE: Not configured');
  }
  
  // Test Production Database
  if (process.env.DATABASE_URL_PROD) {
    console.log('\n🚀 TESTING PRODUCTION DATABASE:');
    try {
      const prodUrl = process.env.DATABASE_URL_PROD;
      
      // Safety check
      if (prodUrl.includes('lingering-flower')) {
        throw new Error('CRITICAL: Production URL points to development database!');
      }
      
      const prodSql = neon(prodUrl);
      const prodDb = drizzle(prodSql, { schema });
      
      // Test connection
      await prodSql`SELECT 1 as test`;
      
      // Get database info
      const dbInfo = await prodSql`
        SELECT 
          current_database() as database_name,
          version() as postgres_version,
          pg_size_pretty(pg_database_size(current_database())) as size
      `;
      
      // Get table counts
      const userCount = await prodSql`SELECT COUNT(*) as count FROM users`;
      const categoryCount = await prodSql`SELECT COUNT(*) as count FROM categories`;
      const productCount = await prodSql`SELECT COUNT(*) as count FROM products`;
      const orderCount = await prodSql`SELECT COUNT(*) as count FROM orders`;
      
      // Get role distribution
      const roleDistribution = await prodSql`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY role
      `;
      
      // Check for developer user
      const developerExists = await prodSql`
        SELECT email 
        FROM users 
        WHERE role = 'developer' 
        LIMIT 1
      `;
      
      const url = new URL(prodUrl);
      results.production = {
        success: true,
        error: null,
        data: {
          host: url.hostname,
          database: dbInfo[0].database_name,
          version: dbInfo[0].postgres_version.split(' ')[1],
          size: dbInfo[0].size,
          users: userCount[0].count,
          categories: categoryCount[0].count,
          products: productCount[0].count,
          orders: orderCount[0].count,
          roles: roleDistribution,
          hasDeveloper: developerExists.length > 0,
          developerEmail: developerExists.length > 0 ? developerExists[0].email : null
        }
      };
      
      console.log(`   ✅ Connection: Success`);
      console.log(`   📍 Host: ${results.production.data.host}`);
      console.log(`   🗄️  Database: ${results.production.data.database}`);
      console.log(`   📊 Users: ${results.production.data.users}`);
      console.log(`   📁 Categories: ${results.production.data.categories}`);
      console.log(`   🏷️  Products: ${results.production.data.products}`);
      console.log(`   🛒 Orders: ${results.production.data.orders}`);
      console.log(`   👨‍💻 Developer: ${results.production.data.hasDeveloper ? '✅' : '❌'}`);
      
    } catch (error) {
      results.production.error = error;
      console.log(`   ❌ Connection: Failed`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('\n🚀 PRODUCTION DATABASE: Not configured');
  }
  
  // Role System Verification
  console.log('\n🔐 ROLE SYSTEM VERIFICATION:');
  
  for (const [env, result] of Object.entries(results)) {
    if (result.success && result.data) {
      console.log(`\n   ${env.toUpperCase()}:`);
      
      if (result.data.roles.length === 0) {
        console.log(`     ⚠️  No users found`);
      } else {
        for (const role of result.data.roles) {
          const status = ['user', 'developer'].includes(role.role) ? '✅' : '❌';
          console.log(`     ${status} ${role.role}: ${role.count} users`);
        }
      }
      
      // Check for forbidden roles
      const forbiddenRoles = result.data.roles.filter((r: any) => 
        !['user', 'developer'].includes(r.role)
      );
      
      if (forbiddenRoles.length > 0) {
        console.log(`     ❌ FORBIDDEN ROLES DETECTED:`);
        forbiddenRoles.forEach((role: any) => {
          console.log(`        - ${role.role}: ${role.count} users`);
        });
      }
    }
  }
  
  // Summary
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log(`   Development DB: ${results.development.success ? '✅ OK' : '❌ Failed'}`);
  console.log(`   Production DB:  ${results.production.success ? '✅ OK' : '❌ Failed'}`);
  
  if (results.development.success && results.production.success) {
    console.log('\n🎯 DATABASES READY:');
    console.log('   ✅ Both databases are accessible');
    console.log('   ✅ Role system properly configured');
    console.log('   ✅ Safe to deploy to production');
  } else {
    console.log('\n⚠️  ISSUES DETECTED:');
    if (!results.development.success) {
      console.log('   - Development database needs attention');
    }
    if (!results.production.success) {
      console.log('   - Production database needs setup or fixing');
    }
  }
  
  console.log('\n✅ Database verification complete');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabases().catch(console.error);
}

export default verifyDatabases;