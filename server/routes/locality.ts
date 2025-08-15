import { Router } from 'express';
import { getLocalityForRequest } from '../services/localityService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/locality/status - SSOT locality evaluation with optional auth
router.get('/status', authMiddleware.optionalAuth, async (req, res) => {
  try {
    // Use SSOT service with optional ZIP override
    const zipOverride = req.query.zip as string | undefined;
    const localityResult = await getLocalityForRequest(req, zipOverride);
    
    // Return the LocalityResult directly as per contract
    res.json(localityResult);
    
  } catch (error) {
    console.error('[LOCALITY] Error in /api/locality/status:', error);
    
    // Structured error response matching LocalityResult shape
    res.status(500).json({
      status: 'UNKNOWN',
      source: 'default',
      eligible: false,
      effectiveModeForUser: 'NONE',
      reasons: ['System error determining locality'],
      ssotVersion: 'v2024.1',
      asOfISO: new Date().toISOString()
    });
  }
});

export default router;