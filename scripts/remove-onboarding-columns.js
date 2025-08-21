#!/usr/bin/env node

// Remove onboarding-related columns and tables from the database (dev and prod)
// Columns: users.profile_complete, users.onboarding_step, users.onboarding_completed_at
// Table: user_onboarding (if exists)

import { neon } from '@neondatabase/serverless';

async function cleanup(dbUrl, label) {
  if (!dbUrl) {
    console.log(`ℹ️  ${label}: URL not provided - skipping`);
    return;
  }
  console.log(`\n🧹 Cleaning ${label} database...`);
  try {
    const sql = neon(dbUrl);

    // Drop columns (idempotent)
    const dropStatements = [
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_complete"`,
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_step"`,
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_completed_at"`,
      `DROP INDEX IF EXISTS "idx_users_onboarding_completed_at"`,
      `DROP TABLE IF EXISTS "user_onboarding" CASCADE`
    ];

    for (const stmt of dropStatements) {
      try {
        await sql(stmt);
        console.log(`  ✅ ${stmt}`);
      } catch (err) {
        console.log(`  ⚠️  ${stmt} -> ${err.message}`);
      }
    }

    // Verify removal
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY column_name`;
    const cols = res.map(r => r.column_name);
    const leftovers = ['profile_complete', 'onboarding_step', 'onboarding_completed_at'].filter(c => cols.includes(c));
    if (leftovers.length === 0) {
      console.log(`  🎉 ${label}: Onboarding columns removed`);
    } else {
      console.log(`  ❌ ${label}: Leftover columns still present: ${leftovers.join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ ${label}: Cleanup failed ->`, error.message);
    process.exitCode = 1;
  }
}

const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL_DEV || '';
const prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL_PROD || '';

console.log('🔧 Removing onboarding artifacts from databases...');
await cleanup(devUrl, 'DEV');
await cleanup(prodUrl, 'PROD');
console.log('\n✅ Cleanup run complete');

