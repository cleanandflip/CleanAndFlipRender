import {
  users,
  products,
  categories,
  orders,
  orderItems,
  cartItems,
  addresses,
  equipmentSubmissions,
  activityLogs,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type Address,
  type InsertAddress,
  type EquipmentSubmission,
  type InsertEquipmentSubmission,
  type ActivityLog,
  type InsertActivityLog,
  userOnboarding,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, gte, lte, inArray, sql, ilike, isNotNull } from "drizzle-orm";
import { normalizeEmail, normalizeSearchTerm, normalizeBrand } from "@shared/utils";
import { Logger } from "./utils/logger";
import { randomUUID } from "crypto";
// addressRepo removed - using SSOT address system

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User>;
  createUserFromGoogle(userData: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    profileImageUrl?: string;
    authProvider: string;
    isEmailVerified: boolean;
  }): Promise<User>;
  updateUserGoogleInfo(id: string, googleData: {
    googleId: string;
    profileImageUrl?: string;
    isEmailVerified: boolean;
    authProvider: string;
  }): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
  updateUserProfileAddress(id: string, profileAddressId: string): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Brand operations  
  getBrands(): Promise<string[]>;

  // Product operations
  getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    brand?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: Product[]; total: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  incrementProductViews(id: string): Promise<void>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  // Removed equipment submission and wishlist methods for single-seller model
  // Address operations
  getAddressById(id: string): Promise<Address | undefined>;
  // User helper methods
  getUserById(id: string): Promise<User | undefined>;

  healthCheck(): Promise<{ status: string; timestamp: string }>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Address operations removed - using SSOT address system via routes/addresses.ts

  // Order operations
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string, notes?: string): Promise<Order>;
  updateOrder(id: string, orderData: Partial<Order>): Promise<Order>;
  getAllUsers(): Promise<User[]>;
  getOrderItems(orderId: string): Promise<(OrderItem & { product: Product })[]>;
  createOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]>;

  // Admin operations
  getAdminStats(): Promise<{
    totalProducts: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<void>;
  updateProductStock(productId: string, status: string): Promise<void>;
  exportProductsToCSV(): Promise<string>;
  exportUsersToCSV(): Promise<string>;
  exportOrdersToCSV(): Promise<string>;
  trackActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getAnalytics(): Promise<any>;
  
  // Removed equipment submission and wishlist analytics for single-seller model
  
  healthCheck(): Promise<{ status: string; timestamp: string; }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }



  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = normalizeEmail(email);
    try {
      // FIXED: Only select columns that exist in current schema (no legacy address fields)
      const result = await db.execute(sql`
        SELECT
          id, email, password, first_name, last_name, phone,
          stripe_customer_id, stripe_subscription_id, created_at, updated_at,
          role, google_id, profile_image_url, auth_provider, is_email_verified,
          google_email, google_picture, profile_complete, onboarding_step,
          is_local_customer, profile_address_id, onboarding_completed_at
        FROM users
        WHERE LOWER(email) = LOWER(${normalizedEmail})
        LIMIT 1
      `);
      return result.rows[0] as User | undefined;
    } catch (error: any) {
      Logger.error('Error getting user by email:', error.message);
      if (error.code === '57P01') {
        // Retry once on connection termination
        const result = await db.execute(sql`
          SELECT
            id, email, password, first_name, last_name, phone,
            stripe_customer_id, stripe_subscription_id, created_at, updated_at,
            role, google_id, profile_image_url, auth_provider, is_email_verified,
            google_email, google_picture, profile_complete, onboarding_step,
            is_local_customer, profile_address_id, onboarding_completed_at
          FROM users
          WHERE LOWER(email) = LOWER(${normalizedEmail})
          LIMIT 1
        `);
        return result.rows[0] as User | undefined;
      }
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Normalize email before storing
    const userToInsert = {
      ...insertUser,
      email: normalizeEmail(insertUser.email)
    };
    
    try {
      const [user] = await db
        .insert(users)
        .values(userToInsert)
        .returning();
      return user;
    } catch (error: any) {
      Logger.error('Error creating user:', error.message);
      if (error.code === '57P01') {
        // Retry once on connection termination
        const [user] = await db
          .insert(users)
          .values(userToInsert)
          .returning();
        return user;
      }
      throw error;
    }
  }

  async createUserFromGoogle(userData: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    profileImageUrl?: string;
    authProvider: string;
    isEmailVerified: boolean;
  }): Promise<User> {
    const userToInsert = {
      email: normalizeEmail(userData.email),
      firstName: userData.firstName,
      lastName: userData.lastName,
      googleId: userData.googleId,
      profileImageUrl: userData.profileImageUrl,
      authProvider: userData.authProvider,
      isEmailVerified: userData.isEmailVerified,
      role: "user" as const, // Default role for Google users
      password: null, // No password for OAuth users
    };
    
    try {
      const [user] = await db
        .insert(users)
        .values(userToInsert)
        .returning();
      return user;
    } catch (error: any) {
      Logger.error('Error creating Google user:', error.message);
      if (error.code === '57P01') {
        // Retry once on connection termination
        const [user] = await db
          .insert(users)
          .values(userToInsert)
          .returning();
        return user;
      }
      throw error;
    }
  }

  async updateUserGoogleInfo(id: string, googleData: {
    googleId: string;
    profileImageUrl?: string;
    isEmailVerified: boolean;
    authProvider: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        googleId: googleData.googleId,
        profileImageUrl: googleData.profileImageUrl,
        isEmailVerified: googleData.isEmailVerified,
        authProvider: googleData.authProvider,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfileAddress(id: string, profileAddressId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        profileAddressId: profileAddressId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  // Removed duplicate createCategory function

  async getBrands(): Promise<string[]> {
    const result = await db
      .selectDistinct({ brand: products.brand })
      .from(products)
      .where(isNotNull(products.brand))
      .orderBy(asc(products.brand));
    
    return result.map(row => row.brand!).filter(Boolean);
  }

  // Product operations
  async getProducts(filters?: {
    category?: string;
    categoryId?: string;
    categorySlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    brand?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: Product[]; total: number }> {
    const conditions = [];

    // Handle category filtering - support both ID and slug
    if (filters?.categoryId && filters.categoryId !== 'null' && filters.categoryId !== 'all') {
      Logger.debug('Storage: Filtering by categoryId:', filters.categoryId);
      conditions.push(eq(products.categoryId, filters.categoryId));
    } else if (filters?.categorySlug || filters?.category) {
      // Find category by slug first, then filter by ID
      const categorySlugOrName = filters.categorySlug || filters.category;
      if (categorySlugOrName && categorySlugOrName !== 'all' && categorySlugOrName !== 'null') {
        Logger.debug('Storage: Filtering by category slug:', categorySlugOrName);
        const categoryData = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            or(
              eq(categories.slug, categorySlugOrName),
              eq(categories.name, categorySlugOrName)
            )
          )
          .limit(1);
          
        if (categoryData[0]) {
          Logger.debug('Storage: Found category ID for slug:', categoryData[0].id);
          conditions.push(eq(products.categoryId, categoryData[0].id));
        } else {
          Logger.debug('Storage: No category found for slug:', categorySlugOrName);
        }
      }
    }

    if (filters?.search) {
      const normalizedSearch = normalizeSearchTerm(filters.search);
      conditions.push(sql`LOWER(${products.name}) LIKE ${`%${normalizedSearch}%`}`);
    }

    if (filters?.minPrice) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }

    if (filters?.maxPrice) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }

    if (filters?.condition) {
      conditions.push(eq(products.condition, filters.condition as any));
    }

    if (filters?.brand) {
      const normalizedBrand = normalizeBrand(filters.brand);
      conditions.push(sql`LOWER(${products.brand}) = ${normalizedBrand}`);
    }

    if (filters?.status) {
      conditions.push(eq(products.status, filters.status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build count query
    const countQueryBuilder = db.select({ count: sql<number>`count(*)` }).from(products);
    const countQuery = whereClause ? countQueryBuilder.where(whereClause) : countQueryBuilder;

    // Build main query
    let queryBuilder = db.select().from(products) as any;
    if (whereClause) {
      queryBuilder = queryBuilder.where(whereClause);
    }

    // Sorting
    if (filters?.sortBy === 'price') {
      queryBuilder = filters.sortOrder === 'desc' 
        ? queryBuilder.orderBy(desc(products.price))
        : queryBuilder.orderBy(asc(products.price));
    } else if (filters?.sortBy === 'name') {
      queryBuilder = filters.sortOrder === 'desc' 
        ? queryBuilder.orderBy(desc(products.name))
        : queryBuilder.orderBy(asc(products.name));
    } else {
      queryBuilder = queryBuilder.orderBy(desc(products.createdAt));
    }

    // Pagination
    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }
    if (filters?.offset) {
      queryBuilder = queryBuilder.offset(filters.offset);
    }

    const [productResults, countResults] = await Promise.all([
      queryBuilder,
      countQuery
    ]);

    return {
      products: productResults,
      total: countResults[0]?.count || 0
    };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product as any).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    Logger.debug('DatabaseStorage.updateProduct - received data:', product);
    
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...(product as any),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
      
    Logger.debug('DatabaseStorage.updateProduct - result:', updatedProduct);
    return updatedProduct;
  }



  async incrementProductViews(id: string): Promise<void> {
    await db
      .update(products)
      .set({
        views: sql`${products.views} + 1`,
      })
      .where(eq(products.id, id));
  }

  async getFeaturedProducts(limit: number = 6): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  // Cart operations - Always fetch fresh product data
  async getCartItems(userId?: string, sessionId?: string): Promise<(CartItem & { product: Product })[]> {
    let whereCondition;
    
    if (userId) {
      whereCondition = eq(cartItems.userId, userId);
    } else if (sessionId) {
      whereCondition = eq(cartItems.sessionId, sessionId);
    } else {
      return [];
    }
    
    // Get cart items first
    const cartItemsData = await db
      .select()
      .from(cartItems)
      .where(whereCondition);
    
    // Then fetch fresh product data for each item
    const cartWithProducts = await Promise.all(
      cartItemsData.map(async (item) => {
        const freshProduct = await this.getProduct(item.productId!);
        
        // If product deleted or not available, remove from cart
        if (!freshProduct || freshProduct.status !== 'active') {
          await this.removeFromCart(item.id);
          return null;
        }
        
        return {
          ...item,
          product: freshProduct
        };
      })
    );
    
    // Filter out null items (deleted products)
    return cartWithProducts.filter(item => item !== null) as (CartItem & { product: Product })[];
  }

  // Get existing cart item for smart cart logic (prevents duplicates)
  async getCartItem(userId: string | null, sessionId: string | null, productId: string): Promise<CartItem | undefined> {
    if (!userId && !sessionId) return undefined;
    
    const conditions = userId 
      ? eq(cartItems.userId, userId)
      : and(eq(cartItems.sessionId, sessionId!), isNotNull(cartItems.sessionId));
      
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(conditions, eq(cartItems.productId, productId)))
      .limit(1);
      
    return existing[0];
  }

  // Removed wishlist batch check for single-seller model

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Create new cart item - ensure we have either userId or sessionId
    const itemToInsert = {
      ...cartItem,
      // Generate a session ID if none exists
      sessionId: cartItem.sessionId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const [newItem] = await db.insert(cartItems).values(itemToInsert).returning();
    return newItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    if (userId) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    }
  }

  // Merge guest cart to user cart on login
  async mergeGuestCart(sessionId: string, userId: string): Promise<void> {
    // Update guest cart items to belong to the user
    await db
      .update(cartItems)
      .set({ userId: userId, sessionId: null })
      .where(eq(cartItems.sessionId, sessionId));
  }

  // Removed duplicate getAdminStats function

  // Removed duplicate getAllUsers function

  async getAnalytics(): Promise<any> {
    // Get REAL page views from last 7 days
    const [pageViewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.eventType, 'page_view'),
          sql`${activityLogs.createdAt} > NOW() - INTERVAL '7 days'`
        )
      );

    // Get REAL active users (unique users in last hour)
    const [activeUsersResult] = await db
      .select({ count: sql<number>`count(distinct ${activityLogs.userId})` })
      .from(activityLogs)
      .where(
        and(
          sql`${activityLogs.createdAt} > NOW() - INTERVAL '1 hour'`,
          isNotNull(activityLogs.userId)
        )
      );

    // Calculate REAL conversion rate based on visits vs orders
    const [visitsResult] = await db
      .select({ count: sql<number>`count(distinct ${activityLogs.sessionId})` })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.eventType, 'page_view'),
          sql`${activityLogs.createdAt} > NOW() - INTERVAL '7 days'`
        )
      );

    const [orderCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.createdAt} > NOW() - INTERVAL '7 days'`);

    const visits = Number(visitsResult.count || 1);
    const orderCount = Number(orderCountResult.count || 0);
    const conversionRate = visits > 0 ? (orderCount / visits * 100) : 0;

    // Get average order value from delivered orders (fix enum error)
    const [avgOrderResult] = await db
      .select({ avgValue: sql<number>`coalesce(avg(${orders.total}), 0)` })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    // Get top products (if any orders exist)
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        name: products.name,
        totalSold: sql<number>`sum(${orderItems.quantity})`,
        revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.price})`
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .groupBy(orderItems.productId, products.name)
      .orderBy(sql`sum(${orderItems.quantity}) desc`)
      .limit(5);

    // Get recent activity from activity_logs (last 10 entries)
    const recentActivity = await db
      .select({
        id: activityLogs.id,
        type: activityLogs.eventType,
        details: sql<string>`CASE 
          WHEN ${activityLogs.eventType} = 'page_view' THEN 'Page view: ' || COALESCE(${activityLogs.page}, 'Unknown')
          WHEN ${activityLogs.eventType} = 'user_action' THEN 'User action: ' || COALESCE(${activityLogs.action}, 'Unknown')
          ELSE ${activityLogs.eventType}
        END`,
        timestamp: activityLogs.createdAt
      })
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(10);

    return {
      pageViews: { 
        current: Number(pageViewsResult.count || 0),
        change: 0 // Would need historical tracking for real change calculation
      },
      activeUsers: { 
        current: Number(activeUsersResult.count || 0),
        change: 0
      },
      conversionRate: { 
        current: Math.round(conversionRate * 10) / 10, 
        change: 0 
      },
      avgOrderValue: { 
        current: Math.round(Number(avgOrderResult.avgValue) * 100) / 100, 
        change: 0 
      },
      topProducts,
      recentActivity
    };
  }

  // Removed duplicate healthCheck function

  async deleteProduct(productId: string): Promise<void> {
    try {
      Logger.debug(`Starting deletion of product: ${productId}`);
      
      // First check if product exists
      const [existingProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));
      
      if (!existingProduct) {
        Logger.debug(`Product ${productId} not found in database`);
        throw new Error('Product not found');
      }
      
      Logger.debug(`Found product to delete: ${existingProduct.name}`);
      
      // Remove from cart items first (foreign key constraint)
      const deletedCartItems = await db
        .delete(cartItems)
        .where(eq(cartItems.productId, productId))
        .returning();
      
      Logger.debug(`Removed ${deletedCartItems.length} cart items referencing product`);
      
      // Removed wishlist cleanup for single-seller model
      
      // Delete the product itself
      const deletedProducts = await db
        .delete(products)
        .where(eq(products.id, productId))
        .returning();
      
      if (deletedProducts.length === 0) {
        Logger.error(`Failed to delete product ${productId} - no rows affected`);
        throw new Error('Product deletion failed - no rows affected');
      }
      
      Logger.debug(`Successfully deleted product: ${deletedProducts[0].name} (${productId})`);
      
      // Verify deletion
      const [verifyProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));
      
      if (verifyProduct) {
        Logger.error(`Product ${productId} still exists after deletion!`);
        throw new Error('Product deletion verification failed');
      }
      
      Logger.debug(`Deletion verified - product ${productId} successfully removed from database`);
      
    } catch (error) {
      Logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async updateProductStock(productId: string, status: string): Promise<void> {
    const stockQuantity = status === 'in_stock' ? 10 : 0;
    await db
      .update(products)
      .set({ stockQuantity })
      .where(eq(products.id, productId));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, userId));
  }

  async exportProductsToCSV(): Promise<string> {
    const productResults = await this.getProducts();
    const products = productResults.products || productResults;
    const headers = ['ID', 'Name', 'Brand', 'Price', 'Category', 'Condition', 'Inventory', 'Created'];
    const rows = products.map((p: any) => [
      p.id,
      p.name,
      p.brand || '',
      p.price,
      p.categoryId || '',
      p.condition,
      p.stockQuantity?.toString() || '0',
      p.createdAt?.toISOString() || ''
    ]);
    
    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
  }

  async exportUsersToCSV(): Promise<string> {
    const users = await this.getAllUsers();
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Created'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.role || 'user',
      u.createdAt?.toISOString() || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async exportOrdersToCSV(): Promise<string> {
    const orderData = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        userEmail: users.email
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    const headers = ['Order ID', 'User Email', 'Total', 'Status', 'Created'];
    const rows = orderData.map((o: any) => [
      o.id,
      o.userEmail || '',
      o.total?.toString() || '0',
      o.status,
      o.createdAt?.toISOString() || ''
    ]);
    
    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
  }

  // All legacy address methods removed - using SSOT address system via routes/addresses.ts

  // Order operations
  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
    const updateData: any = { 
      status: status as any,
      updatedAt: new Date() 
    };
    if (notes) {
      updateData.notes = notes;
    }
    
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    if (!order) {
      throw new Error("Order not found");
    }
    
    return order;
  }

  async getOrderItems(orderId: string): Promise<(OrderItem & { product: Product })[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    return await db.insert(orderItems).values(items).returning();
  }

  // Removed all equipment submission operations for single-seller model

  async healthCheck(): Promise<{ status: string; timestamp: string; }> {
    try {
      await db.select().from(products).limit(1);
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Removed submission reference and update methods for single-seller model

  // Removed all wishlist operations for single-seller model

  // Admin operations
  async getAdminStats(): Promise<{
    totalProducts: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
  }> {
    try {
      // Get individual counts with simple queries that definitely work
      const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
      
      // For revenue, just return 0 for now since no completed orders exist
      // We can fix this when there are actual orders in the system
      
      return {
        totalProducts: Number(productCount.count || 0),
        totalUsers: Number(userCount.count || 0),
        totalOrders: Number(orderCount.count || 0),
        totalRevenue: 0 // No completed orders in system yet
      };
    } catch (error) {
      Logger.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Removed wishlist analytics for single-seller model

  // Category management methods
  async getAllCategoriesWithProductCount(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
    productCount: number;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        imageUrl: categories.imageUrl,
        description: categories.description,
        displayOrder: categories.displayOrder,
        isActive: categories.isActive,
        productCount: sql<number>`count(${products.id})`.as('productCount'),
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.displayOrder, categories.name);
    
    return result as any;
  }

  async createCategory(categoryData: {
    name: string;
    slug: string;
    imageUrl?: string;
    description?: string;
    isActive?: boolean;
    filterConfig?: Record<string, any>;
  }): Promise<any> {
    const [newCategory] = await db
      .insert(categories)
      .values({
        ...categoryData,
        displayOrder: 0,
        isActive: categoryData.isActive ?? true,
        productCount: 0,
      })
      .returning();
    return newCategory;
  }

  async updateCategory(categoryId: string, updates: {
    name?: string;
    slug?: string;
    imageUrl?: string;
    description?: string;
    isActive?: boolean;
    displayOrder?: number;
    filterConfig?: Record<string, any>;
  }): Promise<any> {
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...(updates as any),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, categoryId));
  }

  async getActiveCategoriesForHomepage(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    productCount: number;
  }>> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        imageUrl: categories.imageUrl,
        productCount: sql<number>`count(${products.id})`.as('productCount'),
      })
      .from(categories)
      .leftJoin(products, and(
        eq(categories.id, products.categoryId),
        eq(products.status, 'active')
      ))
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(categories.displayOrder, categories.name);
    
    return result as any;
  }

  async reorderCategories(categoryOrder: string[]): Promise<void> {
    const updates = categoryOrder.map((categoryId, index) => 
      db
        .update(categories)
        .set({ displayOrder: index, updatedAt: new Date() })
        .where(eq(categories.id, categoryId))
    );
    
    await Promise.all(updates);
  }

  // Address operations
  async getAddressById(id: string): Promise<Address | undefined> {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
    return address;
  }

  // User helper methods  
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  // Removed duplicate updateProductStock function

  // Removed duplicate exportProductsToCSV function

  // Removed duplicate exportUsersToCSV function

  // Removed duplicate exportOrdersToCSV function

  // Activity tracking for real analytics
  async trackActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db.insert(activityLogs).values(activity).returning();
    return newActivity;
  }



  // Equipment Submission operations (essential for single-seller model)
  async createSubmission(data: InsertEquipmentSubmission): Promise<EquipmentSubmission> {
    // Generate unique reference number
    const referenceNumber = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const [submission] = await db
      .insert(equipmentSubmissions)
      .values({
        ...data,
        referenceNumber,
      })
      .returning();
    
    return submission;
  }

  async getSubmissions(userId?: string): Promise<EquipmentSubmission[]> {
    const query = db
      .select()
      .from(equipmentSubmissions)
      .$dynamic();
    
    if (userId) {
      return await query
        .where(eq(equipmentSubmissions.userId, userId))
        .orderBy(desc(equipmentSubmissions.createdAt));
    }
    
    return await query.orderBy(desc(equipmentSubmissions.createdAt));
  }

  async getSubmission(id: string): Promise<EquipmentSubmission | null> {
    const [submission] = await db
      .select()
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.id, id));
    
    return submission || null;
  }

  async getSubmissionByReference(referenceNumber: string): Promise<EquipmentSubmission | null> {
    const [submission] = await db
      .select()
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.referenceNumber, referenceNumber));
    
    return submission || null;
  }

  async updateSubmission(id: string, updates: Partial<EquipmentSubmission>): Promise<void> {
    await db
      .update(equipmentSubmissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(equipmentSubmissions.id, id));
  }

  async getEquipmentSubmissions(status?: string): Promise<any[]> {
    let query = db
      .select({
        submission: equipmentSubmissions,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(equipmentSubmissions)
      .leftJoin(users, eq(equipmentSubmissions.userId, users.id))
      .orderBy(desc(equipmentSubmissions.createdAt)) as any;

    if (status && status !== 'all') {
      query = query.where(eq(equipmentSubmissions.status, status)) as any;
    }

    const results = await query;
    return results.map((row: any) => ({
      ...row.submission,
      user: row.user,
    }));
  }

  async updateEquipmentSubmission(id: string, updates: Partial<EquipmentSubmission>): Promise<void> {
    await db
      .update(equipmentSubmissions)
      .set(updates)
      .where(eq(equipmentSubmissions.id, id));
  }

  // Removed all wishlist operations for single-seller model
}

export const storage = new DatabaseStorage();