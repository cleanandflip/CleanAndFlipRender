/* Run with: npx tsx scripts/verify-products-column.ts */
import 'dotenv/config';
import { Client } from 'pg';

async function check(name: string, url: string) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    const r = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='products' AND column_name='continue_selling_when_out_of_stock'
    `);
    console.log(`\n[${name}]`, r.rows[0] || '(missing)');
  } finally { await c.end(); }
}

(async () => {
  await check('DEV (lucky-poetry)', process.env.DEV_DATABASE_URL!);
  await check('PROD (muddy-moon)', process.env.PROD_DATABASE_URL!);
})();