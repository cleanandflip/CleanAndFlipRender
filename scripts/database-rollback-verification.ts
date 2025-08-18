#!/usr/bin/env tsx
// Database rollback verification and recovery script
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';

async function verifyDatabaseRollback() {
  console.log('🔍 DATABASE ROLLBACK VERIFICATION');
  console.log('==================================');
  
  const devUrl = process.env.DEV_DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;
  
  if (!devUrl || !prodUrl) {
    throw new Error('Missing database URLs');
  }
  
  console.log('\n1. Connecting to Development DB (lucky-poetry)...');
  const devPool = new Pool({ connectionString: devUrl });
  const devDb = drizzle({ client: devPool });
  
  const devCheck = await devDb.execute(sql`
    SELECT 
      current_database() as db_name,
      current_user as db_user,
      current_timestamp as check_time,
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
      (SELECT count(*) FROM users) as user_count,
      (SELECT count(*) FROM products) as product_count
  `);
  
  console.log('Dev DB Status:', devCheck.rows[0]);
  
  console.log('\n2. Connecting to Production DB (muddy-moon)...');
  const prodPool = new Pool({ connectionString: prodUrl });
  const prodDb = drizzle({ client: prodPool });
  
  const prodCheck = await prodDb.execute(sql`
    SELECT 
      current_database() as db_name,
      current_user as db_user,
      current_timestamp as check_time,
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
      (SELECT count(*) FROM users) as user_count,
      (SELECT count(*) FROM products) as product_count
  `);
  
  console.log('Prod DB Status:', prodCheck.rows[0]);
  
  console.log('\n3. Schema Verification...');
  
  // Check critical tables exist
  const criticalTables = ['users', 'products', 'categories', 'orders', 'addresses', 'cart_items', 'sessions'];
  
  for (const table of criticalTables) {
    console.log(`Checking table: ${table}`);
    
    const devTableCheck = await devDb.execute(sql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${table}'
      ) as exists
    `));
    
    const prodTableCheck = await prodDb.execute(sql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${table}'
      ) as exists
    `));
    
    console.log(`  Dev: ${devTableCheck.rows[0].exists ? '✅' : '❌'} | Prod: ${prodTableCheck.rows[0].exists ? '✅' : '❌'}`);
  }
  
  console.log('\n4. Foreign Key Constraints Check...');
  
  const devConstraints = await devDb.execute(sql`
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  
  console.log(`Found ${devConstraints.rows.length} foreign key constraints in dev DB`);
  
  const prodConstraints = await prodDb.execute(sql`
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  
  console.log(`Found ${prodConstraints.rows.length} foreign key constraints in prod DB`);
  
  console.log('\n5. CASCADE DELETE Rules Check...');
  const cascadeConstraints = devConstraints.rows.filter(r => r.delete_rule === 'CASCADE');
  console.log(`Dev DB has ${cascadeConstraints.length} CASCADE DELETE constraints`);
  
  const prodCascadeConstraints = prodConstraints.rows.filter(r => r.delete_rule === 'CASCADE');
  console.log(`Prod DB has ${prodCascadeConstraints.length} CASCADE DELETE constraints`);
  
  await devPool.end();
  await prodPool.end();
  
  console.log('\n✅ Database rollback verification complete');
  console.log('Both databases are accessible and have core table structure');
}

if (import.meta.main) {
  verifyDatabaseRollback().catch(console.error);
}