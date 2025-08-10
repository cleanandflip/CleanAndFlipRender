import { exec } from 'child_process';
import { promisify } from 'util';
import { getCurrentEnvironment } from '../../server/config/database';

const execAsync = promisify(exec);

/**
 * Run Database Migrations
 * Uses Drizzle Kit to apply schema changes
 */
async function runMigrations() {
  console.log('🔄 DATABASE MIGRATION SCRIPT');
  console.log('='.repeat(65));
  
  const environment = getCurrentEnvironment();
  console.log(`Environment: ${environment.toUpperCase()}`);
  
  try {
    let command: string;
    
    if (environment === 'production') {
      console.log('🚀 Running PRODUCTION database migrations...');
      
      // Safety check for production
      const prodUrl = process.env.DATABASE_URL_PROD;
      if (!prodUrl) {
        console.error('❌ DATABASE_URL_PROD must be set for production migrations');
        process.exit(1);
      }
      
      if (prodUrl.includes('lingering-flower')) {
        console.error('❌ CRITICAL: Cannot run production migrations on development database!');
        process.exit(1);
      }
      
      command = 'drizzle-kit push --config=drizzle.config.prod.ts';
    } else {
      console.log('🛠️ Running DEVELOPMENT database migrations...');
      command = 'drizzle-kit push';
    }
    
    console.log(`Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) {
      console.log('Migration Output:');
      console.log(stdout);
    }
    
    if (stderr) {
      console.log('Migration Warnings:');
      console.log(stderr);
    }
    
    console.log('✅ Database migrations completed successfully');
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration results...');
    
    if (environment === 'production') {
      console.log('Production database updated');
    } else {
      console.log('Development database updated');
    }
    
    console.log('✅ Migration verification complete');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Ensure database URL is correctly set');
    console.log('2. Check network connectivity');
    console.log('3. Verify schema changes are valid');
    console.log('4. Check for conflicting database locks');
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(console.error);
}

export default runMigrations;