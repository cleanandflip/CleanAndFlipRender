// scripts/wipe-user-data.ts
import { neon } from '@neondatabase/serverless';

async function main() {
  const env = process.env.NODE_ENV;
  if (env !== 'development') {
    console.error('Refusing to wipe: NODE_ENV is not development');
    process.exit(1);
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  // Keep product/catalog & migration tables; wipe user-related data.
  // This dynamically truncates tables whose names match user data patterns.
  const doBlock = `
  DO $$
  DECLARE
    stm text;
  BEGIN
    SELECT 'TRUNCATE TABLE ' ||
           string_agg(quote_ident(schemaname) || '.' || quote_ident(tablename), ', ')
           || ' RESTART IDENTITY CASCADE;'
      INTO stm
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT IN (
         -- keep catalog/config/migrations
         'products','categories','product_categories','inventory',
         'knex_migrations','knex_migrations_lock','_prisma_migrations','migrations','drizzle__migrations','drizzle__schema'
       )
       AND (
         -- user-related tables (adjust if your schema differs)
         tablename ~* '(user|profile|address|session|cart|order|submission|activity|event|issue|error|notification|preference|wishlist|review|audit)'
       );

    IF stm IS NOT NULL THEN
      EXECUTE stm;
    END IF;
  END $$;
  `;

  // Extra explicit clears for common table names (no-op if they don't exist)
  const explicit = [
    "session",
    "users",
    "user_profiles",
    "addresses",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "submissions",
    "activity_log",
    "error_events",
    "error_issues",
    "observability_events",
    "observability_issues",
  ];

  try {
    console.log('Wiping user-related tables (dynamic)…');
    await sql(doBlock);

    // Try explicit deletes to catch any missed by regex (ignore errors if table absent)
    for (const t of explicit) {
      try {
        await sql(`TRUNCATE TABLE IF EXISTS ${t} RESTART IDENTITY CASCADE;`);
        console.log(`✔ TRUNCATED ${t}`);
      } catch {
        /* ignore */
      }
    }

    // If you store sessions in Postgres via connect-pg-simple, table is usually named "session"
    // Already covered above, but do one more pass:
    try {
      await sql(`DELETE FROM "session";`);
      console.log('✔ Cleared session table');
    } catch {
      /* ignore */
    }

    console.log('✅ User data wipe completed.');
  } catch (e) {
    console.error('❌ Wipe failed:', e);
    process.exit(1);
  }
}

main();