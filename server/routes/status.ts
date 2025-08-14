import { Router } from 'express';

const router = Router();

// Status endpoint - returns stable version without changing timestamps
router.get('/status', (req, res) => {
  res.json({
    ok: true,
    version: process.env.COMMIT_SHA || process.env.APP_VERSION || 'dev',
    environment: process.env.NODE_ENV || 'development',
    // DO NOT include Date.now() or volatile fields that change each request
  });
});

export default router;