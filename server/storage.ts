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
  type UpsertUser,
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
import { eq, desc, asc, and, or, like, gte, lte, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
  getOrders(userId?: string, limit?: number, offset?: number): Promise<Order[]>;
  getOrder(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Equipment submission operations
  getSubmissions(userId?: string): Promise<EquipmentSubmission[]>;
  getSubmission(id: string): Promise<EquipmentSubmission | undefined>;
  createSubmission(submission: InsertEquipmentSubmission): Promise<EquipmentSubmission>;
  updateSubmission(id: string, submission: Partial<InsertEquipmentSubmission>): Promise<EquipmentSubmission>;

  // Wishlist operations
  getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
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

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
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
    let query = db.select().from(products);
    let countQuery = db.select({ count: sql`count(*)` }).from(products);

    const conditions = [];

    if (filters?.category) {
      const categoryCondition = eq(products.categoryId, filters.category);
      conditions.push(categoryCondition);
    }

    if (filters?.search) {
      const searchCondition = or(
        like(products.name, `%${filters.search}%`),
        like(products.description, `%${filters.search}%`),
        like(products.brand, `%${filters.search}%`)
      );
      conditions.push(searchCondition);
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
      conditions.push(eq(products.brand, filters.brand));
    }

    if (filters?.status) {
      conditions.push(eq(products.status, filters.status as any));
    } else {
      conditions.push(eq(products.status, 'active'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    // Sorting
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? desc : asc;
      switch (filters.sortBy) {
        case 'price':
          query = query.orderBy(sortOrder(products.price));
          break;
        case 'name':
          query = query.orderBy(sortOrder(products.name));
          break;
        case 'createdAt':
          query = query.orderBy(sortOrder(products.createdAt));
          break;
        case 'views':
          query = query.orderBy(sortOrder(products.views));
          break;
        default:
          query = query.orderBy(desc(products.createdAt));
      }
    } else {
      query = query.orderBy(desc(products.createdAt));
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const [productsResult, countResult] = await Promise.all([
      query,
      countQuery,
    ]);

    return {
      products: productsResult,
      total: Number(countResult[0].count),
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

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async incrementProductViews(id: string): Promise<void> {
    await db
      .update(products)
      .set({ views: sql`${products.views} + 1` })
      .where(eq(products.id, id));
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.featured, true), eq(products.status, 'active')))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .then(rows => 
        rows.map(row => ({
          ...row.cart_items,
          product: row.products!,
        }))
      );
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, cartItem.userId),
        eq(cartItems.productId, cartItem.productId)
      ));

    if (existing) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({ 
          quantity: existing.quantity + cartItem.quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const [item] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return item;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Address operations
  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [newAddress] = await db.insert(addresses).values(address).returning();
    return newAddress;
  }

  async updateAddress(id: string, addressData: Partial<InsertAddress>): Promise<Address> {
    const [address] = await db
      .update(addresses)
      .set(addressData)
      .where(eq(addresses.id, id))
      .returning();
    return address;
  }

  async deleteAddress(id: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  // Order operations
  async getOrders(userId?: string, limit = 50, offset = 0): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.userId, userId));
    }
    
    return await query
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getOrder(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id))
      .then(rows =>
        rows.map(row => ({
          ...row.order_items,
          product: row.products!,
        }))
      );

    return { ...order, items };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    return await db.insert(orderItems).values(items).returning();
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
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
    submissionData: Partial<InsertEquipmentSubmission>
  ): Promise<EquipmentSubmission> {
    const [submission] = await db
      .update(equipmentSubmissions)
      .set({ ...submissionData, updatedAt: new Date() })
      .where(eq(equipmentSubmissions.id, id))
      .returning();
    return submission;
  }

  // Wishlist operations
  async getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]> {
    return await db
      .select()
      .from(wishlist)
      .leftJoin(products, eq(wishlist.productId, products.id))
      .where(eq(wishlist.userId, userId))
      .then(rows =>
        rows.map(row => ({
          ...row.wishlist,
          product: row.products!,
        }))
      );
  }

  async addToWishlist(wishlistItem: InsertWishlist): Promise<Wishlist> {
    const [newItem] = await db.insert(wishlist).values(wishlistItem).returning();
    return newItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
  }
}

export const storage = new DatabaseStorage();
