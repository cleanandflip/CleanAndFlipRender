import { Router } from 'express';
import { requireAuth, requireRole } from '../../auth';

// ALL ERROR MANAGEMENT COMPLETELY REMOVED
// This file will be rebuilt later with proper implementation

const router = Router();

// Middleware - require developer role for all error management routes
router.use(requireAuth);
router.use(requireRole('developer'));

// ALL ERROR ROUTES REMOVED - NO MORE /api/errors/client ENDPOINT

export default router;