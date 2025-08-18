// scripts/complete-data-migration.ts
import { neon } from '@neondatabase/serverless';

const OLD_DB_URL = "postgresql://neondb_owner:npg_kjyl3onHs7Xq@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = process.env.DEV_DATABASE_URL!;

const oldDb = neon(OLD_DB_URL);
const newDb = neon(NEW_DB_URL);

async function getAllTables() {
  console.log("🔍 Checking available tables in both databases...");
  
  const oldTables = await oldDb(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  const newTables = await newDb(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log("📋 Old database tables:", oldTables.map(t => t.table_name));
  console.log("📋 New database tables:", newTables.map(t => t.table_name));
  
  return { oldTables: oldTables.map(t => t.table_name), newTables: newTables.map(t => t.table_name) };
}

async function getTableCounts(db: any, tables: string[]) {
  const counts: Record<string, number> = {};
  
  for (const table of tables) {
    try {
      const result = await db(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result[0].count);
    } catch (error) {
      counts[table] = -1; // Error getting count
    }
  }
  
  return counts;
}

async function migrateTableData(tableName: string) {
  console.log(`\n📋 Migrating table: ${tableName}`);
  
  try {
    // Get data from old database
    const oldData = await oldDb(`SELECT * FROM ${tableName}`);
    console.log(`  📊 Found ${oldData.length} records in old database`);
    
    if (oldData.length === 0) {
      console.log(`  ⏭️  Skipping empty table`);
      return { success: true, migrated: 0 };
    }
    
    // Check if table exists in new database
    const tableExists = await newDb(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);
    
    if (tableExists.length === 0) {
      console.log(`  ⚠️  Table ${tableName} does not exist in new database, skipping`);
      return { success: false, migrated: 0, reason: 'table_not_exists' };
    }
    
    // Get column info for both databases
    const oldColumns = await oldDb(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    const newColumns = await newDb(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    const oldColNames = oldColumns.map(c => c.column_name);
    const newColNames = newColumns.map(c => c.column_name);
    const commonColumns = oldColNames.filter(col => newColNames.includes(col));
    
    console.log(`  🔄 Common columns (${commonColumns.length}): ${commonColumns.join(', ')}`);
    
    if (commonColumns.length === 0) {
      console.log(`  ⚠️  No common columns found, skipping`);
      return { success: false, migrated: 0, reason: 'no_common_columns' };
    }
    
    // Clear existing data
    await newDb(`TRUNCATE TABLE ${tableName} CASCADE`);
    console.log(`  🧹 Cleared existing data`);
    
    // Insert data using only common columns
    let migratedCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < oldData.length; i += batchSize) {
      const batch = oldData.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Build insert query with only common columns
          const values = commonColumns.map(col => row[col]);
          const placeholders = commonColumns.map((_, idx) => `$${idx + 1}`).join(', ');
          
          await newDb(
            `INSERT INTO ${tableName} (${commonColumns.join(', ')}) VALUES (${placeholders})`,
            values
          );
          
          migratedCount++;
        } catch (error) {
          console.log(`    ⚠️  Failed to insert row: ${error.message}`);
        }
      }
      
      console.log(`    ✅ Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(oldData.length/batchSize)}`);
    }
    
    console.log(`  ✅ Migration complete: ${migratedCount}/${oldData.length} records migrated`);
    return { success: true, migrated: migratedCount };
    
  } catch (error) {
    console.error(`  ❌ Error migrating ${tableName}:`, error.message);
    return { success: false, migrated: 0, reason: error.message };
  }
}

async function updateSequences() {
  console.log("\n🔢 Updating sequence values...");
  
  const tablesWithSequences = [
    'users', 'categories', 'products', 'orders', 'equipment_submissions'
  ];
  
  for (const table of tablesWithSequences) {
    try {
      // Check if table has an id column
      const hasId = await newDb(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'id'
      `, [table]);
      
      if (hasId.length === 0) continue;
      
      // Get max ID
      const maxId = await newDb(`SELECT MAX(id) as max_id FROM ${table}`);
      
      if (maxId[0].max_id) {
        // Update sequence
        await newDb(`SELECT setval('${table}_id_seq', $1, true)`, [maxId[0].max_id]);
        console.log(`  ✅ Updated ${table}_id_seq to ${maxId[0].max_id}`);
      }
    } catch (error) {
      console.log(`  ⚠️  Could not update sequence for ${table}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log("🚀 Starting comprehensive data migration...\n");
    
    // Get all tables
    const { oldTables, newTables } = await getAllTables();
    
    // Get counts before migration
    console.log("\n📊 Data counts BEFORE migration:");
    const oldCounts = await getTableCounts(oldDb, oldTables);
    const newCountsBefore = await getTableCounts(newDb, newTables);
    
    oldTables.forEach(table => {
      console.log(`  ${table}: OLD=${oldCounts[table]}, NEW=${newCountsBefore[table] || 0}`);
    });
    
    // Migrate all tables that exist in both databases
    const migrationResults: Record<string, any> = {};
    
    for (const table of oldTables) {
      if (newTables.includes(table)) {
        migrationResults[table] = await migrateTableData(table);
      } else {
        console.log(`\n📋 Skipping ${table} - not in new database`);
        migrationResults[table] = { success: false, migrated: 0, reason: 'table_not_in_new_db' };
      }
    }
    
    // Update sequences
    await updateSequences();
    
    // Get counts after migration
    console.log("\n📊 Data counts AFTER migration:");
    const newCountsAfter = await getTableCounts(newDb, newTables);
    
    newTables.forEach(table => {
      const oldCount = oldCounts[table] || 0;
      const newCount = newCountsAfter[table] || 0;
      const migrated = migrationResults[table]?.migrated || 0;
      console.log(`  ${table}: OLD=${oldCount} → NEW=${newCount} (migrated: ${migrated})`);
    });
    
    // Summary
    console.log("\n🎉 Migration Summary:");
    const successful = Object.values(migrationResults).filter(r => r.success).length;
    const total = Object.keys(migrationResults).length;
    console.log(`  ✅ Successful: ${successful}/${total} tables`);
    
    Object.entries(migrationResults).forEach(([table, result]) => {
      if (result.success) {
        console.log(`    ✅ ${table}: ${result.migrated} records`);
      } else {
        console.log(`    ❌ ${table}: ${result.reason || 'failed'}`);
      }
    });
    
    console.log("\n✅ Complete! All available data migrated to lucky-poetry database");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();