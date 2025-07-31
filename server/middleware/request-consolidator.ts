import { Request, Response, NextFunction } from 'express';
import { Logger, LogLevel } from '../utils/logger';

interface RequestStat {
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  statuses: Set<number>;
  totalDuration: number;
}

class RequestConsolidator {
  private requestStats = new Map<string, RequestStat>();
  private flushInterval: NodeJS.Timeout;
  
  constructor() {
    // Flush stats every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flushStats();
    }, 5000);
  }
  
  private shouldSkipRequest(req: Request): boolean {
    const skipPatterns = [
      '@vite', '@fs', '@react-refresh', 'node_modules',
      '.js', '.css', '.map', 'hot-update', 'chunk-',
      'clean-flip-logo', '.png', '.jpg', '.jpeg', '.svg',
      '/src/', 'components/', '.tsx', '.ts'
    ];
    
    return skipPatterns.some(pattern => req.url.includes(pattern));
  }
  
  private getRequestKey(req: Request): string {
    const baseUrl = req.path.split('?')[0];
    return `${req.method} ${baseUrl}`;
  }
  
  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip static assets and development requests
      if (this.shouldSkipRequest(req)) {
        return next();
      }
      
      const startTime = Date.now();
      const requestKey = this.getRequestKey(req);
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const currentTime = Date.now();
        
        // Track request statistics
        if (!this.requestStats.has(requestKey)) {
          this.requestStats.set(requestKey, {
            count: 0,
            firstTimestamp: currentTime,
            lastTimestamp: currentTime,
            statuses: new Set(),
            totalDuration: 0
          });
        }
        
        const stats = this.requestStats.get(requestKey)!;
        stats.count++;
        stats.lastTimestamp = currentTime;
        stats.statuses.add(res.statusCode);
        stats.totalDuration += duration;
        
        // Log immediately for slow requests or errors
        if (duration > 1000 || res.statusCode >= 400) {
          Logger.info(`${requestKey} ${res.statusCode} ${duration}ms`);
        }
        // For auth endpoints, consolidate frequent calls
        else if (requestKey.includes('/api/user') || requestKey.includes('/api/cart')) {
          Logger.consolidate(
            `frequent-${requestKey}`,
            `${requestKey} ${res.statusCode} ${duration}ms`,
            LogLevel.DEBUG
          );
        }
      });
      
      next();
    };
  }
  
  private flushStats() {
    const now = Date.now();
    
    for (const [requestKey, stats] of Array.from(this.requestStats.entries())) {
      if (stats.count > 1) {
        const avgDuration = Math.round(stats.totalDuration / stats.count);
        const timeSpan = now - stats.firstTimestamp;
        const statusCodes = Array.from(stats.statuses).join(',');
        
        // Log summary for frequently called endpoints
        if (stats.count >= 3) {
          Logger.info(
            `[BATCH] ${requestKey} called ${stats.count} times in ${Math.round(timeSpan / 1000)}s ` +
            `(avg: ${avgDuration}ms, status: ${statusCodes})`
          );
        }
      }
    }
    
    // Clear old stats
    this.requestStats.clear();
  }
  
  public cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}

export const requestConsolidator = new RequestConsolidator();