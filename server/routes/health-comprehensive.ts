import { Router } from 'express';
import { db } from '../db';
import { Logger } from '../utils/logger';

const router = Router();

// Comprehensive health check with database connectivity
router.get('/health', async (req, res) => {
  const healthData: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    services: {}
  };

  let overallStatus = 'healthy';

  try {
    // Test database connection
    const dbStart = Date.now();
    await db.execute('SELECT 1');
    const dbDuration = Date.now() - dbStart;
    
    healthData.services.database = {
      status: 'healthy',
      responseTime: `${dbDuration}ms`,
      details: 'Connection successful'
    };
    
    if (dbDuration > 2000) {
      healthData.services.database.status = 'degraded';
      healthData.services.database.warning = 'Slow response time';
      overallStatus = 'degraded';
    }
  } catch (error: any) {
    healthData.services.database = {
      status: 'unhealthy',
      error: error.message,
      details: 'Database connection failed'
    };
    overallStatus = 'unhealthy';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  healthData.services.memory = {
    status: memUsedPercent < 85 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    usage: `${Math.round(memUsedPercent)}%`
  };
  
  if (memUsedPercent > 90) {
    healthData.services.memory.status = 'critical';
    overallStatus = 'unhealthy';
  }

  // Environment variables check
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'STRIPE_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  healthData.services.configuration = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
    requiredVariables: requiredEnvVars.length,
    configured: requiredEnvVars.length - missingEnvVars.length,
    missing: missingEnvVars
  };
  
  if (missingEnvVars.length > 0) {
    overallStatus = 'unhealthy';
  }

  healthData.status = overallStatus;
  
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthData);
});

// Simple liveness probe
router.get('/health/live', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe with critical service checks
router.get('/health/ready', async (req, res) => {
  try {
    // Quick database check
    await db.execute('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: ['database', 'session', 'filesystem']
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Database not ready'
    });
  }
});

// Metrics endpoint for monitoring
router.get('/health/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      application: {
        environment: process.env.NODE_ENV,
        pid: process.pid,
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
      }
    };
    
    res.json(metrics);
  } catch (error) {
    Logger.error('Health metrics error:', error);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

export default router;