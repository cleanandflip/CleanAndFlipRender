import { Router } from "express";
import { APP_ENV, DB_HOST } from "../config/env";
import { universalPool } from "../db/universal-pool";

export const universalHealth = Router();

universalHealth.get("/api/healthz", async (_req, res) => {
  try {
    if (!universalPool) {
      return res.json({ env: APP_ENV, db: 'unconfigured', role: null, host: DB_HOST, ok: true });
    }
    const r = await universalPool.query(`select current_database() as db, current_user as role`);
    res.json({ 
      env: APP_ENV, 
      db: r.rows[0]?.db || 'unknown',
      role: r.rows[0]?.role || 'unknown',
      host: DB_HOST,
      ok: true
    });
  } catch (error: any) {
    res.status(200).json({ env: APP_ENV, db: 'error', error: error?.message, ok: false });
  }
});