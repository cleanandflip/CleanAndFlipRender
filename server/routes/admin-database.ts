import { Router } from 'express';
import { z } from 'zod';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { validateRequest } from '../middleware/validation';
import { getPool } from '../db/registry';
import { createCheckpoint, listCheckpoints, diffCheckpoint, rollbackToCheckpoint } from '../db/checkpoints';
import { syncDatabases } from '../services/db-sync';
import ws from 'ws';

// Configure Neon WebSocket constructor
neonConfig.webSocketConstructor = ws;

const router = Router();

// Database connection pools - use current DATABASE_URL for development, PROD_DATABASE_URL for production
const devPool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
const prodPool = process.env.PROD_DATABASE_URL ? new Pool({ connectionString: process.env.PROD_DATABASE_URL }) : null;

// Schema validation
const QueryRequestSchema = z.object({
  database: z.enum(['development', 'production']),
  query: z.string().min(1, 'Query cannot be empty'),
});

const TableDataRequestSchema = z.object({
  database: z.enum(['development', 'production']),
  table: z.string().min(1, 'Table name is required'),
  limit: z.number().min(1).max(1000).default(100),
});

// Helper to get the correct pool
function getDatabasePool(database: string): Pool | null {
  if (database === 'development') {
    return devPool;
  } else {
    return prodPool;
  }
}

// Helper to get database info
async function getDatabaseInfo(pool: Pool | null, dbName: string) {
  if (!pool) {
    return {
      name: dbName,
      tables: [],
      connectionStatus: 'error' as const,
      error: `${dbName === 'development' ? 'DATABASE_URL' : 'PROD_DATABASE_URL'} not configured`
    };
  }
  try {
    // Get all tables with row counts
    const tablesResult = await pool.query(`
      SELECT 
        schemaname as schema,
        tablename as name,
        schemaname || '.' || tablename as full_name
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename
    `);

    const tables = [];
    
    for (const table of tablesResult.rows) {
      try {
        // Get row count
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.full_name}`);
        const rowCount = parseInt(countResult.rows[0]?.count || '0');

        // Get column information
        const columnsResult = await pool.query(`
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable,
            column_default as default_value
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [table.schema, table.name]);

        const columns = columnsResult.rows.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.is_nullable === 'YES',
          default: col.default_value
        }));

        tables.push({
          name: table.name,
          schema: table.schema,
          rowCount,
          columns
        });
      } catch (error) {
        console.error(`Error getting info for table ${table.name}:`, error);
        // Add table with minimal info
        tables.push({
          name: table.name,
          schema: table.schema,
          rowCount: 0,
          columns: []
        });
      }
    }

    return {
      name: dbName,
      tables,
      connectionStatus: 'connected' as const,
    };
  } catch (error) {
    console.error(`Error connecting to ${dbName} database:`, error);
    return {
      name: dbName,
      tables: [],
      connectionStatus: 'error' as const,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

// Get database information
router.get('/databases', async (req, res) => {
  try {
    const [devInfo, prodInfo] = await Promise.all([
      getDatabaseInfo(devPool, 'development'),
      getDatabaseInfo(prodPool, 'production')
    ]);

    res.json({
      development: devInfo,
      production: prodInfo
    });
  } catch (error) {
    console.error('Error fetching database info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch database information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute SQL query
router.post('/database/query', validateRequest(QueryRequestSchema), async (req, res) => {
  const { database, query } = req.body;
  const pool = getDatabasePool(database);
  const startTime = Date.now();
  
  if (!pool) {
    return res.status(503).json({ 
      error: `${database} database not configured` 
    });
  }

  try {
    // Basic security: prevent dangerous operations
    const lowerQuery = query.toLowerCase().trim();
    const dangerousKeywords = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update'];
    const isDangerous = dangerousKeywords.some(keyword => lowerQuery.startsWith(keyword));
    
    if (isDangerous) {
      return res.status(403).json({ 
        error: 'Potentially dangerous query detected. Only SELECT queries are allowed for safety.' 
      });
    }

    // Execute query with timeout
    const result = await Promise.race([
      pool.query(query),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout (30s)')), 30000)
      )
    ]) as any;

    const duration = Date.now() - startTime;

    // Format response
    const response = {
      columns: result.fields?.map((field: any) => field.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || result.rows?.length || 0,
      duration
    };

    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query error in ${database} database:`, error);
    
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Query execution failed',
      duration
    });
  }
});

// Get table data
router.post('/database/table-data', validateRequest(TableDataRequestSchema), async (req, res) => {
  const { database, table, limit } = req.body;
  const pool = getDatabasePool(database);
  const startTime = Date.now();
  
  if (!pool) {
    return res.status(503).json({ 
      error: `${database} database not configured` 
    });
  }

  try {
    // Sanitize table name (basic protection)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const query = `SELECT * FROM ${table} ORDER BY 1 LIMIT ${limit}`;
    const result = await pool.query(query);
    const duration = Date.now() - startTime;

    const response = {
      columns: result.fields?.map((field: any) => field.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || result.rows?.length || 0,
      duration
    };

    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Table data error for ${table} in ${database}:`, error);
    
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch table data',
      duration
    });
  }
});

// === NEW CHECKPOINT & SYNC ROUTES ===

// List checkpoints (per branch DB)
router.get("/api/admin/db/:branch/checkpoints", async (req, res) => {
  try {
    const pool = getPool(req.params.branch === "prod" ? "prod" : "dev");
    const rows = await listCheckpoints(pool);
    res.json({ ok: true, checkpoints: rows });
  } catch (error) {
    console.error('Error listing checkpoints:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

// Create checkpoint
router.post("/api/admin/db/:branch/checkpoint", async (req, res) => {
  try {
    const { label, notes } = req.body || {};
    if (!label) return res.status(400).json({ ok: false, error: "Label required" });
    
    const branch = (req.params.branch === "prod" ? "prod" : "dev");
    const pool = getPool(branch);
    const id = await createCheckpoint(pool, branch, label, notes, req.body?.createdBy || "admin");
    res.json({ ok: true, id });
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

// Diff
router.get("/api/admin/db/:branch/checkpoints/:id/diff", async (req, res) => {
  try {
    const branch = (req.params.branch === "prod" ? "prod" : "dev");
    const pool = getPool(branch);
    const diff = await diffCheckpoint(pool, req.params.id);
    res.json({ ok: true, diff });
  } catch (error) {
    console.error('Error diffing checkpoint:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

// Rollback
router.post("/api/admin/db/:branch/rollback/:id", async (req, res) => {
  try {
    const branch = (req.params.branch === "prod" ? "prod" : "dev");
    const pool = getPool(branch);
    await rollbackToCheckpoint(pool, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error rolling back:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

// Fire-and-wait sync (simple). Requires admin.
router.post("/api/admin/db/sync", async (req, res) => {
  try {
    const { direction } = req.body as { direction: "dev_to_prod" | "prod_to_dev" };
    if (!direction) return res.status(400).json({ ok: false, error: "direction required" });

    const from = direction === "dev_to_prod" ? "dev" : "prod";
    const to   = direction === "dev_to_prod" ? "prod" : "dev";

    // optional: stricter confirmation for Dev→Prod
    if (direction === "dev_to_prod" && req.body?.confirmText !== "SYNC PRODUCTION") {
      return res.status(400).json({ ok: false, error: "Confirmation text mismatch" });
    }

    // Simple sync without WebSocket progress for now
    const result = await syncDatabases({
      from, to,
      actor: req.body?.createdBy || "admin"
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error syncing databases:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

export default router;