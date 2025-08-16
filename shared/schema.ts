import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  serial,
  decimal,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom tsvector type for PostgreSQL full-text search
const tsvector = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return "tsvector";
  },
});

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

// Local Sentry-style error tracking tables
export const errorsRaw = pgTable("errors_raw", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  level: varchar("level").notNull(), // error, warn, info
  env: varchar("env").notNull(), // development, production
  release: varchar("release"),
  service: varchar("service").notNull(), // client, server
  url: text("url"),
  method: varchar("method"),
  statusCode: integer("status_code"),
  message: text("message").notNull(),
  type: varchar("type"),
  stack: jsonb("stack"), // string[]
  fingerprint: varchar("fingerprint").notNull(),
  userId: varchar("user_id"),
  tags: jsonb("tags"), // Record<string, string | number | boolean>
  extra: jsonb("extra"), // Record<string, any>
}, (table) => [
  index("idx_errors_raw_created_at").on(table.createdAt),
  index("idx_errors_raw_fingerprint").on(table.fingerprint),
  index("idx_errors_raw_level").on(table.level),
]);

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  fingerprint: varchar("fingerprint").notNull().unique(),
  title: text("title").notNull(),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  level: varchar("level").notNull(),
  count: integer("count").default(0).notNull(),
  affectedUsers: integer("affected_users").default(0).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  ignored: boolean("ignored").default(false).notNull(),
  sampleEventId: varchar("sample_event_id"),
  envs: jsonb("envs").notNull(), // Record<string, number>
}, (table) => [
  index("idx_issues_last_seen").on(table.lastSeen),
  index("idx_issues_resolved").on(table.resolved),
  index("idx_issues_level").on(table.level),
]);

export const issueEvents = pgTable("issue_events", {
  id: serial("id").primaryKey(),
  fingerprint: varchar("fingerprint").notNull(),
  hour: timestamp("hour").notNull(),
  count: integer("count").default(0).notNull(),
}, (table) => [
  index("idx_issue_events_hour").on(table.hour),
  index("idx_issue_events_fingerprint").on(table.fingerprint),
  // Unique constraint for fingerprint + hour combination
  index("idx_issue_events_unique").on(table.fingerprint, table.hour),
]);

export type ErrorRaw = typeof errorsRaw.$inferSelect;
export type InsertErrorRaw = typeof errorsRaw.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;
export type IssueEvent = typeof issueEvents.$inferSelect;
export type InsertIssueEvent = typeof issueEvents.$inferInsert;

// User roles enum - Simplified system (user/developer only)
export const userRoleEnum = pgEnum("user_role", [
  "user",
  "developer"
]);

// Product fulfillment enum for local delivery system
export const fulfillmentTypeEnum = pgEnum("fulfillment_type", [
  "LOCAL_ONLY",
  "SHIP_ONLY", 
  "LOCAL_OR_SHIP"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Make optional for OAuth users
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone"), // Optional field
  // REMOVED: Legacy address fields - using SSOT addresses table instead
  isLocalCustomer: boolean("is_local_customer").default(false),
  role: userRoleEnum("role").default("user"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  // OAuth fields
  googleId: varchar("google_id").unique(),
  googleEmail: varchar("google_email"),
  googlePicture: text("google_picture"),
  profileImageUrl: text("profile_image_url"),
  authProvider: varchar("auth_provider").default("local"), // 'local', 'google'
  isEmailVerified: boolean("is_email_verified").default(false),
  profileComplete: boolean("profile_complete").default(false),
  onboardingStep: integer("onboarding_step").default(0),
  // SSOT Profile address reference - nullable FK to addresses
  profileAddressId: varchar("profile_address_id").references(() => addresses.id, { onDelete: 'set null' }),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User onboarding tracking table
export const userOnboarding = pgTable("user_onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  addressCompleted: boolean("address_completed").default(false),
  phoneCompleted: boolean("phone_completed").default(false),
  preferencesCompleted: boolean("preferences_completed").default(false),
  stripeCustomerCreated: boolean("stripe_customer_created").default(false),
  welcomeEmailSent: boolean("welcome_email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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

// Product condition enum
export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "like_new",
  "good",
  "fair",
  "needs_repair",
]);

// Product status enum
export const productStatusEnum = pgEnum("product_status", [
  "active",
  "inactive",
  "sold",
  "pending", 
  "draft",
  "archived",
]);

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  subcategory: text("subcategory"),
  brand: varchar("brand"),
  weight: integer("weight"), // in pounds
  condition: productConditionEnum("condition").notNull(),
  status: productStatusEnum("status").default("active"),
  images: jsonb("images").$type<string[]>().default([]),
  specifications: jsonb("specifications").$type<Record<string, string | number | boolean>>().default({}),
  stockQuantity: integer("stock_quantity").default(1),
  views: integer("views").default(0),
  featured: boolean("featured").default(false),
  // Search functionality
  searchVector: tsvector("search_vector"),
  // Stripe integration fields
  stripeProductId: varchar("stripe_product_id"),
  stripePriceId: varchar("stripe_price_id"),
  stripeSyncStatus: varchar("stripe_sync_status", { length: 50 }).default("pending"),
  stripeLastSync: timestamp("stripe_last_sync"),
  sku: varchar("sku"),
  dimensions: jsonb("dimensions").$type<{length?: number, width?: number, height?: number}>(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  // Delivery options - Active columns
  isLocalDeliveryAvailable: boolean("is_local_delivery_available").default(true),
  isShippingAvailable: boolean("is_shipping_available").default(true),
  // Legacy compatibility columns
  availableLocal: boolean("available_local").default(true),
  availableShipping: boolean("available_shipping").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_search").using("gin", table.searchVector),
  index("idx_products_category").on(table.categoryId),
  index("idx_products_status").on(table.status),
  index("idx_products_featured").on(table.featured),
  index("idx_products_created_at").on(table.createdAt),
  index("idx_products_price").on(table.price),
  index("idx_stripe_product_id").on(table.stripeProductId),
  index("idx_stripe_sync_status").on(table.stripeSyncStatus),
]);

// SSOT Addresses table - Single source of truth with canonical SSOT schema
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  firstName: text("first_name").notNull(), // Required for shipping
  lastName: text("last_name").notNull(), // Required for shipping
  street1: text("street1").notNull(), // Main street address
  street2: text("street2"), // Apt, Suite, Unit
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(), // Client field name matches
  country: text("country").default("US").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  geoapifyPlaceId: text("geoapify_place_id"), // From Geoapify API
  isDefault: boolean("is_default").default(false).notNull(),
  isLocal: boolean("is_local").default(false).notNull(), // Computed field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // One default address per user (enforced by database constraint)
  index("idx_addresses_user").on(table.userId),
  index("idx_addresses_coordinates").on(table.latitude, table.longitude),
  index("idx_addresses_local").on(table.isLocal),
]);

// Service zones for local delivery configuration
export const serviceZones = pgTable("service_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // Option A: center + radius
  centerLat: decimal("center_lat", { precision: 10, scale: 7 }),
  centerLng: decimal("center_lng", { precision: 11, scale: 7 }),
  radiusKm: decimal("radius_km", { precision: 8, scale: 3 }),
  // Option B: polygon (GeoJSON as JSONB)
  polygon: jsonb("polygon"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order addresses - immutable snapshots for historical accuracy
export const orderAddresses = pgTable("order_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  sourceAddressId: varchar("source_address_id").references(() => addresses.id),
  formatted: text("formatted"),
  // REMOVED: Legacy street field - using SSOT addresses table
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 11, scale: 7 }),
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
  tax: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  shipping: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
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
  ownerId: text("owner_id"), // Unified owner column (user_id || session_id)
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wishlists table for user favorite products
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wishlists_user").on(table.userId),
  index("idx_wishlists_product").on(table.productId),
]);

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

// Email Queue table for notifications and marketing
export const emailQueue = pgTable("email_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toEmail: varchar("to_email").notNull(),
  template: varchar("template").notNull(),
  data: jsonb("data"),
  status: varchar("status").default("pending"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_queue_status").on(table.status),
  index("idx_email_queue_created_at").on(table.createdAt),
]);

// Equipment submission status enum
export const equipmentSubmissionStatusEnum = pgEnum("equipment_submission_status", [
  "pending",
  "under_review", 
  "approved",
  "declined",
  "scheduled",
  "completed",
  "cancelled"
]);

// Equipment submissions table (for sell-to-us functionality) - matches actual database
export const equipmentSubmissions = pgTable("equipment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  brand: varchar("brand"),
  category: varchar("category").notNull(),
  condition: varchar("condition").notNull(), // 'new', 'excellent', 'good', 'fair', 'poor'
  description: text("description").notNull(),
  images: text("images").array().default([]),
  askingPrice: decimal("asking_price", { precision: 10, scale: 2 }),
  weight: integer("weight"), // in pounds
  dimensions: text("dimensions"), // "L x W x H"
  yearPurchased: integer("year_purchased"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  sellerEmail: varchar("seller_email").notNull(),
  sellerPhone: varchar("seller_phone"),
  sellerLocation: text("seller_location"), // Free text location
  // Removed isLocalDelivery field - column doesn't exist in database
  notes: text("notes"), // Additional seller notes
  status: varchar("status").default("pending"), // 'pending', 'reviewing', 'approved', 'rejected', 'purchased'
  adminNotes: text("admin_notes"), // Internal admin notes
  offeredPrice: decimal("offered_price", { precision: 10, scale: 2 }), // Price offered by business
  referenceNumber: varchar("reference_number").unique(), // Tracking reference for users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_submissions_user").on(table.userId),
  index("idx_submissions_status").on(table.status),
  index("idx_submissions_reference").on(table.referenceNumber),
  index("idx_submissions_category").on(table.category),
]);

// Relations  
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
  addresses: many(addresses),
  activities: many(activityLogs),
  equipmentSubmissions: many(equipmentSubmissions),
  wishlists: many(wishlists),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  wishlists: many(wishlists),
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

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
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
  adminNotes: true,
  offeredPrice: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});



export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;

// Error Logging Tables
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  error_type: varchar("error_type").notNull(), // 'error', 'warning', 'info'
  severity: varchar("severity").notNull(), // 'critical', 'high', 'medium', 'low'
  message: text("message").notNull(),
  stack_trace: text("stack_trace"),
  file_path: varchar("file_path"),
  line_number: integer("line_number"),
  column_number: integer("column_number"),
  user_id: varchar("user_id").references(() => users.id),
  user_email: varchar("user_email"),
  user_ip: varchar("user_ip"),
  user_agent: text("user_agent"),
  url: varchar("url"),
  method: varchar("method"),
  request_body: jsonb("request_body"),
  response_status: integer("response_status"),
  browser: varchar("browser"),
  os: varchar("os"),
  device_type: varchar("device_type"),
  session_id: varchar("session_id"),
  environment: varchar("environment").default("production"),
  resolved: boolean("resolved").default(false),
  resolved_by: varchar("resolved_by").references(() => users.id),
  resolved_at: timestamp("resolved_at"),
  notes: text("notes"),
  occurrence_count: integer("occurrence_count").default(1),
  first_seen: timestamp("first_seen").defaultNow(),
  last_seen: timestamp("last_seen").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_error_logs_severity").on(table.severity),
  index("idx_error_logs_type").on(table.error_type),
  index("idx_error_logs_user").on(table.user_id),
  index("idx_error_logs_resolved").on(table.resolved),
  index("idx_error_logs_created").on(table.created_at),
]);

export const errorLogInstances = pgTable("error_log_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  error_log_id: varchar("error_log_id").references(() => errorLogs.id, { onDelete: "cascade" }),
  occurred_at: timestamp("occurred_at").defaultNow(),
  context: jsonb("context"),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
export type ErrorLogInstance = typeof errorLogInstances.$inferSelect;
export type InsertErrorLogInstance = typeof errorLogInstances.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserOnboarding = typeof userOnboarding.$inferInsert;

// Registration specific type that includes additional fields
export const registerDataSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  // REMOVED: Legacy fullAddress field - using SSOT formatted address
}).omit({
  role: true,
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

export type ServiceZone = typeof serviceZones.$inferSelect;
export type InsertServiceZone = typeof serviceZones.$inferInsert;

export type OrderAddress = typeof orderAddresses.$inferSelect;
export type InsertOrderAddress = typeof orderAddresses.$inferInsert;

export type EquipmentSubmission = typeof equipmentSubmissions.$inferSelect;
export type InsertEquipmentSubmission = z.infer<typeof insertEquipmentSubmissionSchema>;

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Reviews Schema
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  verified: boolean("verified").default(false),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reviews_product").on(table.productId),
  index("idx_reviews_user").on(table.userId),
  index("idx_reviews_rating").on(table.rating),
]);

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  helpful: true,
  createdAt: true,
  updatedAt: true,
});

// Coupons Schema
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  description: text("description").notNull(),
  discountType: varchar("discount_type").notNull(), // 'percentage' | 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_coupons_code").on(table.code),
  index("idx_coupons_active").on(table.isActive),
]);

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

// Order Tracking Schema
export const orderTracking = pgTable("order_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  status: varchar("status").notNull(),
  location: varchar("location"),
  description: text("description"),
  trackingNumber: varchar("tracking_number"),
  carrier: varchar("carrier"),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_order_tracking_order").on(table.orderId),
  index("idx_order_tracking_status").on(table.status),
]);

export const insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
  id: true,
  createdAt: true,
});

// Return Requests Schema
export const returnRequests = pgTable("return_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reason: varchar("reason").notNull(),
  description: text("description"),
  preferredResolution: varchar("preferred_resolution").notNull(), // 'refund' | 'exchange'
  status: varchar("status").default("pending"), // 'pending' | 'approved' | 'rejected' | 'completed'
  returnNumber: varchar("return_number").unique().notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  adminNotes: text("admin_notes"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_return_requests_order").on(table.orderId),
  index("idx_return_requests_user").on(table.userId),
  index("idx_return_requests_status").on(table.status),
]);

export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type OrderTracking = typeof orderTracking.$inferSelect;
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

// Email logs table
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toEmail: varchar("to_email").notNull(),
  fromEmail: varchar("from_email").notNull(),
  subject: varchar("subject").notNull(),
  templateType: varchar("template_type").notNull(),
  status: varchar("status").default("pending"),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_logs_status").on(table.status),
  index("idx_email_logs_created_at").on(table.createdAt),
  index("idx_email_logs_to_email").on(table.toEmail),
]);

// Newsletter subscribers table
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  subscribed: boolean("subscribed").default(true),
  unsubscribeToken: varchar("unsubscribe_token").unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
}, (table) => [
  index("idx_newsletter_email").on(table.email),
  index("idx_newsletter_subscribed").on(table.subscribed),
]);

// User email preferences
export const userEmailPreferences = pgTable("user_email_preferences", {
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  orderUpdates: boolean("order_updates").default(true),
  marketing: boolean("marketing").default(true),
  priceAlerts: boolean("price_alerts").default(true),
  newsletter: boolean("newsletter").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_prt_token").on(table.token),
  index("idx_prt_user_id").on(table.userId),
  index("idx_prt_expires").on(table.expiresAt),
]);

// Schema for email logs
export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});

// Schema for newsletter subscribers
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
  unsubscribedAt: true,
});

// Schema for user email preferences
export const insertUserEmailPreferencesSchema = createInsertSchema(userEmailPreferences).omit({
  updatedAt: true,
});

// Schema for password reset tokens
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export type UserEmailPreferences = typeof userEmailPreferences.$inferSelect;
export type InsertUserEmailPreferences = z.infer<typeof insertUserEmailPreferencesSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Type for status history tracking
export type StatusHistoryEntry = {
  status: string;
  timestamp: string;
  changedBy: string;
  notes?: string;
};
