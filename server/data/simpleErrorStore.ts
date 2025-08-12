import { db } from "../db";
import { sql, eq, desc } from "drizzle-orm";

// Simplified error storage for LETS system
export const SimpleErrorStore = {
  async addError(data: {
    service: "client" | "server";
    level: "error" | "warn" | "info";
    message: string;
    stack?: string;
    url?: string;
    env?: string;
  }) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fingerprint = this.createFingerprint(data.message, data.stack);
    
    try {
      // Insert raw error (don't specify id column - let it auto-increment)
      const env = data.env || 'development';
      const url = data.url || null;
      const stack = data.stack || null;
      await db.execute(sql`
        INSERT INTO errors_raw (event_id, created_at, level, env, service, url, message, stack, fingerprint)
        VALUES (${eventId}, NOW(), ${data.level}, ${env}, ${data.service}, ${url}, ${data.message}, ${stack}, ${fingerprint})
      `);

      // Update or create issue
      const existingIssue = await db.execute(sql`
        SELECT fingerprint FROM issues WHERE fingerprint = ${fingerprint} LIMIT 1
      `);

      if (existingIssue.rows.length > 0) {
        // Update existing issue - use explicit arithmetic
        await db.execute(sql`
          UPDATE issues 
          SET count = COALESCE(count, 0) + 1, 
              last_seen = NOW()
          WHERE fingerprint = ${fingerprint}
        `);
      } else {
        // Create new issue
        const title = data.message.split('\n')[0].slice(0, 160) || 'Error';
        const envJson = JSON.stringify({ [data.env || 'development']: 1 });
        await db.execute(sql`
          INSERT INTO issues (fingerprint, title, level, service, first_seen, last_seen, count, resolved, ignored, affected_users, envs, sample_event_id)
          VALUES (${fingerprint}, ${title}, ${data.level}, ${data.service}, NOW(), NOW(), 1, false, false, 1, ${envJson}, ${eventId})
        `);
      }

      return { success: true, eventId, fingerprint };
    } catch (error) {
      console.error('Failed to store error:', error);
      throw error;
    }
  },

  async listIssues(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    try {
      const result = await db.execute(sql`
        SELECT fingerprint, title, level, service, first_seen, last_seen, count, resolved, ignored
        FROM issues 
        ORDER BY last_seen DESC 
        LIMIT ${limit} OFFSET ${offset}
      `);

      const total = await db.execute(sql`SELECT COUNT(*) as count FROM issues`);
      
      // Normalize date fields to ISO strings
      const items = result.rows.map((row: any) => ({
        ...row,
        firstSeen: new Date(row.first_seen).toISOString(),
        lastSeen: new Date(row.last_seen).toISOString(),
        first_seen: undefined, // Remove underscore version
        last_seen: undefined,   // Remove underscore version
      }));
      
      return {
        items,
        total: total.rows[0]?.count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Failed to list issues:', error);
      throw error;
    }
  },

  async getChartData(days: number = 1) {
    try {
      const result = await db.execute(sql`
        SELECT 
          date_trunc('hour', created_at) as hour,
          COUNT(*) as count
        FROM errors_raw 
        WHERE created_at >= NOW() - interval '${sql.raw(days.toString())} days'
        GROUP BY date_trunc('hour', created_at)
        ORDER BY hour
      `);
      
      // Normalize date fields to ISO strings
      const series = result.rows.map((row: any) => ({
        hour: new Date(row.hour).toISOString(),
        count: Number(row.count) || 0
      }));
      
      return series;
    } catch (error) {
      console.error('Failed to get chart data:', error);
      return [];
    }
  },

  async getIssue(fingerprint: string) {
    try {
      const result = await db.execute(sql`
        SELECT fingerprint, title, level, service, first_seen, last_seen, count, resolved, ignored
        FROM issues 
        WHERE fingerprint = ${fingerprint}
        LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        return null;
      }

      const issue = result.rows[0] as any;
      return {
        ...issue,
        firstSeen: new Date(issue.first_seen).toISOString(),
        lastSeen: new Date(issue.last_seen).toISOString(),
      };
    } catch (error) {
      console.error('Failed to get issue:', error);
      return null;
    }
  },

  async getRawForIssue(fingerprint: string, limit: number = 50) {
    try {
      const result = await db.execute(sql`
        SELECT event_id, created_at, level, env, service, url, message, stack
        FROM errors_raw 
        WHERE fingerprint = ${fingerprint}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      
      return result.rows.map((row: any) => ({
        ...row,
        createdAt: new Date(row.created_at).toISOString(),
        stack: row.stack && row.stack !== '' ? 
          (row.stack.startsWith('[') || row.stack.startsWith('{') ? 
            JSON.parse(row.stack) : [row.stack]) : [],
      }));
    } catch (error) {
      console.error('Failed to get raw events for issue:', error);
      return [];
    }
  },

  async getIssueStatus(fingerprint: string) {
    const result = await db.execute(sql`
      SELECT fingerprint, resolved, ignored, updated_at
      FROM obs_issue_status WHERE fingerprint = ${fingerprint}
    `);
    return result.rows[0] ?? null;
  },

  async setResolved(fingerprint: string, resolved: boolean) {
    await db.execute(sql`
      INSERT INTO obs_issue_status (fingerprint, resolved, ignored)
        VALUES (${fingerprint}, ${resolved}, COALESCE((SELECT ignored FROM obs_issue_status WHERE fingerprint=${fingerprint}), FALSE))
      ON CONFLICT (fingerprint)
        DO UPDATE SET resolved = EXCLUDED.resolved, updated_at = now()
    `);
  },

  async setIgnored(fingerprint: string, ignored: boolean) {
    await db.execute(sql`
      INSERT INTO obs_issue_status (fingerprint, resolved, ignored)
        VALUES (${fingerprint}, COALESCE((SELECT resolved FROM obs_issue_status WHERE fingerprint=${fingerprint}), FALSE), ${ignored})
      ON CONFLICT (fingerprint)
        DO UPDATE SET ignored = EXCLUDED.ignored, updated_at = now()
    `);
  },

  async getStatusesBulk(fingerprints: string[]) {
    if (!fingerprints.length) return new Map<string, { resolved: boolean; ignored: boolean }>();
    
    const result = await db.execute(sql`
      SELECT fingerprint, resolved, ignored 
      FROM obs_issue_status 
      WHERE fingerprint = ANY(${fingerprints})
    `);
    
    const map = new Map<string, { resolved: boolean; ignored: boolean }>();
    for (const r of result.rows) {
      map.set(r.fingerprint as string, { 
        resolved: !!r.resolved, 
        ignored: !!r.ignored 
      });
    }
    return map;
  },

  async findEventsSince(since: Date) {
    try {
      const result = await db.execute(sql`
        SELECT event_id, created_at, level, env, service, url, message, stack, fingerprint
        FROM errors_raw 
        WHERE created_at >= ${since}
        ORDER BY created_at DESC
      `);
      
      return result.rows.map((row: any) => ({
        ...row,
        createdAt: new Date(row.created_at).toISOString(),
        stack: row.stack && row.stack !== '' ? 
          (row.stack.startsWith('[') || row.stack.startsWith('{') ? 
            JSON.parse(row.stack) : [row.stack]) : [],
      }));
    } catch (error) {
      console.error('Failed to find events since date:', error);
      return [];
    }
  },

  async markResolved(fingerprint: string, resolved: boolean) {
    return this.setResolved(fingerprint, resolved);
  },

  async markIgnored(fingerprint: string, ignored: boolean) {
    return this.setIgnored(fingerprint, ignored);
  },

  async getIssueEvents(fp: string, limit = 50) {
    try {
      const result = await db.execute(sql`
        SELECT event_id, created_at, service, level, env, message, type, url, method, stack, fingerprint, extra
        FROM errors_raw
        WHERE fingerprint = ${fp}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      return result.rows.map((row: any) => ({
        ...row,
        createdAt: new Date(row.created_at).toISOString(),
        stack: row.stack && row.stack !== '' ? 
          (row.stack.startsWith('[') || row.stack.startsWith('{') ? 
            JSON.parse(row.stack) : [row.stack]) : [],
      }));
    } catch (error) {
      console.error('Failed to get issue events:', error);
      return [];
    }
  },

  createFingerprint(message: string, stack?: string): string {
    const topLine = stack?.split('\n')[0] || '';
    const basis = `${message}_${topLine}`.slice(0, 100);
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < basis.length; i++) {
      hash = ((hash << 5) - hash + basis.charCodeAt(i)) & 0xffffffff;
    }
    
    return `fp_${Math.abs(hash)}`;
  }
};