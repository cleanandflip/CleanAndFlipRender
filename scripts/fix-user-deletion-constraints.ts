/* Fix foreign key constraints for user deletion */
import 'dotenv/config';
import { Client } from 'pg';

const DEV = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL!;
const PROD = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL!;

if (!DEV || !PROD) {
  console.error('❌ Missing database URLs in env.');
  process.exit(1);
}

const SQL = `
BEGIN;

-- Check if foreign key constraint exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'addresses_user_id_users_id_fk' 
        AND table_name = 'addresses'
    ) THEN
        ALTER TABLE public.addresses DROP CONSTRAINT addresses_user_id_users_id_fk;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Recreate with CASCADE DELETE
ALTER TABLE public.addresses 
ADD CONSTRAINT addresses_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES public.users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Also check for cart_items if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items') THEN
        -- Drop existing constraint if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'cart_items_user_id_users_id_fk' 
            AND table_name = 'cart_items'
        ) THEN
            ALTER TABLE public.cart_items DROP CONSTRAINT cart_items_user_id_users_id_fk;
        END IF;
        
        -- Recreate with CASCADE DELETE
        ALTER TABLE public.cart_items 
        ADD CONSTRAINT cart_items_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Updated cart_items foreign key constraint';
    END IF;
END $$;

-- Check for orders table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Drop existing constraint if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'orders_user_id_users_id_fk' 
            AND table_name = 'orders'
        ) THEN
            ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_users_id_fk;
        END IF;
        
        -- Recreate with CASCADE DELETE
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Updated orders foreign key constraint';
    END IF;
END $$;

COMMIT;`;

async function run(name: string, url: string) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    process.stdout.write(`\n[${name}] Fixing foreign key constraints… `);
    await c.query(SQL);
    console.log('OK');

    // Verify the constraint is properly set
    const r = await c.query(`
      SELECT tc.constraint_name, tc.table_name, rc.delete_rule, rc.update_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('addresses', 'cart_items', 'orders')
      AND rc.unique_constraint_name LIKE '%users%'
      ORDER BY tc.table_name;
    `);
    
    console.log(`[${name}] Foreign key constraints:`, r.rows);
  } finally {
    await c.end();
  }
}

(async () => {
  await run('DEV (lucky-poetry)', DEV);
  await run('PROD (muddy-moon)', PROD);
  console.log('\n✅ Done. Foreign key constraints updated with CASCADE DELETE.');
})().catch(e => {
  console.error('\n❌ Migration failed:', e?.message || e);
  process.exit(1);
});