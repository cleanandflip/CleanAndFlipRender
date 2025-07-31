import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { upload, cloudinary } from "./config/cloudinary";
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
  submissions,
  cart,
  wishlist,
  activityLogs,
  type User,
  type Product,
  type Category,
  type NewProduct,
  type UpdateProduct,
  type AnalyticsData
} from "@shared/schema";
import { eq, desc, ilike, sql, and, or, gt, lt, gte, lte, ne, asc, inArray } from "drizzle-orm";
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
  insertEquipmentSubmissionSchema,
  insertWishlistSchema
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
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
  
  // Setup authentication
  setupAuth(app);
  
  // Initialize search indexes
  await initializeSearchIndexes();
  
  // Health check endpoints
  app.get('/health', healthLive);
  app.get('/health/live', healthLive);
  app.get('/health/ready', healthReady);
  
  // Performance testing endpoint (development only)
  app.get('/api/performance-test', performanceTest);
  
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

  // Cart operations - Always fetch fresh product data
  app.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id || req.userId || (req.session as any)?.userId;
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

  app.post("/api/cart", requireAuth, async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user?.id || req.userId || (req.session as any)?.userId;
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
      const userId = req.user?.id || req.userId || (req.session as any)?.userId;
      const sessionId = req.sessionID;
      
      const cartItems = await storage.getCartItems(
        userId || undefined,
        sessionId
      );
      
      const updates = [];
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.productId);
        
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
  app.get("/api/orders", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      Logger.error("Error fetching orders", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
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

  // Wishlist - require authentication
  app.get("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = req.userId; // Now set by requireAuth middleware
      
      Logger.debug(`Get wishlist - userId: ${userId}`);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to view your wishlist'
        });
      }
      
      const wishlistItems = await storage.getWishlistItems(userId);
      res.json(wishlistItems);
    } catch (error) {
      Logger.error("Error fetching wishlist", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  // Wishlist cache for preventing spam requests
  const wishlistCache = new Map<string, { data: any; timestamp: number }>();
  const WISHLIST_CACHE_DURATION = 10000; // 10 seconds - longer cache
  
  // BATCH wishlist check endpoint to reduce API spam
  app.post("/api/wishlist/check-batch", requireAuth, async (req, res) => {
    try {
      const { productIds } = req.body;
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to check wishlist status'
        });
      }
      
      if (!productIds || !Array.isArray(productIds)) {
        return res.status(400).json({ message: "Product IDs array required" });
      }
      
      const results = {};
      const uncachedIds = [];
      
      // Check cache first
      for (const productId of productIds) {
        const cacheKey = `${userId}-${productId}`;
        const cached = wishlistCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < WISHLIST_CACHE_DURATION) {
          results[productId] = cached.data.isWishlisted;
        } else {
          uncachedIds.push(productId);
        }
      }
      
      // Fetch uncached items in batch
      if (uncachedIds.length > 0) {
        const wishlistStatuses = await storage.getWishlistStatusBatch(userId, uncachedIds);
        
        for (const productId of uncachedIds) {
          const isWishlisted = wishlistStatuses[productId] || false;
          results[productId] = isWishlisted;
          
          // Cache individual results
          const cacheKey = `${userId}-${productId}`;
          wishlistCache.set(cacheKey, {
            data: { isWishlisted },
            timestamp: Date.now()
          });
        }
      }
      
      res.json(results);
    } catch (error) {
      Logger.error("Error checking wishlist batch", error);
      res.status(500).json({ message: "Failed to check wishlist status" });
    }
  });
  
  // Single wishlist check - HEAVILY CACHED
  app.post("/api/wishlist/check", requireAuth, async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to check wishlist status'
        });
      }
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID required" });
      }
      
      // Check cache first - AGGRESSIVE CACHING
      const cacheKey = `${userId}-${productId}`;
      const cached = wishlistCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < WISHLIST_CACHE_DURATION) {
        return res.json(cached.data);
      }
      
      const isWishlisted = await storage.isProductInWishlist(userId, productId);
      const result = { isWishlisted };
      
      // Cache the result
      wishlistCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      res.json(result);
    } catch (error) {
      Logger.error("Error checking wishlist", error);
      res.status(500).json({ message: "Failed to check wishlist status" });
    }
  });

  // Batch wishlist check for performance optimization - prevents spam individual requests
  app.post("/api/wishlist/check-batch", requireAuth, async (req, res) => {
    try {
      const { productIds } = req.body;
      const userId = req.userId!;
      
      if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: "productIds must be an array" });
      }
      
      const wishlistedItems = await storage.getWishlistedProducts(userId, productIds);
      
      // Return object for O(1) lookup in frontend
      const wishlistMap: Record<string, boolean> = {};
      wishlistedItems.forEach(item => {
        wishlistMap[item.productId] = true;
      });
      
      res.json(wishlistMap);
    } catch (error) {
      Logger.error("Error checking batch wishlist", error);
      res.status(500).json({ error: "Failed to check wishlist" });
    }
  });

  app.post("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.userId; // Now set by requireAuth middleware
      
      Logger.debug(`Add to wishlist - userId: ${userId}, productId: ${productId}`);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to add items to your wishlist'
        });
      }
      
      const wishlistItem = await storage.addToWishlist(userId, productId);
      res.json({ message: "Added to wishlist" });
    } catch (error) {
      Logger.error("Error adding to wishlist", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const { productId } = req.body; // Read from body instead of query
      const userId = req.userId; // Now set by requireAuth middleware
      
      Logger.debug(`Remove from wishlist - userId: ${userId}, productId: ${productId}`);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to manage your wishlist'
        });
      }
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID required" });
      }
      
      await storage.removeFromWishlist(userId, productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      Logger.error("Error removing from wishlist", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Stripe payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
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
  app.post("/api/orders", async (req, res) => {
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
    
    // Check if user has admin privileges
    if (!user.isAdmin && user.role !== 'developer') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  };

  // Health Check Endpoint
  app.get("/health", createHealthCheck());
  
  // Security Test Endpoint (Development Only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/security/test", adminLimiter, requireRole(['admin', 'developer']), async (req, res) => {
      try {
        const testResults = await runPenetrationTests();
        res.json(testResults);
      } catch (error) {
        Logger.error("Security test error:", error);
        res.status(500).json({ message: "Security test failed" });
      }
    });
  }

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

  app.get("/api/admin/users", adminLimiter, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      Logger.debug(`Admin users result: ${users.length} users found`);
      res.json(users.map(user => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin
      })));
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Analytics endpoint
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      Logger.error("Error fetching analytics", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin wishlist analytics - Basic
  app.get("/api/admin/wishlist-analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getWishlistAnalytics();
      res.json(analytics);
    } catch (error) {
      Logger.error("Error fetching wishlist analytics", error);
      res.status(500).json({ message: "Failed to fetch wishlist analytics" });
    }
  });

  // Enhanced wishlist analytics with comprehensive insights
  app.get("/api/admin/wishlist-analytics/detailed", requireAdmin, async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;
      const analytics = await storage.getDetailedWishlistAnalytics(timeRange as string);
      
      // Generate actionable insights
      const insights = generateWishlistInsights(analytics);
      
      res.json({
        stats: analytics.stats,
        trendData: analytics.trendData,
        topProducts: analytics.topProducts,
        topUsers: analytics.topUsers,
        insights
      });
    } catch (error) {
      Logger.error("Error fetching detailed wishlist analytics", error);
      res.status(500).json({ message: "Failed to fetch detailed wishlist analytics" });
    }
  });

  // Export wishlist analytics data
  app.get("/api/admin/wishlist-analytics/export", requireAdmin, async (req, res) => {
    try {
      const { format = 'csv' } = req.query;
      const data = await storage.getWishlistExportData();
      
      if (format === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=wishlist-analytics.csv');
        res.send(csv);
      } else {
        res.json(data);
      }
    } catch (error) {
      Logger.error("Error exporting wishlist data", error);
      res.status(500).json({ message: "Failed to export wishlist data" });
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

  // Category Management APIs
  app.get("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllCategoriesWithProductCount();
      res.json(categories);
    } catch (error) {
      Logger.error("Error fetching categories", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const { name, slug, description, is_active, filter_config } = req.body;
      
      let imageUrl;
      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'categories',
          transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }]
        });
        imageUrl = result.secure_url;
      }

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

  app.put("/api/admin/categories/:id", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const { name, slug, description, is_active, existing_image_url, filter_config } = req.body;
      
      let imageUrl = existing_image_url;
      if (req.file) {
        // Upload new image
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'categories',
          transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }]
        });
        imageUrl = result.secure_url;
        
        // Delete old image if it exists
        if (existing_image_url) {
          try {
            const publicId = existing_image_url.split('/').pop()?.split('.')[0];
            if (publicId) {
              await cloudinary.v2.uploader.destroy(`categories/${publicId}`);
            }
          } catch (deleteError) {
            console.warn("Failed to delete old image:", deleteError);
          }
        }
      }

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

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting category", error);
      res.status(500).json({ message: "Failed to delete category" });
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
  app.get("/api/addresses", async (req, res) => {
    try {
      // Get authenticated user using comprehensive auth check
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user?.id;
      } else if (req.session?.passport?.user?.id) {
        userId = req.session.passport.user.id;
      } else if (req.user?.id) {
        userId = req.user.id;
      } else if (req.session?.userId) {
        userId = req.session.userId;
      }
      
      console.log("=== ADDRESS FETCH DEBUG ===");
      console.log("Session ID:", req.sessionID);
      console.log("Is authenticated:", req.isAuthenticated?.());
      console.log("User object:", req.user);
      console.log("Resolved userId:", userId);
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
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
        .where(eq(users.id, userId))
        .limit(1);
      
      console.log("Database query result:", userWithAddress);
      
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
      
      console.log("Returning addresses:", addresses);
      return res.json(addresses);
      
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", async (req, res) => {
    try {
      // Get authenticated user using comprehensive auth check
      let userId = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user?.id;
      } else if (req.session?.passport?.user?.id) {
        userId = req.session.passport.user.id;
      } else if (req.user?.id) {
        userId = req.user.id;
      } else if (req.session?.userId) {
        userId = req.session.userId;
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

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
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          isLocalCustomer: isLocal,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
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
      console.error("Error saving address:", error);
      res.status(500).json({ error: "Failed to save address" });
    }
  });

  // User endpoint (protected) - added back since it was missing
  app.get("/api/user", async (req, res) => {
    // Add debugging for authentication state
    Logger.debug(`[AUTH DEBUG] Session ID: ${req.sessionID}`);
    Logger.debug(`[AUTH DEBUG] Is authenticated: ${req.isAuthenticated?.()}`);
    Logger.debug(`[AUTH DEBUG] User in session: ${JSON.stringify(req.user)}`);
    
    let userId = null;
    if (req.isAuthenticated && req.isAuthenticated()) {
      userId = req.user?.id;
      Logger.debug(`[AUTH DEBUG] Got userId from passport: ${userId}`);
    } else if (req.session?.passport?.user?.id) {
      userId = req.session.passport.user.id;
      Logger.debug(`[AUTH DEBUG] Got userId from session.passport: ${userId}`);
    } else if (req.user?.id) {
      userId = req.user.id;
      Logger.debug(`[AUTH DEBUG] Got userId from req.user: ${userId}`);
    }
    
    if (!userId) {
      Logger.debug(`[AUTH DEBUG] No userId found - user not authenticated`);
      return res.status(401).send("Unauthorized");
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        Logger.debug(`[AUTH DEBUG] User not found in database: ${userId}`);
        return res.status(404).send("User not found");
      }
      Logger.debug(`[AUTH DEBUG] Successfully found user: ${user.email}`);
      res.json(user);
    } catch (error) {
      Logger.error("Error fetching user", error);
      res.status(500).send("Server error");
    }
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
      res.status(500).json({ status: 'Disconnected', pool: 'Error', error: error.message });
    }
  });

  // Product management endpoints
  
  // Create new product with image uploads
  app.post("/api/admin/products", requireAdmin, upload.array('images', 6), async (req, res) => {
    try {
      // Handle images array from form data
      let images = [];
      if (req.body.images) {
        images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
        images = images.filter(img => img && img.trim() !== '');
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
      res.status(500).json({ error: 'Failed to create product: ' + error.message });
    }
  });

  // Update product with image uploads
  app.put("/api/admin/products/:id", requireAdmin, upload.array('images', 6), async (req, res) => {
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
          updateData.images = images.filter(img => img && img.trim() !== '');
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
      res.status(500).json({ error: 'Failed to update product: ' + error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      Logger.error("Error deleting product", error);
      res.status(500).json({ message: "Failed to delete product" });
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
      
      // Processing upload: removed console.log for clean logging
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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  // Add global error handling
  app.use(errorTracking);

  // Security hardening complete - simplified logging
  Logger.info('Clean & Flip Security Hardening Complete');
  Logger.info('Production-grade security measures now active');

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
  
  // Setup advanced request consolidation middleware
  const { requestConsolidator } = await import('./middleware/request-consolidator');
  app.use(requestConsolidator.middleware());
  
  return httpServer;
}

// Helper function to generate actionable insights
function generateWishlistInsights(analytics: any) {
  const insights = [];
  
  // High-demand products
  const highDemand = analytics.topProducts?.filter((p: any) => p.wishlistCount > 5) || [];
  if (highDemand.length > 0) {
    insights.push({
      title: `${highDemand.length} products in high demand`,
      description: 'Consider restocking or featuring these items prominently',
      action: 'View products',
      type: 'opportunity'
    });
  }
  
  // Low conversion products
  const lowConversion = analytics.topProducts?.filter((p: any) => 
    p.wishlistCount > 3 && p.conversionRate < 10
  ) || [];
  if (lowConversion.length > 0) {
    insights.push({
      title: 'Products with low conversion',
      description: `${lowConversion.length} wishlisted items rarely purchased`,
      action: 'Review pricing',
      type: 'warning'
    });
  }
  
  // User engagement insights
  if (analytics.stats?.avgDaysInWishlist > 30) {
    insights.push({
      title: 'Long wishlist duration',
      description: 'Items stay in wishlists for over a month on average',
      action: 'Send reminder emails',
      type: 'info'
    });
  }
  
  // Power user opportunities
  if (analytics.stats?.powerUsers > 0) {
    insights.push({
      title: `${analytics.stats.powerUsers} power users identified`,
      description: 'Users with 10+ wishlist items - potential for VIP program',
      action: 'Create segments',
      type: 'opportunity'
    });
  }
  
  return insights;
}

// Helper function to convert data to CSV format
function convertToCSV(data: any[]) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}
