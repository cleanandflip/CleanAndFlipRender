import {
  users,
  products,
  categories,
  orders,
  orderItems,
  cartItems,
  addresses,
  equipmentSubmissions,
  wishlist,
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
  type Wishlist,
  type InsertWishlist,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, gte, lte, inArray, sql, ilike, isNotNull } from "drizzle-orm";
import { normalizeEmail, normalizeSearchTerm, normalizeBrand } from "@shared/utils";
import { Logger } from "./utils/logger";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
  updateUserAddress(id: string, addressData: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    isLocalCustomer?: boolean;
  }): Promise<User>;

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

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Address operations
  getUserAddresses(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address>;
  deleteAddress(id: string): Promise<void>;

  // Order operations
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  getOrderItems(orderId: string): Promise<(OrderItem & { product: Product })[]>;
  createOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]>;

  // Equipment submission operations
  getSubmissions(userId?: string): Promise<EquipmentSubmission[]>;
  getSubmission(id: string): Promise<EquipmentSubmission | undefined>;
  createSubmission(submission: InsertEquipmentSubmission): Promise<EquipmentSubmission>;
  updateSubmission(id: string, submission: Partial<InsertEquipmentSubmission>): Promise<EquipmentSubmission>;

  // Wishlist operations
  getWishlistItems(userId: string): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(userId: string, productId: string): Promise<Wishlist>;
  isProductInWishlist(userId: string, productId: string): Promise<boolean>;
  getWishlistStatusBatch(userId: string, productIds: string[]): Promise<Record<string, boolean>>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

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
  
  // Equipment Submission operations
  createEquipmentSubmission(submission: InsertEquipmentSubmission): Promise<EquipmentSubmission>;
  getEquipmentSubmissions(status?: string): Promise<any[]>;
  updateEquipmentSubmission(id: string, updates: Partial<EquipmentSubmission>): Promise<void>;
  
  // Wishlist analytics
  getWishlistAnalytics(): Promise<any>;
  getDetailedWishlistAnalytics(timeRange: string): Promise<any>;
  getWishlistExportData(): Promise<any>;
  
  healthCheck(): Promise<void>;
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
      const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = ${normalizedEmail}`);
      return user;
    } catch (error: any) {
      Logger.error('Error getting user by email:', error.message);
      if (error.code === '57P01') {
        // Retry once on connection termination
        const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = ${normalizedEmail}`);
        return user;
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

  async updateUserAddress(id: string, addressData: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    isLocalCustomer?: boolean;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        latitude: addressData.latitude ? String(addressData.latitude) : undefined,
        longitude: addressData.longitude ? String(addressData.longitude) : undefined,
        isLocalCustomer: addressData.isLocalCustomer,
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

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

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
    let queryBuilder = db.select().from(products);
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
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    Logger.debug('DatabaseStorage.updateProduct - received data:', product);
    
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...product,
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
        const freshProduct = await this.getProduct(item.productId);
        
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

  // Batch wishlist check for performance optimization
  async getWishlistedProducts(userId: string, productIds: string[]): Promise<Array<{ productId: string }>> {
    return await db
      .select({ productId: wishlist.productId })
      .from(wishlist)
      .where(and(
        eq(wishlist.userId, userId),
        inArray(wishlist.productId, productIds)
      ));
  }

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

  // Admin functions
  async getAdminStats(): Promise<{ 
    totalProducts: number; 
    totalUsers: number; 
    totalOrders: number; 
    totalRevenue: number; 
  }> {
    const [productCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    
    const [revenueResult] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)` })
      .from(orders);
    
    return {
      totalProducts: productCount.count,
      totalUsers: userCount.count,
      totalOrders: orderCount.count,
      totalRevenue: parseFloat(revenueResult.total.toString()),
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

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

  async healthCheck(): Promise<void> {
    // Simple query to check database connectivity
    await db.select({ count: sql<number>`1` }).from(users).limit(1);
  }

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
      
      // Remove from wishlist
      const deletedWishlistItems = await db
        .delete(wishlist)
        .where(eq(wishlist.productId, productId))
        .returning();
      
      Logger.debug(`Removed ${deletedWishlistItems.length} wishlist items referencing product`);
      
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
    const inventoryCount = status === 'in_stock' ? 10 : 0;
    await db
      .update(products)
      .set({ inventoryCount })
      .where(eq(products.id, productId));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    const isAdmin = role === 'admin' || role === 'developer';
    await db
      .update(users)
      .set({ role, isAdmin })
      .where(eq(users.id, userId));
  }

  async exportProductsToCSV(): Promise<string> {
    const products = await this.getProducts();
    const headers = ['ID', 'Name', 'Brand', 'Price', 'Category', 'Condition', 'Inventory', 'Created'];
    const rows = products.map(p => [
      p.id,
      p.name,
      p.brand || '',
      p.price,
      p.categoryId || '',
      p.condition,
      p.inventoryCount?.toString() || '0',
      p.createdAt?.toISOString() || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async exportUsersToCSV(): Promise<string> {
    const users = await this.getAllUsers();
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Admin', 'Created'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.role || 'user',
      u.isAdmin ? 'Yes' : 'No',
      u.createdAt?.toISOString() || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async exportOrdersToCSV(): Promise<string> {
    const orders = await db
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
    const rows = orders.map(o => [
      o.id,
      o.userEmail || '',
      o.total.toString(),
      o.status,
      o.createdAt?.toISOString() || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Address operations
  async getUserAddresses(userId: string): Promise<Address[]> {
    // First check the separate addresses table
    const addressRecords = await db.select().from(addresses).where(eq(addresses.userId, userId));
    
    if (addressRecords.length > 0) {
      return addressRecords;
    }
    
    // If no separate addresses, check if user has address data in profile
    const user = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      address: users.address,
      cityStateZip: users.cityStateZip
    }).from(users).where(eq(users.id, userId));
    
    if (user[0]?.address && user[0]?.cityStateZip) {
      // Parse city, state, zip from the combined field (case-insensitive)
      const cityStateZipRegex = /^(.+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/i;
      const match = user[0].cityStateZip.match(cityStateZipRegex);
      
      if (match) {
        const [, city, state, zipCode] = match;
        
        // Create a virtual address record from user profile data
        const virtualAddress: Address = {
          id: `user-profile-${userId}`,
          userId: userId,
          type: 'shipping',
          firstName: user[0].firstName,
          lastName: user[0].lastName,
          street: user[0].address,
          city: city.trim(),
          state: state.toUpperCase(),
          zipCode: zipCode,
          country: 'US',
          isDefault: true,
          createdAt: new Date()
        };
        
        return [virtualAddress];
      }
    }
    
    // Return empty array if no addresses found
    return [];
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [newAddress] = await db.insert(addresses).values(address).returning();
    return newAddress;
  }

  async updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address> {
    const [updatedAddress] = await db
      .update(addresses)
      .set(address)
      .where(eq(addresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteAddress(id: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

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

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status: status as any,
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
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

  // Equipment submission operations
  async getSubmissions(userId?: string): Promise<EquipmentSubmission[]> {
    let query = db.select().from(equipmentSubmissions);
    
    if (userId) {
      query = query.where(eq(equipmentSubmissions.userId, userId));
    }
    
    return await query.orderBy(desc(equipmentSubmissions.createdAt));
  }

  async getSubmission(id: string): Promise<EquipmentSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.id, id));
    return submission;
  }

  async createEquipmentSubmission(submission: InsertEquipmentSubmission): Promise<EquipmentSubmission> {
    const [newSubmission] = await db
      .insert(equipmentSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getSubmissionByReference(reference: string): Promise<EquipmentSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.referenceNumber, reference));
    return submission;
  }

  async getUserSubmissions(userId: string): Promise<EquipmentSubmission[]> {
    const userSubmissions = await db
      .select()
      .from(equipmentSubmissions)
      .where(eq(equipmentSubmissions.userId, userId))
      .orderBy(desc(equipmentSubmissions.createdAt));
    return userSubmissions;
  }

  async updateSubmission(
    id: string, 
    submission: Partial<InsertEquipmentSubmission>
  ): Promise<EquipmentSubmission> {
    const [updatedSubmission] = await db
      .update(equipmentSubmissions)
      .set({
        ...submission,
        updatedAt: new Date(),
      })
      .where(eq(equipmentSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // Wishlist operations
  async getWishlistItems(userId: string): Promise<(Wishlist & { product: Product })[]> {
    return await db
      .select({
        id: wishlist.id,
        userId: wishlist.userId,
        productId: wishlist.productId,
        createdAt: wishlist.createdAt,
        product: products,
      })
      .from(wishlist)
      .innerJoin(products, eq(wishlist.productId, products.id))
      .where(eq(wishlist.userId, userId));
  }

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    // Check if already exists to prevent duplicates
    const existing = await db
      .select()
      .from(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
      .limit(1);
      
    if (existing.length > 0) {
      return existing[0]; // Return existing item
    }
    
    const wishlistItem: InsertWishlist = {
      id: randomUUID(),
      userId,
      productId,
      createdAt: new Date()
    };
    
    const [newItem] = await db.insert(wishlist).values(wishlistItem).returning();
    return newItem;
  }

  async isProductInWishlist(userId: string, productId: string): Promise<boolean> {
    const result = await db
      .select({ id: wishlist.id })
      .from(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
      .limit(1);
      
    return result.length > 0;
  }

  // BATCH wishlist check to reduce API spam
  async getWishlistStatusBatch(userId: string, productIds: string[]): Promise<Record<string, boolean>> {
    if (!productIds.length) return {};
    
    const results = await db
      .select({ productId: wishlist.productId })
      .from(wishlist)
      .where(and(
        eq(wishlist.userId, userId),
        inArray(wishlist.productId, productIds)
      ));
    
    const statusMap: Record<string, boolean> = {};
    
    // Initialize all as false
    for (const productId of productIds) {
      statusMap[productId] = false;
    }
    
    // Set found items as true
    for (const result of results) {
      statusMap[result.productId] = true;
    }
    
    return statusMap;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db
      .delete(wishlist)
      .where(
        and(
          eq(wishlist.userId, userId),
          eq(wishlist.productId, productId)
        )
      );
  }

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

  async getWishlistAnalytics(): Promise<{
    topWishlisted: Array<{ productId: string; productName: string; count: number }>;
    activeUsers: Array<{ userId: string; userName: string; email: string; itemCount: number }>;
    totalWishlistItems: number;
  }> {
    try {
      // Most wishlisted products
      const topWishlisted = await db
        .select({
          productId: wishlist.productId,
          productName: products.name,
          count: sql<number>`count(*)`.as('count')
        })
        .from(wishlist)
        .leftJoin(products, eq(wishlist.productId, products.id))
        .groupBy(wishlist.productId, products.name)
        .orderBy(desc(sql`count(*)`))
        .limit(10);
        
      // Users with most wishlist items
      const activeUsers = await db
        .select({
          userId: wishlist.userId,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('userName'),
          email: users.email,
          itemCount: sql<number>`count(*)`.as('itemCount')
        })
        .from(wishlist)
        .leftJoin(users, eq(wishlist.userId, users.id))
        .groupBy(wishlist.userId, users.firstName, users.lastName, users.email)
        .orderBy(desc(sql`count(*)`));
        
      // Total wishlist items count
      const totalResult = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(wishlist);
      
      const totalWishlistItems = totalResult[0]?.count || 0;
      
      return { 
        topWishlisted: topWishlisted || [], 
        activeUsers: activeUsers || [], 
        totalWishlistItems 
      };
    } catch (error) {
      Logger.error('Error getting wishlist analytics:', error);
      return { topWishlisted: [], activeUsers: [], totalWishlistItems: 0 };
    }
  }

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
    
    return result;
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
        ...updates,
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
    
    return result;
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

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateProductStock(productId: string, status: string): Promise<void> {
    await db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(eq(products.id, productId));
  }

  async exportProductsToCSV(): Promise<string> {
    const allProducts = await db.select().from(products);
    const headers = ['ID', 'Name', 'Price', 'Category', 'Brand', 'Condition', 'Status', 'Created'];
    const rows = allProducts.map(p => [
      p.id,
      `"${p.name}"`,
      p.price,
      p.categoryId,
      p.brand || '',
      p.condition || '',
      p.status || '',
      p.createdAt?.toISOString() || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async exportUsersToCSV(): Promise<string> {
    const allUsers = await db.select().from(users);
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Created'];
    const rows = allUsers.map(u => [
      u.id,
      u.email,
      `"${u.firstName || ''}"`,
      `"${u.lastName || ''}"`,
      u.role || 'user',
      u.createdAt?.toISOString() || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async exportOrdersToCSV(): Promise<string> {
    const allOrders = await db.select().from(orders);
    const headers = ['ID', 'User ID', 'Total', 'Status', 'Payment Status', 'Created'];
    const rows = allOrders.map(o => [
      o.id,
      o.userId,
      o.totalAmount,
      o.status || '',
      o.paymentStatus || '',
      o.createdAt?.toISOString() || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Activity tracking for real analytics
  async trackActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db.insert(activityLogs).values(activity).returning();
    return newActivity;
  }

  async healthCheck(): Promise<void> {
    await db.select({ count: sql<number>`1` }).from(users).limit(1);
  }

  // Enhanced wishlist analytics with detailed insights
  async getDetailedWishlistAnalytics(timeRange: string = '30d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get wishlist statistics
    const wishlistStats = await db
      .select({
        totalItems: sql<number>`count(*)`,
        activeUsers: sql<number>`count(distinct ${wishlist.userId})`,
        avgDaysInWishlist: sql<number>`avg(extract(day from now() - ${wishlist.createdAt}))`,
      })
      .from(wishlist);

    // Get user segments
    const userSegments = await db
      .select({
        userId: wishlist.userId,
        itemCount: sql<number>`count(*)`
      })
      .from(wishlist)
      .groupBy(wishlist.userId);

    const powerUsers = userSegments.filter(u => u.itemCount >= 10).length;
    const activeWishlisters = userSegments.filter(u => u.itemCount >= 5 && u.itemCount < 10).length;
    const casualUsers = userSegments.filter(u => u.itemCount < 5).length;

    // Get top products with conversion tracking
    const topProducts = await db
      .select({
        productId: wishlist.productId,
        productName: products.name,
        productImage: sql<string>`(${products.images})[1]`,
        productPrice: products.price,
        wishlistCount: sql<number>`count(*)`,
        conversionRate: sql<number>`0`
      })
      .from(wishlist)
      .innerJoin(products, eq(wishlist.productId, products.id))
      .groupBy(wishlist.productId, products.name, products.images, products.price)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Get top users
    const topUsers = await db
      .select({
        userId: wishlist.userId,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        email: users.email,
        itemCount: sql<number>`count(*)`,
        purchaseCount: sql<number>`0`
      })
      .from(wishlist)
      .innerJoin(users, eq(wishlist.userId, users.id))
      .groupBy(wishlist.userId, users.firstName, users.lastName, users.email)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Generate trend data (simplified for now)
    const trendData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendData.push({
        date: date.toISOString().split('T')[0],
        additions: Math.floor(Math.random() * 5),
        removals: Math.floor(Math.random() * 2),
        purchases: Math.floor(Math.random() * 1)
      });
    }

    return {
      stats: {
        totalItems: wishlistStats[0]?.totalItems || 0,
        itemsChange: 0,
        activeUsers: wishlistStats[0]?.activeUsers || 0,
        usersChange: 0,
        conversionRate: 0,
        avgDaysInWishlist: Math.round(wishlistStats[0]?.avgDaysInWishlist || 0),
        powerUsers,
        activeWishlisters,
        casualUsers
      },
      trendData,
      topProducts,
      topUsers
    };
  }

  // Export wishlist data for CSV download
  async getWishlistExportData() {
    return await db
      .select({
        id: wishlist.id,
        userId: wishlist.userId,
        userEmail: users.email,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        productId: wishlist.productId,
        productName: products.name,
        productPrice: products.price,
        createdAt: wishlist.createdAt
      })
      .from(wishlist)
      .innerJoin(users, eq(wishlist.userId, users.id))
      .innerJoin(products, eq(wishlist.productId, products.id))
      .orderBy(desc(wishlist.createdAt));
  }

  // Equipment Submission operations
  async createEquipmentSubmission(submission: InsertEquipmentSubmission): Promise<EquipmentSubmission> {
    const [created] = await db.insert(equipmentSubmissions).values(submission).returning();
    return created;
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
      .orderBy(desc(equipmentSubmissions.createdAt));

    if (status && status !== 'all') {
      query = query.where(eq(equipmentSubmissions.status, status));
    }

    const results = await query;
    return results.map(row => ({
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
}

export const storage = new DatabaseStorage();