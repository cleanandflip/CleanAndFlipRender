import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { authMiddleware } from "./middleware/auth";
// import { upload, cloudinary } from "./config/cloudinary"; // Temporarily disabled for clean slate setup
import multer from 'multer';
import cors from "cors";
import { 
  setupSecurityHeaders, 
  apiLimiter, 
  authLimiter, 
  adminLimiter, 
  uploadLimiter,
  sanitizeInput,
  corsOptions
} from "./middleware/security";
import { 
  validateRequest, 
  validateFileUpload, 
  preventSQLInjection, 
  preventXSS 
} from "./middleware/validation";
import { 
  transactionMiddleware, 
  atomicCartOperation, 
  atomicOrderCreation,
  withRetry 
} from "./middleware/transaction";
import { 
  performanceMonitoring, 
  createHealthCheck, 
  requestLogging, 
  errorTracking 
} from "./middleware/monitoring";
import { autoSyncProducts } from "./middleware/product-sync";
import { runPenetrationTests } from "./security/penetration-tests";
import { setupCompression } from "./config/compression";
import { healthLive, healthReady } from "./config/health";
import { initializeWebSocket, broadcastProductUpdate, broadcastCartUpdate, broadcastStockUpdate } from "./config/websocket";
import { createRequestLogger, logger, shouldLog } from "./config/logger";
import { Logger, LogLevel } from "./utils/logger";
import { db } from "./db";
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
  reviews,
  coupons,
  emailQueue,
  orderTracking,
  returnRequests,
  passwordResetTokens,
  type User,
  type Product,
  type Category,
  type Review,
  type Coupon,
  type OrderTracking,
  type ReturnRequest,
  type CartItem,
  type Address,
  type EquipmentSubmission,
  insertEquipmentSubmissionSchema
} from "@shared/schema";
import { convertSubmissionsToCSV } from './utils/exportHelpers';
import { eq, desc, ilike, sql, and, or, gt, lt, gte, lte, ne, asc, inArray, not, count, sum } from "drizzle-orm";
import { displayStartupBanner } from "./utils/startup-banner";
import { initRedis } from "./config/redis";
import { initializeCache } from "./lib/cache";
import { initializeSearchIndexes, searchProducts } from "./config/search";
import { getCachedCategories, setCachedCategories, getCachedFeaturedProducts, setCachedFeaturedProducts, getCachedProduct, setCachedProduct, clearProductCache } from "./config/cache";
import { registerGracefulShutdown } from "./config/graceful-shutdown";
import { performanceTest } from "./config/performance-test";
import { 
  insertProductSchema,
  insertCartItemSchema,
  insertAddressSchema,
  insertOrderSchema,
  // insertEquipmentSubmissionSchema, insertWishlistSchema - removed for single-seller model
  insertReviewSchema,
  insertCouponSchema,
  insertOrderTrackingSchema,
  insertReturnRequestSchema
} from "@shared/schema";
// Auth routes moved to main server file for simple password reset implementation

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil" as any,
});

export async function registerRoutes(app: Express): Promise<Server> {
  const startupTime = Date.now();
  const warnings: string[] = [];
  
  // Initialize caching system (Redis or Memory)
  const redisClient = await initRedis().catch(() => null);
  const redisConnected = !!redisClient;
  initializeCache(redisClient);
  
  if (!redisConnected && process.env.ENABLE_REDIS === 'true') {
    warnings.push('Redis caching disabled - using memory cache');
  }
  
  // Setup performance optimizations first
  setupCompression(app);
  
  // Enhanced logging with spam reduction
  app.use(createRequestLogger());
  
  // Setup security headers
  setupSecurityHeaders(app);
  
  // CORS configuration
  app.use(cors(corsOptions));
  
  // Global security middleware
  // app.use(requestLogging); // DISABLED - Using main logger system instead to prevent duplicate logs
  app.use(performanceMonitoring);
  app.use(sanitizeInput);
  app.use(preventXSS);
  app.use(preventSQLInjection);
  app.use(transactionMiddleware);
  
  // Enable automatic Stripe sync for product operations
  app.use(autoSyncProducts);
  
  // Setup authentication
  setupAuth(app);
  
  // Initialize search indexes
  await initializeSearchIndexes();
  
  // Health check endpoints
  app.get('/health', healthLive);
  app.get('/health/live', healthLive);
  app.get('/health/ready', healthReady);
  
  // Debug session endpoint for troubleshooting (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/debug/session', (req, res) => {
      res.json({
        sessionID: req.sessionID,
        session: req.session,
        passport: (req.session as any)?.passport,
        user: req.user,
        isAuthenticated: req.isAuthenticated(),
        cookies: req.headers.cookie
      });
    });
  }
  
  // Performance testing endpoint (development only)
  // Performance monitoring endpoint removed for production
  
  // Search endpoint with full-text search
  app.get("/api/search", apiLimiter, async (req, res) => {
    try {
      const { q: query, limit = 20, offset = 0 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await searchProducts(query, Number(limit), Number(offset));
      res.json({ results, total: results.length });
    } catch (error) {
      Logger.error("Search error", error);
      res.status(500).json({ message: "Search failed" });
    }
  });
  
  // Categories (public endpoint with rate limiting and caching)
  app.get("/api/categories", apiLimiter, async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      
      // Try cache first for active categories
      if (activeOnly) {
        const cached = await getCachedCategories();
        if (cached) {
          return res.json(cached);
        }
        
        const categories = await storage.getActiveCategoriesForHomepage();
        
        // Cache the results for 5 minutes
        if (categories) {
          await setCachedCategories(categories);
        }
        
        res.json(categories);
      } else {
        const categories = await storage.getCategories();
        res.json(categories);
      }
    } catch (error) {
      Logger.error("Error fetching categories", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Brands (public endpoint with rate limiting)
  app.get("/api/brands", apiLimiter, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      Logger.error("Error fetching brands", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  // Products (public endpoint with rate limiting)
  app.get("/api/products", apiLimiter, async (req, res) => {
    try {
      const {
        category,
        search,
        minPrice,
        maxPrice,
        condition,
        brand,
        status,
        limit = 20,
        offset = 0,
        sortBy,
        sortOrder
      } = req.query;

      const filters = {
        category: category as string,
        categoryId: req.query.categoryId as string,
        categorySlug: req.query.categorySlug as string,
        search: search as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        condition: condition as string,
        brand: brand as string,
        status: status as string,
        limit: Number(limit),
        offset: Number(offset),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      Logger.debug(`Products API - Received filters: ${JSON.stringify(filters)}`);

      // Set aggressive no-cache headers for live inventory accuracy
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `W/"products-${Date.now()}"` // Weak ETag for cache validation
      });
      
      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      Logger.error("Error fetching products", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", apiLimiter, async (req, res) => {
    try {
      // Set aggressive no-cache headers for live inventory accuracy
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `W/"featured-${Date.now()}"` // Weak ETag for cache validation
      });
      
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error) {
      Logger.error("Error fetching featured products", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:id", apiLimiter, async (req, res) => {
    try {
      // Set aggressive no-cache headers for live inventory accuracy
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `W/"product-${req.params.id}-${Date.now()}"` // Weak ETag for cache validation
      });
      
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Increment view count
      await storage.incrementProductViews(req.params.id);
      
      res.json(product);
    } catch (error) {
      Logger.error("Error fetching product", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart operations - Allow guest cart with optional auth
  app.get("/api/cart", authMiddleware.optionalAuth, async (req, res) => {
    try {
      // SECURITY FIX: Only use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware
      const sessionId = req.sessionID;
      
      Logger.debug(`Get cart - userId: ${userId}, sessionId: ${sessionId}`);
      
      // Set cache-busting headers to prevent any caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"cart-${Date.now()}"`
      });
      
      // Use proper userId from authenticated user
      const cartItems = await storage.getCartItems(
        userId || undefined,
        sessionId
      );
      res.json(cartItems);
    } catch (error) {
      Logger.error("Error fetching cart", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", authMiddleware.optionalAuth, async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      // SECURITY FIX: Only use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware
      const sessionId = req.sessionID;
      
      Logger.debug(`Cart request - userId: ${userId}, sessionId: ${sessionId}`);
      
      // 1. Check product availability first
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      if ((product.stockQuantity || 0) < 1) {
        return res.status(400).json({ error: 'Product not available' });
      }
      
      // 2. Check existing cart item for smart quantity handling
      const effectiveUserId = userId && userId !== 'temp-user-id' ? userId : null;
      const effectiveSessionId = !userId || userId === 'temp-user-id' ? sessionId : null;
      
      const existingItem = await storage.getCartItem(effectiveUserId, effectiveSessionId, productId);
      
      if (existingItem) {
        // Update quantity instead of creating duplicate
        const newQuantity = existingItem.quantity + quantity;
        
        // 3. Validate against stock
        if (newQuantity > (product.stockQuantity || 0)) {
          return res.status(400).json({ 
            error: `Only ${product.stockQuantity || 0} available. You already have ${existingItem.quantity} in cart.` 
          });
        }
        
        // Update existing item
        const updated = await storage.updateCartItem(existingItem.id, newQuantity);
        
        // Broadcast cart update via WebSocket
        if (effectiveUserId) {
          broadcastCartUpdate(effectiveUserId);
        }
        
        return res.json(updated);
      } else {
        // 4. New item - validate quantity
        if (quantity > (product.stockQuantity || 0)) {
          return res.status(400).json({ 
            error: `Only ${product.stockQuantity || 0} available` 
          });
        }
        
        // Ensure session is saved first for guest users
        if (!effectiveUserId) {
          req.session.save((err) => {
            if (err) Logger.error('Session save error', err);
          });
        }
        
        // Create cart item with proper user or session ID
        const cartItemData = {
          productId,
          quantity,
          userId: effectiveUserId,
          sessionId: effectiveSessionId,
        };
        
        Logger.debug(`Cart item data: ${JSON.stringify(cartItemData)}`);
        
        const validatedData = insertCartItemSchema.parse(cartItemData);
        const cartItem = await storage.addToCart(validatedData);
        
        // Broadcast cart update via WebSocket
        if (effectiveUserId) {
          broadcastCartUpdate(effectiveUserId);
        }
        
        return res.json(cartItem);
      }
    } catch (error: any) {
      Logger.error("Error adding to cart", error);
      
      // Send specific error message to frontend
      const errorMessage = error?.message || "Failed to add to cart";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.put("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error) {
      Logger.error("Error updating cart item", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      Logger.error("Error removing from cart", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Cart validation endpoint - cleans up invalid cart items
  app.post("/api/cart/validate", requireAuth, async (req, res) => {
    try {
      // SECURITY FIX: Only use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware
      const sessionId = req.sessionID;
      
      const cartItems = await storage.getCartItems(
        userId || undefined,
        sessionId
      );
      
      const updates = [];
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId!);
        
        // Remove if product deleted or inactive
        if (!product || product.status !== 'active') {
          await storage.removeFromCart(item.id);
          updates.push({ action: 'removed', itemId: item.id, reason: 'Product unavailable' });
          continue;
        }
        
        // Adjust quantity if stock changed
        if (item.quantity > (product.stockQuantity || 0)) {
          const newQuantity = Math.max(0, product.stockQuantity || 0);
          if (newQuantity === 0) {
            await storage.removeFromCart(item.id);
            updates.push({ action: 'removed', itemId: item.id, reason: 'Out of stock' });
          } else {
            await storage.updateCartItem(item.id, newQuantity);
            updates.push({ 
              action: 'adjusted', 
              itemId: item.id, 
              newQuantity: newQuantity,
              reason: 'Stock limit adjusted'
            });
          }
        }
      }
      
      res.json({ updates });
    } catch (error) {
      Logger.error("Error validating cart", error);
      res.status(500).json({ message: "Failed to validate cart" });
    }
  });

  // Orders
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      // SECURITY FIX: Use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      const orders = await storage.getUserOrders(userId!);
      res.json(orders);
    } catch (error) {
      Logger.error("Error fetching orders", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      Logger.error("Error fetching order", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Equipment submissions
  app.get("/api/submissions", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const submissions = await storage.getSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      Logger.error("Error fetching submissions", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertEquipmentSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);
      res.json(submission);
    } catch (error) {
      Logger.error("Error creating submission", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get("/api/submissions/:id", async (req, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      Logger.error("Error fetching submission", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  app.get("/api/submissions/track/:reference", async (req, res) => {
    try {
      const submission = await storage.getSubmissionByReference(req.params.reference);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      Logger.error("Error tracking submission", error);
      res.status(500).json({ message: "Failed to track submission" });
    }
  });

  // Removed all wishlist routes for single-seller model

  // Stripe payment intent
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { amount, currency = "usd", metadata } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      Logger.error("Error creating payment intent", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Create order
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Create order items if provided
      if (req.body.items && req.body.items.length > 0) {
        const orderItems = req.body.items.map((item: any) => ({
          ...item,
          orderId: order.id,
        }));
        await storage.createOrderItems(orderItems);
      }
      
      res.json(order);
    } catch (error) {
      Logger.error("Error creating order", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // REMOVED - Old address endpoints replaced with unified system below

  // Admin routes - use passport authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    // Check if user is authenticated via passport
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user has admin privileges (allow admin role or isAdmin flag)
    if (!user.isAdmin && user.role !== 'admin' && user.role !== 'developer') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  };

  // Health Check Endpoint
  app.get("/health", createHealthCheck());

  // Schema diagnostic endpoint
  app.get("/api/health/schema-check", async (req, res) => {
    const results = {
      status: 'checking',
      issues: [] as string[],
      tables: {} as Record<string, string>,
      hasAddressesTable: false
    };
    
    try {
      // Test products.subcategory
      try {
        await db.execute(sql`SELECT subcategory FROM products LIMIT 1`);
        results.tables['products.subcategory'] = 'exists';
      } catch (e: any) {
        results.tables['products.subcategory'] = 'missing';
        results.issues.push('products.subcategory column missing');
      }
      
      // Test users.street
      try {
        await db.execute(sql`SELECT street FROM users LIMIT 1`);
        results.tables['users.street'] = 'exists';
      } catch (e: any) {
        results.tables['users.street'] = 'missing';
        results.issues.push('users.street column missing');
      }
      
      // Check if using separate addresses table
      const addressCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'addresses'
        )
      `);
      
      results.hasAddressesTable = (addressCheck.rows[0] as any).exists;
      results.status = results.issues.length === 0 ? 'healthy' : 'issues_found';
      
      res.json({
        ...results,
        timestamp: new Date().toISOString(),
        database_status: 'connected'
      });
    } catch (error: any) {
      logger.error('Schema health check failed:', error);
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ==========================================
  // SEARCH API ENDPOINTS
  // ==========================================

  // Global search endpoint
  app.get("/api/search", apiLimiter, async (req, res) => {
    try {
      const { q, limit = 10, type = 'all' } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json({ results: [], suggestions: [] });
      }

      const searchTerm = `%${q}%`;
      const results = [];

      // Search products
      if (type === 'all' || type === 'products') {
        const productResults = await db
          .select({
            id: products.id,
            title: products.name,
            subtitle: products.brand,
            price: products.price,
            image: sql`${products.images}->0`,
            type: sql`'product'`,
          })
          .from(products)
          .where(
            and(
              eq(products.status, 'active'),
              or(
                ilike(products.name, searchTerm),
                ilike(products.brand, searchTerm),
                ilike(products.description, searchTerm)
              )
            )
          )
          .limit(Number(limit));
        
        results.push(...productResults.map(p => ({
          ...p,
          type: 'product' as const,
          url: `/products/${p.id}`
        })));
      }

      // Search categories
      if (type === 'all' || type === 'categories') {
        const categoryResults = await db
          .select({
            id: categories.id,
            title: categories.name,
            type: sql`'category'`,
          })
          .from(categories)
          .where(
            and(
              eq(categories.isActive, true),
              ilike(categories.name, searchTerm)
            )
          )
          .limit(5);
        
        results.push(...categoryResults.map(c => ({
          ...c,
          type: 'category' as const,
          url: `/products?category=${c.id}`
        })));
      }

      // Get search suggestions
      const suggestions = await db
        .select({
          term: products.name,
          category: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.status, 'active'),
            ilike(products.name, searchTerm)
          )
        )
        .limit(5);

      res.json({ results, suggestions });
    } catch (error) {
      Logger.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Popular searches endpoint
  app.get("/api/search/popular", apiLimiter, async (req, res) => {
    try {
      // Popular searches based on weightlifting equipment
      const popularSearches = [
        "Olympic Barbell",
        "Bumper Plates", 
        "Power Rack",
        "Dumbbells",
        "Bench Press",
        "Kettlebells",
        "Weight Plates",
        "Squat Rack",
        "Cable Machine",
        "Resistance Bands"
      ];
      
      res.json({ searches: popularSearches });
    } catch (error) {
      Logger.error('Popular searches error:', error);
      res.status(500).json({ error: 'Failed to fetch popular searches' });
    }
  });
  
  // Security test endpoint removed for production

  app.get("/api/admin/stats", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      Logger.debug(`Admin stats result: ${JSON.stringify(stats)}`);
      res.json({
        totalProducts: stats.totalProducts || 0,
        totalUsers: stats.totalUsers || 0,
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error("Error fetching admin stats", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Enhanced admin users endpoint with filtering and stats
  app.get("/api/admin/users", adminLimiter, authMiddleware.requireAdmin, async (req, res) => {
    try {
      const { 
        search = '', 
        role = 'all', 
        status = 'all',
        sortBy = 'created', 
        sortOrder = 'desc', 
        page = 1, 
        limit = 20 
      } = req.query;
      
      // Build conditions
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            ilike(users.email, `%${search}%`),
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`)
          )
        );
      }
      
      if (role !== 'all') {
        conditions.push(eq(users.role, role as any));
      }
      
      // Get users without complex subqueries
      const usersQuery = db.select()
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
      
      // Apply sorting
      switch (sortBy) {
        case 'created':
          usersQuery.orderBy(sortOrder === 'desc' ? desc(users.createdAt) : asc(users.createdAt));
          break;
        case 'name':
          usersQuery.orderBy(sortOrder === 'desc' ? desc(users.firstName) : asc(users.firstName));
          break;
        case 'email':
          usersQuery.orderBy(sortOrder === 'desc' ? desc(users.email) : asc(users.email));
          break;
        default:
          usersQuery.orderBy(desc(users.createdAt));
      }
      
      const usersList = await usersQuery;
      
      // Get stats for each user separately
      const usersWithStats = await Promise.all(
        usersList.map(async (user) => {
          try {
            // Get all orders for this user and calculate in JavaScript
            const userOrders = await db
              .select()
              .from(orders)
              .where(eq(orders.userId, user.id));
            
            const completedUserOrders = userOrders.filter(o => 
              o.status === 'delivered'
            );
            
            const totalSpent = completedUserOrders.reduce((sum, order) => 
              sum + Number(order.total || 0), 0
            );
            
            return {
              ...user,
              orderCount: userOrders.length,
              totalSpent: totalSpent
            };
          } catch (error) {
            Logger.error(`Error fetching stats for user ${user.id}`, error);
            return {
              ...user,
              orderCount: 0,
              totalSpent: 0
            };
          }
        })
      );
      
      // Get total count for pagination
      const totalUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      res.json({
        users: usersWithStats,
        total: totalUsersResult[0]?.count || 0,
        page: Number(page),
        totalPages: Math.ceil((totalUsersResult[0]?.count || 0) / Number(limit))
      });
      
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Analytics endpoint - Fixed SQL syntax
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const { range = 'last30days' } = req.query;
      
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      switch (range) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setFullYear(2020); // All time
      }
      
      // Simplified approach - fetch data and process in JavaScript
      const allOrders = await db.select().from(orders);
      const allUsers = await db.select().from(users);
      const allProducts = await db.select().from(products);
      
      // Filter and calculate in JavaScript
      const filteredOrders = allOrders.filter(order => 
        new Date(order.createdAt!) >= startDate
      );
      
      const completedOrders = filteredOrders.filter(order => 
        order.status === 'delivered'
      );
      
      const totalRevenue = completedOrders.reduce((sum, order) => 
        sum + Number(order.total || 0), 0
      );
      
      // Simplified chart data
      const chartData = [];
      
      res.json({
        revenue: {
          total: totalRevenue,
          change: 0
        },
        orders: {
          total: filteredOrders.length,
          avgValue: filteredOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
          change: 0
        },
        users: {
          total: allUsers.length,
          change: 0
        },
        products: {
          total: allProducts.length,
          change: 0
        },
        conversion: {
          rate: 0,
          change: 0
        },
        charts: {
          revenue: []
        },
        topProducts: [],
        traffic: {
          sources: []
        },
        recentActivity: []
      });
      
    } catch (error) {
      Logger.error("Error fetching analytics", error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });



  // Wishlist analytics functionality removed for single-seller model

  // Admin Products Management - Main endpoint  
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const {
        search = '',
        category = 'all',
        status = 'all',
        sortBy = 'name',
        sortOrder = 'asc',
        priceMin = '0',
        priceMax = '10000',
        page = '1',
        limit = '20'
      } = req.query;

      // Build the query with proper filtering
      let query = db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          stockQuantity: products.stockQuantity,
          brand: products.brand,
          condition: products.condition,
          description: products.description,
          images: products.images,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          categoryId: products.categoryId,
          category: {
            id: categories.id,
            name: categories.name
          }
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id));

      const conditions = [];

      // Apply filters
      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.brand, `%${search}%`),
            ilike(products.description, `%${search}%`)
          )
        );
      }

      if (category !== 'all') {
        conditions.push(eq(products.categoryId, category as string));
      }

      // Price range filter
      const minPrice = parseFloat(priceMin as string);
      const maxPrice = parseFloat(priceMax as string);
      if (minPrice > 0) {
        conditions.push(gte(sql`CAST(${products.price} AS NUMERIC)`, minPrice));
      }
      if (maxPrice < 10000) {
        conditions.push(lte(sql`CAST(${products.price} AS NUMERIC)`, maxPrice));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Apply sorting
      const sortColumn = sortBy === 'name' ? products.name :
                        sortBy === 'price' ? sql`CAST(${products.price} AS NUMERIC)` :
                        sortBy === 'stock' ? products.stockQuantity :
                        products.createdAt;

      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)) as any;

      // Get total count for pagination
      let countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(products);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any;
      }

      const [totalResult] = await countQuery;
      const total = totalResult?.count || 0;

      // Apply pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query = query.limit(parseInt(limit as string)).offset(offset) as any;

      const result = await query;

      res.json({
        data: result.map(product => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          stock: product.stockQuantity || 0,
          brand: product.brand,
          condition: product.condition,
          description: product.description,
          images: product.images || [],
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          category: product.category?.name || 'Uncategorized',
          categoryId: product.categoryId,
          status: (product.stockQuantity || 0) > 0 ? 'active' : 'out-of-stock'
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        },
        filters: {
          search,
          category,
          status,
          sortBy,
          sortOrder,
          priceRange: { min: minPrice, max: maxPrice }
        }
      });
    } catch (error) {
      Logger.error("Error fetching admin products", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Product bulk operations
  app.post("/api/admin/products/bulk", requireAdmin, async (req, res) => {
    try {
      const { action, productIds } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Product IDs are required" });
      }

      let updateData = {};
      
      switch (action) {
        case 'delete':
          await db.delete(products).where(inArray(products.id, productIds));
          break;
        case 'deactivate':
          updateData = { stockQuantity: 0 };
          await db.update(products).set(updateData).where(inArray(products.id, productIds));
          break;
        case 'duplicate':
          // Get original products to duplicate
          const originalProducts = await db.select().from(products).where(inArray(products.id, productIds));
          const duplicates = originalProducts.map(product => ({
            ...product,
            id: undefined, // Let database generate new ID
            name: `${product.name} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          await db.insert(products).values(duplicates);
          break;
        default:
          return res.status(400).json({ error: "Invalid bulk action" });
      }

      res.json({ success: true, updated: productIds.length });
    } catch (error) {
      Logger.error("Error performing bulk product action", error);
      res.status(500).json({ error: "Failed to perform bulk action" });
    }
  });

  // Product export functionality
  app.get("/api/admin/products/export", requireAdmin, async (req, res) => {
    try {
      const { format = 'csv' } = req.query;
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          stock: products.stockQuantity,
          brand: products.brand,
          condition: products.condition,
          category: categories.name,
          createdAt: products.createdAt
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id));

      if (format === 'csv') {
        const headers = ['ID', 'Name', 'Price', 'Stock', 'Brand', 'Condition', 'Category', 'Created'];
        const rows = allProducts.map(p => [
          p.id,
          p.name,
          p.price,
          p.stock || 0,
          p.brand || '',
          p.condition,
          p.category || 'Uncategorized',
          new Date(p.createdAt!).toLocaleDateString()
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=products-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
      } else {
        res.json({
          format,
          data: allProducts,
          timestamp: new Date().toISOString(),
          totalRecords: allProducts.length
        });
      }
    } catch (error) {
      Logger.error("Error exporting products", error);
      res.status(500).json({ error: "Failed to export products" });
    }
  });

  // Individual product operations
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting product", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Filter options for category configuration
  app.get("/api/admin/products/filter-options", requireAdmin, async (req, res) => {
    try {
      // Get all products to extract unique values
      const allProducts = await db.select().from(products);
      const uniqueBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();

      const filterOptions = {
        brands: uniqueBrands,
        conditions: ['New', 'Like New', 'Excellent', 'Good', 'Fair']
      };

      res.json(filterOptions);
    } catch (error) {
      Logger.error('Error fetching filter options:', error);
      res.status(500).json({ message: 'Failed to fetch filter options' });
    }
  });

  // Category Management APIs - Enhanced with proper product counts
  app.get("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const {
        search = '',
        sortBy = 'order',
        sortOrder = 'asc'
      } = req.query;

      // Get categories with accurate product counts
      let query = db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          imageUrl: categories.imageUrl,
          isActive: categories.isActive,
          displayOrder: categories.displayOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
          productCount: sql<number>`(SELECT COUNT(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})`
        })
        .from(categories);

      const conditions = [];

      // Apply search filter
      if (search) {
        conditions.push(
          or(
            ilike(categories.name, `%${search}%`),
            ilike(categories.description, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Apply sorting
      const sortColumn = sortBy === 'name' ? categories.name :
                        sortBy === 'products' ? sql<number>`(SELECT COUNT(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})` :
                        sortBy === 'created' ? categories.createdAt :
                        categories.displayOrder;

      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)) as any;

      const result = await query;

      // Get summary stats
      const totalProducts = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products);

      const activeCategories = result.filter(cat => cat.isActive).length;
      const emptyCategories = result.filter(cat => Number(cat.productCount) === 0).length;

      res.json({
        categories: result.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          active: category.isActive,
          order: category.displayOrder || 0,
          productCount: Number(category.productCount) || 0,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        })),
        stats: {
          active: activeCategories,
          empty: emptyCategories,
          total: totalProducts[0]?.count || 0
        }
      });
    } catch (error) {
      Logger.error("Error fetching categories", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, /* upload.single('image'), */ async (req, res) => {
    try {
      const { name, slug, description, is_active, filter_config } = req.body;
      
      let imageUrl: string | undefined = undefined; // Clean slate: no image uploads initially

      const categoryData = {
        name,
        slug,
        description: description || null,
        imageUrl,
        isActive: is_active === 'true',
        filterConfig: filter_config ? JSON.parse(filter_config) : {}
      };

      const newCategory = await storage.createCategory(categoryData);
      res.json(newCategory);
    } catch (error) {
      Logger.error("Error creating category", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requireAdmin, /* upload.single('image'), */ async (req, res) => {
    try {
      const { name, slug, description, is_active, existing_image_url, filter_config } = req.body;
      
      let imageUrl = existing_image_url || null; // Clean slate: no file uploads initially

      const updates = {
        name,
        slug,
        description: description || null,
        imageUrl,
        isActive: is_active === 'true',
        filterConfig: filter_config ? JSON.parse(filter_config) : {}
      };

      const updatedCategory = await storage.updateCategory(req.params.id, updates);
      res.json(updatedCategory);
    } catch (error) {
      Logger.error("Error updating category", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.put("/api/admin/categories/:id/toggle", requireAdmin, async (req, res) => {
    try {
      const { is_active } = req.body;
      await storage.updateCategory(req.params.id, { isActive: is_active });
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error toggling category status", error);
      res.status(500).json({ message: "Failed to toggle category status" });
    }
  });

  // Category reorder endpoint
  app.post("/api/admin/categories/reorder", requireAdmin, async (req, res) => {
    try {
      const { categories: categoryUpdates } = req.body;
      
      if (!Array.isArray(categoryUpdates)) {
        return res.status(400).json({ error: "Categories array is required" });
      }

      // Update display order for each category
      for (const update of categoryUpdates) {
        await db
          .update(categories)
          .set({ displayOrder: update.order })
          .where(eq(categories.id, update.id));
      }

      res.json({ success: true });
    } catch (error) {
      Logger.error("Error reordering categories", error);
      res.status(500).json({ error: "Failed to reorder categories" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if category has products
      const productCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(eq(products.categoryId, id));

      if (productCount[0]?.count > 0) {
        return res.status(400).json({ 
          error: "Cannot delete category with products",
          message: `This category has ${productCount[0].count} products. Remove products first.`
        });
      }

      await db.delete(categories).where(eq(categories.id, id));
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting category", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // System health and information endpoints
  app.get("/api/admin/system/health", requireAdmin, async (req, res) => {
    try {
      const startTime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      // Test database connection
      let dbStatus = 'Connected';
      let dbLatency = 0;
      try {
        const start = Date.now();
        await db.select({ test: sql`1` });
        dbLatency = Date.now() - start;
      } catch (error) {
        dbStatus = 'Disconnected';
      }
      
      const systemHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(startTime),
        database: {
          status: dbStatus,
          latency: dbLatency,
          provider: 'Neon PostgreSQL'
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        storage: {
          status: 'Connected',
          provider: 'Cloudinary'
        },
        cache: {
          status: process.env.REDIS_URL ? 'Connected' : 'Disabled',
          provider: 'Redis'
        },
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      };

      res.json(systemHealth);
    } catch (error) {
      Logger.error("Error fetching system health", error);
      res.status(500).json({ 
        status: 'unhealthy',
        error: "Failed to fetch system health",
        timestamp: new Date().toISOString()
      });
    }  
  });

  app.get("/api/admin/system/info", requireAdmin, async (req, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Get database stats
      const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
      const [productCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(products);
      const [orderCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(orders);
      
      const systemInfo = {
        application: {
          name: 'Clean & Flip Admin',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
          startTime: new Date(Date.now() - uptime * 1000).toISOString()
        },
        database: {
          status: 'Connected',
          provider: 'Neon PostgreSQL',
          totalUsers: userCount?.count || 0,
          totalProducts: productCount?.count || 0,
          totalOrders: orderCount?.count || 0
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          },
          cpu: {
            usage: Math.round(Math.random() * 20 + 10) // Mock CPU usage
          }
        },
        services: {
          cloudinary: {
            status: process.env.CLOUDINARY_CLOUD_NAME ? 'Connected' : 'Not Configured'
          },
          redis: {
            status: process.env.REDIS_URL ? 'Connected' : 'Disabled'
          },
          stripe: {
            status: process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not Configured'
          }
        }
      };

      res.json(systemInfo);
    } catch (error) {
      Logger.error("Error fetching system info", error);
      res.status(500).json({ error: "Failed to fetch system info" });
    }
  });

  app.post("/api/admin/categories/reorder", requireAdmin, async (req, res) => {
    try {
      const { categoryOrder } = req.body;
      await storage.reorderCategories(categoryOrder);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error reordering categories", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });

  // UNIFIED ADDRESS SYSTEM - Single definitive endpoint
  app.get("/api/addresses", requireAuth, async (req, res) => {
    try {
      // SECURITY FIX: Use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware
      
      Logger.info("=== /api/addresses DEBUG ===");
      Logger.info("Authenticated userId:", userId);
      
      // Fetch user with address data directly from database using Drizzle
      const userWithAddress = await db
        .select({
          id: users.id,
          street: users.street,
          city: users.city,
          state: users.state,
          zipCode: users.zipCode,
          latitude: users.latitude,
          longitude: users.longitude,
          isLocalCustomer: users.isLocalCustomer
        })
        .from(users)
        .where(eq(users.id, userId!))
        .limit(1);
      
      Logger.info("5. DB query result:", userWithAddress);
      
      if (!userWithAddress.length) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const user = userWithAddress[0];
      
      // Format address data for frontend
      const addresses = [];
      if (user.street && user.city && user.state && user.zipCode) {
        addresses.push({
          id: user.id,
          street: user.street,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          latitude: user.latitude,
          longitude: user.longitude,
          isLocal: user.isLocalCustomer,
          isDefault: true
        });
      }
      
      Logger.info("6. Formatted addresses:", addresses);
      return res.json(addresses);
      
    } catch (error) {
      Logger.error("Error fetching addresses", error);
      return res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", requireAuth, async (req, res) => {
    try {
      // SECURITY FIX: Use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware

      const { street, city, state, zipCode, latitude, longitude } = req.body;

      if (!street || !city || !state || !zipCode) {
        return res.status(400).json({ error: "All address fields are required" });
      }

      // Check if this is in Asheville area (local customer detection)
      const ashevilleZips = ['28801', '28802', '28803', '28804', '28805', '28806', '28810', '28813', '28814', '28815', '28816'];
      const isLocal = ashevilleZips.includes(zipCode);

      // Update user address directly in database using Drizzle
      const [updatedUser] = await db
        .update(users)
        .set({
          street,
          city,
          state,
          zipCode,
          latitude: latitude ? parseFloat(latitude) as any : null,
          longitude: longitude ? parseFloat(longitude) as any : null,
          isLocalCustomer: isLocal,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId!))
        .returning();

      res.json({
        success: true,
        address: {
          id: updatedUser.id,
          street: updatedUser.street,
          city: updatedUser.city,
          state: updatedUser.state,
          zipCode: updatedUser.zipCode,
          latitude: updatedUser.latitude,
          longitude: updatedUser.longitude,
          isLocal: updatedUser.isLocalCustomer,
          isDefault: true
        }
      });
    } catch (error) {
      Logger.error("Error saving address", error);
      res.status(500).json({ error: "Failed to save address" });
    }
  });

  // Simple users endpoint for admin
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const usersList = await db.select().from(users).limit(100);
      
      // Transform to match frontend interface
      const transformedUsers = usersList.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: !user.isAdmin, // Transform field name
        lastLogin: user.updatedAt?.toISOString() || null,
        createdAt: user.createdAt?.toISOString() || null
      }));
      
      res.json(transformedUsers);
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // User endpoint (protected) - Using proper Passport authentication
  app.get("/api/user", (req, res) => {
    Logger.debug(`[USER API] Authentication check - isAuthenticated: ${req.isAuthenticated?.()}, user: ${!!req.user}, sessionID: ${req.sessionID}`);
    Logger.debug(`[USER API] Session passport: ${JSON.stringify((req.session as any)?.passport)}`);
    
    // Use Passport's built-in authentication check
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      Logger.debug('[USER API] Not authenticated - no isAuthenticated function or returns false');
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // req.user is automatically populated by Passport deserializeUser
    if (!req.user) {
      Logger.debug('[USER API] Not authenticated - no user object');
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    Logger.debug(`[USER API] User found: ${JSON.stringify(req.user)}`);
    
    // Remove sensitive data before sending user info
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Activity tracking endpoint for real analytics
  app.post("/api/track-activity", async (req, res) => {
    try {
      const { eventType, pageUrl, userId } = req.body;
      const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
      
      const activity = {
        eventType,
        pageUrl,
        userId: userId || null,
        sessionId: String(sessionId)
      };
      
      await storage.trackActivity(activity);
      res.json({ success: true });
    } catch (error: any) {
      Logger.error('Error tracking activity:', error.message);
      res.status(500).json({ error: "Failed to track activity" });
    }
  });

  // System health endpoint
  app.get("/api/admin/system/health", requireAdmin, async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const health = {
        status: 'Healthy',
        uptime: Math.floor(process.uptime()),
        memoryPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        memoryUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        memoryTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        timestamp: new Date().toISOString()
      };
      res.json(health);
    } catch (error) {
      Logger.error("Error fetching system health", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });



  // Database health check
  app.get("/api/admin/system/db-check", requireAdmin, async (req, res) => {
    try {
      await storage.healthCheck();
      res.json({ status: 'Connected', pool: 'Active', timestamp: new Date().toISOString() });
    } catch (error) {
      Logger.error("Database health check failed:", error);
      res.status(500).json({ status: 'Disconnected', pool: 'Error', error: (error as any).message });
    }
  });

  // Product management endpoints
  
  // Create new product with image uploads
  app.post("/api/admin/products", requireAdmin, /* upload.array('images', 6), */ async (req, res) => {
    try {
      // Handle images array from form data
      let images = [];
      if (req.body.images) {
        images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        images = images.filter((img: any) => {
          if (typeof img === 'string') {
            return img.trim() !== '';
          } else if (img && typeof img === 'object' && img.url) {
            return img.url.trim() !== '';
          }
          return false;
        });
      }
      
      // Add new images if uploaded via multer
      if (req.files && (req.files as any[]).length > 0) {
        const newImages = (req.files as any[]).map(file => file.path);
        images = [...images, ...newImages];
      }

      const productData = {
        ...req.body,
        images,
        price: parseFloat(req.body.price) || 0,
        stockQuantity: parseInt(req.body.stockQuantity) || 0,
        weight: parseFloat(req.body.weight) || 0,
        isFeatured: false,
        status: 'active'
      };
      
      Logger.debug(`Creating product with data: ${JSON.stringify(productData)}`);
      const newProduct = await storage.createProduct(productData);
      res.json(newProduct);
    } catch (error) {
      Logger.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product: ' + (error as any).message });
    }
  });

  // Update product with image uploads
  app.put("/api/admin/products/:id", requireAdmin, /* upload.array('images', 6), */ async (req, res) => {
    try {
      const { id } = req.params;
      
      const updateData = {
        ...req.body,
        price: parseFloat(req.body.price) || 0,
        stockQuantity: parseInt(req.body.stockQuantity) || 0,
        weight: parseFloat(req.body.weight) || 0
      };
      
      // Handle images array from form data - always update images field
      if ('images' in req.body) {
        if (req.body.images && req.body.images.length > 0) {
          const images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
          updateData.images = images.filter((img: any) => {
            if (typeof img === 'string') {
              return img.trim() !== '';
            } else if (img && typeof img === 'object' && img.url) {
              return img.url.trim() !== '';
            }
            return false;
          });
        } else {
          // Explicitly set to empty array when no images
          updateData.images = [];
        }
      }
      
      // Add new images if uploaded via multer
      if (req.files && (req.files as any[]).length > 0) {
        const newImages = (req.files as any[]).map(file => file.path);
        updateData.images = updateData.images ? [...updateData.images, ...newImages] : newImages;
      }
      
      Logger.debug(`Updating product with data: ${JSON.stringify(updateData)}`);
      const updatedProduct = await storage.updateProduct(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      Logger.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product: ' + (error as any).message });
    }
  });



  app.put("/api/admin/products/:id/stock", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateProductStock(req.params.id, status);
      res.json({ message: "Stock status updated" });
    } catch (error) {
      Logger.error("Error updating stock", error);
      res.status(500).json({ message: "Failed to update stock" });
    }
  });

  // User role management
  app.put("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      await storage.updateUserRole(req.params.id, role);
      res.json({ message: "User role updated" });
    } catch (error) {
      Logger.error("Error updating user role", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Equipment Submissions Management (for authenticated users)
  app.post("/api/equipment-submissions", requireAuth, async (req, res) => {
    try {
      // SECURITY FIX: Only use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware

      if (!userId) {
        return res.status(401).json({ 
          error: "Authentication required", 
          message: "Please log in to submit equipment" 
        });
      }
      
      // Import reference generator
      const { generateUniqueReference } = await import("./utils/referenceGenerator");
      const referenceNumber = await generateUniqueReference();
      
      const submission = await storage.createSubmission({
        ...req.body,
        userId,
        referenceNumber,
      });
      
      Logger.info(`Equipment submission created: ${submission.id} with reference: ${referenceNumber}`);
      res.json({ 
        ...submission,
        referenceNumber: submission.referenceNumber 
      });
    } catch (error) {
      Logger.error("Error creating equipment submission", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  // Equipment submission tracking by reference number (public endpoint)
  app.get("/api/submissions/track/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const submission = await storage.getSubmissionByReference(reference);
      
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      // Return limited data for public tracking
      const publicData = {
        referenceNumber: submission.referenceNumber,
        name: submission.name,
        brand: submission.brand,
        condition: submission.condition,
        status: submission.status,
        statusHistory: submission.statusHistory || [],
        createdAt: submission.createdAt,
        scheduledPickupDate: submission.scheduledPickupDate,
        pickupWindowStart: submission.pickupWindowStart,
        pickupWindowEnd: submission.pickupWindowEnd,
        offerAmount: submission.offerAmount,
        declineReason: submission.declineReason,
      };
      
      res.json(publicData);
    } catch (error) {
      Logger.error("Error tracking submission:", error);
      res.status(500).json({ error: "Failed to track submission" });
    }
  });

  app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
    try {
      
      
      
      
      const { status, search, isLocal, page = 1, limit = 20 } = req.query;
      
      // Get total count
      const totalResult = await db
        .select({ total: count() })
        .from(equipmentSubmissions);
      
      const totalCount = totalResult[0]?.total || 0;

      
      // Build main query with conditions
      const conditions = [];
      if (status && status !== 'all') {
        conditions.push(eq(equipmentSubmissions.status, status as string));
      }
      if (search) {
        conditions.push(
          or(
            ilike(equipmentSubmissions.referenceNumber, `%${search}%`),
            ilike(equipmentSubmissions.name, `%${search}%`)
          )
        );
      }
      if (isLocal !== undefined && isLocal !== null) {
        conditions.push(eq(equipmentSubmissions.isLocal, isLocal === 'true'));
      }
      
      // Main query with joins
      const query = db
        .select({
          submission: equipmentSubmissions,
          user: {
            name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
            email: users.email
          }
        })
        .from(equipmentSubmissions)
        .leftJoin(users, eq(equipmentSubmissions.userId, users.id))
        .orderBy(desc(equipmentSubmissions.createdAt))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
      
      // Execute query with conditions
      const submissions = conditions.length > 0 
        ? await query.where(and(...conditions))
        : await query;
      

      
      // Get status counts
      const statusCounts = await db
        .select({
          status: equipmentSubmissions.status,
          count: count()
        })
        .from(equipmentSubmissions)
        .groupBy(equipmentSubmissions.status);
      

      
      // Format response for frontend compatibility
      const response = {
        data: submissions.map(s => ({
          id: s.submission.id,
          referenceNumber: s.submission.referenceNumber || 'N/A',
          name: s.submission.name, // Map 'name' field
          equipmentName: s.submission.name, // Also provide as equipmentName for compatibility
          description: s.submission.description,
          brand: s.submission.brand,
          condition: s.submission.condition,
          weight: s.submission.weight,
          askingPrice: s.submission.askingPrice,
          status: s.submission.status,
          createdAt: s.submission.createdAt,
          phoneNumber: s.submission.phoneNumber,
          email: s.submission.email,
          isLocal: s.submission.isLocal,
          distance: s.submission.distance,
          offerAmount: s.submission.offerAmount,
          adminNotes: s.submission.adminNotes,
          images: s.submission.images || [],
          user: s.user || { id: '', email: '', firstName: '', lastName: '' }
        })),
        total: Number(totalCount),
        ...Object.fromEntries(
          statusCounts.map(sc => [sc.status || 'unknown', Number(sc.count)])
        )
      };
      

      res.json(response);
      
    } catch (error) {
      Logger.error('Error in admin submissions endpoint', error);
      res.status(500).json({ 
        error: 'Failed to fetch submissions',
        details: (error as any).message,
        data: [],
        total: 0
      });
    }
  });

  // Get user's own submissions  
  app.get("/api/my-submissions", requireAuth, async (req: any, res) => {
    try {
      // SECURITY FIX: Only use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware

      if (!userId) {
        Logger.error("No userId found in authentication sources");
        return res.json([]); // Return empty array for non-authenticated users
      }

      // Direct database query for user's submissions
      const submissions = await db
        .select()
        .from(equipmentSubmissions)
        .where(eq(equipmentSubmissions.userId, userId))
        .orderBy(desc(equipmentSubmissions.createdAt));

      res.json(submissions || []);
    } catch (error) {
      Logger.error("Error fetching user submissions:", error);
      res.json([]); // Return empty array instead of error to prevent UI crashes
    }
  });

  // User cancels their own submission
  app.post('/api/submissions/:id/cancel', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // SECURITY FIX: Only use authenticated userId from middleware
      const userId = req.userId; // Set by requireAuth middleware

      if (!userId) {
        Logger.error("No userId found in authentication sources for cancellation");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Direct database query to get submission and verify ownership
      const submission = await db
        .select()
        .from(equipmentSubmissions)
        .where(
          and(
            eq(equipmentSubmissions.id, id),
            eq(equipmentSubmissions.userId, userId)
          )
        )
        .limit(1);
      
      if (!submission || submission.length === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      const currentSubmission = submission[0];
      
      // Check if cancellation is allowed
      const nonCancellableStatuses = ['scheduled', 'completed', 'cancelled'];
      if (nonCancellableStatuses.includes(currentSubmission.status!)) {
        return res.status(400).json({ 
          error: `Cannot cancel submission with status: ${currentSubmission.status}` 
        });
      }
      
      // Update status history
      const newHistory = [
        ...(currentSubmission.statusHistory as any || []),
        {
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          changedBy: 'user',
          notes: reason || 'Cancelled by user'
        }
      ];
      
      // Update submission using direct database query
      await db
        .update(equipmentSubmissions)
        .set({
          status: 'cancelled',
          statusHistory: newHistory,
          updatedAt: new Date(),
          adminNotes: `User cancelled: ${reason || 'No reason provided'}`
        })
        .where(eq(equipmentSubmissions.id, id));
      
      Logger.info(`Equipment submission cancelled by user: ${id}`);
      res.json({ success: true, message: 'Submission cancelled successfully' });
    } catch (error) {
      Logger.error("Error cancelling submission:", error);
      res.status(500).json({ error: "Failed to cancel submission" });
    }
  });

  app.put("/api/admin/submissions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await storage.updateEquipmentSubmission(id, {
        ...updates,
        updatedAt: new Date(),
      });
      
      Logger.info(`Equipment submission updated: ${id}`);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error updating submission", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  // Bulk actions for submissions
  app.post("/api/admin/submissions/bulk", requireAdmin, async (req, res) => {
    try {
      const { action, submissionIds } = req.body;
      
      if (!action || !submissionIds || !Array.isArray(submissionIds)) {
        return res.status(400).json({ error: "Invalid bulk action request" });
      }

      let updateData: any = { updatedAt: new Date() };
      
      switch (action) {
        case 'archive':
          updateData.status = 'archived';
          break;
        case 'delete':
          // For safety, we'll mark as deleted rather than actually deleting
          updateData.status = 'deleted';
          break;
        case 'export':
          // This is handled by the export endpoint, just return success
          return res.json({ success: true, message: 'Export initiated' });
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      // Update all submissions in the array
      const results = await Promise.allSettled(
        submissionIds.map(id => 
          db.update(equipmentSubmissions)
            .set(updateData)
            .where(eq(equipmentSubmissions.id, id))
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      Logger.info(`Bulk action ${action} completed for ${successCount}/${submissionIds.length} submissions`);
      res.json({ success: true, updated: successCount, total: submissionIds.length });
    } catch (error) {
      Logger.error("Error performing bulk action", error);
      res.status(500).json({ error: "Failed to perform bulk action" });
    }
  });

  // Export submissions data
  app.get("/api/admin/submissions/export", requireAdmin, async (req, res) => {
    try {
      const {
        format = 'csv',
        status = 'all',
        search = '',
        isLocal
      } = req.query;

      // Build query for export - similar to main submissions endpoint but get all results
      const conditions = [];
      if (status && status !== 'all') {
        conditions.push(eq(equipmentSubmissions.status, status as string));
      }
      if (search) {
        conditions.push(
          or(
            ilike(equipmentSubmissions.referenceNumber, `%${search}%`),
            ilike(equipmentSubmissions.name, `%${search}%`)
          )
        );
      }
      if (isLocal !== undefined && isLocal !== null) {
        conditions.push(eq(equipmentSubmissions.isLocal, isLocal === 'true'));
      }

      // Get all matching submissions for export
      let query = db
        .select({
          submission: equipmentSubmissions,
          user: {
            name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
            email: users.email
          }
        })
        .from(equipmentSubmissions)
        .leftJoin(users, eq(equipmentSubmissions.userId, users.id))
        .orderBy(desc(equipmentSubmissions.createdAt));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const submissions = await query;
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = [
          'Reference Number', 'Name', 'Brand', 'Condition', 'Status', 
          'Asking Price', 'Offer Amount', 'User Email', 'User Name',
          'Location', 'Is Local', 'Created Date', 'Admin Notes'
        ];
        
        const csvRows = submissions.map(s => [
          s.submission.referenceNumber,
          s.submission.name,
          s.submission.brand,
          s.submission.condition,
          s.submission.status,
          s.submission.askingPrice || '',
          s.submission.offerAmount || '',
          s.user?.email || '',
          s.user?.name || '',
          [s.submission.userCity, s.submission.userState].filter(Boolean).join(', '),
          s.submission.isLocal ? 'Yes' : 'No',
          new Date(s.submission.createdAt!).toLocaleDateString(),
          s.submission.adminNotes || ''
        ]);

        const csvContent = convertSubmissionsToCSV(submissions.map(s => ({
          referenceNumber: s.submission.referenceNumber,
          name: s.submission.name,
          brand: s.submission.brand,
          condition: s.submission.condition,
          status: s.submission.status,
          askingPrice: s.submission.askingPrice,
          offerAmount: s.submission.offerAmount,
          user: s.user,
          userCity: s.submission.userCity,
          userState: s.submission.userState,
          isLocal: s.submission.isLocal,
          adminNotes: s.submission.adminNotes,
          createdAt: s.submission.createdAt
        })));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=submissions-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
      } else {
        // Return JSON for PDF or other processing
        res.json({
          format,
          data: submissions.map(s => ({
            ...s.submission,
            user: s.user
          })),
          timestamp: new Date().toISOString(),
          totalRecords: submissions.length
        });
      }
    } catch (error) {
      Logger.error("Error exporting submissions", error);
      res.status(500).json({ error: "Failed to export submissions" });
    }
  });

  // CSV Export endpoints
  app.get("/api/admin/export/:type", requireAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      let data: any[] = [];
      let filename = '';
      let columns: string[] = [];

      switch (type) {
        case 'products':
          const products = await storage.getProducts();
          data = products.products;
          filename = `products-${Date.now()}.csv`;
          columns = ['id', 'name', 'price', 'categoryId', 'condition', 'quantity'];
          break;
        case 'users':
          const users = await storage.getAllUsers();
          data = users;
          filename = `users-${Date.now()}.csv`;
          columns = ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'];
          break;
        case 'orders':
          const orders = await storage.getUserOrders(''); // Empty string for all orders
          data = orders;
          filename = `orders-${Date.now()}.csv`;
          columns = ['id', 'userId', 'totalAmount', 'status', 'createdAt'];
          break;
        default:
          return res.status(400).json({ error: 'Invalid export type' });
      }

      // Convert to CSV
      const csvHeader = columns.join(',');
      const csvRows = data.map(row => 
        columns.map(col => `"${(row as any)[col] || ''}"`).join(',')
      );
      const csv = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      Logger.error(`Error exporting ${req.params.type}:`, error);
      res.status(500).json({ error: `Failed to export ${req.params.type}` });
    }
  });

  // Export endpoints
  app.get("/api/admin/export/:type", requireAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      let csv = '';
      
      switch(type) {
        case 'products':
          csv = await storage.exportProductsToCSV();
          break;
        case 'users':
          csv = await storage.exportUsersToCSV();
          break;
        case 'orders':
          csv = await storage.exportOrdersToCSV();
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      Logger.error("Error exporting data", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Memory storage for single file uploads with industry-standard limits
  const memoryStorage = multer.memoryStorage();
  const memoryUpload = multer({ 
    storage: memoryStorage,
    limits: { 
      fileSize: 12 * 1024 * 1024, // 12MB limit (industry standard)
      files: 12 // Maximum 12 images per product
    },
    fileFilter: (req, file, cb) => {
      // Industry standard image types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
      }
    }
  });

  // Cloudinary upload endpoint - allow admin and developer roles
  app.post("/api/upload/cloudinary", requireRole(['admin', 'developer']), (req, res, next) => {
    memoryUpload.single('file')(req, res, (err) => {
      if (err) {
        Logger.error('Multer upload error:', err);
        
        // Handle specific multer errors with user-friendly messages
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'File too large',
            message: 'Image must be smaller than 12MB. Please compress your image or choose a smaller file.',
            maxSize: '12MB'
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            error: 'Too many files',
            message: 'Maximum 12 images allowed per product.',
            maxFiles: 12
          });
        }
        
        if (err.message.includes('Only JPEG, PNG, and WebP')) {
          return res.status(400).json({ 
            error: 'Invalid file type',
            message: 'Only JPEG, PNG, and WebP images are allowed.',
            allowedTypes: ['JPEG', 'PNG', 'WebP']
          });
        }
        
        return res.status(400).json({ 
          error: 'Upload error',
          message: 'Failed to process uploaded file. Please try again.',
          details: err.message
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file provided',
          message: 'Please select an image file to upload.'
        });
      }
      
      // Processing upload: clean logging implemented
      Logger.debug(`Processing upload: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);
      
      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      
      // Upload to Cloudinary with industry-standard transformations
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'clean-flip/products',
        resource_type: 'image',
        transformation: [
          { 
            width: 2000, 
            height: 2000, 
            crop: 'limit',           // Don't upscale smaller images
            quality: 'auto:best',    // Auto quality optimization
            fetch_format: 'auto'     // Auto format (WebP where supported)
          }
        ],
        // Generate thumbnails for faster loading
        eager: [
          {
            width: 800,
            height: 800,
            crop: 'fill',
            quality: 'auto'
          }
        ]
      });
      
      Logger.info(`Cloudinary upload successful: ${result.secure_url}`);
      
      res.json({ 
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      });
    } catch (error) {
      Logger.error('Cloudinary upload error:', error);
      res.status(500).json({ 
        error: 'Upload failed',
        message: 'Failed to upload image to cloud storage. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
      });
    }
  });

  // Delete Cloudinary image endpoint - allow admin and developer roles
  app.delete("/api/upload/cloudinary/:publicId", requireRole(['admin', 'developer']), async (req, res) => {
    try {
      const publicId = decodeURIComponent(req.params.publicId);
      await cloudinary.uploader.destroy(publicId);
      res.json({ success: true });
    } catch (error) {
      Logger.error('Cloudinary delete error:', error);
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  // Stripe sync routes (admin only)
  app.post('/api/stripe/sync-all', requireRole(['admin']), async (req, res) => {
    try {
      const { StripeProductSync } = await import('./services/stripe-sync.js');
      await StripeProductSync.syncAllProducts();
      res.json({ success: true, message: 'All products synced to Stripe' });
    } catch (error) {
      Logger.error('Sync all products error:', error);
      res.status(500).json({ error: 'Failed to sync products' });
    }
  });

  app.post('/api/stripe/sync/:productId', requireRole(['admin']), async (req, res) => {
    try {
      const { StripeProductSync } = await import('./services/stripe-sync.js');
      const { productId } = req.params;
      await StripeProductSync.syncProduct(productId);
      res.json({ success: true, message: 'Product synced to Stripe' });
    } catch (error) {
      Logger.error('Sync product error:', error);
      res.status(500).json({ error: 'Failed to sync product' });
    }
  });

  app.post('/api/stripe/create-test-products', requireRole(['admin']), async (req, res) => {
    try {
      const { createTestProducts } = await import('./scripts/create-test-products.js');
      await createTestProducts();
      res.json({ success: true, message: 'Test products created and synced' });
    } catch (error) {
      Logger.error('Create test products error:', error);
      res.status(500).json({ error: 'Failed to create test products' });
    }
  });

  // Add global error handling
  app.use(errorTracking);

  // Security hardening complete - simplified logging
  Logger.info('Clean & Flip Security Hardening Complete');
  Logger.info('Production-grade security measures now active');

  // =======================================================
  // AUTH ROUTES (PASSWORD RESET)
  // =======================================================
  
  // Auth routes moved to main server file for simple implementation





  // Debug endpoint (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/list-emails', async (req, res) => {
      try {
        const allEmails = await db
          .select({
            id: users.id,
            email: users.email,
            created: users.createdAt,
          })
          .from(users);
        res.json({ emails: allEmails });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  const httpServer = createServer(app);
  
  // Initialize WebSocket support
  const io = initializeWebSocket(httpServer);
  
  // Register graceful shutdown handlers
  registerGracefulShutdown(httpServer);
  
  // Display professional startup banner with connection info
  const endTime = Date.now() - startupTime;
  displayStartupBanner({
    port: process.env.PORT || 5000,
    db: true, // Database is connected at this point
    redis: redisConnected,
    ws: true, // WebSocket initialized
    startupTime: endTime,
    warnings,
  });
  
  // Initialize consolidated logger with environment-based log level
  const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
  Logger.setLogLevel(LogLevel[LOG_LEVEL as keyof typeof LogLevel]);
  
  // Log database connection success only once using new logger
  if (!process.env.DB_CONNECTION_LOGGED) {
    Logger.info('Database connected successfully');
    process.env.DB_CONNECTION_LOGGED = 'true';
  }
  
  // Start the HTTP server with enhanced startup logging
  const port = Number(process.env.PORT) || 5000;
  const host = '0.0.0.0'; // Required for Cloud Run deployments
  
  Logger.info(`[STARTUP] Attempting to start server on ${host}:${port}`);
  Logger.info(`[STARTUP] Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.info(`[STARTUP] Node version: ${process.version}`);
  
  const server = httpServer.listen(port, host, () => {
    const address = server.address();
    Logger.info(`🚀 Server successfully started and listening`, {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      host: host,
      port: port,
      actualAddress: address,
      redis: redisConnected ? 'Connected' : 'Disabled',
      websocket: 'Enabled',
      process: {
        pid: process.pid,
        memory: process.memoryUsage()
      }
    });
    
    // Legacy logger for backward compatibility
    logger.info(`🚀 Server started on port ${port}`, {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: port,
      redis: redisConnected ? 'Connected' : 'Disabled',
      websocket: 'Enabled'
    });
  });
  
  // Enhanced error handling for server startup
  server.on('error', (error: any) => {
    Logger.error(`[STARTUP] Server failed to start:`, error);
    if (error.code === 'EADDRINUSE') {
      Logger.error(`[STARTUP] Port ${port} is already in use`);
    } else if (error.code === 'EACCES') {
      Logger.error(`[STARTUP] Permission denied to bind to port ${port}`);
    }
    process.exit(1);
  });
  
  // ===== NEW E-COMMERCE API ENDPOINTS =====
  
  // Product Reviews & Ratings
  app.post("/api/reviews", authMiddleware.requireAuth, async (req, res) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = (req as any).userId;
      
      if (!productId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid product ID and rating (1-5) required" });
      }
      
      const review = await db.insert(reviews).values({
        productId: String(productId),
        userId,
        rating,
        comment: comment || '',
        verifiedPurchase: false, // TODO: Check if user actually purchased this product
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      res.json(review[0]);
    } catch (error) {
      Logger.error("Error creating review", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });
  
  app.get("/api/reviews/:productId", async (req, res) => {
    try {
      const productReviews = await db.select().from(reviews)
        .where(eq(reviews.productId, req.params.productId))
        .orderBy(desc(reviews.createdAt));
      
      res.json(productReviews);
    } catch (error) {
      Logger.error("Error fetching reviews", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  
  // Coupon Validation
  app.post("/api/coupons/validate", authMiddleware.optionalAuth, async (req, res) => {
    try {
      const { code, cartTotal } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code required" });
      }
      
      const coupon = await db.select().from(coupons)
        .where(and(
          eq(coupons.code, code.toUpperCase()),
          eq(coupons.active, true)
        ))
        .limit(1);
      
      if (!coupon.length) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }
      
      const couponData = coupon[0];
      
      // Check expiration
      if (couponData.expiresAt && new Date() > couponData.expiresAt) {
        return res.status(400).json({ error: "Coupon has expired" });
      }
      
      // Check usage limit  
      if (couponData.used_count >= (couponData.max_uses || 999999)) {
        return res.status(400).json({ error: "Coupon usage limit reached" });
      }
      
      // Check minimum purchase
      if (couponData.min_purchase && cartTotal < Number(couponData.min_purchase)) {
        return res.status(400).json({ 
          error: `Minimum purchase of $${couponData.min_purchase} required` 
        });
      }
      
      // Calculate discount
      let discount = 0;
      if (couponData.discount_percent) {
        discount = (cartTotal * Number(couponData.discount_percent)) / 100;
      } else if (couponData.discount_amount) {
        discount = Number(couponData.discount_amount);
      }
      
      res.json({
        valid: true,
        discount,
        code: couponData.code,
        type: couponData.discount_percent ? 'percentage' : 'fixed'
      });
    } catch (error) {
      Logger.error("Error validating coupon", error);
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });
  
  // Inventory Check
  app.post("/api/inventory/check", async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      
      const product = await db.select().from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (!product.length) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const available = product[0].stockQuantity >= quantity;
      
      res.json({
        available,
        stockQuantity: product[0].stockQuantity,
        requested: quantity
      });
    } catch (error) {
      Logger.error("Error checking inventory", error);
      res.status(500).json({ error: "Failed to check inventory" });
    }
  });
  
  // Newsletter Subscription
  app.post("/api/email/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email address required" });
      }
      
      // Add to email queue for processing
      await db.insert(emailQueue).values({
        toEmail: email,
        template: 'newsletter_welcome',
        data: { email },
        status: 'pending',
        createdAt: new Date()
      });
      
      res.json({ success: true, message: "Successfully subscribed to newsletter" });
    } catch (error) {
      Logger.error("Error subscribing to newsletter", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  server.on('listening', () => {
    Logger.info(`[STARTUP] Server is now accepting connections on ${host}:${port}`);
  });

  return server;
}
