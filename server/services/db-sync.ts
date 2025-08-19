import { Pool } from "pg";
import { getPool, Branch } from "../db/registry";
import { createCheckpoint } from "../db/checkpoints";

// Helper: list tables in public schema, excluding admin/sessions if desired
async function listTables(pool: Pool): Promise<string[]> {
  const { rows } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
      AND table_name NOT IN ('sessions') -- optional
    ORDER BY table_name
  `);
  return rows.map(r => r.table_name);
}

// Copy all data from source→target (truncating target)
export async function syncDatabases(opts: {
  from: Branch;
  to: Branch;
  wsBroadcast?: (msg: any) => void;   // optional progress reporter
  actor?: string;                     // who launched sync
}) {
  const source = getPool(opts.from);
  const target = getPool(opts.to);

  if (opts.from === opts.to) throw new Error("from and to must differ");

  // 1) Create a target checkpoint (safety net)
  const ckptId = await createCheckpoint(target, opts.to, `autosync_${opts.from}_to_${opts.to}`, "Automatic checkpoint before sync", opts.actor);
  opts.wsBroadcast?.({ type: "sync/checkpoint-created", checkpointId: ckptId });

  // 2) Get tables
  const tables = await listTables(source);
  opts.wsBroadcast?.({ type: "sync/tables", tables });

  // 3) Advisory lock to avoid concurrent destructive ops
  await target.query(`SELECT pg_advisory_lock(123456789)`);

  try {
    await target.query('BEGIN');
    await target.query(`SET session_replication_role = replica`); // disable triggers/FKs

    // TRUNCATE all target tables
    for (const t of tables) {
      await target.query(`TRUNCATE TABLE public.${JSON.stringify(t).slice(1,-1)} CASCADE`);
    }
    opts.wsBroadcast?.({ type: "sync/truncated", count: tables.length });

    // For each table, stream from source and insert into target
    for (const t of tables) {
      opts.wsBroadcast?.({ type: "sync/table-start", table: t });

      // Get column list intersection
      const { rows: cols } = await target.query(`
        SELECT c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema='public' AND c.table_name=$1
        ORDER BY c.ordinal_position
      `, [t]);
      const colList = cols.map((c: any) => `"${c.column_name}"`).join(',');

      // Batch pull from source
      const batch = 5000;
      let offset = 0;
      let total = 0;

      while (true) {
        const { rows: chunk } = await source.query(
          `SELECT ${colList || '*'} FROM public.${JSON.stringify(t).slice(1,-1)} OFFSET $1 LIMIT $2`,
          [offset, batch]
        );
        if (!chunk.length) break;

        // Build multi-row INSERT
        const values: any[] = [];
        const placeholders: string[] = [];
        chunk.forEach((row, i) => {
          const cols = Object.values(row);
          const base = i*cols.length;
          placeholders.push(
            `(${cols.map((_c, j) => `$${base + j + 1}`).join(',')})`
          );
          values.push(...cols);
        });

        if (values.length) {
          await target.query(
            `INSERT INTO public.${JSON.stringify(t).slice(1,-1)} (${colList}) VALUES ${placeholders.join(',')}`,
            values
          );
        }

        offset += batch;
        total  += chunk.length;
        opts.wsBroadcast?.({ type: "sync/table-progress", table: t, total });
      }

      opts.wsBroadcast?.({ type: "sync/table-done", table: t, total });
    }

    // 4) Restore sequences from source
    const { rows: seqs } = await source.query(`
      SELECT sequence_schema, sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema='public'
    `);

    for (const s of seqs) {
      const q = `SELECT last_value FROM ${JSON.stringify(s.sequence_schema).slice(1,-1)}.${JSON.stringify(s.sequence_name).slice(1,-1)}`;
      const { rows } = await source.query(q);
      const last = rows[0]?.last_value ?? 1;
      await target.query(`SELECT setval($1, $2, true)`, [`"${s.sequence_schema}"."${s.sequence_name}"`, last]);
    }

    await target.query(`SET session_replication_role = origin`);
    await target.query('COMMIT');
    opts.wsBroadcast?.({ type: "sync/done", checkpointId: ckptId });
  } catch (e) {
    await target.query('ROLLBACK');
    opts.wsBroadcast?.({ type: "sync/error", error: String(e) });
    throw e;
  } finally {
    await target.query(`SELECT pg_advisory_unlock(123456789)`);
  }

  return { checkpointId: ckptId };
}