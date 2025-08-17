import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, requireRole } from '../auth';
import { db } from '../db';
import { orders, products, equipmentSubmissions, orderItems } from '@shared/schema';
import { eq, gte, sql, and, desc } from 'drizzle-orm';
import { Logger } from '../utils/logger';

const router = Router();

// Comprehensive admin metrics endpoint
router.get('/metrics', requireAuth, requireRole('developer'), async (req, res) => {
  try {
    const metrics: any = {};
    
    // Today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMetrics = await db
      .select({
        ordersToday: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${today})`,
        revenueToday: sql<number>`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${today}), 0)`,
        customersToday: sql<number>`COUNT(DISTINCT user_id) FILTER (WHERE created_at >= ${today})`
      })
      .from(orders)
      .where(sql`status != 'cancelled'`);
    
    metrics.today = todayMetrics[0];
    
    // Inventory alerts
    const inventoryMetrics = await db
      .select({
        outOfStock: sql<number>`COUNT(*) FILTER (WHERE stock_quantity = 0)`,
        lowStock: sql<number>`COUNT(*) FILTER (WHERE stock_quantity BETWEEN 1 AND 5)`,
        totalProducts: sql<number>`COUNT(*)`,
        inventoryValue: sql<number>`COALESCE(SUM(CAST(price AS NUMERIC) * stock_quantity), 0)`
      })
      .from(products)
      .where(eq(products.status, 'active'));
    
    metrics.inventory = inventoryMetrics[0];
    
    // Equipment submissions pending
    const submissionMetrics = await db
      .select({
        pendingReview: sql<number>`COUNT(*)`
      })
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.status, 'pending'));
    
    metrics.submissions = submissionMetrics[0];
    
    // Top selling products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const topProducts = await db
      .select({
        name: products.name,
        id: products.id,
        sold: sql<number>`COUNT(${orderItems.id})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * ${orderItems.quantity}), 0)`
      })
      .from(products)
      .leftJoin(orderItems, eq(products.id, orderItems.productId))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.createdAt, thirtyDaysAgo),
          eq(orders.status, 'delivered')
        )
      )
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`COUNT(${orderItems.id})`))
      .limit(5);
    
    metrics.topProducts = topProducts;
    
    // This week vs last week comparison
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const weeklyComparison = await db
      .select({
        thisWeekOrders: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${weekAgo})`,
        lastWeekOrders: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo})`,
        thisWeekRevenue: sql<number>`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${weekAgo}), 0)`,
        lastWeekRevenue: sql<number>`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo}), 0)`
      })
      .from(orders)
      .where(sql`status != 'cancelled'`);
    
    metrics.weekly = weeklyComparison[0];
    
    // Calculate growth percentages
    if (metrics.weekly) {
      metrics.weekly.orderGrowth = metrics.weekly.lastWeekOrders > 0 
        ? ((metrics.weekly.thisWeekOrders - metrics.weekly.lastWeekOrders) / metrics.weekly.lastWeekOrders * 100).toFixed(1)
        : 0;
      metrics.weekly.revenueGrowth = metrics.weekly.lastWeekRevenue > 0
        ? ((metrics.weekly.thisWeekRevenue - metrics.weekly.lastWeekRevenue) / metrics.weekly.lastWeekRevenue * 100).toFixed(1)
        : 0;
    }
    
    Logger.info('[ADMIN] Metrics calculated successfully');
    res.json(metrics);
    
  } catch (error: any) {
    Logger.error('Error calculating admin metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// Order status workflow endpoint with proper validation
router.put('/orders/:id/status', requireAuth, requireRole('developer'), async (req, res) => {
  try {
    const { status, trackingNumber, carrier, notes } = req.body;
    const orderId = req.params.id;
    
    // Valid status transitions
    const ORDER_STATUS_MACHINE: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'returned'],
      'delivered': ['returned'],
      'cancelled': [],
      'returned': ['refunded'],
      'refunded': []
    };
    
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Validate status transition
    const allowedStatuses = ORDER_STATUS_MACHINE[order.status || 'pending'] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change from ${order.status} to ${status}`,
        allowedStatuses
      });
    }
    
    // Handle status-specific logic
    switch(status) {
      case 'cancelled':
      case 'returned':
        // Restore inventory
        const items = await storage.getOrderItems(orderId);
         for (const item of items) {
           const productId = item.productId as string;
           const product = await storage.getProduct(productId);
           if (product && product.stockQuantity != null) {
             await storage.updateProduct(productId, {
               stockQuantity: (product.stockQuantity || 0) + item.quantity
             } as any);
           }
         }
        Logger.info(`[ADMIN] Inventory restored for ${status} order: ${orderId}`);
        break;
        
      case 'shipped':
        // Require tracking info
        if (!trackingNumber || !carrier) {
          return res.status(400).json({ error: 'Tracking number and carrier required for shipped status' });
        }
        await storage.updateOrder(orderId, { trackingNumber });
        Logger.info(`[ADMIN] Order ${orderId} marked as shipped with ${carrier} tracking: ${trackingNumber}`);
        break;
        
      case 'refunded':
        // Note: Stripe refund would be handled here in production
        Logger.info(`[ADMIN] Order ${orderId} marked for refund processing`);
        break;
    }
    
    // Update order status
    await storage.updateOrderStatus(orderId, status, notes);
    
    Logger.info(`[ADMIN] Order ${orderId} status updated from ${order.status} to ${status}`);
    res.json({ 
      success: true, 
      orderId,
      previousStatus: order.status,
      newStatus: status
    });
    
  } catch (error: any) {
    Logger.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;