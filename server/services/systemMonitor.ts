import { Logger } from '../utils/logger';
import { PerformanceMonitor } from './performanceMonitor';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  alerts: SystemAlert[];
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export class SystemMonitor {
  private static alerts: SystemAlert[] = [];
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static readonly ALERT_RETENTION_HOURS = 24;
  private static readonly MAX_ALERTS = 100;

  static startMonitoring(): void {
    if (this.monitoringInterval) return;

    // Monitor system health every 60 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth();
    }, 60000);

    Logger.info('System monitoring started');
  }

  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      Logger.info('System monitoring stopped');
    }
  }

  private static async checkSystemHealth(): Promise<void> {
    try {
      const health = await this.getSystemHealth();
      
      // Check for alerts
      this.checkMemoryUsage(health.memory);
      this.checkDatabaseHealth(health.database);
      this.checkPerformanceMetrics(health.performance);
      
      // Log system status
      if (health.status !== 'healthy') {
        Logger.warn('System health warning detected', { health });
      }
      
    } catch (error) {
      this.addAlert('critical', 'System health check failed', error);
    }
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get performance metrics
    const performanceMetrics = PerformanceMonitor.getMetricsSummary('hour');
    
    // Calculate memory percentage
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercent = (memoryUsedMB / memoryTotalMB) * 100;

    // Test database connection
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    let dbLatency = 0;
    try {
      const { db } = await import('../db.js');
      const start = Date.now();
      await db.execute('SELECT 1');
      dbLatency = Date.now() - start;
    } catch (error) {
      dbStatus = 'disconnected';
      dbLatency = -1;
    }

    // Calculate performance metrics
    const avgResponseTime = performanceMetrics.request_duration?.avg || 0;
    const errorRate = this.calculateErrorRate();
    const requestsPerMinute = this.calculateRequestsPerMinute();

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (memoryPercent > 85 || dbStatus === 'disconnected' || avgResponseTime > 1000) {
      status = 'critical';
    } else if (memoryPercent > 70 || avgResponseTime > 500 || errorRate > 5) {
      status = 'warning';
    }

    return {
      status,
      uptime: Math.floor(uptime),
      memory: {
        used: memoryUsedMB,
        total: memoryTotalMB,
        percentage: Math.round(memoryPercent)
      },
      database: {
        status: dbStatus,
        latency: dbLatency
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerMinute: Math.round(requestsPerMinute)
      },
      alerts: this.getActiveAlerts(),
      timestamp: new Date().toISOString()
    };
  }

  private static checkMemoryUsage(memory: { percentage: number }): void {
    if (memory.percentage > 90) {
      this.addAlert('critical', `Critical memory usage: ${memory.percentage}%`);
    } else if (memory.percentage > 80) {
      this.addAlert('warning', `High memory usage: ${memory.percentage}%`);
    }
  }

  private static checkDatabaseHealth(database: { status: string; latency: number }): void {
    if (database.status === 'disconnected') {
      this.addAlert('critical', 'Database connection lost');
    } else if (database.latency > 1000) {
      this.addAlert('warning', `High database latency: ${database.latency}ms`);
    }
  }

  private static checkPerformanceMetrics(performance: { avgResponseTime: number; errorRate: number }): void {
    if (performance.avgResponseTime > 2000) {
      this.addAlert('critical', `Very slow response time: ${performance.avgResponseTime}ms`);
    } else if (performance.avgResponseTime > 1000) {
      this.addAlert('warning', `Slow response time: ${performance.avgResponseTime}ms`);
    }

    if (performance.errorRate > 10) {
      this.addAlert('critical', `High error rate: ${performance.errorRate}%`);
    } else if (performance.errorRate > 5) {
      this.addAlert('warning', `Elevated error rate: ${performance.errorRate}%`);
    }
  }

  private static calculateErrorRate(): number {
    const metrics = PerformanceMonitor.getMetrics('request_duration', 100);
    if (metrics.length === 0) return 0;

    const errorRequests = metrics.filter(m => 
      m.context?.statusCode && m.context.statusCode >= 400
    ).length;

    return (errorRequests / metrics.length) * 100;
  }

  private static calculateRequestsPerMinute(): number {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const metrics = PerformanceMonitor.getMetrics('request_duration', 1000);
    
    const recentRequests = metrics.filter(m => 
      new Date(m.timestamp) > oneMinuteAgo
    );

    return recentRequests.length;
  }

  private static addAlert(level: SystemAlert['level'], message: string, context?: any): void {
    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.unshift(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }

    // Clean up old alerts
    const cutoff = new Date(Date.now() - this.ALERT_RETENTION_HOURS * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => new Date(a.timestamp) > cutoff);

    // Log the alert
    Logger[level === 'critical' ? 'error' : level === 'warning' ? 'warn' : 'info'](
      `System Alert [${level.toUpperCase()}]: ${message}`,
      context
    );
  }

  static getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  static getAllAlerts(): SystemAlert[] {
    return [...this.alerts];
  }

  static resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      Logger.info(`System alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  static clearResolvedAlerts(): number {
    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter(a => !a.resolved);
    const clearedCount = initialCount - this.alerts.length;
    
    if (clearedCount > 0) {
      Logger.info(`Cleared ${clearedCount} resolved system alerts`);
    }
    
    return clearedCount;
  }
}
// [MERGED FROM] /home/runner/workspace/server/utils/monitoring.ts
export function monitorMemory() {
  const used = process.memoryUsage();
  
  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
  
  const memoryInfo = {
    rss: `${mb(used.rss)}MB`, // Total memory
    heapTotal: `${mb(used.heapTotal)}MB`,
    heapUsed: `${mb(used.heapUsed)}MB`,
    external: `${mb(used.external)}MB`
  };
  
  console.log('[MEMORY]', memoryInfo);
  
  // Alert if memory usage is high
  if (used.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('⚠️ High memory usage detected!');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('Forced garbage collection');
    }
  }
  
  return memoryInfo;
}
