/** Public health endpoints - NO AUTH REQUIRED */
import { Router } from 'express';
import { universalPool } from '../db/universal-pool';
import { APP_ENV, DB_HOST } from '../config/env';

export const publicHealth = Router();

publicHealth.get('/healthz', (_req, res) => res.status(200).send('ok'));

publicHealth.get('/api/healthz', async (_req, res) => {
  try {
    if (!universalPool) {
      return res.json({ env: APP_ENV, db: 'unconfigured', role: null, host: DB_HOST, ok: true });
    }
    const r = await universalPool.query(`SELECT current_database() as db, current_user as role`);
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

// Back-compat aliases (public)
publicHealth.get('/health', (_req, res) => res.redirect(307, '/api/healthz'));
publicHealth.get('/api/admin/system/health', (_req, res) => res.redirect(307, '/api/healthz'));