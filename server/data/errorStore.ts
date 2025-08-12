import { db } from "../db";
import { sql } from "drizzle-orm";

export const ErrorStore = {
  async insertRaw(r: any) {
    await db.execute(sql`
      INSERT INTO errors_raw
        (event_id, created_at, service, level, env, release, url, method, status_code,
         message, type, stack, user_id, tags, extra, fingerprint)
      VALUES
        (${r.event_id}, ${r.created_at}, ${r.service}, ${r.level}, ${r.env}, ${r.release || null},
         ${r.url || null}, ${r.method || null}, ${r.status_code || null}, ${r.message || ""}, ${r.type || "Error"}, ${r.stack || ""},
         ${r.user_id || null}, ${r.tags ? JSON.stringify(r.tags) : "{}"}, ${r.extra ? JSON.stringify(r.extra) : "{}"}, ${r.fingerprint})
    `);
  },

  async upsertIssue(r: any) {
    const title = (r.message?.split("\n")[0] ?? r.type ?? "Error").slice(0, 160);
    const envsInc = sql`COALESCE(envs, '{}'::jsonb) || jsonb_build_object(${r.env}, COALESCE((envs->>${r.env})::int, 0) + 1)`;

    const row = await db.execute(sql`
      INSERT INTO issues (fingerprint, title, level, service, first_seen, last_seen, count, resolved, ignored, sample_event_id, envs)
      VALUES (${r.fingerprint}, ${title}, ${r.level}, ${r.service}, ${r.created_at}, ${r.created_at}, 1, FALSE, FALSE, ${r.event_id}, jsonb_build_object(${r.env}, 1))
      ON CONFLICT (fingerprint) DO UPDATE
        SET last_seen = EXCLUDED.last_seen,
            count     = issues.count + 1,
            envs      = ${envsInc}
      RETURNING *;
    `);
    return row.rows[0];
  },

  async bumpRollup(r: any) {
    const hour = new Date(r.created_at);
    hour.setMinutes(0, 0, 0);
    await db.execute(sql`
      INSERT INTO issue_events (fingerprint, hour, count)
      VALUES (${r.fingerprint}, ${hour.toISOString()}, 1)
      ON CONFLICT (fingerprint, hour) DO UPDATE
        SET count = issue_events.count + 1
    `);
  },

  async chartByHour({ from, to }: { from: Date; to: Date }) {
    const rows = await db.execute(sql`
      SELECT hour, SUM(count)::bigint AS count
      FROM issue_events
      WHERE hour BETWEEN ${from.toISOString()} AND ${to.toISOString()}
      GROUP BY hour
      ORDER BY hour ASC
    `);
    return rows.rows;
  },

  async listIssues(opts: {
    q?: string;
    level?: string;
    env?: string;
    resolved?: boolean;
    ignored?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const {
      q = "",
      level,
      env,
      resolved = false,
      ignored = false,
      page = 1,
      limit = 20,
      sortBy = "lastSeen",
      sortOrder = "desc",
    } = opts;

    // Build base query with conditions
    let whereConditions = [];
    
    if (q.trim()) {
      whereConditions.push(`(title ILIKE '%${q.trim()}%' OR fingerprint ILIKE '%${q.trim()}%')`);
    }
    
    if (level) {
      whereConditions.push(`level = '${level}'`);
    }
    
    if (env) {
      whereConditions.push(`envs ? '${env}'`);
    }
    
    whereConditions.push(`resolved = ${resolved}`);
    whereConditions.push(`ignored = ${ignored}`);
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const sortColumn = sortBy === "firstSeen" ? "first_seen" : sortBy === "lastSeen" ? "last_seen" : "count";
    const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
    const limitClause = `LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const itemsQuery = `
      SELECT fingerprint, title, level, service, first_seen as "firstSeen", last_seen as "lastSeen", count, 
             resolved, ignored, sample_event_id as "sampleEventId", envs
      FROM issues ${whereClause} ${orderClause} ${limitClause}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM issues ${whereClause}`;

    const [itemsResult, countResult] = await Promise.all([
      db.execute(sql.raw(itemsQuery)),
      db.execute(sql.raw(countQuery)),
    ]);

    return {
      items: itemsResult.rows || [],
      total: parseInt(countResult.rows?.[0]?.total || "0"),
      page,
      limit,
    };
  },

  async getIssue(fingerprint: string) {
    const result = await db.execute(sql`
      SELECT fingerprint, title, level, service, first_seen as "firstSeen", last_seen as "lastSeen", count,
             resolved, ignored, sample_event_id as "sampleEventId", envs
      FROM issues
      WHERE fingerprint = ${fingerprint}
    `);
    return result.rows?.[0];
  },

  async getEvents(fingerprint: string, limit = 10) {
    const result = await db.execute(sql`
      SELECT event_id as "eventId", created_at as "createdAt", message, level, env, service, url, stack, extra
      FROM errors_raw
      WHERE fingerprint = ${fingerprint}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
    return result.rows || [];
  },

  async resolve(fingerprint: string) {
    await db.execute(sql`
      UPDATE issues SET resolved = TRUE WHERE fingerprint = ${fingerprint}
    `);
  },

  async reopen(fingerprint: string) {
    await db.execute(sql`
      UPDATE issues SET resolved = FALSE WHERE fingerprint = ${fingerprint}
    `);
  },

  async ignore(fingerprint: string) {
    await db.execute(sql`
      UPDATE issues SET ignored = TRUE WHERE fingerprint = ${fingerprint}
    `);
  },

  async unignore(fingerprint: string) {
    await db.execute(sql`
      UPDATE issues SET ignored = FALSE WHERE fingerprint = ${fingerprint}
    `);
  },
};