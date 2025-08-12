import { db } from '../db';
import { errorLogs, errorLogInstances } from '../../shared/schema';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { Logger } from '../utils/logger';

export interface ErrorContext {
  req?: {
    url?: string;
    method?: string;
    body?: any;
    headers?: any;
    ip?: string;
    userAgent?: string;
  };
  res?: {
    statusCode?: number;
  };
  user?: {
    id?: string;
    email?: string;
  };
  component?: string;
  action?: string;
  metadata?: any;
}

export class ErrorLogger {
  static async logError(error: Error, context: ErrorContext = {}): Promise<string | null> {
    try {
      const severity = this.determineSeverity(error, context);
      const errorData = this.extractErrorData(error, context, 'error', severity);
      
      // Check for similar existing error
      const existingError = await this.findSimilarError(error);
      
      if (existingError) {
        await this.incrementOccurrence(existingError.id);
        await this.createInstance(existingError.id, context);
        return existingError.id;
      }
      
      // Create new error log
      const [newError] = await db.insert(errorLogs).values(errorData).returning();
      await this.createInstance(newError.id, context);
      
      // Log critical errors immediately
      if (severity === 'critical') {
        Logger.error(`CRITICAL ERROR: ${error.message}`, { errorId: newError.id, stack: error.stack });
      }
      
      return newError.id;
    } catch (logError) {
      Logger.error('Failed to log error:', logError);
      return null;
    }
  }

  static async logWarning(message: string, context: ErrorContext = {}): Promise<string | null> {
    try {
      const errorData = {
        error_type: 'warning',
        severity: 'medium',
        message,
        ...this.extractContextData(context),
        environment: process.env.NODE_ENV || 'production'
      };
      
      const [warning] = await db.insert(errorLogs).values(errorData).returning();
      await this.createInstance(warning.id, context);
      
      return warning.id;
    } catch (logError) {
      Logger.error('Failed to log warning:', logError);
      return null;
    }
  }

  static async logInfo(message: string, context: ErrorContext = {}): Promise<string | null> {
    try {
      const errorData = {
        error_type: 'info',
        severity: 'low',
        message,
        ...this.extractContextData(context),
        environment: process.env.NODE_ENV || 'production'
      };
      
      const [info] = await db.insert(errorLogs).values(errorData).returning();
      await this.createInstance(info.id, context);
      
      return info.id;
    } catch (logError) {
      Logger.error('Failed to log info:', logError);
      return null;
    }
  }

  static async findSimilarError(error: Error): Promise<any | null> {
    try {
      const [existing] = await db
        .select()
        .from(errorLogs)
        .where(
          and(
            eq(errorLogs.message, error.message),
            eq(errorLogs.resolved, false)
          )
        )
        .limit(1);
      
      return existing || null;
    } catch (err) {
      Logger.error('Failed to find similar error:', err);
      return null;
    }
  }

  static async incrementOccurrence(errorId: string): Promise<void> {
    try {
      await db
        .update(errorLogs)
        .set({
          occurrence_count: sql`${errorLogs.occurrence_count} + 1`,
          last_seen: new Date()
        })
        .where(eq(errorLogs.id, errorId));
    } catch (err) {
      Logger.error('Failed to increment occurrence:', err);
    }
  }

  static async createInstance(errorLogId: string, context: ErrorContext): Promise<void> {
    try {
      await db.insert(errorLogInstances).values({
        error_log_id: errorLogId,
        context: context as any
      });
    } catch (err) {
      Logger.error('Failed to create error instance:', err);
    }
  }

  static async getErrorTrends(timeRange: string = '24h'): Promise<any[]> {
    try {
      const timeRanges = {
        '24h': sql`NOW() - INTERVAL '24 hours'`,
        '7d': sql`NOW() - INTERVAL '7 days'`,
        '30d': sql`NOW() - INTERVAL '30 days'`
      };
      
      const timeFilter = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h'];
      
      const trends = await db
        .select({
          hour: sql`DATE_TRUNC('hour', created_at)`,
          count: sql`COUNT(*)`,
          severity: errorLogs.severity
        })
        .from(errorLogs)
        .where(gte(errorLogs.created_at, timeFilter))
        .groupBy(sql`DATE_TRUNC('hour', created_at)`, errorLogs.severity)
        .orderBy(desc(sql`DATE_TRUNC('hour', created_at)`));
      
      return trends;
    } catch (err) {
      Logger.error('Failed to get error trends:', err);
      return [];
    }
  }

  static async getTopErrors(limit: number = 10): Promise<any[]> {
    try {
      const topErrors = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.resolved, false))
        .orderBy(desc(errorLogs.occurrence_count))
        .limit(limit);
      
      return topErrors;
    } catch (err) {
      Logger.error('Failed to get top errors:', err);
      return [];
    }
  }

  static async getErrorsByUser(userId: string): Promise<any[]> {
    try {
      const userErrors = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.user_id, userId))
        .orderBy(desc(errorLogs.created_at));
      
      return userErrors;
    } catch (err) {
      Logger.error('Failed to get errors by user:', err);
      return [];
    }
  }

  static async getUnresolvedCritical(): Promise<any[]> {
    try {
      const criticalErrors = await db
        .select()
        .from(errorLogs)
        .where(
          and(
            eq(errorLogs.severity, 'critical'),
            eq(errorLogs.resolved, false)
          )
        )
        .orderBy(desc(errorLogs.created_at));
      
      return criticalErrors;
    } catch (err) {
      Logger.error('Failed to get unresolved critical errors:', err);
      return [];
    }
  }

  static async resolveError(errorId: string, resolvedBy: string, notes?: string): Promise<void> {
    try {
      await db
        .update(errorLogs)
        .set({
          resolved: true,
          resolved_by: resolvedBy,
          resolved_at: new Date(),
          notes
        })
        .where(eq(errorLogs.id, errorId));
      
      Logger.info(`Error ${errorId} resolved by ${resolvedBy}: ${notes}`);
    } catch (err) {
      Logger.error('Failed to resolve error:', err);
    }
  }

  // Bulk resolve errors by fingerprint
  static async resolveErrorsByFingerprint(message: string, errorType: string, resolvedBy: string, notes?: string): Promise<void> {
    try {
      await db
        .update(errorLogs)
        .set({
          resolved: true,
          resolved_by: resolvedBy,
          resolved_at: new Date(),
          notes
        })
        .where(and(
          eq(errorLogs.message, message),
          eq(errorLogs.error_type, errorType),
          eq(errorLogs.resolved, false)
        ));
        
      Logger.info(`All errors matching fingerprint ${message}-${errorType} resolved by ${resolvedBy}`);
    } catch (err) {
      Logger.error('Failed to bulk resolve errors:', err);
    }
  }

  static async getErrorsWithFilters(filters: any, options: { page: number; limit: number; timeRange: string; search: string }): Promise<any[]> {
    try {
      const { page, limit, timeRange, search } = options;
      const offset = (page - 1) * limit;

      let query = db.select().from(errorLogs);
      const conditions = [];

      // Apply filters
      if (filters.severity) {
        conditions.push(eq(errorLogs.severity, filters.severity));
      }

      if (typeof filters.resolved === 'boolean') {
        conditions.push(eq(errorLogs.resolved, filters.resolved));
      }

      // Time range filter
      const timeRanges = {
        '24h': sql`NOW() - INTERVAL '24 hours'`,
        '7d': sql`NOW() - INTERVAL '7 days'`,
        '30d': sql`NOW() - INTERVAL '30 days'`
      };
      
      if (timeRanges[timeRange as keyof typeof timeRanges]) {
        conditions.push(gte(errorLogs.created_at, timeRanges[timeRange as keyof typeof timeRanges]));
      }

      // Search filter
      if (search) {
        conditions.push(sql`${errorLogs.message} ILIKE ${`%${search}%`}`);
      }

      // Apply conditions
      let finalQuery = query;
      if (conditions.length > 0) {
        finalQuery = query.where(and(...conditions));
      }

      const results = await finalQuery
        .orderBy(desc(errorLogs.created_at))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (err) {
      Logger.error('Failed to get errors with filters:', err);
      return [];
    }
  }

  static async getErrorById(errorId: string): Promise<any | null> {
    try {
      const [error] = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.id, errorId));

      if (!error) return null;

      // Get instances for this error
      const instances = await db
        .select()
        .from(errorLogInstances)
        .where(eq(errorLogInstances.error_log_id, errorId))
        .orderBy(desc(errorLogInstances.occurred_at))
        .limit(10);

      return { ...error, instances };
    } catch (err) {
      Logger.error('Failed to get error by ID:', err);
      return null;
    }
  }

  static async getErrorStats(): Promise<any> {
    try {
      const [totalCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(errorLogs);

      const [resolvedCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(errorLogs)
        .where(eq(errorLogs.resolved, true));

      const [criticalCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(errorLogs)
        .where(and(eq(errorLogs.severity, 'critical'), eq(errorLogs.resolved, false)));

      const [affectedUsersCount] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${errorLogs.user_id})` })
        .from(errorLogs)
        .where(sql`${errorLogs.user_id} IS NOT NULL`);

      // Calculate error rate (simplified)
      const errorRate = totalCount.count > 0 ? Math.round((criticalCount.count / totalCount.count) * 100) : 0;

      return {
        total: totalCount.count || 0,
        resolved: resolvedCount.count || 0,
        critical: criticalCount.count || 0,
        affectedUsers: affectedUsersCount.count || 0,
        errorRate
      };
    } catch (err) {
      Logger.error('Failed to get error stats:', err);
      return {
        total: 0,
        resolved: 0,
        critical: 0,
        affectedUsers: 0,
        errorRate: 0
      };
    }
  }

  private static determineSeverity(error: Error, context: ErrorContext): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Critical errors
    if (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('auth') ||
      message.includes('payment') ||
      context.res?.statusCode === 500
    ) {
      return 'critical';
    }
    
    // High severity
    if (
      message.includes('validation') ||
      message.includes('permission') ||
      context.res?.statusCode === 400 ||
      context.res?.statusCode === 401 ||
      context.res?.statusCode === 403
    ) {
      return 'high';
    }
    
    // Medium severity
    if (
      message.includes('not found') ||
      context.res?.statusCode === 404
    ) {
      return 'medium';
    }
    
    return 'low';
  }

  private static extractErrorData(error: Error, context: ErrorContext, type: string, severity: string) {
    const stackLines = error.stack?.split('\n') || [];
    const firstStackLine = stackLines[1] || '';
    const fileMatch = firstStackLine.match(/at.*\((.+):(\d+):(\d+)\)/);
    
    return {
      error_type: type,
      severity,
      message: error.message,
      stack_trace: error.stack,
      file_path: fileMatch ? fileMatch[1] : null,
      line_number: fileMatch ? parseInt(fileMatch[2]) : null,
      column_number: fileMatch ? parseInt(fileMatch[3]) : null,
      ...this.extractContextData(context),
      environment: process.env.NODE_ENV || 'production'
    };
  }

  private static extractContextData(context: ErrorContext) {
    return {
      user_id: context.user?.id || null,
      user_email: context.user?.email || null,
      user_ip: context.req?.ip || null,
      user_agent: context.req?.userAgent || null,
      url: context.req?.url || null,
      method: context.req?.method || null,
      request_body: context.req?.body || null,
      response_status: context.res?.statusCode || null,
      browser: this.extractBrowser(context.req?.userAgent),
      os: this.extractOS(context.req?.userAgent),
      device_type: this.extractDeviceType(context.req?.userAgent),
      session_id: null // Could be extracted from session
    };
  }

  private static extractBrowser(userAgent?: string): string | null {
    if (!userAgent) return null;
    
    const browsers = {
      'Chrome': /Chrome\/([\d.]+)/,
      'Firefox': /Firefox\/([\d.]+)/,
      'Safari': /Safari\/([\d.]+)/,
      'Edge': /Edge\/([\d.]+)/,
      'Opera': /Opera\/([\d.]+)/
    };
    
    for (const [browser, regex] of Object.entries(browsers)) {
      if (regex.test(userAgent)) {
        return browser;
      }
    }
    
    return 'Unknown';
  }

  private static extractOS(userAgent?: string): string | null {
    if (!userAgent) return null;
    
    const os = {
      'Windows': /Windows NT ([\d.]+)/,
      'MacOS': /Mac OS X ([\d_]+)/,
      'Linux': /Linux/,
      'iOS': /iPhone|iPad/,
      'Android': /Android ([\d.]+)/
    };
    
    for (const [osName, regex] of Object.entries(os)) {
      if (regex.test(userAgent)) {
        return osName;
      }
    }
    
    return 'Unknown';
  }

  private static extractDeviceType(userAgent?: string): string | null {
    if (!userAgent) return null;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'Mobile';
    if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) return 'Mobile';
    if (/Android/.test(userAgent)) return 'Tablet';
    
    return 'Desktop';
  }
}