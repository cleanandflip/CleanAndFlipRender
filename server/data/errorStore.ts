import { db } from "../db";
import { sql } from "drizzle-orm";

export type Issue = {
  _id?: string;
  fingerprint: string;
  title: string;
  level: "error"|"warn"|"info";
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  affectedUsers?: number;
  resolved: boolean;
  ignored: boolean;
  sampleEventId?: string;
  envs: Record<string, number>;
};

export const ErrorStore = {
  async insertRaw(doc: any) {
    try {
      await db.execute(sql`
        INSERT INTO errors_raw (
          event_id, created_at, service, level, env, url, method, status_code,
          message, type, stack, user_id, tags, extra, fingerprint
        ) VALUES (
          ${doc.eventId}, ${doc.createdAt}, ${doc.service}, ${doc.level}, ${doc.env},
          ${doc.url || null}, ${doc.method || null}, ${doc.statusCode || null}, ${doc.message}, ${doc.type || null},
          ${JSON.stringify(doc.stack || [])}, ${doc.user || null},
          ${doc.tags ? JSON.stringify(doc.tags) : null}, ${doc.extra ? JSON.stringify(doc.extra) : null},
          ${doc.fingerprint}
        )
      `);
      return { acknowledged: true, insertedId: doc.eventId };
    } catch (error) {
      console.error('Failed to insert raw error:', error);
      throw error;
    }
  },

  async upsertIssue(raw: any) {
    const title = (raw.message?.split("\n")[0] ?? raw.type ?? "Error").slice(0, 160);
    const now = new Date();
    
    try {
      // Check if issue exists
      const existing = await db.execute(sql`
        SELECT fingerprint, count, envs FROM issues WHERE fingerprint = ${raw.fingerprint}
      `);

      if (existing.rows.length === 0) {
        // Insert new issue
        await db.execute(sql`
          INSERT INTO issues (
            fingerprint, title, first_seen, last_seen, resolved, ignored,
            sample_event_id, level, service, count
          ) VALUES (
            ${raw.fingerprint}, ${title}, ${raw.createdAt}, ${raw.createdAt},
            false, false, ${raw.eventId}, ${raw.level}, ${raw.service}, 1
          )
        `);
      } else {
        // Update existing issue
        const issue = existing.rows[0] as any;
        const currentEnvs = issue.envs ? JSON.parse(issue.envs) : {};
        currentEnvs[raw.env] = (currentEnvs[raw.env] || 0) + 1;

        await db.execute(sql`
          UPDATE issues 
          SET last_seen = ${raw.createdAt},
              count = ${issue.count + 1}
          WHERE fingerprint = ${raw.fingerprint}
        `);
      }
    } catch (error) {
      console.error('Failed to upsert issue:', error);
      throw error;
    }
  },

  async bumpRollup(raw: any) {
    const hr = new Date(raw.createdAt);
    hr.setMinutes(0, 0, 0);
    const hourStr = hr.toISOString();

    try {
      // Check if rollup exists
      const existing = await db.execute(sql`
        SELECT count FROM issue_events 
        WHERE fingerprint = ${raw.fingerprint} AND hour = ${hourStr}
      `);

      if (existing.rows.length === 0) {
        await db.execute(sql`
          INSERT INTO issue_events (fingerprint, hour, count)
          VALUES (${raw.fingerprint}, ${hourStr}, 1)
        `);
      } else {
        const current = existing.rows[0] as any;
        await db.execute(sql`
          UPDATE issue_events 
          SET count = ${current.count + 1}
          WHERE fingerprint = ${raw.fingerprint} AND hour = ${hourStr}
        `);
      }
    } catch (error) {
      console.error('Failed to bump rollup:', error);
      throw error;
    }
  },

  async listIssues({ 
    q, level, env, resolved, ignored = false, page = 1, limit = 20, 
    sortBy = "lastSeen", sortOrder = "desc" 
  }: any) {
    try {
      // Build where conditions
      const conditions = [`ignored = ${ignored ? 'true' : 'false'}`];

      if (resolved !== undefined) {
        conditions.push(`resolved = ${resolved ? 'true' : 'false'}`);
      }
      if (level) {
        conditions.push(`level = '${level.replace(/'/g, "''")}'`);
      }
      if (q) {
        const qEscaped = q.replace(/'/g, "''");
        conditions.push(`(title LIKE '%${qEscaped}%' OR fingerprint LIKE '%${qEscaped}%')`);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const sortColumn = sortBy === "lastSeen" ? "last_seen" : 
                        sortBy === "firstSeen" ? "first_seen" : "count";
      const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
      const limitClause = `LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

      const itemsQuery = sql.raw(`
        SELECT fingerprint, title, level, service, first_seen as "firstSeen", last_seen as "lastSeen", count, 
               resolved, ignored, sample_event_id as "sampleEventId"
        FROM issues ${whereClause} ${orderClause} ${limitClause}
      `);

      const countQuery = sql.raw(`SELECT COUNT(*) as total FROM issues ${whereClause}`);

      const [itemsResult, countResult] = await Promise.all([
        db.execute(itemsQuery),
        db.execute(countQuery)
      ]);

      const items = itemsResult.rows.map((row: any) => ({
        ...row,
        firstSeen: new Date(row.first_seen),
        lastSeen: new Date(row.last_seen),
        envs: row.envs ? JSON.parse(row.envs) : {}
      }));

      const total = (countResult.rows[0] as any).total;

      return { items, total, page, limit };
    } catch (error) {
      console.error('Failed to list issues:', error);
      return { items: [], total: 0, page, limit };
    }
  },

  async getIssue(fp: string) {
    try {
      const result = await db.execute(sql`
        SELECT fingerprint, title, level, first_seen, last_seen, count,
               resolved, ignored, sample_event_id, envs
        FROM issues WHERE fingerprint = ${fp}
      `);

      if (result.rows.length === 0) return null;

      const issue = result.rows[0] as any;
      return {
        ...issue,
        firstSeen: new Date(issue.first_seen),
        lastSeen: new Date(issue.last_seen),
        envs: issue.envs ? JSON.parse(issue.envs) : {}
      };
    } catch (error) {
      console.error('Failed to get issue:', error);
      return null;
    }
  },

  async getRawForIssue(fp: string, limit = 50) {
    try {
      const result = await db.execute(sql`
        SELECT event_id, created_at, level, env, service, url, message, stack,
               user_data, tags, extra
        FROM errors_raw 
        WHERE fingerprint = ${fp}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);

      return result.rows.map((row: any) => ({
        ...row,
        eventId: row.event_id,
        createdAt: new Date(row.created_at),
        stack: row.stack ? JSON.parse(row.stack) : [],
        user: row.user_data ? JSON.parse(row.user_data) : null,
        tags: row.tags ? JSON.parse(row.tags) : {},
        extra: row.extra ? JSON.parse(row.extra) : {}
      }));
    } catch (error) {
      console.error('Failed to get raw events for issue:', error);
      return [];
    }
  },

  async setResolved(fp: string, resolved: boolean) {
    try {
      await db.execute(sql`
        UPDATE issues SET resolved = ${resolved} WHERE fingerprint = ${fp}
      `);
      return { acknowledged: true };
    } catch (error) {
      console.error('Failed to set resolved status:', error);
      return { acknowledged: false };
    }
  },

  async setIgnored(fp: string, ignored: boolean) {
    try {
      await db.execute(sql`
        UPDATE issues SET ignored = ${ignored} WHERE fingerprint = ${fp}
      `);
      return { acknowledged: true };
    } catch (error) {
      console.error('Failed to set ignored status:', error);
      return { acknowledged: false };
    }
  },

  async chartByHour({ from, to, env }: { from: Date; to: Date; env?: string }) {
    try {
      let whereClause = `WHERE hour >= ? AND hour <= ?`;
      const params = [from.toISOString(), to.toISOString()];

      if (env) {
        // Note: env filtering would need to be added to rollup schema if needed
        // For now, we'll return all data
      }

      const result = await db.execute(sql`
        SELECT hour, SUM(count) as count
        FROM issue_events 
        WHERE hour >= ${from.toISOString()} AND hour <= ${to.toISOString()}
        GROUP BY hour
        ORDER BY hour ASC
      `);

      return result.rows.map((row: any) => ({
        hour: new Date(row.hour),
        count: row.count
      }));
    } catch (error) {
      console.error('Failed to get chart data:', error);
      return [];
    }
  }
};