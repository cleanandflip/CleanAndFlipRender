import { Router } from 'express';
import { ErrorLogger } from '../../services/errorLogger';
import { requireAuth, requireRole } from '../../auth';
import { UnifiedErrorHandler } from '../../middleware/unifiedErrorHandler';
// Legacy components removed

const router = Router();

// Middleware - require developer role for all error management routes
router.use(requireAuth);
router.use(requireRole('developer'));

// Legacy codebase scanner routes removed

// Get paginated errors with filters
router.get('/errors', async (req, res) => {
  try {
  const { 
    page = 1, 
    limit = 50, 
    severity, 
    resolved, 
    timeRange = '24h',
    search 
  } = req.query;

  const filters: any = {};
  
  if (severity && severity !== 'all') {
    filters.severity = severity;
  }
  
  if (resolved && resolved !== 'all') {
    filters.resolved = resolved === 'true';
  }
  
  // Get errors based on filters
  const errors = await ErrorLogger.getErrorsWithFilters(filters, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    timeRange: timeRange as string,
    search: search as string
  });

  res.json(errors);
  } catch (error) {
    console.error('Failed to get errors:', error);
    res.status(500).json({ error: 'Failed to get errors' });
  }
});

// Get error trends for analytics
router.get('/errors/trends', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    // For now, return mock data - implement getErrorTrends later
    res.json([]);
  } catch (error) {
    console.error('Failed to get error trends:', error);
    res.status(500).json({ error: 'Failed to get error trends' });
  }
});

// Get error statistics
router.get('/errors/stats', async (req, res) => {
  try {
    const stats = await ErrorLogger.getErrorStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get error stats:', error);
    res.status(500).json({ error: 'Failed to get error stats' });
  }
});

// Advanced Codebase Doctor Integration
// Legacy CodebaseDoctorService removed

// Run comprehensive codebase analysis
router.post('/codebase/analyze', async (req, res) => {
  try {
    const options = {
      includePerformance: req.body.includePerformance !== false,
      includeSecurity: req.body.includeSecurity !== false,
      includeCodeQuality: req.body.includeCodeQuality !== false,
      outputToDatabase: req.body.outputToDatabase === true
    };

    // Legacy codebase analysis removed - use new observability system
    res.status(410).json({ error: 'Legacy analysis deprecated. Use /api/observability instead.' });
  } catch (error: any) {
    console.error('Codebase analysis failed:', error);
    res.status(500).json({ error: 'Codebase analysis failed', details: error?.message || 'Unknown error' });
  }
});

// Get quick health check
router.get('/codebase/health', async (req, res) => {
  try {
    // Legacy health check - return minimal status
    res.json({ status: 'ok', findingsCount: 0, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: 'Health check failed', details: error?.message || 'Unknown error' });
  }
});

// Get last scan results
router.get('/codebase/last-scan', async (req, res) => {
  try {
    // Legacy scan results removed
    res.status(404).json({ error: 'No previous scan results found' });
  } catch (error) {
    console.error('Failed to get last scan:', error);
    res.status(500).json({ error: 'Failed to get last scan results' });
  }
});

// Get scan history
router.get('/codebase/history', async (req, res) => {
  try {
    // Legacy scan history removed
    res.json([]);
  } catch (error) {
    console.error('Failed to get scan history:', error);
    res.status(500).json({ error: 'Failed to get scan history' });
  }
});

// Generate detailed report
router.get('/codebase/report', async (req, res) => {
  try {
    const format = req.query.format === 'markdown' ? 'markdown' : 'json';
    // Legacy report generation removed
    res.status(410).json({ error: 'Legacy reporting deprecated. Use /api/observability for current error tracking.' });
  } catch (error: any) {
    console.error('Failed to generate report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error?.message || 'Unknown error' });
  }
});

// Log new errors from client
router.post('/errors/log', async (req, res) => {
  try {
    const { 
      message, 
      stack, 
      component, 
      action, 
      severity = 'medium',
      url,
      userAgent,
      userContext 
    } = req.body;

    await ErrorLogger.logError(new Error(message), {
      req: { url, userAgent, ip: req.ip },
      user: { id: req.user?.id },
      action,
      metadata: { component, severity, userContext }
    } as any);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// Get specific error details
router.get('/errors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const error = await ErrorLogger.getErrorById(id);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    res.json(error);
  } catch (error) {
    console.error('Failed to get error:', error);
    res.status(500).json({ error: 'Failed to get error' });
  }
});

// Resolve an error
router.post('/errors/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = 'Resolved via admin dashboard' } = req.body;
    
    // Since we may not have user authentication in all cases, handle gracefully
    const userId = req.user?.id || 'system';

    await ErrorLogger.resolveError(id, userId, notes);
    
    res.json({ success: true, message: 'Error resolved successfully' });
  } catch (error) {
    console.error('Failed to resolve error:', error);
    res.status(500).json({ error: 'Failed to resolve error' });
  }
});

// Bulk resolve errors
router.post('/errors/bulk-resolve', async (req, res) => {
  try {
    const { errorIds, notes } = req.body;
    const user = req.user as any;

    for (const errorId of errorIds) {
      await ErrorLogger.resolveError(errorId, user.id, notes);
    }
    
    res.json({ 
      success: true, 
      message: `${errorIds.length} errors resolved successfully` 
    });
  } catch (error) {
    console.error('Failed to bulk resolve errors:', error);
    res.status(500).json({ error: 'Failed to bulk resolve errors' });
  }
});

// Client-side error reporting endpoint
router.post('/errors/client', async (req, res) => {
  try {
    const errorData = req.body;
    
    // Create error from client-side data
    const error = new Error(errorData.message);
    error.stack = errorData.stack;
    
    const context = {
      req: {
        url: errorData.url,
        userAgent: errorData.userAgent,
        ip: req.ip
      },
      user: errorData.userContext,
      component: errorData.component,
      action: errorData.action,
      metadata: {
        breadcrumbs: errorData.breadcrumbs,
        clientSide: true,
        ...errorData.metadata
      }
    };

    await ErrorLogger.logError(error, context);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// Client-side log messages endpoint
router.post('/errors/client-log', async (req, res) => {
  try {
    const logData = req.body;
    
    const context = {
      req: {
        url: logData.url,
        userAgent: logData.userAgent,
        ip: req.ip
      },
      user: logData.userContext,
      action: logData.action,
      metadata: {
        breadcrumbs: logData.breadcrumbs,
        clientSide: true,
        level: logData.level,
        ...logData.metadata
      }
    };

    if (logData.level === 'error') {
      await ErrorLogger.logError(new Error(logData.message), context);
    } else if (logData.level === 'warning') {
      await ErrorLogger.logWarning(logData.message, context);
    } else {
      await ErrorLogger.logInfo(logData.message, context);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to log client message:', error);
    res.status(500).json({ error: 'Failed to log message' });
  }
});

// Performance metrics endpoint
router.post('/errors/performance', async (req, res) => {
  try {
    const metric = req.body;
    
    // Store performance metrics (could extend ErrorLogger or create separate service)
    await ErrorLogger.logInfo(`Performance: ${metric.name} took ${metric.value}ms`, {
      req: {
        url: metric.url,
        ip: req.ip
      },
      metadata: {
        performance: true,
        metric: metric.name,
        value: metric.value,
        timestamp: metric.timestamp
      }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to log performance metric:', error);
    res.status(500).json({ error: 'Failed to log performance metric' });
  }
});

// Route for frontend to log errors - standardized with proper error creation
router.post('/errors/log', async (req, res) => {
  try {
    const errorData = req.body;
    
    // Create proper error object
    const error = new Error(errorData.message || 'Client-side error');
    if (errorData.stack) {
      error.stack = errorData.stack;
    }
    
    const context = {
      req: {
        url: errorData.url || req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      },
      user: errorData.userContext,
      component: errorData.component,
      action: errorData.action,
      metadata: {
        breadcrumbs: errorData.breadcrumbs,
        clientSide: true,
        level: errorData.level || 'error',
        timestamp: errorData.timestamp || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...errorData.metadata
      }
    };
    
    // Log based on severity level
    if (errorData.level === 'error' || !errorData.level) {
      await ErrorLogger.logError(error, context);
    } else if (errorData.level === 'warning') {
      await ErrorLogger.logWarning(errorData.message, context);
    } else {
      await ErrorLogger.logInfo(errorData.message, context);
    }
    
    res.json({ success: true, message: 'Error logged successfully' });
  } catch (error) {
    console.error('Failed to log frontend error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

export default router;