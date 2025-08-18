// Comprehensive Admin Dashboard API Routes
import { Router } from 'express';
import { db } from '../db';
import { sql, eq, desc, ilike, and, or, count, sum } from 'drizzle-orm';
import { users, orders, orderItems, sessions, products, categories, userIdentities, loginEvents, adminAuditLog } from '@shared/schema';
import { adminAuth } from '../middleware/admin-auth';
import { Logger } from '../utils/logger';

const router = Router();

// Apply role-based authentication to all admin routes
router.use(adminAuth.requireRole('support', 'developer'));

// ===== USERS MANAGEMENT =====

// A) Users listing with rich data and filtering
router.get('/users', adminAuth.auditLog('list_users'), async (req, res) => {
  try {
    const {
      query = '',
      provider = '',
      role = '',
      status = '',
      page = '1',
      pageSize = '25',
      sort = 'last_login_at:desc'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limit = Math.min(parseInt(pageSize as string) || 25, 100);
    const offset = (pageNum - 1) * limit;
    const canViewPII = adminAuth.canViewPII(req);

    // Parse sort parameter
    const [sortField, sortDir] = (sort as string).split(':');
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Build dynamic WHERE clause
    const conditions = [];
    const params: any[] = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      conditions.push(`(u.email ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`);
      params.push(`%${query}%`);
    }

    if (provider) {
      paramCount++;
      conditions.push(`u.auth_provider = $${paramCount}`);
      params.push(provider);
    }

    if (role) {
      paramCount++;
      conditions.push(`u.role = $${paramCount}`);
      params.push(role);
    }

    if (status) {
      paramCount++;
      conditions.push(`u.status = $${paramCount}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Add pagination params
    params.push(limit, offset);
    const limitClause = `LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const usersQuery = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.status,
        u.auth_provider, u.email_verified_at, u.last_login_at, u.last_ip, 
        u.mfa_enabled, u.created_at, u.picture_url,
        (SELECT array_agg(provider) FROM user_identities ui WHERE ui.user_id = u.id) AS providers,
        ua.orders_count, ua.lifetime_value, ua.last_order_at,
        (SELECT count(*) FROM sessions s WHERE s.user_id = u.id AND s.expire > now()) AS active_sessions
      FROM users u
      LEFT JOIN user_aggregate ua ON ua.id = u.id
      ${whereClause}
      ORDER BY u.${sortField === 'last_login_at' ? 'last_login_at' : 'created_at'} ${sortDirection}
      ${limitClause}
    `;

    const countQuery = `
      SELECT count(*) as total
      FROM users u
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      db.execute(sql.raw(usersQuery, params)),
      db.execute(sql.raw(countQuery, params.slice(0, -2))) // Remove limit/offset for count
    ]);

    const users = usersResult.rows.map((user: any) => ({
      ...user,
      last_ip: adminAuth.maskIP(user.last_ip, canViewPII),
      email: adminAuth.maskEmail(user.email, canViewPII),
      lifetime_value: parseFloat(user.lifetime_value || '0'),
      orders_count: parseInt(user.orders_count || '0'),
      active_sessions: parseInt(user.active_sessions || '0'),
      providers: user.providers || []
    }));

    const total = parseInt(countResult.rows[0]?.total || '0');

    res.json({
      users,
      pagination: {
        page: pageNum,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    Logger.error('Error fetching admin users list:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// B) User 360° detail view
router.get('/users/:id', adminAuth.auditLog('view_user_detail', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    const canViewPII = adminAuth.canViewPII(req);

    // Fetch comprehensive user data
    const userQuery = `
      SELECT 
        u.*,
        ua.orders_count, ua.lifetime_value, ua.last_order_at
      FROM users u
      LEFT JOIN user_aggregate ua ON ua.id = u.id
      WHERE u.id = $1
    `;

    const [userResult, identitiesResult, loginEventsResult, sessionsResult, addressesResult] = await Promise.all([
      db.execute(sql.raw(userQuery, [id])),
      db.execute(sql`SELECT * FROM user_identities WHERE user_id = ${id} ORDER BY created_at DESC`),
      db.execute(sql`SELECT * FROM login_events WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 50`),
      db.execute(sql`SELECT sid, sess, expire, ip, user_agent, last_seen_at FROM sessions WHERE user_id = ${id} AND expire > now()`),
      db.execute(sql`SELECT * FROM addresses WHERE user_id = ${id} ORDER BY is_default DESC, created_at DESC`)
    ]);

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = {
      account: {
        ...user,
        email: adminAuth.maskEmail(user.email, canViewPII),
        last_ip: adminAuth.maskIP(user.last_ip, canViewPII),
        lifetime_value: parseFloat(user.lifetime_value || '0'),
        orders_count: parseInt(user.orders_count || '0')
      },
      identities: identitiesResult.rows,
      loginEvents: loginEventsResult.rows.map((event: any) => ({
        ...event,
        ip: adminAuth.maskIP(event.ip, canViewPII),
        user_agent: adminAuth.maskUserAgent(event.user_agent, canViewPII)
      })),
      sessions: sessionsResult.rows.map((session: any) => ({
        sid: session.sid,
        ip: adminAuth.maskIP(session.ip, canViewPII),
        user_agent: adminAuth.maskUserAgent(session.user_agent, canViewPII),
        last_seen_at: session.last_seen_at,
        expire: session.expire
      })),
      addresses: addressesResult.rows
    };

    res.json(response);
  } catch (error) {
    Logger.error('Error fetching user detail:', error);
    res.status(500).json({ error: 'Failed to fetch user detail' });
  }
});

// C) Login events feed
router.get('/auth/login-events', adminAuth.auditLog('view_login_events'), async (req, res) => {
  try {
    const { userId, success, provider, since, limit = '100' } = req.query;
    const canViewPII = adminAuth.canViewPII(req);

    const conditions = [];
    const params: any[] = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      conditions.push(`user_id = $${paramCount}`);
      params.push(userId);
    }

    if (success !== undefined) {
      paramCount++;
      conditions.push(`success = $${paramCount}`);
      params.push(success === 'true');
    }

    if (provider) {
      paramCount++;
      conditions.push(`provider = $${paramCount}`);
      params.push(provider);
    }

    if (since) {
      paramCount++;
      conditions.push(`created_at >= $${paramCount}`);
      params.push(since);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Math.min(parseInt(limit as string) || 100, 500));

    const query = `
      SELECT le.*, u.email, u.first_name, u.last_name
      FROM login_events le
      LEFT JOIN users u ON u.id = le.user_id
      ${whereClause}
      ORDER BY le.created_at DESC
      LIMIT $${params.length}
    `;

    const result = await db.execute(sql.raw(query, params));

    const events = result.rows.map((event: any) => ({
      ...event,
      email: adminAuth.maskEmail(event.email, canViewPII),
      ip: adminAuth.maskIP(event.ip, canViewPII),
      user_agent: adminAuth.maskUserAgent(event.user_agent, canViewPII)
    }));

    res.json({ events });
  } catch (error) {
    Logger.error('Error fetching login events:', error);
    res.status(500).json({ error: 'Failed to fetch login events' });
  }
});

// D) Session management
router.get('/users/:id/sessions', adminAuth.auditLog('view_user_sessions', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    const canViewPII = adminAuth.canViewPII(req);

    const result = await db.execute(sql`
      SELECT sid, sess, expire, ip, user_agent, last_seen_at
      FROM sessions 
      WHERE user_id = ${id} AND expire > now()
      ORDER BY last_seen_at DESC
    `);

    const sessions = result.rows.map((session: any) => ({
      sid: session.sid,
      ip: adminAuth.maskIP(session.ip, canViewPII),
      user_agent: adminAuth.maskUserAgent(session.user_agent, canViewPII),
      last_seen_at: session.last_seen_at,
      expire: session.expire
    }));

    res.json({ sessions });
  } catch (error) {
    Logger.error('Error fetching user sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post('/users/:id/sessions/revoke', adminAuth.requireRole('developer'), adminAuth.auditLog('revoke_user_sessions', 'user'), async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(sql`DELETE FROM sessions WHERE user_id = ${id}`);

    Logger.info(`[ADMIN] Revoked all sessions for user ${id}`, {
      actorUserId: req.user?.id,
      targetUserId: id
    });

    res.json({ success: true, message: 'All user sessions revoked' });
  } catch (error) {
    Logger.error('Error revoking user sessions:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

router.post('/sessions/:sid/revoke', adminAuth.requireRole('developer'), adminAuth.auditLog('revoke_session', 'session'), async (req, res) => {
  try {
    const { sid } = req.params;

    await db.execute(sql`DELETE FROM sessions WHERE sid = ${sid}`);

    Logger.info(`[ADMIN] Revoked session ${sid}`, {
      actorUserId: req.user?.id,
      sessionId: sid
    });

    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    Logger.error('Error revoking session:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// ===== SYSTEM OVERVIEW =====

router.get('/system/overview', adminAuth.auditLog('view_system_overview'), async (req, res) => {
  try {
    const [dbStatsResult, systemStatsResult] = await Promise.all([
      db.execute(sql`
        SELECT 
          current_database() as database,
          current_user as role,
          version() as version,
          now() as timestamp
      `),
      db.execute(sql`
        SELECT 
          (SELECT count(*) FROM users) as total_users,
          (SELECT count(*) FROM products) as total_products,
          (SELECT count(*) FROM orders) as total_orders,
          (SELECT count(*) FROM sessions WHERE expire > now()) as active_sessions
      `)
    ]);

    const dbInfo = dbStatsResult.rows[0];
    const stats = systemStatsResult.rows[0];

    res.json({
      environment: process.env.NODE_ENV || 'development',
      database: {
        host: process.env.DB_HOST || 'unknown',
        name: dbInfo.database,
        role: dbInfo.role,
        timestamp: dbInfo.timestamp
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        pid: process.pid
      },
      stats: {
        totalUsers: parseInt(stats.total_users || '0'),
        totalProducts: parseInt(stats.total_products || '0'),
        totalOrders: parseInt(stats.total_orders || '0'),
        activeSessions: parseInt(stats.active_sessions || '0')
      }
    });
  } catch (error) {
    Logger.error('Error fetching system overview:', error);
    res.status(500).json({ error: 'Failed to fetch system overview' });
  }
});

export default router;