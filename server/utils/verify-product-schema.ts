import { universalPool } from '../db/universal-pool';
import { APP_ENV } from '../config/env';

export async function verifyProductSchema() {
  const q = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='products'
      AND column_name='continue_selling_when_out_of_stock'`;
  const r = await universalPool.query(q);
  if (r.rowCount && r.rowCount > 0) {
    console.log('✅ products.continue_selling_when_out_of_stock present');
    return;
  }

  const msg = '❌ products.continue_selling_when_out_of_stock is missing!';
  if (APP_ENV !== 'production') {
    console.warn(msg, 'Auto-adding in non-prod…');
    await universalPool.query(`
      ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS continue_selling_when_out_of_stock boolean NOT NULL DEFAULT false;
    `);
    console.log('✅ Added column in non-prod');
  } else {
    console.error(msg, 'Run: npx tsx scripts/fix-products-column.ts');
  }
}