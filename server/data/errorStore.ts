import { db } from "../db";
import { sql, eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { errorsRaw, issues, issueEvents, type ErrorRaw, type Issue } from "../../shared/schema";

export type RawErrorInput = {
  eventId: string;
  createdAt: Date;
  level: "error" | "warn" | "info";
  env: "development" | "production";
  release?: string;
  service: "client" | "server";
  url?: string;
  method?: string;
  statusCode?: number;
  message: string;
  type?: string;
  stack?: string[];
  fingerprint: string;
  userId?: string;
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, any>;
};

export const ErrorStore = {
  async insertRaw(doc: RawErrorInput): Promise<void> {
    await db.insert(errorsRaw).values({
      eventId: doc.eventId,
      createdAt: doc.createdAt,
      level: doc.level,
      env: doc.env,
      release: doc.release,
      service: doc.service,
      url: doc.url,
      method: doc.method,
      statusCode: doc.statusCode,
      message: doc.message,
      type: doc.type,
      stack: doc.stack,
      fingerprint: doc.fingerprint,
      userId: doc.userId,
      tags: doc.tags,
      extra: doc.extra,
    });
  },

  async upsertIssue(raw: RawErrorInput): Promise<void> {
    const title = raw.message?.split("\n")[0]?.slice(0, 160) || raw.type || "Error";
    
    // Check if issue exists
    const existing = await db.select().from(issues).where(eq(issues.fingerprint, raw.fingerprint)).limit(1);

    if (existing.length > 0) {
      // Update existing issue
      const currentEnvs = (existing[0].envs as Record<string, number>) || {};
      const updatedEnvs = {
        ...currentEnvs,
        [raw.env]: (currentEnvs[raw.env] || 0) + 1
      };

      await db.update(issues)
        .set({
          lastSeen: raw.createdAt,
          count: sql`${issues.count} + 1`,
          envs: updatedEnvs,
          affectedUsers: raw.userId ? sql`GREATEST(${issues.affectedUsers}, 1)` : issues.affectedUsers
        })
        .where(eq(issues.fingerprint, raw.fingerprint));
    } else {
      // Insert new issue
      const envs = { [raw.env]: 1 };
      await db.insert(issues).values({
        fingerprint: raw.fingerprint,
        title,
        firstSeen: raw.createdAt,
        lastSeen: raw.createdAt,
        level: raw.level,
        count: 1,
        affectedUsers: raw.userId ? 1 : 0,
        resolved: false,
        ignored: false,
        sampleEventId: raw.eventId,
        envs
      });
    }
  },

  async bumpRollup(raw: RawErrorInput): Promise<void> {
    const hour = new Date(raw.createdAt);
    hour.setMinutes(0, 0, 0);
    
    // Use INSERT ... ON CONFLICT for PostgreSQL
    await db.execute(sql`
      INSERT INTO issue_events (fingerprint, hour, count) 
      VALUES (${raw.fingerprint}, ${hour}, 1)
      ON CONFLICT (fingerprint, hour) 
      DO UPDATE SET count = issue_events.count + 1
    `);
  },

  async listIssues({ q, level, env, resolved, page = 1, limit = 20 }: {
    q?: string;
    level?: string;
    env?: string;
    resolved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const conditions = [];
    
    if (q) {
      conditions.push(sql`${issues.title} ILIKE ${'%' + q + '%'}`);
    }
    if (level) {
      conditions.push(eq(issues.level, level));
    }
    if (resolved !== undefined) {
      conditions.push(eq(issues.resolved, resolved));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;
    
    const [items, totalResult] = await Promise.all([
      db.select()
        .from(issues)
        .where(whereCondition)
        .orderBy(desc(issues.lastSeen))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(issues)
        .where(whereCondition)
    ]);

    return {
      items,
      total: totalResult[0]?.count || 0,
      page,
      limit
    };
  },

  async getIssue(fingerprint: string): Promise<Issue | null> {
    const result = await db.select()
      .from(issues)
      .where(eq(issues.fingerprint, fingerprint))
      .limit(1);
    
    return result[0] || null;
  },

  async getRawForIssue(fingerprint: string, limit = 50): Promise<ErrorRaw[]> {
    return await db.select()
      .from(errorsRaw)
      .where(eq(errorsRaw.fingerprint, fingerprint))
      .orderBy(desc(errorsRaw.createdAt))
      .limit(limit);
  },

  async setResolved(fingerprint: string, resolved: boolean): Promise<void> {
    await db.update(issues)
      .set({ resolved })
      .where(eq(issues.fingerprint, fingerprint));
  },

  async setIgnored(fingerprint: string, ignored: boolean): Promise<void> {
    await db.update(issues)
      .set({ ignored })
      .where(eq(issues.fingerprint, fingerprint));
  },

  async chartByHour({ from, to, env }: { from: Date; to: Date; env?: string }) {
    let whereCondition = and(
      gte(issueEvents.hour, from),
      lte(issueEvents.hour, to)
    );

    if (env) {
      // Join with issues table to filter by environment
      const result = await db.select({
        hour: issueEvents.hour,
        count: sql<number>`SUM(${issueEvents.count})`
      })
      .from(issueEvents)
      .innerJoin(issues, eq(issueEvents.fingerprint, issues.fingerprint))
      .where(and(
        whereCondition,
        sql`${issues.envs}->>${env} > 0`
      ))
      .groupBy(issueEvents.hour)
      .orderBy(asc(issueEvents.hour));

      return result;
    }

    const result = await db.select({
      hour: issueEvents.hour,
      count: sql<number>`SUM(${issueEvents.count})`
    })
    .from(issueEvents)
    .where(whereCondition)
    .groupBy(issueEvents.hour)
    .orderBy(asc(issueEvents.hour));

    return result;
  }
};