/* Run with: npx tsx scripts/fix-products-column.ts */
import 'dotenv/config';
import { Client } from 'pg';

// Use available environment variables
const DEV = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL!;
const PROD = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL!;

if (!DEV || !PROD) {
  console.error('❌ Missing DEV_DATABASE_URL or PROD_DATABASE_URL in env.');
  process.exit(1);
}

const SQL = `
BEGIN;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS continue_selling_when_out_of_stock boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.products.continue_selling_when_out_of_stock IS 'Allow purchases when inventory <= 0';
-- optional: tiny helper index for admin filters
CREATE INDEX IF NOT EXISTS idx_products_continue_selling ON public.products (continue_selling_when_out_of_stock);
COMMIT;`;

async function run(name: string, url: string) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    process.stdout.write(`\n[${name}] Applying migration… `);
    await c.query(SQL);
    console.log('OK');

    const v = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='products' AND column_name='continue_selling_when_out_of_stock'
      LIMIT 1;
    `);
    console.log(`[${name}] Column:`, v.rows[0] || '(missing)');
  } finally {
    await c.end();
  }
}

(async () => {
  await run('DEV (lucky-poetry)', DEV);
  await run('PROD (muddy-moon)', PROD);
  console.log('\n✅ Done. Both databases have the column.');
})().catch(e => {
  console.error('\n❌ Migration failed:', e?.message || e);
  process.exit(1);
});