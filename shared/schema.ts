import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", [
  "user",
  "developer", 
  "admin"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone"), // Optional field
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  role: userRoleEnum("role").default("user"),
  isAdmin: boolean("is_admin").default(false),
  isLocalCustomer: boolean("is_local_customer").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  productCount: integer("product_count").default(0),
  filterConfig: jsonb("filter_config").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "like_new",
  "good",
  "fair",
  "needs_repair",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "sold",
  "pending",
  "draft",
]);

export const sportCategoryEnum = pgEnum("sport_category", [
  "basketball",
  "football",
  "soccer",
  "baseball",
  "tennis",
  "golf",
  "running",
  "cycling",
  "fitness",
  "swimming",
  "hockey",
  "volleyball",
  "wrestling",
  "boxing",
  "mma",
  "general",
]);

export const sizeTypeEnum = pgEnum("size_type", [
  "numeric",      // 8, 9, 10, 11
  "letter",       // XS, S, M, L, XL
  "custom",       // Custom measurements
  "one_size",     // One size fits all
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "order_confirmation",
  "shipping_update", 
  "delivery_confirmation",
  "price_drop",
  "back_in_stock",
  "newsletter",
  "promotional",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "requested",
  "approved", 
  "rejected",
  "in_transit",
  "received",
  "processed",
  "refunded",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed_amount",
  "free_shipping",
  "buy_one_get_one",
]);

// Brands table for dedicated brand management
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  website: varchar("website"),
  isActive: boolean("is_active").default(true),
  productCount: integer("product_count").default(0),
  featured: boolean("featured").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_brands_slug").on(table.slug),
  index("idx_brands_active").on(table.isActive),
]);

// Size management system
export const sizes = pgTable("sizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  categoryId: varchar("category_id").references(() => categories.id),
  sizeType: sizeTypeEnum("size_type").notNull(),
  value: varchar("value").notNull(), // "10", "M", "32x34"
  displayName: varchar("display_name").notNull(),
  sortOrder: integer("sort_order").default(0),
  measurements: jsonb("measurements").$type<{
    length?: number,
    width?: number, 
    height?: number,
    chest?: number,
    waist?: number,
    inseam?: number
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sizes_brand_category").on(table.brandId, table.categoryId),
  index("idx_sizes_type").on(table.sizeType),
]);

// Product sizes junction table  
export const productSizes = pgTable("product_sizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  sizeId: varchar("size_id").references(() => sizes.id),
  stockQuantity: integer("stock_quantity").default(0),
  price: decimal("price", { precision: 10, scale: 2 }), // Size-specific pricing
  sku: varchar("sku"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_product_sizes").on(table.productId, table.sizeId),
]);

// Products (Enhanced)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }), // For sale pricing
  categoryId: varchar("category_id").references(() => categories.id),
  brandId: varchar("brand_id").references(() => brands.id),
  subcategory: text("subcategory"),
  brand: varchar("brand"), // Legacy field, will migrate to brandId
  weight: integer("weight"), // in pounds
  condition: productConditionEnum("condition").notNull(),
  status: productStatusEnum("status").default("active"),
  images: jsonb("images").$type<string[]>().default([]),
  specifications: jsonb("specifications").$type<Record<string, any>>().default({}),
  stockQuantity: integer("stock_quantity").default(1),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  views: integer("views").default(0),
  featured: boolean("featured").default(false),
  
  // Enhanced e-commerce fields
  sportCategory: sportCategoryEnum("sport_category"),
  materials: jsonb("materials").$type<string[]>().default([]), // ["waterproof", "breathable"]
  features: jsonb("features").$type<string[]>().default([]), // ["compression", "moisture-wicking"]
  targetGender: varchar("target_gender"), // "men", "women", "unisex", "youth"
  ageGroup: varchar("age_group"), // "adult", "youth", "child"
  seasonality: jsonb("seasonality").$type<string[]>().default([]), // ["summer", "winter"]
  
  // Quality & condition details
  conditionNotes: text("condition_notes"),
  qualityGrade: integer("quality_grade"), // 1-10 scale
  hasDefects: boolean("has_defects").default(false),
  defectDescription: text("defect_description"),
  
  // SEO and content
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Pricing and promotions
  isOnSale: boolean("is_on_sale").default(false),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // For profit calculations
  
  // Shipping and logistics
  requiresShipping: boolean("requires_shipping").default(true),
  localPickupOnly: boolean("local_pickup_only").default(false),
  shippingWeight: decimal("shipping_weight", { precision: 5, scale: 2 }),
  shippingDimensions: jsonb("shipping_dimensions").$type<{length: number, width: number, height: number}>(),
  
  // Stripe integration fields
  stripeProductId: varchar("stripe_product_id"),
  stripePriceId: varchar("stripe_price_id"),
  stripeSyncStatus: varchar("stripe_sync_status", { length: 50 }).default("pending"),
  stripeLastSync: timestamp("stripe_last_sync"),
  sku: varchar("sku").unique(),
  dimensions: jsonb("dimensions").$type<{length?: number, width?: number, height?: number}>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_category_brand").on(table.categoryId, table.brandId),
  index("idx_products_condition").on(table.condition),
  index("idx_products_sport_category").on(table.sportCategory),
  index("idx_products_price").on(table.price),
  index("idx_products_featured").on(table.featured),
  index("idx_products_sale").on(table.isOnSale),
]);

// Addresses
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // 'shipping' or 'billing'
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  street: varchar("street").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  country: varchar("country").default("US"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  status: orderStatusEnum("status").default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  shippingAddressId: varchar("shipping_address_id").references(() => addresses.id),
  billingAddressId: varchar("billing_address_id").references(() => addresses.id),
  notes: text("notes"),
  trackingNumber: varchar("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment submissions
export const equipmentSubmissions = pgTable("equipment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Reference tracking
  referenceNumber: varchar("reference_number").notNull().unique(),
  
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  brand: varchar("brand"),
  condition: productConditionEnum("condition").notNull(),
  weight: integer("weight"),
  askingPrice: decimal("asking_price", { precision: 10, scale: 2 }),
  images: jsonb("images").$type<string[]>().default([]),
  
  // Contact & Location
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  userCity: varchar("user_city"),
  userState: varchar("user_state"),
  userZipCode: varchar("user_zip_code"),
  isLocal: boolean("is_local").default(false),
  distance: decimal("distance", { precision: 5, scale: 2 }),
  
  // Status Management (pending, under_review, accepted, declined, scheduled, completed, cancelled)
  status: varchar("status").default("pending"),
  statusHistory: jsonb("status_history").default([]),
  
  // Admin fields
  adminNotes: text("admin_notes"),
  internalNotes: text("internal_notes"), // Not visible to users
  offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }),
  declineReason: text("decline_reason"),
  notes: text("notes"),
  
  // Scheduling
  scheduledPickupDate: timestamp("scheduled_pickup_date"),
  pickupWindowStart: varchar("pickup_window_start"),
  pickupWindowEnd: varchar("pickup_window_end"),
  
  // Tracking
  viewedByAdmin: boolean("viewed_by_admin").default(false),
  lastViewedAt: timestamp("last_viewed_at"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_reference_number").on(table.referenceNumber),
  index("idx_status").on(table.status),
  index("idx_user_id").on(table.userId),
  index("idx_created_at").on(table.createdAt),
]);

// Wishlist
export const wishlist = pgTable("wishlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity logs for real analytics tracking
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type").notNull(), // 'page_view', 'user_action', 'purchase'
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  action: varchar("action"), // What action was performed
  page: varchar("page"), // Which page/route
  pageUrl: varchar("page_url"), // Full URL (added for compatibility)
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activity_logs_created").on(table.createdAt),
  index("idx_activity_logs_type").on(table.eventType),
]);

// Product Reviews System
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  userId: varchar("user_id").references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id), // Verified purchase
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title"),
  content: text("content"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulVotes: integer("helpful_votes").default(0),
  isApproved: boolean("is_approved").default(true),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reviews_product").on(table.productId),
  index("idx_reviews_rating").on(table.rating),
]);

// Inventory Management
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  sizeId: varchar("size_id").references(() => sizes.id),
  location: varchar("location"), // "warehouse", "showroom", "storage-a"
  stockQuantity: integer("stock_quantity").default(0),
  reservedQuantity: integer("reserved_quantity").default(0), // Pending orders
  lowStockThreshold: integer("low_stock_threshold").default(5),
  lastRestocked: timestamp("last_restocked"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_inventory_product").on(table.productId),
  index("idx_inventory_low_stock").on(table.stockQuantity),
]);

// Discount/Coupon System
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal("minimum_order_amount", { precision: 10, scale: 2 }),
  maximumDiscountAmount: decimal("maximum_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"), // Total usage limit
  usageCount: integer("usage_count").default(0),
  userUsageLimit: integer("user_usage_limit").default(1), // Per user limit
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  applicableCategories: jsonb("applicable_categories").$type<string[]>().default([]),
  applicableBrands: jsonb("applicable_brands").$type<string[]>().default([]),
  excludedProducts: jsonb("excluded_products").$type<string[]>().default([]),
  firstTimeCustomerOnly: boolean("first_time_customer_only").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_coupons_code").on(table.code),
  index("idx_coupons_active").on(table.isActive),
]);

// Coupon Usage Tracking
export const couponUsage = pgTable("coupon_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").references(() => coupons.id),
  userId: varchar("user_id").references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
}, (table) => [
  index("idx_coupon_usage_coupon").on(table.couponId),
  index("idx_coupon_usage_user").on(table.userId),
]);

// Email Notifications System
export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  email: varchar("email").notNull(),
  type: notificationTypeEnum("type").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  templateId: varchar("template_id"),
  status: varchar("status").default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_notifications_user").on(table.userId),
  index("idx_email_notifications_type").on(table.type),
  index("idx_email_notifications_status").on(table.status),
]);

// Return/Refund System
export const returnRequests = pgTable("return_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  orderItemId: varchar("order_item_id").references(() => orderItems.id),
  userId: varchar("user_id").references(() => users.id),
  reason: varchar("reason").notNull(), // "defective", "not_as_described", "changed_mind"
  description: text("description"),
  images: jsonb("images").$type<string[]>().default([]),
  status: returnStatusEnum("status").default("requested"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  restockingFee: decimal("restocking_fee", { precision: 10, scale: 2 }).default("0"),
  adminNotes: text("admin_notes"),
  trackingNumber: varchar("tracking_number"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_return_requests_order").on(table.orderId),
  index("idx_return_requests_status").on(table.status),
]);

// Shipping Rates and Methods
export const shippingRates = pgTable("shipping_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  carrier: varchar("carrier").notNull(), // "ups", "fedex", "usps"
  serviceType: varchar("service_type").notNull(), // "ground", "express", "overnight"
  minWeight: decimal("min_weight", { precision: 5, scale: 2 }),
  maxWeight: decimal("max_weight", { precision: 5, scale: 2 }),
  minDistance: integer("min_distance"),
  maxDistance: integer("max_distance"),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  perPoundRate: decimal("per_pound_rate", { precision: 10, scale: 2 }),
  estimatedDays: integer("estimated_days"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_shipping_rates_carrier").on(table.carrier),
  index("idx_shipping_rates_active").on(table.isActive),
]);

// Newsletter Subscriptions
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  isActive: boolean("is_active").default(true),
  preferences: jsonb("preferences").$type<{
    newArrivals?: boolean,
    sales?: boolean,
    restockAlerts?: boolean,
    tips?: boolean
  }>().default({}),
  source: varchar("source"), // "homepage", "checkout", "popup"
  unsubscribeToken: varchar("unsubscribe_token"),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_newsletter_email").on(table.email),
  index("idx_newsletter_active").on(table.isActive),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
  addresses: many(addresses),
  submissions: many(equipmentSubmissions),
  wishlist: many(wishlist),
  activities: many(activityLogs),
  reviews: many(reviews),
  returnRequests: many(returnRequests),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
  sizes: many(sizes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  sizes: many(sizes),
}));

export const sizesRelations = relations(sizes, ({ one, many }) => ({
  brand: one(brands, {
    fields: [sizes.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [sizes.categoryId],
    references: [categories.id],
  }),
  productSizes: many(productSizes),
  inventory: many(inventory),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  wishlist: many(wishlist),
  reviews: many(reviews),
  productSizes: many(productSizes),
  inventory: many(inventory),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
  }),
  billingAddress: one(addresses, {
    fields: [orders.billingAddressId],
    references: [addresses.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const equipmentSubmissionsRelations = relations(equipmentSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [equipmentSubmissions.userId],
    references: [users.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentSubmissionSchema = createInsertSchema(equipmentSubmissions).omit({
  id: true,
  referenceNumber: true,
  createdAt: true,
  updatedAt: true,
  statusHistory: true,
  viewedByAdmin: true,
  lastViewedAt: true,
  reviewedAt: true,
  completedAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Registration specific type that includes additional fields
export const registerDataSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  fullAddress: z.string().optional(),
}).omit({
  role: true,
  isAdmin: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export type RegisterData = z.infer<typeof registerDataSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type EquipmentSubmission = typeof equipmentSubmissions.$inferSelect;
export type InsertEquipmentSubmission = z.infer<typeof insertEquipmentSubmissionSchema>;

export type Wishlist = typeof wishlist.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// New table schemas
export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  productCount: true,
});

export const insertSizeSchema = createInsertSchema(sizes).omit({
  id: true,
  createdAt: true,
});

export const insertProductSizeSchema = createInsertSchema(productSizes).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulVotes: true,
  isApproved: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertCouponUsageSchema = createInsertSchema(couponUsage).omit({
  id: true,
  usedAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
});

export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({
  id: true,
  createdAt: true,
  unsubscribeToken: true,
  confirmedAt: true,
  unsubscribedAt: true,
});

// Enhanced type exports
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Size = typeof sizes.$inferSelect;
export type InsertSize = z.infer<typeof insertSizeSchema>;

export type ProductSize = typeof productSizes.$inferSelect;
export type InsertProductSize = z.infer<typeof insertProductSizeSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type CouponUsage = typeof couponUsage.$inferSelect;
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

// Type for status history tracking
export type StatusHistoryEntry = {
  status: string;
  timestamp: string;
  changedBy: string;
  notes?: string;
};
