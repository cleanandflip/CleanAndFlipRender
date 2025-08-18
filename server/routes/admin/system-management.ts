import { Router } from 'express';
import { requireAuth, requireRole } from '../../auth';
import { SystemMonitor } from '../../services/systemMonitor';
import { PerformanceMonitor } from '../../services/performanceMonitor';
import { Logger } from '../../utils/logger';

const router = Router();

// Middleware - require developer role for all system management routes
router.use(requireAuth);
router.use(requireRole('developer'));

// Get comprehensive system health
router.get('/health', async (req, res) => {
  try {
    const systemHealth = await SystemMonitor.getSystemHealth();
    const performanceStats = PerformanceMonitor.getSystemStats();
    
    const response = {
      system: systemHealth,
      performance: performanceStats,
      errors: { message: 'Error tracking disabled' },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    Logger.error('Failed to get system health:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { timeWindow = 'hour', metricName, limit = 1000 } = req.query;
    
    const summary = PerformanceMonitor.getMetricsSummary(timeWindow as any);
    const metrics = PerformanceMonitor.getMetrics(metricName as string, parseInt(limit as string));
    const slowRoutes = PerformanceMonitor.getTopSlowRoutes(10);
    
    res.json({
      summary,
      metrics,
      slowRoutes,
      totalMetrics: metrics.length
    });
  } catch (error) {
    Logger.error('Failed to get performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Get system alerts
router.get('/alerts', async (req, res) => {
  try {
    const { resolved = false } = req.query;
    
    const alerts = resolved === 'true' ? 
      SystemMonitor.getAllAlerts() : 
      SystemMonitor.getActiveAlerts();
    
    res.json({
      alerts,
      totalAlerts: alerts.length
    });
  } catch (error) {
    Logger.error('Failed to get system alerts:', error);
    res.status(500).json({ error: 'Failed to get system alerts' });
  }
});

// Resolve a system alert
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const resolved = SystemMonitor.resolveAlert(alertId);
    
    if (resolved) {
      res.json({ success: true, message: 'Alert resolved successfully' });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    Logger.error('Failed to resolve alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Clear all resolved alerts
router.post('/alerts/cleanup', async (req, res) => {
  try {
    const clearedCount = SystemMonitor.clearResolvedAlerts();
    res.json({ 
      success: true, 
      message: `Cleared ${clearedCount} resolved alerts` 
    });
  } catch (error) {
    Logger.error('Failed to cleanup alerts:', error);
    res.status(500).json({ error: 'Failed to cleanup alerts' });
  }
});

// Get database status and performance
router.get('/database', async (req, res) => {
  try {
    const { db } = await import('../../db.js');
    
    const startTime = Date.now();
    await db.execute('SELECT 1');
    const latency = Date.now() - startTime;
    
    // Get database size information
    const sizeQuery = await db.execute(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_size_pretty(pg_total_relation_size('users')) as users_table_size,
        pg_size_pretty(pg_total_relation_size('products')) as products_table_size,
        pg_size_pretty(pg_total_relation_size('orders')) as orders_table_size
    `);
    
    const statsQuery = await db.execute(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
      LIMIT 10
    `);
    
    res.json({
      status: 'connected',
      latency,
      size_info: sizeQuery.rows[0],
      table_stats: statsQuery.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Failed to get database status:', error);
    res.status(500).json({ 
      error: 'Failed to get database status',
      status: 'disconnected'
    });
  }
});

// Get comprehensive system logs
router.get('/logs', async (req, res) => {
  try {
    const { 
      level = 'info', 
      limit = 100, 
      timeRange = '1h' 
    } = req.query;
    
    // This would integrate with your logging system
    // For now, return a placeholder response
    res.json({
      logs: [],
      totalCount: 0,
      filters: {
        level,
        limit: parseInt(limit as string),
        timeRange
      },
      message: 'Log aggregation system not yet implemented'
    });
  } catch (error) {
    Logger.error('Failed to get system logs:', error);
    res.status(500).json({ error: 'Failed to get system logs' });
  }
});

// Run system diagnostics
router.post('/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Database connectivity test
    try {
      const { db } = await import('../../db.js');
      const start = Date.now();
      await db.execute('SELECT 1');
      (diagnostics.tests as any[]).push({
        name: 'Database Connection',
        status: 'passed',
        duration: Date.now() - start,
        message: 'Database connection successful'
      });
    } catch (error) {
      (diagnostics.tests as any[]).push({
        name: 'Database Connection',
        status: 'failed',
        error: (error as Error).message
      });
    }
    
    // Memory usage test
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    (diagnostics.tests as any[]).push({
      name: 'Memory Usage',
      status: memPercent > 85 ? 'warning' : 'passed',
      value: `${Math.round(memPercent)}%`,
      message: `Heap usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    });
    
    // Disk usage test (if available)
    try {
      const { execSync } = require('child_process');
      const diskUsage = execSync('df -h / | tail -1').toString().trim();
      (diagnostics.tests as any[]).push({
        name: 'Disk Usage',
        status: 'passed',
        value: diskUsage.split(/\s+/)[4],
        message: `Disk usage information: ${diskUsage}`
      });
    } catch (error) {
      (diagnostics.tests as any[]).push({
        name: 'Disk Usage',
        status: 'skipped',
        message: 'Disk usage check not available in this environment'
      });
    }
    
    // Performance test
    const perfStats = PerformanceMonitor.getMetricsSummary('hour');
    const avgResponseTime = perfStats.request_duration?.avg || 0;
    (diagnostics.tests as any[]).push({
      name: 'Response Time',
      status: avgResponseTime > 1000 ? 'warning' : 'passed',
      value: `${Math.round(avgResponseTime)}ms`,
      message: `Average response time over last hour`
    });
    
    res.json(diagnostics);
  } catch (error) {
    Logger.error('Failed to run diagnostics:', error);
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

export { router as systemManagementRoutes };