import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/require-admin";
import { 
  listTables, 
  tableColumns, 
  tableIndexes, 
  migrationHistory, 
  executeQuery,
  getTableRowCount,
  logAdminAction 
} from "../db/admin.sql";
import { getPool, type Branch } from "../db/registry";
import { spawn } from "node:child_process";
import { createCheckpoint, listCheckpoints, diffCheckpoint, rollbackToCheckpoint } from "../db/checkpoints";
import { syncDatabases } from "../services/db-sync";
// File imports removed - using in-memory storage instead

// Helper function to get database connection for branch
const getDbForBranch = (branch: Branch) => {
  // Use the registry system for now 
  return getPool(branch);
};

const r = Router();
r.use(requireAdmin);

const BranchSchema = z.enum(["dev", "prod"]);

// Get available database branches
r.get("/branches", (_req, res) => {
  res.json([
    { 
      key: "dev", 
      name: "Development (lucky-poetry)",
      url: process.env.DEV_DATABASE_URL ? "configured" : "missing" 
    },
    { 
      key: "prod", 
      name: "Production (muddy-moon)",
      url: process.env.PROD_DATABASE_URL ? "configured" : "missing" 
    }
  ]);
});

// Get tables for a branch
r.get("/:branch/tables", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const tables = await listTables(branch);
    res.json(tables);
  } catch (error: any) {
    console.error(`Error fetching tables for ${req.params.branch}:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch tables" });
  }
});

// Get table details (columns and indexes)
r.get("/:branch/tables/:schema/:table", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { schema, table } = req.params;
    
    const [columns, indexes, rowCount] = await Promise.all([
      tableColumns(branch, schema, table),
      tableIndexes(branch, schema, table),
      getTableRowCount(branch, schema, table)
    ]);
    
    res.json({ columns, indexes, rowCount });
  } catch (error: any) {
    console.error(`Error fetching table details:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch table details" });
  }
});

// Get migration history
r.get("/:branch/migrations", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const migrations = await migrationHistory(branch);
    res.json(migrations);
  } catch (error: any) {
    console.error(`Error fetching migrations:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch migrations" });
  }
});

// Execute SQL query
r.post("/:branch/query", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Query is required" });
    }
    
    // Basic SQL injection protection - allow only SELECT statements for now
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select') && !trimmedQuery.startsWith('with')) {
      return res.status(400).json({ 
        error: "Only SELECT and WITH queries are allowed for security" 
      });
    }
    
    const result = await executeQuery(branch, query);
    
    // Log the query execution
    await logAdminAction(branch, req.user?.id || 'unknown', 'query_executed', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      branch,
      success: result.success
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
      duration: result.duration
    });
  } catch (error: any) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: error.message || "Query execution failed" });
  }
});

// Get table data with pagination
r.post("/:branch/table-data", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { table, schema = 'public', limit = 100, offset = 0 } = req.body;
    
    if (!table) {
      return res.status(400).json({ error: "Table name is required" });
    }
    
    const query = `SELECT * FROM ${schema}.${table} LIMIT ${limit} OFFSET ${offset}`;
    const result = await executeQuery(branch, query);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
      duration: result.duration
    });
  } catch (error: any) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: error.message || "Failed to fetch table data" });
  }
});

// Run migrations UP or DOWN (typed confirmation for prod)
r.post("/:branch/migrate", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const direction = z.enum(["up", "down"]).parse(req.query.dir ?? "up");
    const steps = Number(req.query.steps ?? 1);

    // Require confirmation for production rollbacks
    if (branch === "prod" && direction === "down") {
      if (req.body?.confirm !== `ROLLBACK ${steps}`) {
        return res.status(400).json({ 
          error: `Type confirmation phrase: ROLLBACK ${steps}` 
        });
      }
    }

    const databaseUrl = branch === "dev" 
      ? process.env.DEV_DATABASE_URL 
      : process.env.PROD_DATABASE_URL;
      
    if (!databaseUrl) {
      return res.status(500).json({ 
        error: `Database URL not configured for ${branch}` 
      });
    }

    const env = { ...process.env, DATABASE_URL: databaseUrl };
    const args = [direction, "-m", "server/db/migrations"];
    
    if (direction === "down" && steps > 1) {
      for (let i = 1; i < steps; i++) {
        args.push("--count", "1");
      }
    }

    const child = spawn("node-pg-migrate", args, { env });

    let out = "";
    let err = "";
    child.stdout?.on("data", (d) => (out += d.toString()));
    child.stderr?.on("data", (d) => (err += d.toString()));

    child.on("close", async (code) => {
      // Log the migration action
      await logAdminAction(branch, req.user?.id || 'unknown', 'migration_executed', {
        direction,
        steps,
        branch,
        success: code === 0,
        output: out,
        error: err
      });
      
      res.status(code === 0 ? 200 : 500).json({ 
        ok: code === 0, 
        output: out, 
        error: err 
      });
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message || "Migration failed" });
  }
});

// Get table data preview
r.post("/:branch/table-data", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { table, schema = 'public', limit = 10, offset = 0 } = req.body;
    
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    const db = getDbForBranch(branch);
    
    // Get sample data from table
    const dataQuery = `
      SELECT * FROM "${schema}"."${table}" 
      LIMIT $1 OFFSET $2
    `;
    const dataResult = await db.query(dataQuery, [limit, offset]);
    
    // Get column information for display
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;
    const columnsResult = await db.query(columnsQuery, [schema, table]);

    res.json({
      success: true,
      rows: dataResult.rows,
      columns: columnsResult.rows,
      total_count: dataResult.rows.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error(`[ADMIN] Error fetching table data:`, error);
    res.status(500).json({ error: 'Failed to fetch table data' });
  }
});

// Simple in-memory checkpoint storage
const checkpointStore: Record<string, any[]> = { dev: [], prod: [] };

// Create checkpoint with in-memory storage
r.post("/:branch/checkpoint", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { label, notes } = req.body;
    
    if (!label) {
      return res.status(400).json({ error: "Checkpoint label is required" });
    }
    
    // Generate checkpoint ID and timestamp
    const checkpointId = `checkpoint_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const checkpoint = {
      id: checkpointId,
      label,
      notes: notes || '',
      branch,
      created_at: timestamp,
      created_by: req.user?.id || 'system'
    };
    
    // Store in memory - works immediately
    checkpointStore[branch].push(checkpoint);
    
    res.json({
      success: true,
      message: `Checkpoint '${label}' created for ${branch} branch`,
      id: checkpointId,
      created_at: timestamp
    });
  } catch (error: any) {
    console.error("Error creating checkpoint:", error);
    res.status(500).json({ error: error.message || "Failed to create checkpoint" });
  }
});

// List checkpoints from memory storage
r.get("/:branch/checkpoints", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    
    const checkpoints = checkpointStore[branch] || [];
    const sortedCheckpoints = checkpoints
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
    
    res.json(sortedCheckpoints);
  } catch (error: any) {
    console.error('Error fetching checkpoints:', error);
    res.status(500).json({ error: error.message || "Failed to fetch checkpoints" });
  }
});

// Rollback database to checkpoint
r.post("/:branch/rollback/:checkpointId", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { checkpointId } = req.params;
    const { confirmPhrase } = req.body;
    
    // Require confirmation phrase for destructive operation
    if (confirmPhrase !== `ROLLBACK ${branch.toUpperCase()}`) {
      return res.status(400).json({ 
        error: `Please type "ROLLBACK ${branch.toUpperCase()}" to confirm this destructive operation` 
      });
    }

    // Get checkpoint details
    const db = getDbForBranch(branch);
    const checkpointQuery = `
      SELECT 
        details->>'label' as label,
        details->>'notes' as notes,
        created_at
      FROM admin_actions 
      WHERE (details->>'checkpoint_id' = $1 OR id::text = $1) AND action = 'checkpoint_created'
    `;
    
    const checkpointResult = await db.query(checkpointQuery, [checkpointId]);
    if (checkpointResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }

    const checkpoint = checkpointResult.rows[0];
    
    // Log the rollback action
    await logAdminAction(branch, 'rollback_executed', req.user?.id || 'system', {
      checkpointId,
      checkpointLabel: checkpoint.label,
      checkpointDate: checkpoint.created_at,
      branch,
      confirmPhrase
    });

    // Use the new real checkpoint system
    await rollbackToCheckpoint(getPool(branch), checkpointId);
    
    res.json({
      success: true,
      message: `Database rollback to checkpoint '${checkpoint.label}' completed successfully`,
      checkpoint: {
        id: checkpointId,
        label: checkpoint.label,
        created_at: checkpoint.created_at
      }
    });
    
  } catch (error: any) {
    console.error('Rollback error:', error);
    res.status(500).json({ error: error.message || "Rollback failed" });
  }
});

// ============= NEW CHECKPOINT ROUTES =============

// List checkpoints for a branch
r.get("/:branch/checkpoints-v2", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const pool = getPool(branch);
    const checkpoints = await listCheckpoints(pool);
    res.json({ ok: true, checkpoints });
  } catch (error: any) {
    console.error('Error fetching checkpoints:', error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch checkpoints" });
  }
});

// Create checkpoint
r.post("/:branch/checkpoint-v2", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { label, notes } = req.body || {};
    if (!label) return res.status(400).json({ ok: false, error: "Label required" });
    
    const pool = getPool(branch);
    const id = await createCheckpoint(pool, branch, label, notes, req.user?.email || "admin");
    
    // Log the action
    await logAdminAction(branch, req.user?.id || 'unknown', 'checkpoint_created_v2', {
      checkpointId: id,
      label,
      notes,
      branch
    });
    
    res.json({ ok: true, id });
  } catch (error: any) {
    console.error('Error creating checkpoint:', error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create checkpoint" });
  }
});

// Get checkpoint diff
r.get("/:branch/checkpoints-v2/:id/diff", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const pool = getPool(branch);
    const diff = await diffCheckpoint(pool, req.params.id);
    res.json({ ok: true, diff });
  } catch (error: any) {
    console.error('Error getting checkpoint diff:', error);
    res.status(500).json({ ok: false, error: error.message || "Failed to get checkpoint diff" });
  }
});

// Rollback to checkpoint (new implementation)
r.post("/:branch/rollback-v2/:id", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { id } = req.params;
    const { confirmPhrase } = req.body;
    
    // Require confirmation phrase for destructive operation
    if (confirmPhrase !== `ROLLBACK ${branch.toUpperCase()}`) {
      return res.status(400).json({ 
        ok: false,
        error: `Please type "ROLLBACK ${branch.toUpperCase()}" to confirm this destructive operation` 
      });
    }

    const pool = getPool(branch);
    await rollbackToCheckpoint(pool, id);
    
    // Log the rollback action
    await logAdminAction(branch, req.user?.id || 'unknown', 'rollback_executed_v2', {
      checkpointId: id,
      branch,
      confirmPhrase
    });
    
    res.json({ ok: true, message: "Rollback completed successfully" });
  } catch (error: any) {
    console.error('Rollback error:', error);
    res.status(500).json({ ok: false, error: error.message || "Rollback failed" });
  }
});

// ============= DATABASE SYNC ROUTES =============

// Fire-and-wait sync (simple). Requires admin.
r.post("/sync", async (req: any, res) => {
  try {
    const { direction } = req.body as { direction: "dev_to_prod" | "prod_to_dev" };
    if (!direction) return res.status(400).json({ ok: false, error: "direction required" });

    const from = direction === "dev_to_prod" ? "dev" : "prod";
    const to   = direction === "dev_to_prod" ? "prod" : "dev";

    // Stricter confirmation for Dev→Prod
    if (direction === "dev_to_prod" && req.body?.confirmText !== "SYNC PRODUCTION") {
      return res.status(400).json({ ok: false, error: "Confirmation text mismatch" });
    }

    // Simple broadcast function for progress
    const wsBroadcast = (msg: any) => {
      // If you have WebSocket setup, broadcast here
      console.log('DB Sync Progress:', msg);
    };

    const result = await syncDatabases({
      from, to,
      wsBroadcast,
      actor: req.user?.email || "admin"
    });
    
    // Log the sync action
    await logAdminAction(to, req.user?.id || 'unknown', 'database_sync', {
      direction,
      from,
      to,
      checkpointId: result.checkpointId,
      actor: req.user?.email || "admin"
    });
    
    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Database sync error:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});

export default r;