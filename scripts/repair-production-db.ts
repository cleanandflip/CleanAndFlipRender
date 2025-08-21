import { Client } from 'pg';
import bcrypt from 'bcryptjs';

type ColumnSpec = { name: string; type: string; default?: string; unique?: boolean };

const REQUIRED_USER_COLUMNS: ColumnSpec[] = [
  { name: 'stripe_customer_id', type: 'varchar' },
  { name: 'stripe_subscription_id', type: 'varchar' },
  { name: 'google_id', type: 'varchar', unique: true },
  { name: 'google_sub', type: 'text', unique: true },
  { name: 'google_email', type: 'varchar' },
  { name: 'google_email_verified', type: 'boolean', default: 'false' },
  { name: 'google_picture', type: 'text' },
  { name: 'last_login_at', type: 'timestamptz' },
  { name: 'profile_image_url', type: 'text' },
  { name: 'auth_provider', type: 'varchar', default: `'local'` },
  { name: 'is_email_verified', type: 'boolean', default: 'false' },
  { name: 'profile_complete', type: 'boolean', default: 'false' },
  { name: 'is_local_customer', type: 'boolean', default: 'false' },
];

async function ensureColumns(client: Client) {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='users'`
  );
  const existing = new Set<string>(res.rows.map(r => r.column_name));

  const statements: string[] = [];
  for (const col of REQUIRED_USER_COLUMNS) {
    if (!existing.has(col.name)) {
      const def = col.default !== undefined ? ` DEFAULT ${col.default}` : '';
      statements.push(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${def};`
      );
      if (col.unique) {
        statements.push(
          `DO $$ BEGIN
             IF NOT EXISTS (
               SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_${col.name}_key'
             ) THEN
               BEGIN
                 ALTER TABLE users ADD CONSTRAINT users_${col.name}_key UNIQUE (${col.name});
               EXCEPTION WHEN duplicate_table THEN NULL; END;
             END IF;
           END $$;`
        );
      }
    }
  }

  if (statements.length === 0) {
    console.log('✅ users table already has all required columns');
    return;
  }

  console.log(`🔧 Applying ${statements.length} schema change(s)...`);
  await client.query('BEGIN');
  try {
    for (const sql of statements) {
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('✅ Schema updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function maybeCreateAdmin(client: Client) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';

  if (!email || !password) {
    console.log('ℹ️ Skipping admin creation (set ADMIN_EMAIL and ADMIN_PASSWORD to enable)');
    return;
  }

  const { rows } = await client.query(
    `SELECT id FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1`,
    [email]
  );
  if (rows.length > 0) {
    console.log(`ℹ️ Admin user already exists: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const insertSql = `
    INSERT INTO users (email, password, first_name, last_name, role, auth_provider, is_email_verified, profile_complete)
    VALUES ($1, $2, $3, $4, 'developer', 'local', true, true)
    RETURNING id
  `;
  const inserted = await client.query(insertSql, [email.toLowerCase(), hash, firstName, lastName]);
  console.log(`✅ Admin user created (${email}), id=${inserted.rows[0].id}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    console.log('🔗 Connected to database');
    await ensureColumns(client);
    await maybeCreateAdmin(client);
    console.log('🎉 Database repair completed');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Repair failed:', err);
  process.exit(1);
});

