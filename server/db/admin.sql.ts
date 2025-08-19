import { getPool, type Branch } from "./registry";

export async function listTables(branch: Branch) {
  const db = getPool(branch);
  const q = `
    select
      t.table_schema,
      t.table_name,
      t.table_type,
      coalesce(pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)), 0) as total_bytes,
      coalesce(
        (select reltuples::bigint 
         from pg_class c 
         join pg_namespace n on n.oid = c.relnamespace 
         where n.nspname = t.table_schema and c.relname = t.table_name), 
        0
      ) as row_count_estimate
    from information_schema.tables t
    where t.table_schema not in ('pg_catalog','information_schema')
    order by t.table_schema, t.table_name;
  `;
  const { rows } = await db.query(q);
  return rows;
}

export async function tableColumns(branch: Branch, schema: string, table: string) {
  const db = getPool(branch);
  const q = `
    select
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    from information_schema.columns
    where table_schema = $1 and table_name = $2
    order by ordinal_position;
  `;
  const { rows } = await db.query(q, [schema, table]);
  return rows;
}

export async function tableIndexes(branch: Branch, schema: string, table: string) {
  const db = getPool(branch);
  const q = `
    select
      i.relname as index_name,
      pg_get_indexdef(ix.indexrelid) as definition,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary
    from pg_class t
    join pg_namespace n on n.oid = t.relnamespace
    join pg_index ix on t.oid = ix.indrelid
    join pg_class i on i.oid = ix.indexrelid
    where n.nspname = $1 and t.relname = $2
    order by is_primary desc, is_unique desc, index_name;
  `;
  const { rows } = await db.query(q, [schema, table]);
  return rows;
}

export async function migrationHistory(branch: Branch) {
  const db = getPool(branch);
  // node-pg-migrate default table
  const q = `select id, name, run_on from pgmigrations order by run_on desc;`;
  try {
    const { rows } = await db.query(q);
    return rows;
  } catch {
    return []; // table not created yet
  }
}

export async function getTableRowCount(branch: Branch, schema: string, table: string) {
  const db = getPool(branch);
  try {
    const q = `SELECT COUNT(*) as count FROM "${schema}"."${table}"`;
    const { rows } = await db.query(q);
    return parseInt(rows[0].count);
  } catch {
    return 0;
  }
}

export async function executeQuery(branch: Branch, query: string) {
  const db = getPool(branch);
  const startTime = Date.now();
  
  try {
    const result = await db.query(query);
    const duration = Date.now() - startTime;
    
    return {
      columns: result.fields?.map(f => f.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      duration,
      success: true
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

export async function logAdminAction(branch: Branch, action: string, actorId: string | null, details: object) {
  const db = getPool(branch);
  try {
    await db.query(
      'INSERT INTO admin_actions (actor_id, action, details) VALUES ($1, $2, $3)',
      [actorId, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}