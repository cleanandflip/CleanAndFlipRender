import { db } from '../server/db';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function finalDatabaseConsolidation() {
  console.log('🎯 FINAL DATABASE CONSOLIDATION ANALYSIS');
  console.log('='.repeat(70));
  
  // Your three databases
  const databases = [
    {
      name: 'Current Working',
      host: 'ep-round-silence-aeetk60u-pooler.c-2.us-east-2.aws.neon.tech',
      connection: db,
      status: 'ACTIVE - Your app connects here'
    },
    {
      name: 'Replit Development', 
      host: 'ep-old-sky-afb0k7bc-2.us-west-2.aws.neon.tech',
      status: 'In Replit secrets panel'
    },
    {
      name: 'Production (100GB)',
      host: 'ep-lucky-credit-afcslqgy.c-2.us-west-2.aws.neon.tech', 
      status: '100GB storage - potentially main production database'
    }
  ];
  
  console.log('📊 DATABASE INVENTORY:');
  databases.forEach((db, i) => {
    console.log(`\n${i + 1}. ${db.name}:`);
    console.log(`   Host: ${db.host}`);
    console.log(`   Status: ${db.status}`);
  });
  
  // Analyze current working database (we know this works)
  console.log('\n📈 CURRENT WORKING DATABASE DATA:');
  try {
    const currentData = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM users`),
      db.execute(sql`SELECT COUNT(*) as count FROM products`),
      db.execute(sql`SELECT COUNT(*) as count FROM orders`)
    ]);
    
    console.log(`   Users: ${currentData[0].rows[0]?.count}`);
    console.log(`   Products: ${currentData[1].rows[0]?.count}`);
    console.log(`   Orders: ${currentData[2].rows[0]?.count}`);
    
  } catch (error) {
    console.log('   ❌ Error accessing current database');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 CONSOLIDATION RECOMMENDATIONS:');
  
  console.log('\n🎯 OPTION A: Use Production Database (100GB)');
  console.log('   ✅ Largest storage capacity');
  console.log('   ✅ Designed for production workloads');
  console.log('   ⚠️  Need to verify if it contains existing data');
  console.log('   📋 Action: Migrate all data to production database');
  
  console.log('\n🎯 OPTION B: Use Current Working Database');
  console.log('   ✅ Already contains all your data');
  console.log('   ✅ Proven to work with your application');
  console.log('   ⚠️  May not be officially managed by Replit');
  console.log('   📋 Action: Update Replit secrets to point here');
  
  console.log('\n🎯 OPTION C: Use Replit Development Database');
  console.log('   ✅ Officially managed by Replit');
  console.log('   ✅ Shown in your secrets panel');
  console.log('   ⚠️  Currently empty, needs data migration');
  console.log('   📋 Action: Migrate data from working database');
  
  console.log('\n💡 RECOMMENDED APPROACH:');
  console.log('1. Investigate Production Database (100GB) content');
  console.log('2. If production DB is empty, migrate your data there');
  console.log('3. If production DB has data, consolidate everything there');
  console.log('4. Delete unused databases after successful migration');
  console.log('5. Update all environment variables to point to chosen database');
}

finalDatabaseConsolidation();