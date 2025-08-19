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

// Helper function to get database connection for branch
const getDbForBranch = (branch: Branch) => {
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

// Create checkpoint (placeholder for now - would integrate with Neon branches)
r.post("/:branch/checkpoint", async (req: any, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { label, notes } = req.body;
    
    if (!label) {
      return res.status(400).json({ error: "Checkpoint label is required" });
    }
    
    // Log the checkpoint creation attempt
    await logAdminAction(branch, req.user?.id || 'unknown', 'checkpoint_created', {
      label,
      notes,
      branch
    });
    
    // This would integrate with Neon's branch API or implement pg_dump strategy
    res.json({ 
      success: true, 
      message: `Checkpoint '${label}' created for ${branch} branch`,
      id: `checkpoint_${Date.now()}`,
      created_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Checkpoint creation error:', error);
    res.status(500).json({ error: error.message || "Checkpoint creation failed" });
  }
});

// List checkpoints
r.get("/:branch/checkpoints", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    
    // Get checkpoints from admin_actions table where action_type = 'checkpoint_created'
    const db = getDbForBranch(branch);
    const checkpointsQuery = `
      SELECT 
        action_metadata->>'label' as label,
        action_metadata->>'notes' as notes,
        action_metadata->>'branch' as branch,
        created_at,
        id as checkpoint_id
      FROM admin_actions 
      WHERE action_type = 'checkpoint_created' 
        AND action_metadata->>'branch' = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(checkpointsQuery, [branch]);
    const checkpoints = result.rows.map((row: any) => ({
      id: row.checkpoint_id,
      label: row.label,
      notes: row.notes,
      branch: row.branch,
      created_at: row.created_at
    }));
    
    res.json(checkpoints);
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
        action_metadata->>'label' as label,
        action_metadata->>'notes' as notes,
        created_at
      FROM admin_actions 
      WHERE id = $1 AND action_type = 'checkpoint_created'
    `;
    
    const checkpointResult = await db.query(checkpointQuery, [checkpointId]);
    if (checkpointResult.rows.length === 0) {
      return res.status(404).json({ error: 'Checkpoint not found' });
    }

    const checkpoint = checkpointResult.rows[0];
    
    // Log the rollback action
    await logAdminAction(branch, req.user?.id || 'unknown', 'rollback_executed', {
      checkpointId,
      checkpointLabel: checkpoint.label,
      checkpointDate: checkpoint.created_at,
      branch,
      confirmPhrase
    });

    // In a real implementation, this would:
    // 1. Create a backup of current state
    // 2. Execute the rollback using pg_restore or similar
    // 3. Verify the rollback was successful
    
    // For now, return success with warning that this is a placeholder
    res.json({
      success: true,
      message: `Database rollback to checkpoint '${checkpoint.label}' has been initiated`,
      checkpoint: {
        id: checkpointId,
        label: checkpoint.label,
        created_at: checkpoint.created_at
      },
      warning: "This is a placeholder implementation. In production, this would perform actual database rollback."
    });
    
  } catch (error: any) {
    console.error('Rollback error:', error);
    res.status(500).json({ error: error.message || "Rollback failed" });
  }
});

export default r;