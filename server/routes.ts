import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { upload, cloudinary } from "./config/cloudinary";
import multer from 'multer';
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
  // Setup authentication
  setupAuth(app);
  
  // Categories (public endpoint)
  app.get("/api/categories", async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      
      if (activeOnly) {
        const categories = await storage.getActiveCategoriesForHomepage();
        res.json(categories);
      } else {
        const categories = await storage.getCategories();
        res.json(categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
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

      console.log('Products API - Received filters:', filters);

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
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
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
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
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
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart operations
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const sessionId = req.sessionID;
      
      console.log("Get cart - userId:", userId, "sessionId:", sessionId);
      
      // Don't use temp-user-id, use actual session or user
      const cartItems = await storage.getCartItems(
        userId && userId !== 'temp-user-id' ? userId : undefined,
        sessionId
      );
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = (req.session as any)?.userId;
      const sessionId = req.sessionID;
      
      console.log("Cart request - userId:", userId, "sessionId:", sessionId);
      
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
            if (err) console.error('Session save error:', err);
          });
        }
        
        // Create cart item with proper user or session ID
        const cartItemData = {
          productId,
          quantity,
          userId: effectiveUserId,
          sessionId: effectiveSessionId,
        };
        
        console.log("Cart item data:", cartItemData);
        
        const validatedData = insertCartItemSchema.parse(cartItemData);
        const cartItem = await storage.addToCart(validatedData);
        return res.json(cartItem);
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      
      // Send specific error message to frontend
      const errorMessage = error?.message || "Failed to add to cart";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
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
      console.error("Error fetching orders:", error);
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
      console.error("Error fetching order:", error);
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
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertEquipmentSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
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
      console.error("Error fetching submission:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  // Wishlist - require authentication
  app.get("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = req.userId; // Now set by requireAuth middleware
      
      console.log('Get wishlist - userId:', userId);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to view your wishlist'
        });
      }
      
      const wishlistItems = await storage.getWishlistItems(userId);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  // Check if product is in wishlist
  app.post("/api/wishlist/check", requireAuth, async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.userId; // Now set by requireAuth middleware
      
      console.log('Check wishlist - userId:', userId, 'productId:', productId);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to check wishlist status'
        });
      }
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID required" });
      }
      
      const isWishlisted = await storage.isProductInWishlist(userId, productId);
      res.json({ isWishlisted });
    } catch (error) {
      console.error("Error checking wishlist:", error);
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
      console.error("Error checking batch wishlist:", error);
      res.status(500).json({ error: "Failed to check wishlist" });
    }
  });

  app.post("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.userId; // Now set by requireAuth middleware
      
      console.log('Add to wishlist - userId:', userId, 'productId:', productId);
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to add items to your wishlist'
        });
      }
      
      const wishlistItem = await storage.addToWishlist(userId, productId);
      res.json({ message: "Added to wishlist" });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const { productId } = req.body; // Read from body instead of query
      const userId = req.userId; // Now set by requireAuth middleware
      
      console.log('Remove from wishlist - userId:', userId, 'productId:', productId);
      
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
      console.error("Error removing from wishlist:", error);
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
      console.error("Error creating payment intent:", error);
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
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Addresses
  app.get("/api/addresses", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", async (req, res) => {
    try {
      const validatedData = insertAddressSchema.parse(req.body);
      const address = await storage.createAddress(validatedData);
      res.json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  // Admin routes - use passport authentication
  const requireAdmin = async (req: any, res: any, next: any) => {
    console.log('Admin middleware - Is authenticated:', req.isAuthenticated?.());
    console.log('Admin middleware - User from passport:', req.user);
    console.log('Admin middleware - Session passport:', req.session?.passport);
    
    // Check if user is authenticated via passport
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      console.log('User not authenticated via passport');
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.user;
    if (!user) {
      console.log('No user object in request');
      return res.status(401).json({ error: "Authentication required" });
    }
    
    console.log('Admin check - User:', user.email, 'role:', user.role, 'isAdmin:', user.isAdmin);
    
    // Check if user has admin privileges
    if (!user.isAdmin && user.role !== 'developer') {
      console.log('User lacks admin privileges:', user.role, user.isAdmin);
      return res.status(403).json({ error: "Admin access required" });
    }
    
    console.log('Admin access granted for:', user.email);
    next();
  };

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      console.log('Admin stats result:', stats);
      res.json({
        totalProducts: stats.totalProducts || 0,
        totalUsers: stats.totalUsers || 0,
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log('Admin users result:', users.length, 'users found');
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
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Analytics endpoint
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin wishlist analytics
  app.get("/api/admin/wishlist-analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getWishlistAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching wishlist analytics:", error);
      res.status(500).json({ message: "Failed to fetch wishlist analytics" });
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
      console.error('Error fetching filter options:', error);
      res.status(500).json({ message: 'Failed to fetch filter options' });
    }
  });

  // Category Management APIs
  app.get("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllCategoriesWithProductCount();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      console.error("Error creating category:", error);
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
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.put("/api/admin/categories/:id/toggle", requireAdmin, async (req, res) => {
    try {
      const { is_active } = req.body;
      await storage.updateCategory(req.params.id, { isActive: is_active });
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling category status:", error);
      res.status(500).json({ message: "Failed to toggle category status" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post("/api/admin/categories/reorder", requireAdmin, async (req, res) => {
    try {
      const { categoryOrder } = req.body;
      await storage.reorderCategories(categoryOrder);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({ message: "Failed to reorder categories" });
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
      console.error('Error tracking activity:', error.message);
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
      console.error("Error fetching system health:", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  // Database health check
  app.get("/api/admin/system/db-check", requireAdmin, async (req, res) => {
    try {
      await storage.healthCheck();
      res.json({ status: 'Connected', pool: 'Active', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Database health check failed:", error);
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
      
      console.log('Creating product with data:', productData);
      const newProduct = await storage.createProduct(productData);
      res.json(newProduct);
    } catch (error) {
      console.error('Create product error:', error);
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
      
      console.log('Updating product with data:', updateData);
      const updatedProduct = await storage.updateProduct(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product: ' + error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.put("/api/admin/products/:id/stock", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateProductStock(req.params.id, status);
      res.json({ message: "Stock status updated" });
    } catch (error) {
      console.error("Error updating stock:", error);
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
      console.error("Error updating user role:", error);
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
      console.error(`Error exporting ${req.params.type}:`, error);
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
      console.error("Error exporting data:", error);
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
        console.error('Multer upload error:', err);
        
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
      
      console.log('Processing upload:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
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
      
      console.log('Cloudinary upload successful:', result.secure_url);
      
      res.json({ 
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
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
      console.error('Cloudinary delete error:', error);
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
