// scripts/test-new-db.ts
import { Pool } from 'pg';

const NEW_DB_URL = 'postgresql://neondb_owner:npg_AP5jRXLtS2mi@ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEW_HOST = 'ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech';

async function testConnection() {
  console.log('🔍 Testing new database connection...');
  console.log(`📍 Host: ${NEW_HOST}`);
  
  const pool = new Pool({
    connectionString: NEW_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    const result = await pool.query(`
      SELECT 
        current_database() as db, 
        current_user as role,
        version() as version,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
    `);
    
    console.log('✅ Connection successful!');
    console.log(`   Database: ${result.rows[0].db}`);
    console.log(`   User: ${result.rows[0].role}`);
    console.log(`   Tables: ${result.rows[0].table_count}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
    
    return true;
  } catch (error: any) {
    console.error(`❌ Connection failed: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Testing New Development Database');
  console.log('=================================');
  
  const success = await testConnection();
  
  if (success) {
    console.log('\n✅ New database is ready!');
    console.log('\nTo switch to this database:');
    console.log('1. Update DEV_DATABASE_URL secret in Replit');
    console.log('2. Add EXPECTED_DB_HOST secret in Replit');
    console.log('3. Restart the application');
  } else {
    console.log('\n❌ Database connection failed');
    process.exit(1);
  }
}

main().catch(console.error);