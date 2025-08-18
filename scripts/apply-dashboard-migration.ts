#!/usr/bin/env tsx
// Apply dashboard foundation migration to both dev and prod databases
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  console.log('🚀 Applying Dashboard Foundation Migration');
  console.log('==========================================');
  
  const migrationSql = readFileSync(join(process.cwd(), 'migrations', '001_dashboard_foundation.sql'), 'utf8');
  
  const devUrl = process.env.DEV_DATABASE_URL;
  const prodUrl = process.env.PROD_DATABASE_URL;
  
  if (!devUrl || !prodUrl) {
    throw new Error('Missing DEV_DATABASE_URL or PROD_DATABASE_URL');
  }
  
  // Apply to Development DB
  console.log('\n1. Applying to Development DB (lucky-poetry)...');
  const devPool = new Pool({ connectionString: devUrl });
  const devDb = drizzle({ client: devPool });
  
  try {
    await devDb.execute(sql.raw(migrationSql));
    console.log('✅ Development DB migration complete');
    
    // Refresh materialized view
    await devDb.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_aggregate`);
    console.log('✅ Development DB materialized view refreshed');
  } catch (error) {
    console.error('❌ Development DB migration failed:', error);
  } finally {
    await devPool.end();
  }
  
  // Apply to Production DB
  console.log('\n2. Applying to Production DB (muddy-moon)...');
  const prodPool = new Pool({ connectionString: prodUrl });
  const prodDb = drizzle({ client: prodPool });
  
  try {
    await prodDb.execute(sql.raw(migrationSql));
    console.log('✅ Production DB migration complete');
    
    // Refresh materialized view
    await prodDb.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_aggregate`);
    console.log('✅ Production DB materialized view refreshed');
  } catch (error) {
    console.error('❌ Production DB migration failed:', error);
  } finally {
    await prodPool.end();
  }
  
  console.log('\n🎉 Dashboard Foundation Migration Complete!');
}

if (import.meta.main) {
  applyMigration().catch(console.error);
}