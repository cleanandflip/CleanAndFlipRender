#!/usr/bin/env node
/* server/scripts/migrate.cjs */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");

const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ||
  (fs.existsSync(path.resolve("server/migrations"))
    ? path.resolve("server/migrations")
    : path.resolve("migrations"));

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.PROD_DATABASE_URL ||
  process.env.DEV_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL (or PROD/DEV_DATABASE_URL) is required.");
  process.exit(1);
}

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

(async () => {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Ensure tracking table + exclusive lock so we never double-apply
  await client.query(`
    CREATE TABLE IF NOT EXISTS pgmigrations (
      id bigserial PRIMARY KEY,
      filename text UNIQUE NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await client.query("SELECT pg_advisory_lock(538146161239)");

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (!files.length) {
    console.log(`ℹ️ No migrations found in ${MIGRATIONS_DIR}`);
    await client.query("SELECT pg_advisory_unlock(538146161239)");
    await client.end();
    process.exit(0);
  }

  for (const file of files) {
    const full = path.join(MIGRATIONS_DIR, file);
    const sqlBuf = fs.readFileSync(full);
    const checksum = sha256(sqlBuf);

    const { rows } = await client.query(
      "SELECT 1 FROM pgmigrations WHERE filename=$1 AND checksum=$2",
      [file, checksum]
    );
    if (rows.length) {
      console.log(`✓ ${file} already applied`);
      continue;
    }

    console.log(`→ applying ${file}`);
    try {
      await client.query("BEGIN");
      await client.query(sqlBuf.toString("utf8"));
      await client.query(
        "INSERT INTO pgmigrations(filename, checksum) VALUES ($1,$2)",
        [file, checksum]
      );
      await client.query("COMMIT");
      console.log(`✓ applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`✗ failed ${file}\n${err.stack || err}`);
      await client.query("SELECT pg_advisory_unlock(538146161239)");
      await client.end();
      process.exit(1);
    }
  }

  await client.query("SELECT pg_advisory_unlock(538146161239)");
  await client.end();
  console.log("🎉 All migrations up to date.");
})();