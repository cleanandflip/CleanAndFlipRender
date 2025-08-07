import { db } from '../db/index.js';
import { 
  activityLogs, 
  orders, 
  users, 
  products, 
  wishlist,
  cartItems 
} from '../../shared/schema.js';
import { sql, eq, and, gte, lte, desc, count, sum } from 'drizzle-orm';
import { subDays, format } from 'date-fns';

export class AnalyticsService {
  private cache: Map<string, any>;
  private cacheTimeout: number;

  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  // Real-time activity tracking
  async trackActivity(userId: string | null, action: string, metadata: any = {}) {
    try {
      await db.insert(activityLogs).values({
        userId: userId,
        action,
        resource: metadata.resource || null,
        resourceId: metadata.resourceId || null,
        metadata: JSON.stringify(metadata),
        ipAddress: metadata.ip || null,
        userAgent: metadata.userAgent || null,
        createdAt: new Date()
      });
      
      // Invalidate relevant caches
      this.invalidateCache(['dashboard', 'conversion']);
    } catch (error) {
      console.error('Activity tracking error:', error);
    }
  }
  
  // Dashboard metrics
  async getDashboardMetrics(dateRange: number = 30) {
    const cacheKey = `dashboard-${dateRange}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    const startDate = subDays(new Date(), dateRange);
    
    const [
      revenue,
      orderStats,
      userStats,
      productStats,
      conversionData
    ] = await Promise.all([
      this.getRevenueMetrics(startDate),
      this.getOrderMetrics(startDate),
      this.getUserMetrics(startDate),
      this.getProductMetrics(startDate),
      this.getConversionMetrics(startDate)
    ]);
    
    const metrics = {
      revenue,
      orders: orderStats,
      users: userStats,
      products: productStats,
      conversion: conversionData,
      timestamp: Date.now()
    };
    
    this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() });
    
    return metrics;
  }
  
  // Revenue analytics
  async getRevenueMetrics(startDate: Date) {
    const result = await db.select({
      total: sql`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
      count: count(),
      avgOrderValue: sql`COALESCE(AVG(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        sql`${orders.status} IN ('completed', 'processing')`
      )
    );
    
    // Calculate growth
    const previousPeriod = await db.select({
      total: sql`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, subDays(startDate, 30)),
        lte(orders.createdAt, startDate),
        sql`${orders.status} IN ('completed', 'processing')`
      )
    );
    
    const currentTotal = parseFloat(result[0]?.total as string || '0');
    const previousTotal = parseFloat(previousPeriod[0]?.total as string || '0');
    const growth = previousTotal 
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;
    
    return {
      total: currentTotal,
      orderCount: result[0]?.count || 0,
      avgOrderValue: parseFloat(result[0]?.avgOrderValue as string || '0'),
      growth: growth.toFixed(2),
      trend: [] // Can be populated with daily data
    };
  }
  
  // Order metrics
  async getOrderMetrics(startDate: Date) {
    const statusBreakdown = await db.select({
      status: orders.status,
      count: count()
    })
    .from(orders)
    .where(gte(orders.createdAt, startDate))
    .groupBy(orders.status);
    
    return {
      total: statusBreakdown.reduce((sum, item) => sum + Number(item.count), 0),
      breakdown: Object.fromEntries(
        statusBreakdown.map(item => [item.status || 'unknown', Number(item.count)])
      )
    };
  }
  
  // User metrics
  async getUserMetrics(startDate: Date) {
    const newUsers = await db.select({
      count: count()
    })
    .from(users)
    .where(gte(users.createdAt, startDate));
    
    const totalUsers = await db.select({
      count: count()
    })
    .from(users);
    
    return {
      new: newUsers[0]?.count || 0,
      total: totalUsers[0]?.count || 0
    };
  }
  
  // Product metrics
  async getProductMetrics(startDate: Date) {
    const totalProducts = await db.select({
      count: count()
    })
    .from(products);
    
    return {
      total: totalProducts[0]?.count || 0,
      active: 0, // Can be calculated based on status
      featured: 0 // Can be calculated based on featured flag
    };
  }
  
  // Conversion metrics
  async getConversionMetrics(startDate: Date) {
    return {
      rate: 0, // Calculate based on sessions vs orders
      funnel: {} // Cart abandonment, checkout completion etc
    };
  }
  
  // Cache management
  private invalidateCache(patterns: string[]) {
    for (const [key] of this.cache) {
      if (patterns.some(pattern => key.includes(pattern))) {
        this.cache.delete(key);
      }
    }
  }
}

export const analyticsService = new AnalyticsService();