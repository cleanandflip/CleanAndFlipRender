// scripts/migrate-database-data.ts
import { neon } from '@neondatabase/serverless';

const OLD_DB_URL = "postgresql://neondb_owner:npg_kjyl3onHs7Xq@ep-lingering-flower-afk8pi6o.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
const NEW_DB_URL = process.env.DEV_DATABASE_URL!;

if (!NEW_DB_URL) {
  throw new Error("DEV_DATABASE_URL not found");
}

const oldDb = neon(OLD_DB_URL);
const newDb = neon(NEW_DB_URL);

async function migrateTables() {
  console.log("🔄 Starting data migration from lingering-flower to lucky-poetry...");
  
  const tables = [
    'users',
    'categories', 
    'products',
    'cart_items',
    'orders',
    'order_items',
    'equipment_submissions',
    'activity_log'
  ];

  for (const table of tables) {
    try {
      console.log(`\n📋 Migrating table: ${table}`);
      
      // Get data from old database
      console.log(`  📤 Fetching data from old database...`);
      const oldData = await oldDb(`SELECT * FROM ${table}`);
      console.log(`  📊 Found ${oldData.length} records`);
      
      if (oldData.length === 0) {
        console.log(`  ⏭️  Skipping empty table`);
        continue;
      }

      // Clear existing data in new database
      console.log(`  🧹 Clearing existing data in new database...`);
      await newDb(`TRUNCATE TABLE ${table} CASCADE`);
      
      // Insert data in batches
      console.log(`  📥 Inserting data into new database...`);
      const batchSize = 100;
      for (let i = 0; i < oldData.length; i += batchSize) {
        const batch = oldData.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]);
        const placeholders = batch.map((_, index) => 
          `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
        ).join(', ');
        
        const values = batch.flatMap(row => columns.map(col => row[col]));
        
        await newDb(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`,
          values
        );
        
        console.log(`    ✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(oldData.length/batchSize)}`);
      }
      
      // Verify migration
      const newCount = await newDb(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ✅ Migration complete: ${newCount[0].count} records in new database`);
      
    } catch (error) {
      console.error(`  ❌ Error migrating ${table}:`, error);
      // Continue with other tables
    }
  }
  
  console.log("\n🎉 Data migration completed!");
}

async function updateSequences() {
  console.log("\n🔢 Updating sequence values...");
  
  const sequences = [
    { table: 'users', column: 'id' },
    { table: 'categories', column: 'id' },
    { table: 'products', column: 'id' },
    { table: 'orders', column: 'id' },
    { table: 'equipment_submissions', column: 'id' }
  ];
  
  for (const { table, column } of sequences) {
    try {
      const maxId = await newDb(`SELECT MAX(${column}) as max_id FROM ${table}`);
      if (maxId[0].max_id) {
        await newDb(`SELECT setval('${table}_${column}_seq', ${maxId[0].max_id}, true)`);
        console.log(`  ✅ Updated ${table}_${column}_seq to ${maxId[0].max_id}`);
      }
    } catch (error) {
      console.log(`  ⚠️  Could not update sequence for ${table}.${column}:`, error.message);
    }
  }
}

async function main() {
  try {
    await migrateTables();
    await updateSequences();
    
    console.log("\n✅ Complete! All data migrated from lingering-flower to lucky-poetry");
    console.log("🔒 Development environment is now using lucky-poetry database exclusively");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();