/** Public health endpoints - NO AUTH REQUIRED */
import { Router } from 'express';
import { universalPool } from '../db/universal-pool';
import { APP_ENV, dbHostFromUrl, DATABASE_URL } from '../config/env';

export const publicHealth = Router();

// Main health endpoint
publicHealth.get('/api/healthz', async (_req, res) => {
  try {
    const r = await universalPool.query(`SELECT current_database() as db, current_user as role`);
    res.json({ 
      env: APP_ENV, 
      dbHost: dbHostFromUrl(DATABASE_URL), 
      database: r.rows[0]?.db, 
      role: r.rows[0]?.role,
      timestamp: new Date().toISOString(),
      status: 'healthy'
    });
  } catch (error) {
    res.status(500).json({ 
      env: APP_ENV, 
      dbHost: dbHostFromUrl(DATABASE_URL), 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Back-compat aliases (public)
publicHealth.get('/health', (_req, res) => res.redirect(307, '/api/healthz'));
publicHealth.get('/api/admin/system/health', (_req, res) => res.redirect(307, '/api/healthz'));