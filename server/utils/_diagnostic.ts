// Temporary diagnostic endpoints for debugging routing issues
import type { Application } from 'express';
import { getUserIdFromReq } from './auth';

export function addDiagnosticRoutes(app: Application) {
  app.get('/api/_whoami', (req, res) => res.json({
    user: getUserIdFromReq(req) || 'guest',
    hasSessionCookie: Boolean(req.headers.cookie?.includes('cf.sid')),
    sessionId: req.sessionID
  }));

  app.get('/api/_route-health', (req, res) => res.json({
    cartPost: 'v2',
    localitySource: 'shared/evaluateLocality',
  }));
}