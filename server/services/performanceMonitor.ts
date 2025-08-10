import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  context?: {
    route?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    userAgent?: string;
  };
}

export interface MetricsSummary {
  [key: string]: {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  };
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 10000;
  private static readonly METRIC_RETENTION_HOURS = 24;
  private static monitoringInterval: NodeJS.Timeout | null = null;

  static startMonitoring(): void {
    if (this.monitoringInterval) return;

    // Clean up old metrics every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000);

    Logger.info('Performance monitoring started');
  }

  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      Logger.info('Performance monitoring stopped');
    }
  }

  private static cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.METRIC_RETENTION_HOURS * 60 * 60 * 1000);
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => new Date(metric.timestamp) > cutoff);
    
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    const cleaned = initialCount - this.metrics.length;
    if (cleaned > 0) {
      Logger.info(`Cleaned up ${cleaned} old performance metrics`);
    }
  }

  static recordMetric(name: string, value: number, context?: PerformanceMetric['context']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      context
    };

    this.metrics.unshift(metric);
    
    // Keep metrics within limits
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(0, this.MAX_METRICS);
    }

    // Log slow operations
    if (name === 'request_duration' && value > 1000) {
      Logger.warn(`Slow request detected: ${context?.method} ${context?.route} took ${value}ms`);
    }
  }

  static getMetrics(name?: string, limit: number = 1000): PerformanceMetric[] {
    let filteredMetrics = name ? 
      this.metrics.filter(m => m.name === name) : 
      this.metrics;

    return filteredMetrics.slice(0, limit);
  }

  static getMetricsSummary(timeWindow: 'hour' | 'day' | 'all' = 'hour'): MetricsSummary {
    let cutoff: Date;
    switch (timeWindow) {
      case 'hour':
        cutoff = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = new Date(0);
    }

    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp) > cutoff);
    const summary: MetricsSummary = {};

    // Group by metric name
    const groupedMetrics: { [key: string]: number[] } = {};
    recentMetrics.forEach(metric => {
      if (!groupedMetrics[metric.name]) {
        groupedMetrics[metric.name] = [];
      }
      groupedMetrics[metric.name].push(metric.value);
    });

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      if (values.length === 0) return;

      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      summary[name] = {
        count: values.length,
        avg: sum / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
      };
    });

    return summary;
  }

  static getSystemStats(): {
    totalMetrics: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
  } {
    return {
      totalMetrics: this.metrics.length,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage()
    };
  }

  static getTopSlowRoutes(limit: number = 10): Array<{
    route: string;
    method: string;
    avgDuration: number;
    count: number;
    maxDuration: number;
  }> {
    const requestMetrics = this.metrics.filter(m => 
      m.name === 'request_duration' && m.context?.route && m.context?.method
    );

    const routeStats: { [key: string]: { durations: number[]; method: string; route: string } } = {};

    requestMetrics.forEach(metric => {
      const key = `${metric.context!.method} ${metric.context!.route}`;
      if (!routeStats[key]) {
        routeStats[key] = {
          durations: [],
          method: metric.context!.method!,
          route: metric.context!.route!
        };
      }
      routeStats[key].durations.push(metric.value);
    });

    return Object.entries(routeStats)
      .map(([, stats]) => ({
        route: stats.route,
        method: stats.method,
        avgDuration: Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length),
        count: stats.durations.length,
        maxDuration: Math.max(...stats.durations)
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }
}

// Middleware for automatic performance tracking
export function performanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    
    // Override res.end to capture timing
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      
      PerformanceMonitor.recordMetric('request_duration', duration, {
        route: req.route?.path || req.url,
        method: req.method,
        statusCode: res.statusCode,
        userId,
        userAgent: req.get('User-Agent')
      });

      // Track memory usage periodically
      if (Math.random() < 0.01) { // 1% of requests
        const memoryUsage = process.memoryUsage();
        PerformanceMonitor.recordMetric('memory_heap_used', memoryUsage.heapUsed);
        PerformanceMonitor.recordMetric('memory_heap_total', memoryUsage.heapTotal);
        PerformanceMonitor.recordMetric('memory_rss', memoryUsage.rss);
      }

      originalEnd.apply(this, args);
    };

    next();
  };
}