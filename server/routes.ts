import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { LRUCache } from 'lru-cache';
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { authMiddleware } from "./middleware/auth";
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
// Legacy profile middleware removed - only gating at order creation now
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
import { ErrorLogger } from "./services/errorLogger";
import { autoSyncProducts } from "./middleware/product-sync";
// import { runPenetrationTests } from "./security/penetration-tests"; // Removed unused import
import { setupCompression } from "./config/compression";
import { healthLive, healthReady } from "./config/health";
// Removed old WebSocket import - using new enhanced WebSocket system
import { createRequestLogger, logger, shouldLog } from "./config/logger";
import { Logger, LogLevel } from "./utils/logger";
import { db } from "./db";
import { cartItems, products } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import observability from "./routes/observability";
import { getLocalityStatus } from "./locality/locality.controller";
import { requireLocalCustomer } from "./middleware/requireLocalCustomer";
import { modeFromProduct } from "../shared/fulfillment";
import { evaluateLocality, normalizeZip } from "@shared/locality";

// WebSocket Manager for broadcasting updates
let wsManager: any = null;

export function setWebSocketManager(manager: any) {
  wsManager = manager;
}

// Helper function to broadcast cart updates
function broadcastCartUpdate(userId: string, action: string = 'update', data?: any) {
  if (wsManager && wsManager.publishToUser) {
    // Use new typed publish method
    wsManager.publishToUser(userId, { 
      topic: "cart:update", 
      userId, 
      count: data?.count || 0 
    });
    Logger.debug(`[WS] Cart update broadcasted: ${action} for user ${userId}`);
  }
}
import googleAuthRoutes from "./routes/auth-google";
import stripeWebhookRoutes from './routes/stripe-webhooks';
import adminMetricsRoutes from './routes/admin-metrics';
import errorManagementRoutes from './routes/admin/error-management';
// addressRoutes dynamically imported below
import checkoutRoutes from './routes/checkout';
import localityRoutes from './routes/locality';

import crypto from 'crypto';
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

// Create API cache for hot endpoints
const apiCache = new LRUCache<string, any>({ max: 500, ttl: 5 * 60 * 1000 }); // 5m TTL

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
  
  // Setup enhanced security headers with input sanitization
  setupSecurityHeaders(app);
  
  // Enhanced security and performance monitoring
  try {
    const { securityHeaders, apiSecurityHeaders } = await import('./middleware/securityHeaders.js');
    const { sanitizeInput } = await import('./middleware/inputSanitization.js');
    const { requestLogger, apiRequestLogger, adminRequestLogger } = await import('./middleware/requestLogger.js');
    const { PerformanceMonitor, performanceMiddleware } = await import('./services/performanceMonitor.js');
    
    // Apply enhanced middleware
    app.use(securityHeaders());
    app.use(performanceMiddleware());
    app.use(requestLogger());
    
    // API-specific middleware
    app.use('/api/', apiSecurityHeaders());
    app.use('/api/', apiRequestLogger());
    // Enable sanitization with auth route exclusion
    app.use('/api/', (req, res, next) => {
      // Skip sanitization for auth routes to prevent login issues
      if (req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/auth/')) {
        return next();
      }
      return sanitizeInput()(req, res, next);
    });
    
    // Admin-specific middleware 
    app.use('/api/admin/', adminRequestLogger());
    
    Logger.info('Enhanced security and performance monitoring middleware loaded');
  } catch (error) {
    Logger.warn('Some enhanced middleware failed to load:', error);
  }
  
  // CORS configuration
  app.use(cors(corsOptions));

  // Kill HTTP/API caching for dynamic routes - no stale data allowed
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
  });
  
  // Global security middleware
  // app.use(requestLogging); // DISABLED - Using main logger system instead to prevent duplicate logs
  app.use(performanceMonitoring);
  // DISABLED - Using enhanced input sanitization middleware instead
  // app.use(sanitizeInput);
  app.use(preventXSS);
  app.use(preventSQLInjection);
  app.use(transactionMiddleware);
  
  // Enable automatic Stripe sync for product operations
  app.use(autoSyncProducts);
  
  // Setup authentication
  setupAuth(app);
  
  // Google OAuth routes
  app.use('/api/auth', googleAuthRoutes);
  
  // Critical: Stripe webhook routes (must use raw body parser)
  app.use('/api/stripe', stripeWebhookRoutes);
  // Import and use SSOT address routes
  const addressRoutes = await import('./routes/addresses');
  app.use('/api/addresses', addressRoutes.default);
  
  // Import V2 SSOT cart routes with session middleware and migration
  const { cartRouterV2 } = await import('./routes/cart.v2');
  const ensureSession = (await import('./middleware/ensureSession')).default;
  const { migrateLegacySidCartIfPresent } = await import('./services/cartMigrate');
  
  app.use('/api/cart', ensureSession);
  app.use('/api/cart', async (req, _res, next) => {
    try { 
      await migrateLegacySidCartIfPresent(req); 
      next(); 
    } catch (e) { 
      next(e); 
    }
  });
  app.use('/api/cart', cartRouterV2);
  
  // DEPRECATED: Legacy cart route has been removed - fully migrated to cart.v2
  app.use('/api/cart-legacy', (req, res, next) => {
    console.log(`[DEPRECATED] Legacy cart route hit: ${req.method} ${req.url} - should be migrated to V2`);
    res.status(410).json({
      error: 'DEPRECATED_ROUTE',
      message: 'This cart API version has been deprecated. Please use the current API.',
      migrationGuide: 'Contact support for migration assistance'
    });
  });
  
  // Shipping quotes API
  const shippingRoutes = await import('./routes/shipping');
  app.use('/api/shipping', shippingRoutes.default);
  
  // Observability error handler (dev tolerant)
  const observabilityRoutes = await import('./routes/observability');
  app.use('/api/observability', observabilityRoutes.default);
  
  // ONBOARDING REMOVED - Users browse freely, address required only at checkout
  
  app.use('/api/checkout', checkoutRoutes);
  
  // SSOT Locality routes
  app.use('/api/locality', localityRoutes);
  
  // Cart validation route
  const cartValidationRoutes = await import('./routes/cart-validation');
  app.use('/api/cart', cartValidationRoutes.default);

  // ONBOARDING REMOVED - Profile completion handled via address creation
  
  // Admin metrics routes  
  app.use('/api/admin', adminMetricsRoutes);
  
  // Error management routes  
  app.use('/api/admin', errorManagementRoutes);
  
  // Observability routes (local Sentry-style error tracking)
// SSOT: Unified system
  
  // New enhanced observability system with proper filtering and actions
  // Mounted later in the file after other route definitions
  
  // Client error logging is now handled at middleware level
  // No additional route needed since middleware handles it
  
  // Initialize search indexes
  await initializeSearchIndexes();
  
  // UNIFIED Locality Status Endpoint handled by locality router above
  

  
  // Diagnostic routes for debugging
  const { addDiagnosticRoutes } = await import('./utils/_diagnostic');
  addDiagnosticRoutes(app);
  
  // Health check endpoints
  app.get('/health', healthLive);
  app.get('/health/live', healthLive);
  app.get('/health/ready', healthReady);

  // GEOApify Proxy with caching and proper error handling
  const geocodeCache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 60 }); // 1h cache
  const geocodeLimiter = rateLimit({ 
    windowMs: 60_000, // 1 minute
    limit: 30, // 30 requests per minute per IP
    message: { error: "GEOCODE_RATE_LIMIT", message: "Too many geocoding requests" }
  });

  app.use("/api/geocode/autocomplete", geocodeLimiter);
  
  app.get("/api/geocode/autocomplete", async (req, res) => {
    try {
      const text = String(req.query.text || "").trim();
      
      if (text.length < 3) {
        return res.json({ results: [] });
      }

      // Check cache first
      const cacheKey = `geo:${text.toLowerCase()}`;
      const cached = geocodeCache.get(cacheKey);
      if (cached) {
        console.log('✅ Geocode cache hit:', text);
        return res.json(cached);
      }

      const apiKey = process.env.VITE_GEOAPIFY_API_KEY;
      if (!apiKey) {
        console.error('VITE_GEOAPIFY_API_KEY missing in server environment');
        return res.status(500).json({ error: 'API key not configured' });
      }

      const url = `https://api.geoapify.com/v1/geocode/autocomplete?` +
        `text=${encodeURIComponent(text)}&` +
        `apiKey=${apiKey}&` +
        `filter=countrycode:us&` +
        `limit=5&` +
        `format=json`;

      console.log('🔍 Server-side GEOApify request:', { text, maskedUrl: url.replace(apiKey, '***') });

      const response = await fetch(url);
      
      if (response.status === 429) {
        // Pass through 429 (too many requests) - let client handle gracefully
        return res.status(429).json({ error: "GEOCODE_RATE_LIMIT", message: "Quota exceeded" });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GEOApify API Error:', response.status, errorText);
        // Return empty results for graceful degradation
        return res.status(200).json({ results: [] });
      }

      const data = await response.json();
      console.log('✅ GEOApify success:', data.results?.length || 0, 'results');
      
      // Cache successful results
      geocodeCache.set(cacheKey, data);
      
      res.json(data);
    } catch (error) {
      console.error('Geocoding proxy error:', error);
      // Graceful degradation - return empty results instead of 500
      res.status(200).json({ results: [] });
    }
  });
  
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
  
  // Professional server-side image upload with optimization
  const imageUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { 
      fileSize: 5 * 1024 * 1024, // 5MB max per file
      files: 8, // Max 8 files per request
      fields: 10, // Max 10 fields
      parts: 20 // Max 20 parts total
    },
    fileFilter: (req, file, cb) => {
      // Strict file validation
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Only JPEG, PNG, and WebP allowed`));
      }
      
      // Check file extension too
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        return cb(new Error('Invalid file extension'));
      }
      
      cb(null, true);
    }
  });

  // Helper: Optimize image before upload
  async function optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      const sharp = require('sharp');
      return await sharp(buffer)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();
    } catch (error) {
      Logger.debug('Sharp optimization failed, using original:', error);
      return buffer; // Return original if optimization fails
    }
  }

  // Helper: Upload single image to Cloudinary
  async function uploadToCloudinary(
    buffer: Buffer, 
    filename: string,
    folder: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
          resource_type: 'image',
          type: 'upload',
          overwrite: false,
          unique_filename: true,
          
          // Cloudinary optimizations
          transformation: [
            { 
              width: 1200, 
              height: 1200, 
              crop: 'limit',
              quality: 'auto:good',
              fetch_format: 'auto'
            }
          ],
          
          // Additional settings
          invalidate: true,
          use_filename: true,
          tags: [folder],
          context: {
            upload_source: 'clean_flip_app',
            upload_date: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            Logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  }

  app.post("/api/upload/images", requireAuth, (req, res, next) => {
    imageUpload.array('images', 8)(req, res, (err) => {
      if (err) {
        Logger.error('Upload middleware error:', err);
        
        // Handle specific multer errors with user-friendly messages
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'File too large',
            message: 'Images must be smaller than 5MB. Please compress your images or choose smaller files.',
            maxSize: '5MB'
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            error: 'Too many files',
            message: 'You can upload a maximum of 8 images at once.',
            maxFiles: 8
          });
        }
        
        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({ 
            error: 'Invalid file type',
            message: 'Only JPEG, PNG, and WebP images are allowed.',
            allowedTypes: ['JPEG', 'PNG', 'WebP']
          });
        }
        
        return res.status(400).json({ 
          error: 'Upload error',
          message: err.message || 'An error occurred during upload'
        });
      }
      next();
    });
  }, async (req, res) => {
    const startTime = Date.now();
    
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No files provided' 
        });
      }
      
      // Get folder from request
      const folder = req.body.folder || 'equipment-submissions';
      
      // Validate folder name (security)
      const validFolders = ['equipment-submissions', 'products', 'avatars'];
      if (!validFolders.includes(folder)) {
        return res.status(400).json({ 
          error: 'Invalid folder' 
        });
      }
      
      Logger.debug(`[UPLOAD] Processing ${files.length} files for folder: ${folder}`);
      
      // Process uploads with concurrency limit
      const uploadResults = [];
      const errors = [];
      
      // Process in batches of 3 to avoid overwhelming server
      for (let i = 0; i < files.length; i += 3) {
        const batch = files.slice(i, i + 3);
        
        const batchPromises = batch.map(async (file) => {
          try {
            Logger.debug(`Processing ${file.originalname} (${file.size} bytes)`);
            
            // Optimize image with sharp if available
            const optimizedBuffer = await optimizeImage(file.buffer);
            
            // Upload to Cloudinary
            const url = await uploadToCloudinary(
              optimizedBuffer,
              file.originalname,
              folder
            );
            
            return { success: true, url, filename: file.originalname };
            
          } catch (error) {
            Logger.error(`Failed to upload ${file.originalname}:`, error);
            errors.push({
              filename: file.originalname,
              error: error.message
            });
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        uploadResults.push(...batchResults.filter(Boolean));
      }
      
      // Free memory immediately
      files.forEach(file => {
        file.buffer = null as any;
      });
      
      const processingTime = Date.now() - startTime;
      Logger.debug(`Upload completed in ${processingTime}ms`);
      
      // Return results
      if (uploadResults.length === 0) {
        return res.status(500).json({
          error: 'All uploads failed',
          details: errors
        });
      }
      
      res.json({
        success: true,
        urls: uploadResults.map(r => r.url),
        uploaded: uploadResults.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        processingTime
      });

      
    } catch (error) {
      Logger.error('Upload endpoint error:', error);
      
      // Clean up memory on error
      if (req.files) {
        (req.files as any[]).forEach(file => {
          if (file.buffer) file.buffer = null;
        });
      }
      
      res.status(500).json({
        error: 'Upload failed',
        message: error.message
      });
    }
  });

  // Cleanup endpoint - delete from Cloudinary
  app.delete("/api/upload/cleanup", requireAuth, async (req, res) => {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid URLs' });
    }
    
    // Extract public IDs from URLs
    const publicIds = urls.map(url => {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      return `${folder}/${filename.split('.')[0]}`;
    });
    
    try {
      await cloudinary.api.delete_resources(publicIds);
      res.json({ success: true });
    } catch (error) {
      Logger.error('Cleanup error:', error);
      res.status(500).json({ error: 'Cleanup failed' });
    }
  });

  // Cloudinary signature endpoint (kept as backup)
  app.get("/api/cloudinary/signature", requireAuth, async (req, res) => {
    try {
      const { folder = 'equipment-submissions' } = req.query;
      
      if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
        return res.status(500).json({ message: "Cloudinary configuration missing" });
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      
      // Create parameters for signature (alphabetically sorted)
      const params = {
        folder: folder as string,
        timestamp: timestamp.toString()
      };

      // Create signature string - must be in alphabetical order
      const signatureString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key as keyof typeof params]}`)
        .join('&') + process.env.CLOUDINARY_API_SECRET;

      // Create signature using SHA-1 (Cloudinary requirement)
      const signature = crypto
        .createHash('sha1')
        .update(signatureString)
        .digest('hex');

      Logger.debug(`[CLOUDINARY] Generated signature for folder: ${folder}`, {
        timestamp,
        signatureString: signatureString.replace(process.env.CLOUDINARY_API_SECRET!, '[REDACTED]')
      });

      res.json({
        signature,
        timestamp: timestamp.toString(),
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder: folder as string
      });

    } catch (error) {
      Logger.error("Error generating Cloudinary signature", error);
      res.status(500).json({ message: "Failed to generate signature" });
    }
  });

  // Search endpoint with full-text search
  // Remove duplicate search route - using the more complete one later
  
  // Categories (public endpoint with rate limiting and caching)
  // Categories with enhanced LRU caching
  app.get("/api/categories", apiLimiter, async (req, res) => {
    try {
      const active = String(req.query.active ?? 'all');
      const key = `categories:${active}`;
      const hit = apiCache.get(key);
      
      if (hit) {
        return res.json(hit);
      }

      let data;
      if (req.query.active === 'true') {
        data = await storage.getActiveCategoriesForHomepage();
        
        // Also try existing cache system
        if (!data) {
          const cached = await getCachedCategories();
          if (cached) data = cached;
        }
        
        // Cache in new LRU system and old cache system
        if (data) {
          apiCache.set(key, data);
          await setCachedCategories(data);
        }
      } else {
        data = await storage.getCategories();
        apiCache.set(key, data);
      }
      
      res.json(data || []);
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

  // Featured products WITHOUT caching - real-time updates required
  app.get("/api/products/featured", apiLimiter, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      // NO CACHING - Always fetch fresh data for real-time admin updates
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
      // Get userId from optional auth middleware (can be null for guests)
      const userId = req.userId;
      const sessionId = req.sessionID;
      
      Logger.info(`[CART] Get cart - userId: ${userId}, sessionId: ${sessionId}, isAuthenticated: ${req.isAuthenticated?.()}`);
      
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
      
      // CRASH FIX: Always return consistent cart structure
      const items = Array.isArray(cartItems) ? cartItems : [];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal; // Can add shipping/tax calculation later
      
      // SSOT FIX: Return clean cart structure that frontend expects
      const cleanCart = { 
        id: `cart-${userId || sessionId}`, 
        items: items, 
        subtotal: subtotal, 
        total: total, 
        shippingAddressId: null 
      };
      
      Logger.info(`[CART] Returning cart with ${items.length} items, subtotal: ${subtotal}`);
      res.json(cleanCart);
    } catch (error) {
      Logger.error("Error fetching cart", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  // REMOVED: Legacy cart route replaced with V2 router
  // LEGACY ROUTE DISABLED - using cartRouterV2 instead
  /*
  app.post("/api/cart/items", authMiddleware.optionalAuth, async (req, res) => {
    try {
      Logger.info(`[CART DEBUG] POST /api/cart/items reached handler - body: ${JSON.stringify(req.body)}, productId: ${req.body?.productId}, quantity: ${req.body?.quantity}`);
      
      const productId = req.body?.productId;
      const quantity = req.body?.quantity || 1;
      
      // Validate product exists first
      const productCheck = await storage.getProduct(productId);
      if (!productCheck) {
        return res.status(404).json({ error: "NOT_FOUND", message: "Product not found" });
      }
      
      // CRITICAL FIX: Block LOCAL_ONLY items using unified locality system
      if (productCheck.isLocalDeliveryAvailable && !productCheck.isShippingAvailable) {
        // This is LOCAL_ONLY - check eligibility using unified evaluation
        const getDefaultAddress = async (userId: string) => {
          try {
            const addresses = await storage.getAddresses(userId);
            return addresses.find(addr => addr.isDefault) || null;
          } catch {
            return null;
          }
        };
        
        const locality = await evaluateLocality({
          user: req.user ? { id: req.user.id } : undefined,
          zipOverride: req.body?.zipCode,
          ip: req.ip,
          getDefaultAddress
        });
        
        if (!locality.eligible) {
          return res.status(403).json({
            code: "LOCAL_ONLY_NOT_ELIGIBLE",
            message: "This item is only available for local delivery.",
            resolution: "Set a local default address or enter a local ZIP."
          });
        }
      }
      
      // Basic validation
      if (!productId) {
        Logger.warn(`[CART DEBUG] Missing productId in request`);
        return res.status(400).json({ error: 'Product ID is required' });
      }
      
      if (!quantity || quantity < 1) {
        Logger.warn(`[CART DEBUG] Invalid quantity: ${quantity}`);
        return res.status(400).json({ error: 'Valid quantity is required' });
      }
      
      // FIXED: Get userId from authenticated request
      const userId = req.user?.id; // From passport authentication
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      Logger.debug(`Cart request - userId: ${userId}, productId: ${productId}, quantity: ${quantity}`);
      
      // 1. Use the product we already checked above
      const product = productCheck;
      
      if ((product.stockQuantity || 0) < 1) {
        return res.status(400).json({ error: 'Product not available' });
      }
      
      // 2. Check for existing cart item
      const existingItem = await storage.getCartItem(userId, null, productId);
      
      if (existingItem) {
        // FIXED: Allow user to add more items if they want (normal e-commerce behavior)
        const newQuantity = existingItem.quantity + quantity;
        const availableStock = product.stockQuantity || 0;
        
        // Only block if total exceeds available stock
        if (newQuantity > availableStock) {
          return res.status(400).json({ 
            error: `Only ${availableStock} available. You have ${existingItem.quantity} in cart.` 
          });
        }
        
        // Update existing item quantity
        const updated = await storage.updateCartItem(existingItem.id, newQuantity);
        
        // Broadcast WebSocket update
        broadcastCartUpdate(userId);
        
        return res.json(updated);
      } else {
        // 3. Create new cart item
        if (quantity > (product.stockQuantity || 0)) {
          return res.status(400).json({ 
            error: `Only ${product.stockQuantity || 0} available` 
          });
        }
        
        // Create new cart item  
        const cartItemData = {
          productId,
          quantity,
          userId,
          sessionId: null,
        };
        
        const validatedData = insertCartItemSchema.parse(cartItemData);
        const cartItem = await storage.addToCart(validatedData);
        
        // Broadcast WebSocket update
        broadcastCartUpdate(userId);
        
        return res.json(cartItem);
      }
    } catch (error: any) {
      Logger.error("[CART DEBUG] Error adding to cart", error);
      
      // Send specific error message to frontend
      const errorMessage = error?.message || "Failed to add to cart";
      Logger.error(`[CART DEBUG] Sending error response: ${errorMessage}`);
      res.status(500).json({ error: errorMessage });
    }
  });
  */ // END LEGACY ROUTE DISABLED

  // FIXED: Update cart item quantity by product ID 
  app.patch("/api/cart/items/:productId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      const { productId } = req.params;
      const { quantity } = req.body;

      console.log(`[CART UPDATE] User ${userId} updating product ${productId} to quantity ${quantity}`);

      // Find cart item by product ID
      const cartItems = await storage.getCartItems(userId || undefined, sessionId);
      const itemToUpdate = cartItems.find(item => item.productId === productId);
      
      if (!itemToUpdate) {
        console.log(`[CART UPDATE ERROR] Product ${productId} not found in user's cart`);
        return res.status(404).json({ error: "Cart item not found" });
      }

      console.log(`[CART UPDATE] Updating cart item ${itemToUpdate.id} to quantity ${quantity}`);
      const updatedItem = await storage.updateCartItem(itemToUpdate.id, quantity);
      
      // Broadcast cart update
      if (userId) broadcastCartUpdate(userId);
      
      res.json(updatedItem);
    } catch (error) {
      Logger.error("Error updating cart item", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  // COMPLETELY REBUILT: Remove item from cart by product ID
  app.delete("/api/cart/items/:productId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      const { productId } = req.params;

      console.log(`[CART DELETE ROUTE] === STARTING CART REMOVAL ===`);
      console.log(`[CART DELETE ROUTE] User: ${userId}, Product: ${productId}`);
      
      // Direct database query to find the cart item
      const cartItem = await db
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        ))
        .limit(1);
      
      console.log(`[CART DELETE ROUTE] Found cart items:`, cartItem);
      
      if (cartItem.length === 0) {
        console.log(`[CART DELETE ROUTE] No cart item found for product ${productId}`);
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      const itemToDelete = cartItem[0];
      console.log(`[CART DELETE ROUTE] Deleting cart item:`, itemToDelete.id);
      
      // Direct database deletion
      const deleteResult = await db
        .delete(cartItems)
        .where(eq(cartItems.id, itemToDelete.id));
      
      console.log(`[CART DELETE ROUTE] Delete result:`, deleteResult.rowCount);
      
      if (deleteResult.rowCount === 0) {
        console.log(`[CART DELETE ROUTE] ERROR - No rows deleted`);
        return res.status(500).json({ error: "Failed to delete cart item" });
      }
      
      console.log(`[CART DELETE ROUTE] SUCCESS - Item deleted successfully`);
      
      // Broadcast cart update
      if (userId) broadcastCartUpdate(userId);
      
      res.json({ 
        message: "Item removed from cart",
        deletedItemId: itemToDelete.id,
        rowsAffected: deleteResult.rowCount
      });
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
          // Direct database deletion for product validation cleanup
          await db.delete(cartItems).where(eq(cartItems.id, item.id));
          updates.push({ action: 'removed', itemId: item.id, reason: 'Product unavailable' });
          continue;
        }
        
        // Adjust quantity if stock changed
        if (item.quantity > (product.stockQuantity || 0)) {
          const newQuantity = Math.max(0, product.stockQuantity || 0);
          if (newQuantity === 0) {
            // Direct database deletion for out of stock cleanup
            await db.delete(cartItems).where(eq(cartItems.id, item.id));
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

  // Set cart shipping address by ID
  app.put("/api/cart/shipping-address", requireAuth, async (req, res) => {
    try {
      const { addressId } = req.body;
      const userId = req.userId;
      
      if (!addressId) {
        return res.status(400).json({ error: "Address ID is required" });
      }
      
      // Verify the address belongs to the user
      const address = await storage.getAddress(addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ error: "Address not found" });
      }
      
      // Set the cart shipping address (we'll add this to storage)
      await storage.setCartShippingAddress(userId!, addressId);
      
      res.json({ 
        ok: true, 
        shippingAddress: address 
      });
    } catch (error) {
      Logger.error("Error setting cart shipping address", error);
      res.status(500).json({ error: "Failed to set shipping address" });
    }
  });

  // Create/update cart shipping address (for new addresses or edits)
  app.post("/api/cart/shipping-address", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { saveToProfile = false, makeDefault = false, ...addressData } = req.body;
      
      // Validate address data
      const validatedAddress = insertAddressSchema.parse({
        ...addressData,
        userId,
        isDefault: saveToProfile && makeDefault
      });
      
      let address;
      
      if (saveToProfile) {
        // Save to addresses table
        address = await storage.createAddress(validatedAddress);
        
        // Update user profile address if making default
        if (makeDefault) {
          await storage.updateUserProfileAddress(userId!, address.id);
        }
      } else {
        // Create temporary address for cart only
        address = await storage.createAddress({
          ...validatedAddress,
          isDefault: false
        });
      }
      
      // Set as cart shipping address
      await storage.setCartShippingAddress(userId!, address.id);
      
      res.json(address);
    } catch (error) {
      Logger.error("Error creating cart shipping address", error);
      res.status(500).json({ error: "Failed to create shipping address" });
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
  const requireDeveloper = async (req: any, res: any, next: any) => {
    // Check if user is authenticated via passport
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user has developer privileges
    if (user.role !== 'developer') {
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
      
      // SSOT system enforced - legacy address fields removed
      
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

  // Error Management Routes - Import and register first
  try {
    const errorManagementModule = await import('./routes/admin/error-management.js');
    app.use('/api/admin', errorManagementModule.default);
    Logger.info('Error management routes registered successfully');
  } catch (error) {
    Logger.error('Failed to register error management routes:', error);
  }

  // System Management Routes
  try {
    const { systemManagementRoutes } = await import('./routes/admin/system-management.js');
    app.use('/api/admin/system', systemManagementRoutes);
    Logger.info('System management routes registered successfully');
  } catch (error) {
    Logger.error('Failed to register system management routes:', error);
  }

  app.get("/api/admin/stats", adminLimiter, requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/users", adminLimiter, requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/analytics", requireRole('developer'), async (req, res) => {
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
      
      // Generate chart data for the selected range
      const chartData = [];
      if (range === 'last7days' || range === 'last30days') {
        const days = range === 'last7days' ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt!);
            return orderDate.toDateString() === date.toDateString();
          });
          const dayRevenue = dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
          chartData.push({
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: Math.round(dayRevenue * 100) / 100,
            orders: dayOrders.length
          });
        }
      }

      // Get top products by order frequency from real order items
      const productSales = {};
      
      // Join orders with order items to get real product data
      for (const order of filteredOrders) {
        try {
          const orderItemsData = await db
            .select({
              productId: orderItems.productId,
              quantity: orderItems.quantity,
              productName: products.name
            })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));
            
          orderItemsData.forEach(item => {
            const key = item.productName;
            productSales[key] = (productSales[key] || 0) + (item.quantity || 1);
          });
        } catch (err) {
          // Handle case where order items table might not exist yet
          console.log('Order items table not available, using product view data');
        }
      }
      
      const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, sales]) => ({ name, sales }));

      // Get real top products from database - only if we have real order data
      let topProductsList = [];
      
      if (Object.keys(productSales).length > 0) {
        // Use real order-based sales data
        topProductsList = Object.entries(productSales)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([name, sales]) => {
            // Get the product price
            const product = allProducts.find(p => p.name === name);
            return {
              name,
              sales: sales as number,
              price: product?.price || '0',
              isViewData: false // This is actual sales data
            };
          });
      } else {
        // If no orders exist, use product view data but with correct labeling
        const realTopProducts = await db
          .select({
            id: products.id,
            name: products.name,
            views: products.views,
            price: products.price
          })
          .from(products)
          .orderBy(desc(products.views))
          .limit(5);
          
        // Since no orders exist, create meaningful analytics based on product data
        topProductsList = realTopProducts.map(p => ({
          name: p.name,
          sales: 0, // No actual sales yet
          views: p.views || 0,
          revenue: 0,
          price: parseFloat(p.price) || 0,
          stockQuantity: p.stockQuantity || 0,
          isViewData: true,
          displayMetric: 'views'
        }));
      }

      // Calculate conversion rate (orders / total users)
      const conversionRate = allUsers.length > 0 ? (filteredOrders.length / allUsers.length) * 100 : 0;

      // Get product performance data
      const productPerformance = await db
        .select({
          name: products.name,
          views: products.views,
          stockQuantity: products.stockQuantity,
          price: products.price,
          featured: products.featured
        })
        .from(products)
        .orderBy(desc(products.views))
        .limit(10);

      // Calculate total inventory value
      const totalInventoryValue = allProducts.reduce((sum, product) => {
        return sum + (parseFloat(product.price) || 0) * (product.stockQuantity || 0);
      }, 0);

      // Recent product activities
      const recentProductActivity = allProducts
        .slice(-5)
        .map(product => ({
          type: 'product',
          description: `Product "${product.name}" added to inventory`,
          timestamp: product.createdAt,
          data: { price: product.price, stock: product.stockQuantity }
        }));

      res.json({
        totalRevenue: totalRevenue,
        totalOrders: filteredOrders.length,
        totalUsers: allUsers.length,
        totalProducts: allProducts.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgOrderValue: completedOrders.length > 0 ? Math.round((totalRevenue / completedOrders.length) * 100) / 100 : 0,
        charts: {
          revenue: chartData,
          productViews: productPerformance.map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
            views: p.views || 0,
            value: (parseFloat(p.price) || 0) * (p.stockQuantity || 0)
          }))
        },
        topProducts: topProductsList,
        productPerformance: productPerformance,
        recentActivity: [
          ...filteredOrders.slice(-5).map(order => ({
            type: 'order',
            description: `Order ${order.id} - $${order.total}`,
            timestamp: order.createdAt
          })),
          ...recentProductActivity
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
      });
      
    } catch (error) {
      Logger.error("Error fetching analytics", error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });



  // Wishlist analytics functionality removed for single-seller model

  // Admin Products Management - Main endpoint  
  app.get("/api/admin/products", requireRole('developer'), async (req, res) => {
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
          featured: products.featured,
          isLocalDeliveryAvailable: products.isLocalDeliveryAvailable,
          isShippingAvailable: products.isShippingAvailable,
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
          status: (product.stockQuantity || 0) > 0 ? 'active' : 'inactive',
          featured: product.featured,
          isLocalDeliveryAvailable: product.isLocalDeliveryAvailable,
          isShippingAvailable: product.isShippingAvailable
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

  // Image upload endpoint for products  
  app.post('/api/admin/products/upload', requireRole('developer'), async (req, res) => {
    try {
      // For now, return a placeholder response
      // The actual upload functionality will be handled by the ProductModal
      res.json({ 
        success: true, 
        url: 'https://via.placeholder.com/300x300?text=Upload+Placeholder',
        publicId: 'placeholder' 
      });
    } catch (error) {
      Logger.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Product bulk operations
  app.post("/api/admin/products/bulk", requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/products/export", requireRole('developer'), async (req, res) => {
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
  app.delete("/api/admin/products/:id", requireRole('developer'), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      
      // CRITICAL: Clear all caches to eliminate stale data
      try {
        const { clearProductCache } = await import('./config/cache');
        await clearProductCache(id);
        Logger.info('Cache cleared successfully for deleted product:', id);
      } catch (error) {
        Logger.warn('Cache clearing failed (non-critical):', error);
      }
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "product:update",
            productId: id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting product", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Filter options for category configuration
  app.get("/api/admin/products/filter-options", requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/categories", requireRole('developer'), async (req, res) => {
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

  app.post("/api/admin/categories", requireRole('developer'), /* upload.single('image'), */ async (req, res) => {
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
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "category:update",
            categoryId: newCategory.id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json(newCategory);
    } catch (error) {
      Logger.error("Error creating category", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requireRole('developer'), /* upload.single('image'), */ async (req, res) => {
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
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "category:update",
            categoryId: req.params.id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json(updatedCategory);
    } catch (error) {
      Logger.error("Error updating category", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.put("/api/admin/categories/:id/toggle", requireRole('developer'), async (req, res) => {
    try {
      const { is_active } = req.body;
      await storage.updateCategory(req.params.id, { isActive: is_active });
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "category:update",
            categoryId: req.params.id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error toggling category status", error);
      res.status(500).json({ message: "Failed to toggle category status" });
    }
  });

  // Category reorder endpoint
  app.post("/api/admin/categories/reorder", requireRole('developer'), async (req, res) => {
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

  app.delete("/api/admin/categories/:id", requireRole('developer'), async (req, res) => {
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
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "category:update",
            categoryId: id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting category", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // System health and information endpoints
  app.get("/api/admin/system/health", requireRole('developer'), async (req, res) => {
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

  app.get("/api/admin/system/info", requireRole('developer'), async (req, res) => {
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

  app.post("/api/admin/categories/reorder", requireRole('developer'), async (req, res) => {
    try {
      const { categoryOrder } = req.body;
      await storage.reorderCategories(categoryOrder);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error reordering categories", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });

  // All address endpoints moved to server/routes/addresses.ts for SSOT

  // Simple users endpoint for admin
  app.get("/api/users", requireRole('developer'), async (req, res) => {
    try {
      const usersList = await db.select().from(users).limit(100);
      
      // Transform to match frontend interface
      const transformedUsers = usersList.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.role !== 'developer', // Transform field name
        lastLogin: user.updatedAt?.toISOString() || null,
        createdAt: user.createdAt?.toISOString() || null
      }));
      
      res.json(transformedUsers);
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // User endpoint (protected) - SSOT with profile address
  app.get("/api/user", async (req, res) => {
    Logger.debug(`[USER API] Authentication check - isAuthenticated: ${req.isAuthenticated?.()}, user: ${!!req.user}, sessionID: ${req.sessionID}`);
    
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
    
    try {
      Logger.debug(`[USER API] User found: ${JSON.stringify(req.user)}`);
      
      const userId = (req.user as any).id;
      
      // Fetch user with profile address using SSOT approach
      // Also check if user has any default address (fix for cart redirect issue)
      const userWithAddress = await db.execute(sql`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone, u.role, 
          u.profile_complete, u.onboarding_step, u.is_local_customer,
          u.profile_address_id, u.onboarding_completed_at,
          a.id as address_id, a.first_name as addr_first_name, 
          a.last_name as addr_last_name, a.street1, a.street2, a.city, 
          a.state, a.postal_code, a.country, a.latitude, a.longitude, 
          a.is_local, a.is_default, a.created_at as address_created_at,
          a.updated_at as address_updated_at,
          COALESCE(da.id, a.id) as fallback_address_id
        FROM users u
        LEFT JOIN addresses a ON u.profile_address_id = a.id
        LEFT JOIN addresses da ON da.user_id = u.id AND da.is_default = true
        WHERE u.id = ${userId}
      `);

      if (!userWithAddress.rows.length) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userWithAddress.rows[0];
      
      // Build response with SSOT address structure
      const profileAddress = userData.address_id ? {
        id: userData.address_id,
        firstName: userData.addr_first_name,
        lastName: userData.addr_last_name,
        fullName: `${userData.addr_first_name} ${userData.addr_last_name}`,
        street1: userData.street1,
        street2: userData.street2 || "",
        city: userData.city,
        state: userData.state,
        postalCode: userData.postal_code,
        country: userData.country || "US",
        latitude: userData.latitude ? parseFloat(userData.latitude) : undefined,
        longitude: userData.longitude ? parseFloat(userData.longitude) : undefined,
        isLocal: Boolean(userData.is_local),
        isDefault: Boolean(userData.is_default),
        createdAt: userData.address_created_at,
        updatedAt: userData.address_updated_at
      } : undefined;

      // Fix cart redirect issue: profile is complete if they have ANY default address
      const hasAnyAddress = Boolean(userData.fallback_address_id || userData.profile_address_id);
      
      Logger.debug(`[USER API] Profile completion check:`, {
        userId: userData.id,
        profile_address_id: userData.profile_address_id,
        fallback_address_id: userData.fallback_address_id,
        hasAnyAddress,
        profileComplete: hasAnyAddress
      });
      
      const response = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        role: userData.role,
        profileComplete: hasAnyAddress, // Profile complete if they have any address
        profileAddressId: userData.profile_address_id || userData.fallback_address_id, // Include profileAddressId for ProtectedRoute
        onboardingStep: userData.onboarding_step || 0,
        isLocal: Boolean(userData.is_local_customer),
        onboardingCompleted: Boolean(userData.onboarding_completed_at),
        profileAddress
      };
      


      res.json(response);
    } catch (error) {
      Logger.error("Error fetching user with address:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Activity tracking endpoint - fire and forget for performance
  // Fire-and-forget activity tracking with instant 202 response
  app.post("/api/track-activity", (req, res) => {
    // Return immediately with 202 (fire-and-forget)
    res.status(202).end();
    
    // Do the work off the request cycle
    setImmediate(async () => {
      try {
        const { eventType, pageUrl, userId } = req.body;
        const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
        
        const activity = {
          eventType,
          pageUrl,
          userId: userId || null,
          sessionId: String(sessionId),
          ip: req.ip,
          userAgent: req.get('user-agent') || null,
          at: new Date()
        };
        
        await storage.trackActivity(activity);
      } catch (error: any) {
        Logger.debug?.('track-activity failed', { error });
      }
    });
  });

  // System health endpoint
  app.get("/api/admin/system/health", requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/system/db-check", requireRole('developer'), async (req, res) => {
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
  app.post("/api/admin/products", requireRole('developer'), /* upload.array('images', 6), */ async (req, res) => {
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
      
      // CRITICAL: Clear all caches to eliminate stale data
      try {
        const { clearProductCache } = await import('./config/cache');
        await clearProductCache();
        Logger.info('Cache cleared successfully for new product:', newProduct.id);
      } catch (error) {
        Logger.warn('Cache clearing failed (non-critical):', error);
      }
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "product:update",
            productId: newProduct.id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json(newProduct);
    } catch (error) {
      Logger.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product: ' + (error as any).message });
    }
  });

  // Update product with image uploads
  app.put("/api/admin/products/:id", requireRole('developer'), /* upload.array('images', 6), */ async (req, res) => {
    try {
      const { id } = req.params;
      
      // Normalize request parsing - handle both camel and snake case
      const b = req.body ?? {};
      const safeBool = (val: any, defaultVal: boolean = false): boolean => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return !!val || defaultVal;
      };
      
      const numeric = (v: any, def = 0) => (isNaN(parseFloat(v)) ? def : parseFloat(v));
      const intNum  = (v: any, def = 0) => (isNaN(parseInt(v)) ? def : parseInt(v));

      // Handle all field variations with proper fallbacks
      const categoryId = b.categoryId ?? b.category_id ?? null;
      const isFeatured = safeBool(b.isFeatured ?? b.is_featured ?? b.featured, false);
      const isLocal = safeBool(b.isLocalDeliveryAvailable ?? b.is_local_delivery_available ?? b.local_delivery, false);
      const isShip = safeBool(b.isShippingAvailable ?? b.is_shipping_available ?? b.shipping_available, true);
      
      // Determine fulfillment mode using new two-value system
      let fulfillmentMode = "LOCAL_AND_SHIPPING";
      if (isLocal && !isShip) fulfillmentMode = "LOCAL_ONLY";

      const baseData = {
        name: b.name,
        description: b.description,
        categoryId: categoryId,
        brand: b.brand ?? null,
        price: numeric(b.price),
        compare_at_price: b.compareAtPrice != null ? numeric(b.compareAtPrice) : null,
        cost: b.cost != null ? numeric(b.cost) : null,
        stockQuantity: intNum(b.stockQuantity ?? b.stock_quantity ?? b.stock, 0),
        status: b.status ?? "active",
        weight: numeric(b.weight, 0),
        sku: b.sku ?? null,
        images: b.images ?? [],

        // Use normalized boolean values consistently
        featured: isFeatured,
        is_featured: isFeatured,
        isLocalDeliveryAvailable: isLocal,
        is_local_delivery_available: isLocal,
        isShippingAvailable: isShip,
        is_shipping_available: isShip,
        fulfillmentMode: fulfillmentMode,
        fulfillment_mode: fulfillmentMode,
      };

      Logger.debug(`Updating product with data: ${JSON.stringify(baseData)}`);
      
      const updatedProduct = await storage.updateProduct(id, baseData);
      
      // CRITICAL: Clear all caches to eliminate stale data
      try {
        const { clearProductCache } = await import('./config/cache');
        await clearProductCache(id);
        Logger.info('Cache cleared successfully for product:', id);
      } catch (error) {
        Logger.warn('Cache clearing failed (non-critical):', error);
      }
      
      // Broadcast to all clients with enhanced debugging
      try {
        if (wsManager?.publishMessage) {
          const payload = {
            id: id,
            productId: id,
            product: updatedProduct,
            featured: updatedProduct.featured
          };
          console.log('🚀 Broadcasting product update:', payload);
          wsManager.publishMessage("product:update", payload);
          Logger.info('WebSocket broadcast sent successfully for product:', id);
        } else {
          Logger.warn('WebSocket manager not available for broadcast');
        }
      } catch (error) {
        Logger.error('WebSocket broadcast failed:', error);
      }
      
      res.json(updatedProduct);
    } catch (error: any) {
      Logger.error('Update product error:', error);
      
      // Handle specific database constraint errors
      if (error?.code === '23503') {
        return res.status(400).json({ 
          error: 'Invalid category selected. Please choose a valid category.',
          details: 'The selected category does not exist.'
        });
      }
      
      if (error?.code === '23505') {
        return res.status(409).json({ 
          error: 'Duplicate value detected.',
          details: 'A product with this SKU or identifier already exists.'
        });
      }
      
      res.status(500).json({ error: 'Failed to update product: ' + (error?.message || 'Unknown error') });
    }
  });



  app.put("/api/admin/products/:id/stock", requireRole('developer'), async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateProductStock(req.params.id, status);
      
      // CRITICAL: Clear all caches to eliminate stale data
      try {
        const { clearProductCache } = await import('./config/cache');
        await clearProductCache(req.params.id);
        Logger.info('Cache cleared successfully for stock update:', req.params.id);
      } catch (error) {
        Logger.warn('Cache clearing failed (non-critical):', error);
      }
      
      // Broadcast update via WebSocket using new typed system
      try {
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "stock:update",
            productId: req.params.id,
            qty: status
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      res.json({ message: "Stock status updated" });
    } catch (error) {
      Logger.error("Error updating stock", error);
      res.status(500).json({ message: "Failed to update stock" });
    }
  });

  // Full user update endpoint
  app.put("/api/admin/users/:id", requireRole('developer'), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove password if empty, otherwise hash it
      if (!updateData.password || updateData.password === '') {
        delete updateData.password;
      } else {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }
      
      // Validate role
      if (updateData.role && !['user', 'developer'].includes(updateData.role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "user" or "developer"' });
      }
      
      // Clean the update data
      const cleanData: any = {
        email: updateData.email,
        firstName: updateData.firstName || null,
        lastName: updateData.lastName || null, 
        phone: updateData.phone || null,
        role: updateData.role, // Include role in the update
        updatedAt: new Date()
      };
      
      // Add password if provided
      if (updateData.password) {
        cleanData.password = updateData.password;
      }
      
      Logger.info(`Updating user ${id} with data:`, { ...cleanData, password: cleanData.password ? '[HIDDEN]' : undefined });
      
      // Update user in database using existing imports
      const [updatedUser] = await db
        .update(users)
        .set(cleanData)
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Broadcast update via WebSocket using new typed system
      try {
        const { wsManager } = await import('./websocket');
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "user:update",
            userId: id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
      
    } catch (error) {
      Logger.error("Error updating user", error);
      res.status(500).json({ 
        error: "Failed to update user",
        details: error.message 
      });
    }
  });

  // Create new user endpoint
  app.post("/api/admin/users", requireRole('developer'), async (req, res) => {
    try {
      const { email, password, role = 'user', firstName, lastName, phone } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password, firstName, lastName' 
        });
      }
      
      // Validate role
      if (!['user', 'developer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "user" or "developer"' });
      }
      
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user data
      const userData = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Logger.info(`Creating new user with email: ${email}, role: ${role}`);
      
      // Insert user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      
      if (!newUser) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      // Broadcast update via WebSocket using new typed system
      try {
        const { wsManager } = await import('./websocket');
        if (wsManager?.publish) {
          wsManager.publish({
            topic: "user:update",
            userId: newUser.id
          });
        }
      } catch (error) {
        Logger.warn('WebSocket broadcast failed:', error);
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
      
    } catch (error) {
      Logger.error("Error creating user", error);
      res.status(500).json({ 
        error: "Failed to create user",
        details: error.message 
      });
    }
  });

  // User role management (legacy endpoint - kept for compatibility)
  app.put("/api/admin/users/:id/role", requireRole('developer'), async (req, res) => {
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
      
      // Get user details to populate seller_email (required field)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ 
          error: "User not found", 
          message: "Please log in again" 
        });
      }
      
      // Import reference generator
      const { generateUniqueReference } = await import("./utils/referenceGenerator");
      const referenceNumber = await generateUniqueReference();
      
      const submission = await storage.createSubmission({
        ...req.body,
        userId,
        sellerEmail: user.email, // Required field from authenticated user
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

  app.get("/api/admin/submissions", requireRole('developer'), async (req, res) => {
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

  app.put("/api/admin/submissions/:id", requireRole('developer'), async (req, res) => {
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
  app.post("/api/admin/submissions/bulk", requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/submissions/export", requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/export/:type", requireRole('developer'), async (req, res) => {
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
  app.get("/api/admin/export/:type", requireRole('developer'), async (req, res) => {
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

  // Legacy upload endpoints removed - all uploads now use /api/upload/images

  // Stripe sync routes (admin only)
  // Stripe transactions endpoint - fetch recent payment intents
  app.get("/api/stripe/transactions", requireRole('developer'), async (req, res) => {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20',
      });

      // Fetch recent payment intents from Stripe
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 10,
        expand: ['data.customer']
      });

      const transactions = paymentIntents.data.map(intent => ({
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        customer_email: intent.customer ? 
          (typeof intent.customer === 'string' ? intent.customer : intent.customer.email) : 
          intent.receipt_email || 'N/A',
        created: intent.created,
        description: intent.description || 'Payment'
      }));

      res.json({
        success: true,
        transactions,
        total: paymentIntents.data.length
      });
      
    } catch (error) {
      Logger.error("Error fetching Stripe transactions", error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch transactions',
        transactions: [] // Return empty array so UI doesn't break
      });
    }
  });

  app.post('/api/stripe/sync-all', requireRole('developer'), async (req, res) => {
    try {
      const { StripeProductSync } = await import('./services/stripe-sync.js');
      await StripeProductSync.syncAllProducts();
      res.json({ success: true, message: 'All products synced to Stripe' });
    } catch (error) {
      Logger.error('Sync all products error:', error);
      res.status(500).json({ error: 'Failed to sync products' });
    }
  });

  app.post('/api/stripe/sync/:productId', requireRole('developer'), async (req, res) => {
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

  app.post('/api/stripe/create-test-products', requireRole('developer'), async (req, res) => {
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
  
  // Initialize enhanced WebSocket support for live sync
  const { setupWebSocket, wsManager } = await import('./websocket');
  setupWebSocket(httpServer);
  setWebSocketManager(wsManager); // Connect WebSocket manager to routes
  Logger.info('[WS] Enhanced WebSocket server initialized for live sync and connected to routes');
  
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
    
// SSOT: Unified system
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
  
  // Helper function to check if user has purchased the product
  const checkUserPurchaseHistory = async (userId: string, productId: string): Promise<boolean> => {
    try {
      const [purchase] = await db.select()
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(
          and(
            eq(orders.userId, userId),
            eq(orderItems.productId, productId),
            or(
              eq(orders.status, 'delivered'),
              eq(orders.status, 'confirmed')
            )
          )
        )
        .limit(1);
      return !!purchase;
    } catch (error) {
      Logger.warn('Failed to check purchase history:', error);
      return false; // Allow review if check fails to avoid blocking users
    }
  };
  
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
        verifiedPurchase: await checkUserPurchaseHistory(userId, productId),
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

  // Mount observability router
  app.use(observability);
  
  // Apply production optimizations (compression, static asset caching)
  if (process.env.NODE_ENV === "production") {
    const { setupProductionOptimizations } = await import('./middleware/compression');
    setupProductionOptimizations(app);
  }

  server.on('listening', () => {
    Logger.info(`[STARTUP] Server is now accepting connections on ${host}:${port}`);
  });

  return server;
}
