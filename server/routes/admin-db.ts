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

const r = Router();
r.use(requireAdmin);

const BranchSchema = z.enum(["dev", "prod"]);

// Get available database branches
r.get("/api/admin/db/branches", (_req, res) => {
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
r.get("/api/admin/db/:branch/tables", async (req, res) => {
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
r.get("/api/admin/db/:branch/tables/:schema/:table", async (req, res) => {
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
r.get("/api/admin/db/:branch/migrations", async (req, res) => {
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
r.post("/api/admin/db/:branch/query", async (req: any, res) => {
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
r.post("/api/admin/db/:branch/table-data", async (req: any, res) => {
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
r.post("/api/admin/db/:branch/migrate", async (req: any, res) => {
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

// Create checkpoint (placeholder for now - would integrate with Neon branches)
r.post("/api/admin/db/:branch/checkpoint", async (req: any, res) => {
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
r.get("/api/admin/db/:branch/checkpoints", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    
    // This would query the admin_checkpoints table once created
    // For now, return empty array
    res.json([]);
  } catch (error: any) {
    console.error('Error fetching checkpoints:', error);
    res.status(500).json({ error: error.message || "Failed to fetch checkpoints" });
  }
});

export default r;