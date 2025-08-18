// scripts/switch-to-new-dev-db.ts
// This script validates and switches to the new development database

import { writeFileSync, readFileSync } from 'fs';
import { Pool } from 'pg';

const NEW_DEV_URL = 'postgresql://neondb_owner:npg_AP5jRXLtS2mi@ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEW_HOST = 'ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech';

async function testNewDatabase() {
  console.log('🔍 Testing new database connection...');
  
  const pool = new Pool({
    connectionString: NEW_DEV_URL,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    const result = await pool.query(`
      SELECT 
        current_database() as db, 
        current_user as role,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
    `);
    
    console.log('✅ New database connection successful');
    console.log(`   Database: ${result.rows[0].db}`);
    console.log(`   User: ${result.rows[0].role}`);
    console.log(`   Tables: ${result.rows[0].table_count}`);
    
    // Test key tables exist
    const tables = ['users', 'products', 'categories', 'cart_items'];
    for (const table of tables) {
      const tableResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${tableResult.rows[0].count} rows`);
    }
    
    return true;
  } catch (error: any) {
    console.error(`❌ Database test failed: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

function updateEnvFile() {
  console.log('📝 Updating .env file...');
  
  try {
    const envContent = readFileSync('.env', 'utf8');
    
    // Replace DEV_DATABASE_URL
    const updatedContent = envContent
      .replace(/^DEV_DATABASE_URL=.*$/m, `DEV_DATABASE_URL="${NEW_DEV_URL}"`)
      .replace(/^EXPECTED_DB_HOST=.*$/m, `EXPECTED_DB_HOST="${NEW_HOST}"`);
    
    // Create backup
    writeFileSync('.env.backup-before-db-switch', envContent);
    
    // Write updated content
    writeFileSync('.env', updatedContent);
    
    console.log('✅ .env file updated');
    console.log('📦 Backup saved as .env.backup-before-db-switch');
    
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to update .env: ${error.message}`);
    return false;
  }
}

function createRollbackScript() {
  console.log('🔄 Creating rollback script...');
  
  const rollbackScript = `#!/bin/bash
# Rollback script to restore old development database
echo "🔄 Rolling back to old development database..."

# Read the backup
if [ ! -f .env.backup-before-db-switch ]; then
  echo "❌ Backup file not found!"
  exit 1
fi

# Restore backup
cp .env.backup-before-db-switch .env
echo "✅ Restored .env from backup"

echo "🔄 Restart the application to use the old database"
echo "📝 Note: You may need to restart the workflow manually"
`;

  writeFileSync('scripts/rollback-db-switch.sh', rollbackScript);
  
  console.log('✅ Rollback script created: scripts/rollback-db-switch.sh');
}

async function main() {
  console.log('🚀 Switching to New Development Database');
  console.log('======================================');
  
  // Test the new database first
  const testOk = await testNewDatabase();
  if (!testOk) {
    console.error('❌ New database test failed. Cannot proceed.');
    process.exit(1);
  }
  
  // Update environment file
  const envOk = updateEnvFile();
  if (!envOk) {
    console.error('❌ Failed to update environment. Cannot proceed.');
    process.exit(1);
  }
  
  // Create rollback script
  createRollbackScript();
  
  console.log('\n🎉 Database switch completed successfully!');
  console.log('\n📝 Summary:');
  console.log(`✅ New database URL: ${NEW_HOST}`);
  console.log('✅ .env file updated');
  console.log('✅ Backup created');
  console.log('✅ Rollback script ready');
  
  console.log('\n🔄 Next steps:');
  console.log('1. Restart the application workflow');
  console.log('2. Test all functionality');
  console.log('3. If issues occur, run: bash scripts/rollback-db-switch.sh');
  
  console.log('\n⚠️  Important:');
  console.log('- The old database is still available for rollback');
  console.log('- Remove old database only after confirming everything works');
}

if (require.main === module) {
  main().catch(console.error);
}