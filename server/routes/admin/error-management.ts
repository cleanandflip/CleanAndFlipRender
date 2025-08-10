import { Router } from 'express';
import { ErrorLogger } from '../../services/errorLogger';
// Remove unused import
import { requireAuth, requireRole } from '../../auth';
import { UnifiedErrorHandler } from '../../middleware/unifiedErrorHandler';

const router = Router();

// Middleware - require developer role for all error management routes
router.use(requireAuth);
router.use(requireRole('developer'));

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
    const { notes } = req.body;
    const user = req.user as any;

    await ErrorLogger.resolveError(id, user.id, notes);
    
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

export { router as errorManagementRoutes };