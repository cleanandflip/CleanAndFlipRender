// Enhanced admin API routes for dashboard upgrade
import { Request, Response } from "express";
import { db } from "../db";
import { users, loginEvents, userIdentities, sessions } from "@shared/schema";
import type { LoginEvent, UserIdentity, Session } from "@shared/schema";
import { eq, desc, and, sql, or, like } from "drizzle-orm";
import { logger as Logger } from "../config/logger";
import { maskIp } from "@shared/admin-utils";

// Enhanced users list with dashboard features
export async function getEnhancedUsersList(req: Request, res: Response) {
  try {
    const {
      query = '',
      provider,
      role,
      status,
      page = '1',
      pageSize = '25',
      sort = 'last_login_at:desc'
    } = req.query as Record<string, string>;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const [sortField, sortOrder] = sort.split(':');
    
    // Check user role for PII access
    const isDeveloper = (req.user as any)?.role === 'developer';
    
    Logger.info('[ADMIN] Enhanced users list request', {
      query, provider, role, status, page, pageSize, sort,
      userId: (req.user as any)?.id,
      isDeveloper
    });

    // Build filter conditions
    const filters = [];
    
    if (query) {
      filters.push(
        or(
          like(users.email, `%${query}%`),
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`)
        )
      );
    }
    
    if (provider && provider !== 'all') {
      filters.push(eq(users.authProvider, provider));
    }
    
    if (role && role !== 'all') {
      filters.push(eq(users.role, role as any));
    }
    
    if (status && status !== 'all') {
      filters.push(eq(users.status, status));
    }

    // Get users with enhanced data
    const usersQuery = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        authProvider: users.authProvider,
        emailVerifiedAt: users.emailVerifiedAt,
        mfaEnabled: users.mfaEnabled,
        lastLoginAt: users.lastLoginAt,
        lastIp: users.lastIp,
        lastUserAgent: users.lastUserAgent,
        createdAt: users.createdAt,
        stripeCustomerId: users.stripeCustomerId,
        marketingOptIn: users.marketingOptIn,
        pictureUrl: users.pictureUrl,
      })
      .from(users)
      .where(filters.length > 0 ? and(...filters) : sql`1=1`)
      .orderBy(
        sortOrder === 'desc' 
          ? desc(users.lastLoginAt)
          : users.lastLoginAt
      )
      .limit(parseInt(pageSize))
      .offset(offset);

    const usersList = await usersQuery;
    
    // Get total count for pagination
    const totalQuery = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(filters.length > 0 ? and(...filters) : sql`1=1`);
    
    const total = Number(totalQuery[0].count);

    // Enhance users with computed data
    const enhancedUsers = await Promise.all(
      usersList.map(async (user) => {
        // Get session count
        const sessionCount = await db
          .select({ count: sql`count(*)` })
          .from(sessions)
          .where(eq(sessions.userId, user.id));

        // Get providers from identities
        const identities = await db
          .select({ provider: userIdentities.provider })
          .from(userIdentities)
          .where(eq(userIdentities.userId, user.id));

        const providers = [
          ...(user.authProvider === 'password' || user.authProvider === 'local' ? ['password'] : []),
          ...identities.map(i => i.provider)
        ];

        return {
          ...user,
          lastIp: maskIp(user.lastIp || undefined, isDeveloper),
          providers,
          sessionsCount: Number(sessionCount[0].count),
          joinedDaysAgo: user.createdAt 
            ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        };
      })
    );

    res.json({
      users: enhancedUsers,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });

  } catch (error) {
    Logger.error('[ADMIN] Enhanced users list error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// User 360 view
export async function getUserDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const isDeveloper = (req.user as any)?.role === 'developer';
    
    Logger.info('[ADMIN] User 360 request', { userId: id, requesterId: (req.user as any)?.id });

    // Get user basic info
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];

    // Get user identities
    const identities = await db
      .select()
      .from(userIdentities)
      .where(eq(userIdentities.userId, id))
      .orderBy(desc(userIdentities.createdAt));

    // Get active sessions
    const activeSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, id))
      .orderBy(desc(sessions.lastSeenAt))
      .limit(10);

    // Get recent login events
    const loginActivity = await db
      .select()
      .from(loginEvents)
      .where(eq(loginEvents.userId, id))
      .orderBy(desc(loginEvents.createdAt))
      .limit(50);

    // Build response sections
    const response = {
      account: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status,
        emailVerified: !!userData.emailVerifiedAt,
        stripeCustomerId: userData.stripeCustomerId,
        marketingOptIn: userData.marketingOptIn,
        pictureUrl: userData.pictureUrl,
        createdAt: userData.createdAt,
      },
      auth: {
        authProvider: userData.authProvider,
        identities: identities.map(i => ({
          provider: i.provider,
          providerUserId: i.providerUserId,
          email: i.email,
          createdAt: i.createdAt,
        })),
        mfaEnabled: userData.mfaEnabled,
        lastLoginAt: userData.lastLoginAt,
        lastIp: maskIp(userData.lastIp || undefined, isDeveloper),
        lastUserAgent: userData.lastUserAgent,
      },
      sessions: activeSessions.map(s => ({
        sid: s.sid,
        ip: maskIp(s.ip || undefined, isDeveloper),
        userAgent: s.userAgent,
        lastSeenAt: s.lastSeenAt,
        expires: s.expire,
      })),
      activity: loginActivity.map(event => ({
        id: event.id,
        provider: event.provider,
        method: event.method,
        success: event.success,
        errorCode: event.errorCode,
        ip: maskIp(event.ip || undefined, isDeveloper),
        userAgent: event.userAgent,
        country: event.country,
        region: event.region,
        city: event.city,
        riskScore: event.riskScore,
        createdAt: event.createdAt,
      })),
    };

    res.json(response);

  } catch (error) {
    Logger.error('[ADMIN] User 360 error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
}

// Session management
export async function revokeUserSessions(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    Logger.info('[ADMIN] Revoking all sessions for user', { 
      userId: id, 
      adminId: (req.user as any)?.id 
    });

    // Delete all sessions for the user
    const result = await db
      .delete(sessions)
      .where(eq(sessions.userId, id));

    const affectedRows = result.rowCount || 0;

    Logger.info('[ADMIN] Sessions revoked', { userId: id, count: affectedRows });
    
    res.json({ message: 'All sessions revoked', count: affectedRows });

  } catch (error) {
    Logger.error('[ADMIN] Session revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
}

export async function revokeSession(req: Request, res: Response) {
  try {
    const { sid } = req.params;
    
    Logger.info('[ADMIN] Revoking session', { 
      sessionId: sid, 
      adminId: (req.user as any)?.id 
    });

    const result = await db
      .delete(sessions)
      .where(eq(sessions.sid, sid));

    res.json({ message: 'Session revoked' });

  } catch (error) {
    Logger.error('[ADMIN] Single session revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
}

// System health with enhanced metrics
export async function getSystemHealth(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Test database latency
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;

    // Get basic system info
    const systemInfo = {
      ok: true,
      env: process.env.APP_ENV || 'unknown',
      nodeVersion: process.version,
      dbHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dbLatency,
      timestamp: new Date().toISOString(),
    };

    // Get WebSocket client count (if available)
    const wsClients = (global as any).wsClientCount || 0;

    // Get table counts for database overview
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    const sessionCount = await db.select({ count: sql`count(*)` }).from(sessions);

    const response = {
      ...systemInfo,
      wsClients,
      database: {
        users: Number(userCount[0].count),
        sessions: Number(sessionCount[0].count),
      },
      responseTime: Date.now() - startTime,
    };

    res.json(response);

  } catch (error) {
    Logger.error('[ADMIN] System health check error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}