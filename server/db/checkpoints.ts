import { Pool } from "pg";

export async function createCheckpoint(pool: Pool, branch: "dev"|"prod", label: string, notes?: string, who?: string) {
  const q = `SELECT admin.create_checkpoint($1,$2,$3,$4,$5) AS id`;
  const schemas = ['public']; // add more if you need
  const { rows } = await pool.query(q, [branch, label, notes || null, schemas, who || null]);
  return rows[0].id as string;
}

export async function listCheckpoints(pool: Pool) {
  const { rows } = await pool.query(
    `SELECT id, branch, label, schema_name, notes, created_by, created_at
     FROM admin.db_checkpoints ORDER BY created_at DESC`
  );
  return rows;
}

export async function diffCheckpoint(pool: Pool, id: string) {
  const { rows } = await pool.query(
    `SELECT * FROM admin.diff_checkpoint($1)`, [id]
  );
  return rows;
}

export async function rollbackToCheckpoint(pool: Pool, id: string) {
  await pool.query(`BEGIN`);
  try {
    await pool.query(`SELECT admin.rollback_to_checkpoint($1)`, [id]);
    await pool.query(`COMMIT`);
  } catch (e) {
    await pool.query(`ROLLBACK`);
    throw e;
  }
}