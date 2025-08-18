import { Request, Response } from 'express';
import { db } from '../db';
import { redis } from './cache';
import { sql } from 'drizzle-orm';
import { APP_ENV, DB_HOST } from './env';

// Basic liveness check - just confirms service is running
export async function healthLive(req: Request, res: Response) {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'clean-flip-api',
    env: APP_ENV,
    dbHost: DB_HOST
  });
}

// Comprehensive readiness check - confirms all dependencies are healthy
export async function healthReady(req: Request, res: Response) {
  const checks = {
    database: 'checking',
    cache: 'checking',
    cloudinary: 'configured'
  };
  
  let overallStatus = 'ready';
  
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'disconnected';
    overallStatus = 'not ready';
  }
  
  try {
    // Test Redis connection
    if (redis && typeof (redis as any).ping === 'function') {
      await (redis as any).ping();
    }
    checks.cache = 'connected';
  } catch (error) {
    checks.cache = 'disconnected';
    overallStatus = 'degraded'; // Cache is optional, don't fail entirely
  }
  
  const statusCode = overallStatus === 'ready' ? 200 : 503;
  
  res.status(statusCode).json({ 
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: checks,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
}