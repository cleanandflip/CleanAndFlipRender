import { Router } from "express";
import { APP_ENV, DB_HOST } from "../config/env";
import { universalPool } from "../db/universal-pool";

export const universalHealth = Router();

universalHealth.get("/api/healthz", async (_req, res) => {
  try {
    const r = await universalPool.query(`select current_database() as db, current_user as role`);
    res.json({ 
      env: APP_ENV, 
      dbHost: DB_HOST, 
      database: r.rows[0]?.db, 
      role: r.rows[0]?.role,
      timestamp: new Date().toISOString(),
      status: "healthy"
    });
  } catch (error) {
    res.status(500).json({
      env: APP_ENV,
      dbHost: DB_HOST,
      error: "Database connection failed",
      timestamp: new Date().toISOString(),
      status: "unhealthy"
    });
  }
});