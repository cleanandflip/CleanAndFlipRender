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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, gte, lte, inArray, sql, ilike } from "drizzle-orm";
import { normalizeEmail, normalizeSearchTerm, normalizeBrand } from "@shared/utils";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

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
  addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
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
      console.error('Error getting user by email:', error.message);
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
      console.error('Error creating user:', error.message);
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

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Product operations
  async getProducts(filters?: {
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
  }): Promise<{ products: Product[]; total: number }> {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(products.categoryId, filters.category));
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
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
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

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId!),
          eq(cartItems.productId, cartItem.productId!)
        )
      );

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + (cartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
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

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
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

  async createSubmission(submission: InsertEquipmentSubmission): Promise<EquipmentSubmission> {
    const [newSubmission] = await db
      .insert(equipmentSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
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

  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    const [newItem] = await db.insert(wishlist).values(wishlistItem).returning();
    return newItem;
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
}

export const storage = new DatabaseStorage();