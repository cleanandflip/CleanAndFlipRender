// scripts/database-migration.ts
import { Pool } from 'pg';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

interface DatabaseConfig {
  name: string;
  url: string;
  host: string;
}

const SOURCE_DB: DatabaseConfig = {
  name: 'current-dev (lingering-flower)',
  url: process.env.DEV_DATABASE_URL || '',
  host: 'ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech'
};

const TARGET_DB: DatabaseConfig = {
  name: 'new-dev (lucky-poetry)',
  url: 'postgresql://neondb_owner:npg_AP5jRXLtS2mi@ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  host: 'ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech'
};

async function testConnection(config: DatabaseConfig): Promise<boolean> {
  const pool = new Pool({
    connectionString: config.url,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    console.log(`\n🔍 Testing connection to ${config.name}...`);
    const result = await pool.query('SELECT current_database() as db, current_user as role, version() as version');
    console.log(`✅ Connected to ${config.name}`);
    console.log(`   Database: ${result.rows[0].db}`);
    console.log(`   User: ${result.rows[0].role}`);
    console.log(`   Host: ${config.host}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to connect to ${config.name}: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function getTableSchema(config: DatabaseConfig): Promise<string[]> {
  const pool = new Pool({
    connectionString: config.url,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    const result = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    return result.rows.map(row => `${row.table_name} (${row.table_type})`);
  } catch (error: any) {
    console.error(`❌ Failed to get schema from ${config.name}: ${error.message}`);
    return [];
  } finally {
    await pool.end();
  }
}

async function getRowCounts(config: DatabaseConfig): Promise<Record<string, number>> {
  const pool = new Pool({
    connectionString: config.url,
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  const counts: Record<string, number> = {};
  const tables = ['users', 'categories', 'products', 'cart_items', 'orders', 'sessions'];

  try {
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        counts[table] = 0; // Table might not exist
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to get row counts from ${config.name}: ${error.message}`);
  } finally {
    await pool.end();
  }

  return counts;
}

async function setupTargetDatabase(): Promise<boolean> {
  console.log(`\n🔧 Setting up target database schema...`);
  
  try {
    // Run our migrations on the target database
    const targetUrl = TARGET_DB.url;
    console.log('📦 Running Drizzle migrations on target database...');
    
    // Set the target database URL temporarily
    process.env.DATABASE_URL = targetUrl;
    
    // Run the migration script (this will create all tables and indexes)
    execSync('npm run db:push', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: targetUrl,
        DEV_DATABASE_URL: targetUrl 
      }
    });
    
    console.log('✅ Target database schema created successfully');
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to setup target database: ${error.message}`);
    return false;
  }
}

async function copyData(): Promise<boolean> {
  console.log(`\n📋 Copying data from source to target...`);
  
  const sourcePool = new Pool({
    connectionString: SOURCE_DB.url,
    ssl: { rejectUnauthorized: false },
    max: 5
  });

  const targetPool = new Pool({
    connectionString: TARGET_DB.url,
    ssl: { rejectUnauthorized: false },
    max: 5
  });

  try {
    // Copy data in dependency order
    const tables = [
      'categories',
      'users', 
      'products',
      'cart_items',
      'orders',
      'sessions'
    ];

    for (const table of tables) {
      try {
        console.log(`  📄 Copying ${table}...`);
        
        // Get all data from source
        const sourceData = await sourcePool.query(`SELECT * FROM ${table}`);
        
        if (sourceData.rows.length === 0) {
          console.log(`    ⚪ ${table}: No data to copy`);
          continue;
        }

        // Clear target table first
        await targetPool.query(`TRUNCATE TABLE ${table} CASCADE`);
        
        // Get column names
        const columns = Object.keys(sourceData.rows[0]).join(', ');
        const placeholders = sourceData.rows[0] 
          ? Object.keys(sourceData.rows[0]).map((_, i) => `$${i + 1}`).join(', ')
          : '';

        // Insert each row
        for (const row of sourceData.rows) {
          const values = Object.values(row);
          await targetPool.query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
            values
          );
        }
        
        console.log(`    ✅ ${table}: Copied ${sourceData.rows.length} rows`);
      } catch (error: any) {
        console.error(`    ❌ ${table}: ${error.message}`);
      }
    }

    return true;
  } catch (error: any) {
    console.error(`❌ Data copy failed: ${error.message}`);
    return false;
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

async function verifyMigration(): Promise<boolean> {
  console.log(`\n🔍 Verifying migration...`);
  
  const sourceCounts = await getRowCounts(SOURCE_DB);
  const targetCounts = await getRowCounts(TARGET_DB);
  
  console.log('\n📊 Row count comparison:');
  console.log('Table'.padEnd(15), 'Source'.padEnd(10), 'Target'.padEnd(10), 'Status');
  console.log('-'.repeat(50));
  
  let allMatch = true;
  
  for (const table of Object.keys(sourceCounts)) {
    const sourceCount = sourceCounts[table] || 0;
    const targetCount = targetCounts[table] || 0;
    const status = sourceCount === targetCount ? '✅' : '❌';
    
    if (sourceCount !== targetCount) {
      allMatch = false;
    }
    
    console.log(
      table.padEnd(15),
      sourceCount.toString().padEnd(10),
      targetCount.toString().padEnd(10),
      status
    );
  }
  
  return allMatch;
}

async function main() {
  console.log('🚀 Clean & Flip Database Migration Tool');
  console.log('=======================================');
  
  // Validate environment
  if (!SOURCE_DB.url) {
    console.error('❌ DEV_DATABASE_URL not set for source database');
    process.exit(1);
  }
  
  console.log(`📍 Source: ${SOURCE_DB.host}`);
  console.log(`📍 Target: ${TARGET_DB.host}`);
  
  // Test connections
  const sourceOk = await testConnection(SOURCE_DB);
  const targetOk = await testConnection(TARGET_DB);
  
  if (!sourceOk || !targetOk) {
    console.error('❌ Connection tests failed. Cannot proceed.');
    process.exit(1);
  }
  
  // Show current schemas
  console.log(`\n📋 Source database schema:`);
  const sourceSchema = await getTableSchema(SOURCE_DB);
  sourceSchema.forEach(table => console.log(`  - ${table}`));
  
  console.log(`\n📋 Target database schema:`);
  const targetSchema = await getTableSchema(TARGET_DB);
  targetSchema.forEach(table => console.log(`  - ${table}`));
  
  // Setup target database
  const setupOk = await setupTargetDatabase();
  if (!setupOk) {
    console.error('❌ Target database setup failed');
    process.exit(1);
  }
  
  // Copy data
  const copyOk = await copyData();
  if (!copyOk) {
    console.error('❌ Data copy failed');
    process.exit(1);
  }
  
  // Verify migration
  const verifyOk = await verifyMigration();
  if (!verifyOk) {
    console.error('❌ Migration verification failed');
    process.exit(1);
  }
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update DEV_DATABASE_URL to point to the new database');
  console.log('2. Update EXPECTED_DB_HOST to the new host');
  console.log('3. Restart the application');
  console.log('4. Test all functionality');
  console.log('5. Remove old database when confident');
}

if (require.main === module) {
  main().catch(console.error);
}