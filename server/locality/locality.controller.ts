// Unified Locality Controller - Single Source of Truth
// Provides GET /api/locality/status endpoint with comprehensive locality evaluation

import type { Request, Response } from 'express';
import { getLocalityForRequest } from './getLocalityForRequest';
import { getUserIdFromReq } from '../utils/auth';

export async function getLocalityStatus(req: Request, res: Response) {
  try {
    const zipOverride = req.query.zip as string | undefined;
    const status = await getLocalityForRequest(req, zipOverride || null);
    
    // Clear, useful instrumentation
    console.log('[LOCALITY] /status', {
      eligible: status.eligible,
      source: status.source,
      zip: status.zipUsed || 'none',
      user: getUserIdFromReq(req) || 'guest'
    });
    
    res.json(status);
  } catch (error) {
    console.error('Locality status error:', error);
    res.status(500).json({
      eligible: false,
      source: 'ERROR',
      zipUsed: null,
      error: 'Failed to determine locality status'
    });
  }
}