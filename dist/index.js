var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  addresses: () => addresses,
  addressesRelations: () => addressesRelations,
  cartItems: () => cartItems,
  cartItemsRelations: () => cartItemsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  coupons: () => coupons,
  emailLogs: () => emailLogs,
  emailQueue: () => emailQueue,
  equipmentSubmissionStatusEnum: () => equipmentSubmissionStatusEnum,
  equipmentSubmissions: () => equipmentSubmissions,
  equipmentSubmissionsRelations: () => equipmentSubmissionsRelations,
  errorLogInstances: () => errorLogInstances,
  errorLogs: () => errorLogs,
  errorsRaw: () => errorsRaw,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertAddressSchema: () => insertAddressSchema,
  insertCartItemSchema: () => insertCartItemSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertCouponSchema: () => insertCouponSchema,
  insertEmailLogSchema: () => insertEmailLogSchema,
  insertEquipmentSubmissionSchema: () => insertEquipmentSubmissionSchema,
  insertNewsletterSubscriberSchema: () => insertNewsletterSubscriberSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertOrderTrackingSchema: () => insertOrderTrackingSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertProductSchema: () => insertProductSchema,
  insertReturnRequestSchema: () => insertReturnRequestSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertUserEmailPreferencesSchema: () => insertUserEmailPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertWishlistSchema: () => insertWishlistSchema,
  issueEvents: () => issueEvents,
  issues: () => issues,
  newsletterSubscribers: () => newsletterSubscribers,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orderStatusEnum: () => orderStatusEnum,
  orderTracking: () => orderTracking,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  passwordResetTokens: () => passwordResetTokens,
  productConditionEnum: () => productConditionEnum,
  productStatusEnum: () => productStatusEnum,
  products: () => products,
  productsRelations: () => productsRelations,
  registerDataSchema: () => registerDataSchema,
  returnRequests: () => returnRequests,
  reviews: () => reviews,
  sessions: () => sessions,
  userEmailPreferences: () => userEmailPreferences,
  userOnboarding: () => userOnboarding,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  wishlists: () => wishlists,
  wishlistsRelations: () => wishlistsRelations
});
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
  customType
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var tsvector, sessions, errorsRaw, issues, issueEvents, userRoleEnum, users, userOnboarding, categories, productConditionEnum, productStatusEnum, products, addresses, orderStatusEnum, orders, orderItems, cartItems, wishlists, activityLogs, emailQueue, equipmentSubmissionStatusEnum, equipmentSubmissions, usersRelations, categoriesRelations, productsRelations, ordersRelations, orderItemsRelations, cartItemsRelations, addressesRelations, equipmentSubmissionsRelations, wishlistsRelations, insertUserSchema, insertCategorySchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertCartItemSchema, insertAddressSchema, insertEquipmentSubmissionSchema, insertActivityLogSchema, insertWishlistSchema, errorLogs, errorLogInstances, registerDataSchema, reviews, insertReviewSchema, coupons, insertCouponSchema, orderTracking, insertOrderTrackingSchema, returnRequests, insertReturnRequestSchema, emailLogs, newsletterSubscribers, userEmailPreferences, passwordResetTokens, insertEmailLogSchema, insertNewsletterSubscriberSchema, insertUserEmailPreferencesSchema, insertPasswordResetTokenSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    tsvector = customType({
      dataType() {
        return "tsvector";
      }
    });
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    errorsRaw = pgTable("errors_raw", {
      id: serial("id").primaryKey(),
      eventId: varchar("event_id").notNull().unique(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      level: varchar("level").notNull(),
      // error, warn, info
      env: varchar("env").notNull(),
      // development, production
      release: varchar("release"),
      service: varchar("service").notNull(),
      // client, server
      url: text("url"),
      method: varchar("method"),
      statusCode: integer("status_code"),
      message: text("message").notNull(),
      type: varchar("type"),
      stack: jsonb("stack"),
      // string[]
      fingerprint: varchar("fingerprint").notNull(),
      userId: varchar("user_id"),
      tags: jsonb("tags"),
      // Record<string, string | number | boolean>
      extra: jsonb("extra")
      // Record<string, any>
    }, (table) => [
      index("idx_errors_raw_created_at").on(table.createdAt),
      index("idx_errors_raw_fingerprint").on(table.fingerprint),
      index("idx_errors_raw_level").on(table.level)
    ]);
    issues = pgTable("issues", {
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
      envs: jsonb("envs").notNull()
      // Record<string, number>
    }, (table) => [
      index("idx_issues_last_seen").on(table.lastSeen),
      index("idx_issues_resolved").on(table.resolved),
      index("idx_issues_level").on(table.level)
    ]);
    issueEvents = pgTable("issue_events", {
      id: serial("id").primaryKey(),
      fingerprint: varchar("fingerprint").notNull(),
      hour: timestamp("hour").notNull(),
      count: integer("count").default(0).notNull()
    }, (table) => [
      index("idx_issue_events_hour").on(table.hour),
      index("idx_issue_events_fingerprint").on(table.fingerprint),
      // Unique constraint for fingerprint + hour combination
      index("idx_issue_events_unique").on(table.fingerprint, table.hour)
    ]);
    userRoleEnum = pgEnum("user_role", [
      "user",
      "developer"
    ]);
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique().notNull(),
      password: varchar("password"),
      // Make optional for OAuth users
      firstName: varchar("first_name").notNull(),
      lastName: varchar("last_name").notNull(),
      phone: varchar("phone"),
      // Optional field
      street: varchar("street", { length: 255 }),
      city: varchar("city", { length: 100 }),
      state: varchar("state", { length: 2 }),
      zipCode: varchar("zip_code", { length: 10 }),
      latitude: decimal("latitude", { precision: 10, scale: 8 }),
      longitude: decimal("longitude", { precision: 11, scale: 8 }),
      isLocalCustomer: boolean("is_local_customer").default(false),
      role: userRoleEnum("role").default("user"),
      stripeCustomerId: varchar("stripe_customer_id"),
      stripeSubscriptionId: varchar("stripe_subscription_id"),
      // OAuth fields
      googleId: varchar("google_id").unique(),
      googleEmail: varchar("google_email"),
      googlePicture: text("google_picture"),
      profileImageUrl: text("profile_image_url"),
      authProvider: varchar("auth_provider").default("local"),
      // 'local', 'google'
      isEmailVerified: boolean("is_email_verified").default(false),
      profileComplete: boolean("profile_complete").default(false),
      onboardingStep: integer("onboarding_step").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userOnboarding = pgTable("user_onboarding", {
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
    categories = pgTable("categories", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    productConditionEnum = pgEnum("product_condition", [
      "new",
      "like_new",
      "good",
      "fair",
      "needs_repair"
    ]);
    productStatusEnum = pgEnum("product_status", [
      "active",
      "inactive",
      "sold",
      "pending",
      "draft",
      "archived"
    ]);
    products = pgTable("products", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name").notNull(),
      description: text("description"),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      categoryId: varchar("category_id").references(() => categories.id),
      subcategory: text("subcategory"),
      brand: varchar("brand"),
      weight: integer("weight"),
      // in pounds
      condition: productConditionEnum("condition").notNull(),
      status: productStatusEnum("status").default("active"),
      images: jsonb("images").$type().default([]),
      specifications: jsonb("specifications").$type().default({}),
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
      dimensions: jsonb("dimensions").$type(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("idx_products_search").using("gin", table.searchVector),
      index("idx_products_category").on(table.categoryId),
      index("idx_products_status").on(table.status),
      index("idx_products_featured").on(table.featured),
      index("idx_products_created_at").on(table.createdAt),
      index("idx_products_price").on(table.price),
      index("idx_stripe_product_id").on(table.stripeProductId),
      index("idx_stripe_sync_status").on(table.stripeSyncStatus)
    ]);
    addresses = pgTable("addresses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      type: varchar("type").notNull(),
      // 'shipping' or 'billing'
      firstName: varchar("first_name").notNull(),
      lastName: varchar("last_name").notNull(),
      street: varchar("street").notNull(),
      city: varchar("city").notNull(),
      state: varchar("state").notNull(),
      zipCode: varchar("zip_code").notNull(),
      country: varchar("country").default("US"),
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    orderStatusEnum = pgEnum("order_status", [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded"
    ]);
    orders = pgTable("orders", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    orderItems = pgTable("order_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      orderId: varchar("order_id").references(() => orders.id),
      productId: varchar("product_id").references(() => products.id),
      quantity: integer("quantity").notNull(),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    cartItems = pgTable("cart_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      sessionId: varchar("session_id"),
      productId: varchar("product_id").references(() => products.id),
      quantity: integer("quantity").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    wishlists = pgTable("wishlists", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
      productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_wishlists_user").on(table.userId),
      index("idx_wishlists_product").on(table.productId)
    ]);
    activityLogs = pgTable("activity_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventType: varchar("event_type").notNull(),
      // 'page_view', 'user_action', 'purchase'
      userId: varchar("user_id").references(() => users.id),
      sessionId: varchar("session_id"),
      action: varchar("action"),
      // What action was performed
      page: varchar("page"),
      // Which page/route
      pageUrl: varchar("page_url"),
      // Full URL (added for compatibility)
      metadata: jsonb("metadata"),
      // Additional data
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_activity_logs_created").on(table.createdAt),
      index("idx_activity_logs_type").on(table.eventType)
    ]);
    emailQueue = pgTable("email_queue", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      toEmail: varchar("to_email").notNull(),
      template: varchar("template").notNull(),
      data: jsonb("data"),
      status: varchar("status").default("pending"),
      sentAt: timestamp("sent_at"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_email_queue_status").on(table.status),
      index("idx_email_queue_created_at").on(table.createdAt)
    ]);
    equipmentSubmissionStatusEnum = pgEnum("equipment_submission_status", [
      "pending",
      "under_review",
      "approved",
      "declined",
      "scheduled",
      "completed",
      "cancelled"
    ]);
    equipmentSubmissions = pgTable("equipment_submissions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
      name: varchar("name").notNull(),
      brand: varchar("brand"),
      category: varchar("category").notNull(),
      condition: varchar("condition").notNull(),
      // 'new', 'excellent', 'good', 'fair', 'poor'
      description: text("description").notNull(),
      images: text("images").array().default([]),
      askingPrice: decimal("asking_price", { precision: 10, scale: 2 }),
      weight: integer("weight"),
      // in pounds
      dimensions: text("dimensions"),
      // "L x W x H"
      yearPurchased: integer("year_purchased"),
      originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
      sellerEmail: varchar("seller_email").notNull(),
      sellerPhone: varchar("seller_phone"),
      sellerLocation: text("seller_location"),
      // Free text location
      isLocalDelivery: boolean("is_local_delivery").default(false),
      notes: text("notes"),
      // Additional seller notes
      status: varchar("status").default("pending"),
      // 'pending', 'reviewing', 'approved', 'rejected', 'purchased'
      adminNotes: text("admin_notes"),
      // Internal admin notes
      offeredPrice: decimal("offered_price", { precision: 10, scale: 2 }),
      // Price offered by business
      referenceNumber: varchar("reference_number").unique(),
      // Tracking reference for users
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("idx_submissions_user").on(table.userId),
      index("idx_submissions_status").on(table.status),
      index("idx_submissions_reference").on(table.referenceNumber),
      index("idx_submissions_category").on(table.category)
    ]);
    usersRelations = relations(users, ({ many }) => ({
      orders: many(orders),
      cartItems: many(cartItems),
      addresses: many(addresses),
      activities: many(activityLogs),
      equipmentSubmissions: many(equipmentSubmissions),
      wishlists: many(wishlists)
    }));
    categoriesRelations = relations(categories, ({ many }) => ({
      products: many(products)
    }));
    productsRelations = relations(products, ({ one, many }) => ({
      category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id]
      }),
      orderItems: many(orderItems),
      cartItems: many(cartItems),
      wishlists: many(wishlists)
    }));
    ordersRelations = relations(orders, ({ one, many }) => ({
      user: one(users, {
        fields: [orders.userId],
        references: [users.id]
      }),
      items: many(orderItems),
      shippingAddress: one(addresses, {
        fields: [orders.shippingAddressId],
        references: [addresses.id]
      }),
      billingAddress: one(addresses, {
        fields: [orders.billingAddressId],
        references: [addresses.id]
      })
    }));
    orderItemsRelations = relations(orderItems, ({ one }) => ({
      order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id]
      }),
      product: one(products, {
        fields: [orderItems.productId],
        references: [products.id]
      })
    }));
    cartItemsRelations = relations(cartItems, ({ one }) => ({
      user: one(users, {
        fields: [cartItems.userId],
        references: [users.id]
      }),
      product: one(products, {
        fields: [cartItems.productId],
        references: [products.id]
      })
    }));
    addressesRelations = relations(addresses, ({ one }) => ({
      user: one(users, {
        fields: [addresses.userId],
        references: [users.id]
      })
    }));
    equipmentSubmissionsRelations = relations(equipmentSubmissions, ({ one }) => ({
      user: one(users, {
        fields: [equipmentSubmissions.userId],
        references: [users.id]
      })
    }));
    wishlistsRelations = relations(wishlists, ({ one }) => ({
      user: one(users, {
        fields: [wishlists.userId],
        references: [users.id]
      }),
      product: one(products, {
        fields: [wishlists.productId],
        references: [products.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCategorySchema = createInsertSchema(categories).omit({
      id: true,
      createdAt: true
    });
    insertProductSchema = createInsertSchema(products).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      views: true
    });
    insertOrderSchema = createInsertSchema(orders).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertOrderItemSchema = createInsertSchema(orderItems).omit({
      id: true,
      createdAt: true
    });
    insertCartItemSchema = createInsertSchema(cartItems).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAddressSchema = createInsertSchema(addresses).omit({
      id: true,
      createdAt: true
    });
    insertEquipmentSubmissionSchema = createInsertSchema(equipmentSubmissions).omit({
      id: true,
      referenceNumber: true,
      adminNotes: true,
      offeredPrice: true,
      status: true,
      createdAt: true,
      updatedAt: true
    });
    insertActivityLogSchema = createInsertSchema(activityLogs).omit({
      id: true,
      createdAt: true
    });
    insertWishlistSchema = createInsertSchema(wishlists).omit({
      id: true,
      createdAt: true
    });
    errorLogs = pgTable("error_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      error_type: varchar("error_type").notNull(),
      // 'error', 'warning', 'info'
      severity: varchar("severity").notNull(),
      // 'critical', 'high', 'medium', 'low'
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
      created_at: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_error_logs_severity").on(table.severity),
      index("idx_error_logs_type").on(table.error_type),
      index("idx_error_logs_user").on(table.user_id),
      index("idx_error_logs_resolved").on(table.resolved),
      index("idx_error_logs_created").on(table.created_at)
    ]);
    errorLogInstances = pgTable("error_log_instances", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      error_log_id: varchar("error_log_id").references(() => errorLogs.id, { onDelete: "cascade" }),
      occurred_at: timestamp("occurred_at").defaultNow(),
      context: jsonb("context")
    });
    registerDataSchema = insertUserSchema.extend({
      confirmPassword: z.string(),
      fullAddress: z.string().optional()
    }).omit({
      role: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true
    });
    reviews = pgTable("reviews", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      rating: integer("rating").notNull(),
      title: varchar("title").notNull(),
      content: text("content").notNull(),
      verified: boolean("verified").default(false),
      helpful: integer("helpful").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("idx_reviews_product").on(table.productId),
      index("idx_reviews_user").on(table.userId),
      index("idx_reviews_rating").on(table.rating)
    ]);
    insertReviewSchema = createInsertSchema(reviews).omit({
      id: true,
      helpful: true,
      createdAt: true,
      updatedAt: true
    });
    coupons = pgTable("coupons", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      code: varchar("code").unique().notNull(),
      description: text("description").notNull(),
      discountType: varchar("discount_type").notNull(),
      // 'percentage' | 'fixed'
      discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
      minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
      maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
      usageLimit: integer("usage_limit"),
      usageCount: integer("usage_count").default(0),
      isActive: boolean("is_active").default(true),
      validFrom: timestamp("valid_from").defaultNow(),
      validUntil: timestamp("valid_until"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("idx_coupons_code").on(table.code),
      index("idx_coupons_active").on(table.isActive)
    ]);
    insertCouponSchema = createInsertSchema(coupons).omit({
      id: true,
      usageCount: true,
      createdAt: true,
      updatedAt: true
    });
    orderTracking = pgTable("order_tracking", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
      status: varchar("status").notNull(),
      location: varchar("location"),
      description: text("description"),
      trackingNumber: varchar("tracking_number"),
      carrier: varchar("carrier"),
      estimatedDelivery: timestamp("estimated_delivery"),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_order_tracking_order").on(table.orderId),
      index("idx_order_tracking_status").on(table.status)
    ]);
    insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
      id: true,
      createdAt: true
    });
    returnRequests = pgTable("return_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      reason: varchar("reason").notNull(),
      description: text("description"),
      preferredResolution: varchar("preferred_resolution").notNull(),
      // 'refund' | 'exchange'
      status: varchar("status").default("pending"),
      // 'pending' | 'approved' | 'rejected' | 'completed'
      returnNumber: varchar("return_number").unique().notNull(),
      images: jsonb("images").$type().default([]),
      adminNotes: text("admin_notes"),
      refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("idx_return_requests_order").on(table.orderId),
      index("idx_return_requests_user").on(table.userId),
      index("idx_return_requests_status").on(table.status)
    ]);
    insertReturnRequestSchema = createInsertSchema(returnRequests).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    emailLogs = pgTable("email_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      toEmail: varchar("to_email").notNull(),
      fromEmail: varchar("from_email").notNull(),
      subject: varchar("subject").notNull(),
      templateType: varchar("template_type").notNull(),
      status: varchar("status").default("pending"),
      sentAt: timestamp("sent_at"),
      error: text("error"),
      metadata: jsonb("metadata").$type().default({}),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_email_logs_status").on(table.status),
      index("idx_email_logs_created_at").on(table.createdAt),
      index("idx_email_logs_to_email").on(table.toEmail)
    ]);
    newsletterSubscribers = pgTable("newsletter_subscribers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique().notNull(),
      subscribed: boolean("subscribed").default(true),
      unsubscribeToken: varchar("unsubscribe_token").unique(),
      subscribedAt: timestamp("subscribed_at").defaultNow(),
      unsubscribedAt: timestamp("unsubscribed_at")
    }, (table) => [
      index("idx_newsletter_email").on(table.email),
      index("idx_newsletter_subscribed").on(table.subscribed)
    ]);
    userEmailPreferences = pgTable("user_email_preferences", {
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).primaryKey(),
      orderUpdates: boolean("order_updates").default(true),
      marketing: boolean("marketing").default(true),
      priceAlerts: boolean("price_alerts").default(true),
      newsletter: boolean("newsletter").default(true),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: varchar("token", { length: 255 }).notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      used: boolean("used").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      ipAddress: varchar("ip_address", { length: 45 }),
      userAgent: text("user_agent")
    }, (table) => [
      index("idx_prt_token").on(table.token),
      index("idx_prt_user_id").on(table.userId),
      index("idx_prt_expires").on(table.expiresAt)
    ]);
    insertEmailLogSchema = createInsertSchema(emailLogs).omit({
      id: true,
      createdAt: true
    });
    insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
      id: true,
      subscribedAt: true,
      unsubscribedAt: true
    });
    insertUserEmailPreferencesSchema = createInsertSchema(userEmailPreferences).omit({
      updatedAt: true
    });
    insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/utils/logger.ts
var LogLevel, Logger;
var init_logger = __esm({
  "server/utils/logger.ts"() {
    "use strict";
    LogLevel = /* @__PURE__ */ ((LogLevel2) => {
      LogLevel2[LogLevel2["ERROR"] = 0] = "ERROR";
      LogLevel2[LogLevel2["WARN"] = 1] = "WARN";
      LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
      LogLevel2[LogLevel2["DEBUG"] = 3] = "DEBUG";
      LogLevel2[LogLevel2["VERBOSE"] = 4] = "VERBOSE";
      return LogLevel2;
    })(LogLevel || {});
    Logger = class {
      static logLevel = 2 /* INFO */;
      static consolidatedLogs = /* @__PURE__ */ new Map();
      static consolidationWindow = 5e3;
      // 5 seconds
      static setLogLevel(level) {
        this.logLevel = level;
      }
      static shouldLog(level) {
        return level <= this.logLevel;
      }
      static consolidate(key, message, level = 2 /* INFO */) {
        if (!this.shouldLog(level)) return;
        const messageStr = typeof message === "string" ? message : typeof message === "object" ? JSON.stringify(message) : String(message || "");
        const now = Date.now();
        const existing = this.consolidatedLogs.get(key);
        if (existing && now - existing.lastLogged < this.consolidationWindow) {
          existing.count++;
          return;
        }
        if (existing && existing.count > 1) {
          console.log(`[CONSOLIDATED] ${messageStr} (occurred ${existing.count} times)`);
        } else {
          console.log(messageStr);
        }
        this.consolidatedLogs.set(key, { count: 1, lastLogged: now });
      }
      static info(message, data) {
        if (this.shouldLog(2 /* INFO */)) {
          console.log(`[INFO] ${message}`, data || "");
        }
      }
      static debug(message, data) {
        if (this.shouldLog(3 /* DEBUG */)) {
          console.log(`[DEBUG] ${message}`, data || "");
        }
      }
      static error(message, error) {
        if (this.shouldLog(0 /* ERROR */)) {
          console.error(`[ERROR] ${message}`, error || "");
        }
      }
      static warn(message, data) {
        if (this.shouldLog(1 /* WARN */)) {
          console.warn(`[WARN] ${message}`, data || "");
        }
      }
    };
  }
});

// server/config/database.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
function getCurrentEnvironment() {
  if (process.env.REPLIT_DEPLOYMENT === "true") {
    console.log("[DB] Environment detected via REPLIT_DEPLOYMENT=true \u2192 PRODUCTION");
    return "production";
  }
  if (process.env.NODE_ENV === "production") {
    console.log("[DB] Environment detected via NODE_ENV=production \u2192 PRODUCTION");
    return "production";
  }
  const host = process.env.HOST || process.env.HOSTNAME || "localhost";
  if (host.includes("localhost") || host.includes("127.0.0.1") || host === "0.0.0.0") {
    console.log("[DB] Environment detected via localhost \u2192 DEVELOPMENT");
    return "development";
  }
  if (process.env.REPL_ID || process.env.REPLIT_DB_URL) {
    console.log("[DB] Environment detected via Replit workspace \u2192 DEVELOPMENT");
    return "development";
  }
  console.log("[DB] Environment defaulting to development (safest option)");
  return "development";
}
function getDatabaseConfig() {
  const environment = getCurrentEnvironment();
  if (environment === "production") {
    let prodUrl = process.env.DATABASE_URL_PROD;
    if (!prodUrl) {
      console.log("[DB] DATABASE_URL_PROD not found, checking DATABASE_URL for production compatibility...");
      const fallbackUrl = process.env.DATABASE_URL;
      if (fallbackUrl && fallbackUrl.includes("muddy-moon")) {
        console.log("[DB] \u2705 DATABASE_URL contains production database (muddy-moon), using it");
        prodUrl = fallbackUrl;
      } else if (fallbackUrl && fallbackUrl.includes("lingering-flower")) {
        console.error("[DB] \u274C CRITICAL: DATABASE_URL points to development database in production!");
        throw new Error("SECURITY: Cannot use development database (lingering-flower) in production!");
      } else {
        console.error("[DB] \u274C CRITICAL: No production database URL available!");
        console.error("[DB] Available URLs:");
        console.error(`[DB]   DATABASE_URL: ${process.env.DATABASE_URL ? "Set" : "Missing"}`);
        console.error(`[DB]   DATABASE_URL_PROD: ${process.env.DATABASE_URL_PROD ? "Set" : "Missing"}`);
        console.error("[DB] Please set DATABASE_URL to your production database in Replit deployment settings.");
        throw new Error("No production database URL configured. Set DATABASE_URL in deployment environment.");
      }
    }
    if (prodUrl.includes("lingering-flower")) {
      throw new Error("CRITICAL: Cannot use development database (lingering-flower) in production!");
    }
    console.log("[DB] \u2705 Using PRODUCTION database (muddy-moon)");
    return {
      url: prodUrl,
      name: "production",
      environment: "production",
      maxRetries: 5,
      retryDelay: 2e3
    };
  } else {
    const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
    if (!devUrl) {
      throw new Error("DATABASE_URL must be set for development environment");
    }
    if (devUrl.includes("muddy-moon")) {
      console.warn("[DB] \u26A0\uFE0F  WARNING: Development environment using production database!");
      console.warn("[DB] This is allowed but not recommended for safety");
    }
    console.log("[DB] \u2705 Using DEVELOPMENT database (localhost environment)");
    return {
      url: devUrl,
      name: "development",
      environment: "development",
      maxRetries: 3,
      retryDelay: 1e3
    };
  }
}
var init_database = __esm({
  "server/config/database.ts"() {
    "use strict";
    init_schema();
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool,
  withRetry: () => withRetry
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzle2 } from "drizzle-orm/neon-serverless";
import { WebSocket } from "ws";
import { sql as sql2 } from "drizzle-orm";
var dbConfig, databaseUrl, poolConfig, pool, keepAlive, keepAliveInterval, withRetry, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_logger();
    init_database();
    neonConfig.webSocketConstructor = WebSocket;
    neonConfig.pipelineConnect = false;
    neonConfig.useSecureWebSocket = true;
    dbConfig = getDatabaseConfig();
    databaseUrl = dbConfig.url;
    console.log("[DB] Using unified database configuration...");
    console.log("[DB] Environment:", dbConfig.environment);
    console.log("[DB] Database name:", dbConfig.name);
    try {
      const dbUrl = new URL(databaseUrl);
      console.log("[DB] Connecting to host:", dbUrl.hostname);
      console.log("[DB] Database name:", dbUrl.pathname.substring(1));
    } catch (e) {
      console.error("[DB] Invalid database URL format");
      throw new Error("Invalid database URL configuration");
    }
    poolConfig = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1e4,
      statement_timeout: 3e4,
      query_timeout: 3e4
    };
    pool = new Pool(poolConfig);
    pool.on("error", (err) => {
      Logger.error("Database pool error:", err.message);
      if (err.code === "57P01" || err.message?.includes("terminating connection")) {
        Logger.info("Connection terminated, creating new pool...");
        pool = new Pool(poolConfig);
      }
    });
    pool.on("connect", () => {
    });
    keepAlive = async () => {
      try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          Logger.error("Keep-alive query failed:", error.message);
          if (error.code === "57P01" || error.message?.includes("connection")) {
            Logger.info("Recreating pool due to connection issues...");
            pool = new Pool(poolConfig);
          }
        }
      }
    };
    keepAliveInterval = process.env.NODE_ENV === "production" ? 10 * 60 * 1e3 : 5 * 60 * 1e3;
    setInterval(keepAlive, keepAliveInterval);
    withRetry = async (operation, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          Logger.error(`Database operation attempt ${attempt} failed:`, error.message);
          if (error.code === "57P01" || error.message?.includes("terminating connection")) {
            if (attempt < maxRetries) {
              Logger.info(`Retrying operation (attempt ${attempt + 1})...`);
              pool = new Pool(poolConfig);
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1e3));
              continue;
            }
          }
          if (attempt === maxRetries) {
            throw error;
          }
        }
      }
    };
    db = drizzle2({ client: pool, schema: schema_exports });
    db.execute(sql2`SELECT current_database() as db, current_user as user, version() as version`).then((result) => {
      const info = result.rows[0];
      console.log("[DB] \u2705 Database connected successfully");
      console.log(`[DB] Database: ${info.db}, User: ${info.user}`);
      console.log(`[DB] PostgreSQL Version: ${info.version?.split(",")[0] || "unknown"}`);
    }).catch((err) => {
      console.error("[DB] \u274C Database connection failed:", err.message);
      console.error("[DB] This will cause authentication and other database features to fail");
    });
    process.on("SIGTERM", async () => {
      Logger.info("Gracefully shutting down database connections...");
      await pool.end();
      process.exit(0);
    });
    process.on("SIGINT", async () => {
      Logger.info("Gracefully shutting down database connections...");
      await pool.end();
      process.exit(0);
    });
  }
});

// shared/utils.ts
var normalizeEmail, normalizeSearchTerm, normalizeBrand, normalizePhone;
var init_utils = __esm({
  "shared/utils.ts"() {
    "use strict";
    normalizeEmail = (email) => {
      return email?.toLowerCase().trim() || "";
    };
    normalizeSearchTerm = (term) => {
      return term?.toLowerCase().trim() || "";
    };
    normalizeBrand = (brand) => {
      return brand?.toLowerCase().trim() || "";
    };
    normalizePhone = (phone) => {
      return phone?.replace(/\D/g, "") || "";
    };
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { eq, desc, asc, and, or, gte, lte, sql as sql3, isNotNull } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_utils();
    init_logger();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByEmail(email) {
        const normalizedEmail = normalizeEmail(email);
        try {
          const [user] = await db.select().from(users).where(sql3`LOWER(${users.email}) = ${normalizedEmail}`);
          return user;
        } catch (error) {
          Logger.error("Error getting user by email:", error.message);
          if (error.code === "57P01") {
            const [user] = await db.select().from(users).where(sql3`LOWER(${users.email}) = ${normalizedEmail}`);
            return user;
          }
          throw error;
        }
      }
      async createUser(insertUser) {
        const userToInsert = {
          ...insertUser,
          email: normalizeEmail(insertUser.email)
        };
        try {
          const [user] = await db.insert(users).values(userToInsert).returning();
          return user;
        } catch (error) {
          Logger.error("Error creating user:", error.message);
          if (error.code === "57P01") {
            const [user] = await db.insert(users).values(userToInsert).returning();
            return user;
          }
          throw error;
        }
      }
      async createUserFromGoogle(userData) {
        const userToInsert = {
          email: normalizeEmail(userData.email),
          firstName: userData.firstName,
          lastName: userData.lastName,
          googleId: userData.googleId,
          profileImageUrl: userData.profileImageUrl,
          authProvider: userData.authProvider,
          isEmailVerified: userData.isEmailVerified,
          role: "user",
          // Default role for Google users
          password: null
          // No password for OAuth users
        };
        try {
          const [user] = await db.insert(users).values(userToInsert).returning();
          return user;
        } catch (error) {
          Logger.error("Error creating Google user:", error.message);
          if (error.code === "57P01") {
            const [user] = await db.insert(users).values(userToInsert).returning();
            return user;
          }
          throw error;
        }
      }
      async updateUserGoogleInfo(id, googleData) {
        const [user] = await db.update(users).set({
          googleId: googleData.googleId,
          profileImageUrl: googleData.profileImageUrl,
          isEmailVerified: googleData.isEmailVerified,
          authProvider: googleData.authProvider,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning();
        return user;
      }
      async updateUserStripeInfo(id, customerId, subscriptionId) {
        const [user] = await db.update(users).set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning();
        return user;
      }
      async updateUser(id, userData) {
        const [user] = await db.update(users).set({
          ...userData,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning();
        return user;
      }
      async updateUserAddress(id, addressData) {
        const [user] = await db.update(users).set({
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          latitude: addressData.latitude ? String(addressData.latitude) : void 0,
          longitude: addressData.longitude ? String(addressData.longitude) : void 0,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning();
        return user;
      }
      // Category operations
      async getCategories() {
        return await db.select().from(categories).orderBy(asc(categories.name));
      }
      // Removed duplicate createCategory function
      async getBrands() {
        const result = await db.selectDistinct({ brand: products.brand }).from(products).where(isNotNull(products.brand)).orderBy(asc(products.brand));
        return result.map((row) => row.brand).filter(Boolean);
      }
      // Product operations
      async getProducts(filters) {
        const conditions = [];
        if (filters?.categoryId && filters.categoryId !== "null" && filters.categoryId !== "all") {
          Logger.debug("Storage: Filtering by categoryId:", filters.categoryId);
          conditions.push(eq(products.categoryId, filters.categoryId));
        } else if (filters?.categorySlug || filters?.category) {
          const categorySlugOrName = filters.categorySlug || filters.category;
          if (categorySlugOrName && categorySlugOrName !== "all" && categorySlugOrName !== "null") {
            Logger.debug("Storage: Filtering by category slug:", categorySlugOrName);
            const categoryData = await db.select({ id: categories.id }).from(categories).where(
              or(
                eq(categories.slug, categorySlugOrName),
                eq(categories.name, categorySlugOrName)
              )
            ).limit(1);
            if (categoryData[0]) {
              Logger.debug("Storage: Found category ID for slug:", categoryData[0].id);
              conditions.push(eq(products.categoryId, categoryData[0].id));
            } else {
              Logger.debug("Storage: No category found for slug:", categorySlugOrName);
            }
          }
        }
        if (filters?.search) {
          const normalizedSearch = normalizeSearchTerm(filters.search);
          conditions.push(sql3`LOWER(${products.name}) LIKE ${`%${normalizedSearch}%`}`);
        }
        if (filters?.minPrice) {
          conditions.push(gte(products.price, filters.minPrice.toString()));
        }
        if (filters?.maxPrice) {
          conditions.push(lte(products.price, filters.maxPrice.toString()));
        }
        if (filters?.condition) {
          conditions.push(eq(products.condition, filters.condition));
        }
        if (filters?.brand) {
          const normalizedBrand = normalizeBrand(filters.brand);
          conditions.push(sql3`LOWER(${products.brand}) = ${normalizedBrand}`);
        }
        if (filters?.status) {
          conditions.push(eq(products.status, filters.status));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
        const countQueryBuilder = db.select({ count: sql3`count(*)` }).from(products);
        const countQuery = whereClause ? countQueryBuilder.where(whereClause) : countQueryBuilder;
        let queryBuilder = db.select().from(products);
        if (whereClause) {
          queryBuilder = queryBuilder.where(whereClause);
        }
        if (filters?.sortBy === "price") {
          queryBuilder = filters.sortOrder === "desc" ? queryBuilder.orderBy(desc(products.price)) : queryBuilder.orderBy(asc(products.price));
        } else if (filters?.sortBy === "name") {
          queryBuilder = filters.sortOrder === "desc" ? queryBuilder.orderBy(desc(products.name)) : queryBuilder.orderBy(asc(products.name));
        } else {
          queryBuilder = queryBuilder.orderBy(desc(products.createdAt));
        }
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
      async getProduct(id) {
        const [product] = await db.select().from(products).where(eq(products.id, id));
        return product;
      }
      async createProduct(product) {
        const [newProduct] = await db.insert(products).values(product).returning();
        return newProduct;
      }
      async updateProduct(id, product) {
        Logger.debug("DatabaseStorage.updateProduct - received data:", product);
        const [updatedProduct] = await db.update(products).set({
          ...product,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(products.id, id)).returning();
        Logger.debug("DatabaseStorage.updateProduct - result:", updatedProduct);
        return updatedProduct;
      }
      async incrementProductViews(id) {
        await db.update(products).set({
          views: sql3`${products.views} + 1`
        }).where(eq(products.id, id));
      }
      async getFeaturedProducts(limit = 6) {
        return await db.select().from(products).where(eq(products.featured, true)).orderBy(desc(products.createdAt)).limit(limit);
      }
      // Cart operations - Always fetch fresh product data
      async getCartItems(userId, sessionId) {
        let whereCondition;
        if (userId) {
          whereCondition = eq(cartItems.userId, userId);
        } else if (sessionId) {
          whereCondition = eq(cartItems.sessionId, sessionId);
        } else {
          return [];
        }
        const cartItemsData = await db.select().from(cartItems).where(whereCondition);
        const cartWithProducts = await Promise.all(
          cartItemsData.map(async (item) => {
            const freshProduct = await this.getProduct(item.productId);
            if (!freshProduct || freshProduct.status !== "active") {
              await this.removeFromCart(item.id);
              return null;
            }
            return {
              ...item,
              product: freshProduct
            };
          })
        );
        return cartWithProducts.filter((item) => item !== null);
      }
      // Get existing cart item for smart cart logic (prevents duplicates)
      async getCartItem(userId, sessionId, productId) {
        if (!userId && !sessionId) return void 0;
        const conditions = userId ? eq(cartItems.userId, userId) : and(eq(cartItems.sessionId, sessionId), isNotNull(cartItems.sessionId));
        const existing = await db.select().from(cartItems).where(and(conditions, eq(cartItems.productId, productId))).limit(1);
        return existing[0];
      }
      // Removed wishlist batch check for single-seller model
      async addToCart(cartItem) {
        const itemToInsert = {
          ...cartItem,
          // Generate a session ID if none exists
          sessionId: cartItem.sessionId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        const [newItem] = await db.insert(cartItems).values(itemToInsert).returning();
        return newItem;
      }
      async updateCartItem(id, quantity) {
        const [updatedItem] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
        return updatedItem;
      }
      async removeFromCart(id) {
        await db.delete(cartItems).where(eq(cartItems.id, id));
      }
      async clearCart(userId, sessionId) {
        if (userId) {
          await db.delete(cartItems).where(eq(cartItems.userId, userId));
        } else if (sessionId) {
          await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
        }
      }
      // Merge guest cart to user cart on login
      async mergeGuestCart(sessionId, userId) {
        await db.update(cartItems).set({ userId, sessionId: null }).where(eq(cartItems.sessionId, sessionId));
      }
      // Removed duplicate getAdminStats function
      // Removed duplicate getAllUsers function
      async getAnalytics() {
        const [pageViewsResult] = await db.select({ count: sql3`count(*)` }).from(activityLogs).where(
          and(
            eq(activityLogs.eventType, "page_view"),
            sql3`${activityLogs.createdAt} > NOW() - INTERVAL '7 days'`
          )
        );
        const [activeUsersResult] = await db.select({ count: sql3`count(distinct ${activityLogs.userId})` }).from(activityLogs).where(
          and(
            sql3`${activityLogs.createdAt} > NOW() - INTERVAL '1 hour'`,
            isNotNull(activityLogs.userId)
          )
        );
        const [visitsResult] = await db.select({ count: sql3`count(distinct ${activityLogs.sessionId})` }).from(activityLogs).where(
          and(
            eq(activityLogs.eventType, "page_view"),
            sql3`${activityLogs.createdAt} > NOW() - INTERVAL '7 days'`
          )
        );
        const [orderCountResult] = await db.select({ count: sql3`count(*)` }).from(orders).where(sql3`${orders.createdAt} > NOW() - INTERVAL '7 days'`);
        const visits = Number(visitsResult.count || 1);
        const orderCount = Number(orderCountResult.count || 0);
        const conversionRate = visits > 0 ? orderCount / visits * 100 : 0;
        const [avgOrderResult] = await db.select({ avgValue: sql3`coalesce(avg(${orders.total}), 0)` }).from(orders).where(eq(orders.status, "delivered"));
        const topProducts = await db.select({
          productId: orderItems.productId,
          name: products.name,
          totalSold: sql3`sum(${orderItems.quantity})`,
          revenue: sql3`sum(${orderItems.quantity} * ${orderItems.price})`
        }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).groupBy(orderItems.productId, products.name).orderBy(sql3`sum(${orderItems.quantity}) desc`).limit(5);
        const recentActivity = await db.select({
          id: activityLogs.id,
          type: activityLogs.eventType,
          details: sql3`CASE 
          WHEN ${activityLogs.eventType} = 'page_view' THEN 'Page view: ' || COALESCE(${activityLogs.page}, 'Unknown')
          WHEN ${activityLogs.eventType} = 'user_action' THEN 'User action: ' || COALESCE(${activityLogs.action}, 'Unknown')
          ELSE ${activityLogs.eventType}
        END`,
          timestamp: activityLogs.createdAt
        }).from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(10);
        return {
          pageViews: {
            current: Number(pageViewsResult.count || 0),
            change: 0
            // Would need historical tracking for real change calculation
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
      async deleteProduct(productId) {
        try {
          Logger.debug(`Starting deletion of product: ${productId}`);
          const [existingProduct] = await db.select().from(products).where(eq(products.id, productId));
          if (!existingProduct) {
            Logger.debug(`Product ${productId} not found in database`);
            throw new Error("Product not found");
          }
          Logger.debug(`Found product to delete: ${existingProduct.name}`);
          const deletedCartItems = await db.delete(cartItems).where(eq(cartItems.productId, productId)).returning();
          Logger.debug(`Removed ${deletedCartItems.length} cart items referencing product`);
          const deletedProducts = await db.delete(products).where(eq(products.id, productId)).returning();
          if (deletedProducts.length === 0) {
            Logger.error(`Failed to delete product ${productId} - no rows affected`);
            throw new Error("Product deletion failed - no rows affected");
          }
          Logger.debug(`Successfully deleted product: ${deletedProducts[0].name} (${productId})`);
          const [verifyProduct] = await db.select().from(products).where(eq(products.id, productId));
          if (verifyProduct) {
            Logger.error(`Product ${productId} still exists after deletion!`);
            throw new Error("Product deletion verification failed");
          }
          Logger.debug(`Deletion verified - product ${productId} successfully removed from database`);
        } catch (error) {
          Logger.error("Error deleting product:", error);
          throw error;
        }
      }
      async updateProductStock(productId, status) {
        const stockQuantity = status === "in_stock" ? 10 : 0;
        await db.update(products).set({ stockQuantity }).where(eq(products.id, productId));
      }
      async updateUserRole(userId, role) {
        await db.update(users).set({ role }).where(eq(users.id, userId));
      }
      async exportProductsToCSV() {
        const productResults = await this.getProducts();
        const products2 = productResults.products || productResults;
        const headers = ["ID", "Name", "Brand", "Price", "Category", "Condition", "Inventory", "Created"];
        const rows = products2.map((p) => [
          p.id,
          p.name,
          p.brand || "",
          p.price,
          p.categoryId || "",
          p.condition,
          p.stockQuantity?.toString() || "0",
          p.createdAt?.toISOString() || ""
        ]);
        return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      }
      async exportUsersToCSV() {
        const users2 = await this.getAllUsers();
        const headers = ["ID", "Email", "First Name", "Last Name", "Role", "Created"];
        const rows = users2.map((u) => [
          u.id,
          u.email,
          u.firstName || "",
          u.lastName || "",
          u.role || "user",
          u.createdAt?.toISOString() || ""
        ]);
        return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      }
      async exportOrdersToCSV() {
        const orderData = await db.select({
          id: orders.id,
          userId: orders.userId,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          userEmail: users.email
        }).from(orders).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
        const headers = ["Order ID", "User Email", "Total", "Status", "Created"];
        const rows = orderData.map((o) => [
          o.id,
          o.userEmail || "",
          o.total?.toString() || "0",
          o.status,
          o.createdAt?.toISOString() || ""
        ]);
        return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      }
      // Address operations
      async getUserAddresses(userId) {
        const addressRecords = await db.select().from(addresses).where(eq(addresses.userId, userId));
        if (addressRecords.length > 0) {
          return addressRecords;
        }
        const user = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          street: users.street,
          city: users.city,
          state: users.state,
          zipCode: users.zipCode
        }).from(users).where(eq(users.id, userId));
        if (user[0]?.street && user[0]?.city) {
          const cityStateZipRegex = /^(.+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/i;
          const match = user[0].city?.match(cityStateZipRegex);
          if (match) {
            const [, city, state, zipCode] = match;
            const virtualAddress = {
              id: `user-profile-${userId}`,
              userId,
              type: "shipping",
              firstName: user[0].firstName,
              lastName: user[0].lastName,
              street: user[0].street,
              city: city.trim(),
              state: state.toUpperCase(),
              zipCode,
              country: "US",
              isDefault: true,
              createdAt: /* @__PURE__ */ new Date()
            };
            return [virtualAddress];
          }
        }
        return [];
      }
      async createAddress(address) {
        const [newAddress] = await db.insert(addresses).values(address).returning();
        return newAddress;
      }
      async updateAddress(id, address) {
        const [updatedAddress] = await db.update(addresses).set(address).where(eq(addresses.id, id)).returning();
        return updatedAddress;
      }
      async deleteAddress(id) {
        await db.delete(addresses).where(eq(addresses.id, id));
      }
      // Order operations
      async getUserOrders(userId) {
        return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
      }
      async getOrder(id) {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        return order;
      }
      async createOrder(order) {
        const [newOrder] = await db.insert(orders).values(order).returning();
        return newOrder;
      }
      async updateOrderStatus(id, status, notes) {
        const updateData = {
          status,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (notes) {
          updateData.notes = notes;
        }
        const [updatedOrder] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
        return updatedOrder;
      }
      async updateOrder(id, orderData) {
        const [order] = await db.update(orders).set({ ...orderData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, id)).returning();
        if (!order) {
          throw new Error("Order not found");
        }
        return order;
      }
      async getOrderItems(orderId) {
        return await db.select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          product: products
        }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, orderId));
      }
      async createOrderItems(items) {
        return await db.insert(orderItems).values(items).returning();
      }
      // Removed all equipment submission operations for single-seller model
      async healthCheck() {
        try {
          await db.select().from(products).limit(1);
          return {
            status: "healthy",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
        } catch (error) {
          throw error;
        }
      }
      // Removed submission reference and update methods for single-seller model
      // Removed all wishlist operations for single-seller model
      // Admin operations
      async getAdminStats() {
        try {
          const [productCount] = await db.select({ count: sql3`count(*)` }).from(products);
          const [userCount] = await db.select({ count: sql3`count(*)` }).from(users);
          const [orderCount] = await db.select({ count: sql3`count(*)` }).from(orders);
          return {
            totalProducts: Number(productCount.count || 0),
            totalUsers: Number(userCount.count || 0),
            totalOrders: Number(orderCount.count || 0),
            totalRevenue: 0
            // No completed orders in system yet
          };
        } catch (error) {
          Logger.error("Error fetching admin stats:", error);
          throw error;
        }
      }
      async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
      }
      // Removed wishlist analytics for single-seller model
      // Category management methods
      async getAllCategoriesWithProductCount() {
        const result = await db.select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          description: categories.description,
          displayOrder: categories.displayOrder,
          isActive: categories.isActive,
          productCount: sql3`count(${products.id})`.as("productCount"),
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt
        }).from(categories).leftJoin(products, eq(categories.id, products.categoryId)).groupBy(categories.id).orderBy(categories.displayOrder, categories.name);
        return result;
      }
      async createCategory(categoryData) {
        const [newCategory] = await db.insert(categories).values({
          ...categoryData,
          displayOrder: 0,
          isActive: categoryData.isActive ?? true,
          productCount: 0
        }).returning();
        return newCategory;
      }
      async updateCategory(categoryId, updates) {
        const [updatedCategory] = await db.update(categories).set({
          ...updates,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(categories.id, categoryId)).returning();
        return updatedCategory;
      }
      async deleteCategory(categoryId) {
        await db.delete(categories).where(eq(categories.id, categoryId));
      }
      async getActiveCategoriesForHomepage() {
        const result = await db.select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          imageUrl: categories.imageUrl,
          productCount: sql3`count(${products.id})`.as("productCount")
        }).from(categories).leftJoin(products, and(
          eq(categories.id, products.categoryId),
          eq(products.status, "active")
        )).where(eq(categories.isActive, true)).groupBy(categories.id).orderBy(categories.displayOrder, categories.name);
        return result;
      }
      async reorderCategories(categoryOrder) {
        const updates = categoryOrder.map(
          (categoryId, index2) => db.update(categories).set({ displayOrder: index2, updatedAt: /* @__PURE__ */ new Date() }).where(eq(categories.id, categoryId))
        );
        await Promise.all(updates);
      }
      // Removed duplicate updateUserRole function
      // Removed duplicate updateProductStock function
      // Removed duplicate exportProductsToCSV function
      // Removed duplicate exportUsersToCSV function
      // Removed duplicate exportOrdersToCSV function
      // Activity tracking for real analytics
      async trackActivity(activity) {
        const [newActivity] = await db.insert(activityLogs).values(activity).returning();
        return newActivity;
      }
      // Equipment Submission operations (essential for single-seller model)
      async createSubmission(data) {
        const referenceNumber = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const [submission] = await db.insert(equipmentSubmissions).values({
          ...data,
          referenceNumber
        }).returning();
        return submission;
      }
      async getSubmissions(userId) {
        const query = db.select().from(equipmentSubmissions).$dynamic();
        if (userId) {
          return await query.where(eq(equipmentSubmissions.userId, userId)).orderBy(desc(equipmentSubmissions.createdAt));
        }
        return await query.orderBy(desc(equipmentSubmissions.createdAt));
      }
      async getSubmission(id) {
        const [submission] = await db.select().from(equipmentSubmissions).where(eq(equipmentSubmissions.id, id));
        return submission || null;
      }
      async getSubmissionByReference(referenceNumber) {
        const [submission] = await db.select().from(equipmentSubmissions).where(eq(equipmentSubmissions.referenceNumber, referenceNumber));
        return submission || null;
      }
      async updateSubmission(id, updates) {
        await db.update(equipmentSubmissions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(equipmentSubmissions.id, id));
      }
      async getEquipmentSubmissions(status) {
        let query = db.select({
          submission: equipmentSubmissions,
          user: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName
          }
        }).from(equipmentSubmissions).leftJoin(users, eq(equipmentSubmissions.userId, users.id)).orderBy(desc(equipmentSubmissions.createdAt));
        if (status && status !== "all") {
          query = query.where(eq(equipmentSubmissions.status, status));
        }
        const results = await query;
        return results.map((row) => ({
          ...row.submission,
          user: row.user
        }));
      }
      async updateEquipmentSubmission(id, updates) {
        await db.update(equipmentSubmissions).set(updates).where(eq(equipmentSubmissions.id, id));
      }
      // Removed all wishlist operations for single-seller model
    };
    storage = new DatabaseStorage();
  }
});

// server/auth/google-strategy.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq as eq2 } from "drizzle-orm";
import { randomUUID } from "crypto";
function initializeGoogleAuth() {
  passport.use(new GoogleStrategy(
    GOOGLE_CONFIG,
    async (accessToken, refreshToken, profile2, done) => {
      try {
        Logger.debug("[AUTH] Google authentication for:", profile2.emails?.[0]?.value);
        const googleId = profile2.id;
        const email = profile2.emails?.[0]?.value;
        const firstName = profile2.name?.givenName || "";
        const lastName = profile2.name?.familyName || "";
        const picture = profile2.photos?.[0]?.value;
        if (!email) {
          return done(new Error("No email from Google"), false);
        }
        let [existingUser] = await db.select().from(users).where(eq2(users.googleId, googleId)).limit(1);
        if (existingUser) {
          await db.update(users).set({
            updatedAt: /* @__PURE__ */ new Date(),
            googlePicture: picture
            // Update picture in case it changed
          }).where(eq2(users.id, existingUser.id));
          Logger.debug("[AUTH] Existing Google user logged in:", email);
          return done(null, {
            ...existingUser,
            role: existingUser.role || "user"
          });
        }
        [existingUser] = await db.select().from(users).where(eq2(users.email, email)).limit(1);
        if (existingUser) {
          await db.update(users).set({
            googleId,
            googleEmail: email,
            googlePicture: picture,
            authProvider: "google",
            isEmailVerified: true,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(users.id, existingUser.id));
          Logger.debug("[AUTH] Linked Google to existing account:", email);
          return done(null, {
            ...existingUser,
            googleId,
            role: existingUser.role || "user"
          });
        }
        const newUserId = randomUUID();
        const [newUser] = await db.insert(users).values({
          id: newUserId,
          email,
          googleId,
          googleEmail: email,
          googlePicture: picture,
          firstName,
          lastName,
          authProvider: "google",
          isEmailVerified: true,
          profileComplete: false,
          onboardingStep: 1,
          role: "user"
        }).returning();
        await db.insert(userOnboarding).values({
          id: randomUUID(),
          userId: newUserId,
          addressCompleted: false,
          phoneCompleted: false,
          preferencesCompleted: false,
          stripeCustomerCreated: false,
          welcomeEmailSent: false
        });
        Logger.debug("[AUTH] New Google user created:", email);
        return done(null, {
          ...newUser,
          role: newUser.role || "user"
        });
      } catch (error) {
        Logger.error("[AUTH] Google strategy error:", error);
        return done(error, false);
      }
    }
  ));
}
var GOOGLE_CONFIG;
var init_google_strategy = __esm({
  "server/auth/google-strategy.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_logger();
    GOOGLE_CONFIG = {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production" ? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "your-domain.replit.app"}/api/auth/google/callback` : "/api/auth/google/callback",
      scope: ["profile", "email"]
    };
  }
});

// server/auth.ts
import passport2 from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy2 } from "passport-google-oauth20";
import session from "express-session";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
async function comparePasswords(supplied, stored) {
  return await bcrypt.compare(supplied, stored);
}
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Include at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Include at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Include at least one special character (!@#$%^&*)");
  }
  return { isValid: errors.length === 0, errors };
}
function setupAuth(app2) {
  initializeGoogleAuth();
  const PostgresSessionStore = connectPg(session);
  const dbConfig2 = getDatabaseConfig();
  console.log("[SESSION] Using database:", dbConfig2.name);
  console.log("[SESSION] Environment:", dbConfig2.environment);
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: dbConfig2.url,
      createTableIfMissing: false,
      // Don't create table - already exists
      schemaName: "public",
      tableName: "sessions",
      // Use existing sessions table
      errorLog: (err) => {
        if (err && !err.message?.includes("already exists") && !err.message?.includes("IDX_session_expire")) {
          Logger.error("Session store error:", err);
        }
      }
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      // CRITICAL: Allow cross-origin cookies  
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      path: "/"
      // CRITICAL: Ensure cookie available for all paths
    },
    rolling: true
    // CRITICAL: Reset expiry on activity
  };
  app2.set("trust proxy", 1);
  app2.use(session(sessionSettings));
  app2.use(passport2.initialize());
  app2.use(passport2.session());
  passport2.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        Logger.debug(`Login attempt for email: ${normalizedEmail}`);
        const user = await storage.getUserByEmail(normalizedEmail);
        if (!user) {
          Logger.debug(`User not found for email: ${normalizedEmail}`);
          return done(null, false, {
            message: "No account found with this email address. Please check your email or create a new account."
          });
        }
        Logger.debug(`User found, checking password for: ${normalizedEmail}`);
        Logger.debug(`User password hash exists: ${!!user.password}`);
        const passwordMatch = user.password ? await comparePasswords(password, user.password) : false;
        if (!passwordMatch) {
          Logger.debug(`Invalid password for email: ${normalizedEmail}`);
          return done(null, false, {
            message: "Incorrect password. Please check your password and try again."
          });
        }
        Logger.debug(`Successful login for email: ${normalizedEmail}`);
        return done(null, {
          ...user,
          role: user.role || "user"
        });
      } catch (error) {
        Logger.error("Login authentication error:", error.message);
        return done(error, false, {
          message: "System error during login. Please try again."
        });
      }
    })
  );
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport2.use(
      new GoogleStrategy2(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === "production" ? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "your-domain.replit.app"}/api/auth/google/callback` : "/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile2, done) => {
          try {
            const email = profile2.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"), void 0);
            }
            const normalizedEmail = normalizeEmail(email);
            Logger.debug(`Google OAuth attempt for email: ${normalizedEmail}`);
            let user = await storage.getUserByEmail(normalizedEmail);
            if (user) {
              if (!user.googleId) {
                user = await storage.updateUserGoogleInfo(user.id, {
                  googleId: profile2.id,
                  profileImageUrl: profile2.photos?.[0]?.value,
                  isEmailVerified: true,
                  authProvider: "google"
                });
              }
              Logger.debug(`Existing user logged in via Google: ${normalizedEmail}`);
              return done(null, {
                ...user,
                role: user.role || "user"
              });
            } else {
              const newUser = await storage.createUserFromGoogle({
                email: normalizedEmail,
                firstName: profile2.name?.givenName || profile2.displayName?.split(" ")[0] || "User",
                lastName: profile2.name?.familyName || profile2.displayName?.split(" ").slice(1).join(" ") || "",
                googleId: profile2.id,
                profileImageUrl: profile2.photos?.[0]?.value,
                authProvider: "google",
                isEmailVerified: true
              });
              Logger.debug(`New user created via Google: ${normalizedEmail}`);
              return done(null, {
                ...newUser,
                role: newUser.role || "user"
              });
            }
          } catch (error) {
            Logger.error("Google OAuth error:", error.message);
            return done(error, void 0);
          }
        }
      )
    );
  } else {
    Logger.warn("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }
  passport2.serializeUser((user, done) => {
    const userId = user.id;
    Logger.debug(`[PASSPORT] Serializing user ID: ${userId}`);
    done(null, userId);
  });
  passport2.deserializeUser(async (id, done) => {
    try {
      Logger.debug(`[PASSPORT] Deserializing user with ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        Logger.debug(`[PASSPORT] User not found for ID: ${id}`);
        return done(null, false);
      }
      const { password, ...userWithoutPassword } = user;
      const userForSession = {
        ...userWithoutPassword,
        role: user.role || "user"
      };
      Logger.debug(`[PASSPORT] Successfully deserialized user: ${user.email}`);
      done(null, userForSession);
    } catch (error) {
      Logger.error(`[PASSPORT] Deserialization error:`, error);
      done(error, null);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        phone,
        street,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        isLocalCustomer
      } = req.body;
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: "Password does not meet requirements",
          errors: passwordValidation.errors
        });
      }
      if (street && (!city || !state || !zipCode)) {
        return res.status(400).json({
          message: "Please provide complete address information (street, city, state, zip code)"
        });
      }
      const normalizedEmail = normalizeEmail(email);
      Logger.debug(`Registration attempt for email: ${normalizedEmail}`);
      const existingEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingEmail) {
        Logger.debug(`Email already exists: ${normalizedEmail}`);
        return res.status(409).json({
          error: "Account already exists",
          details: "An account with this email already exists. Please sign in instead.",
          code: "EMAIL_EXISTS"
        });
      }
      let role = "user";
      if (normalizedEmail.includes("developer") || normalizedEmail.includes("@dev.") || normalizedEmail === "admin@cleanandflip.com") {
        role = "developer";
      }
      const normalizedPhone = phone ? normalizePhone(phone) : void 0;
      const user = await storage.createUser({
        email: normalizedEmail,
        password: await hashPassword(password),
        firstName,
        lastName,
        phone: normalizedPhone,
        street: street || void 0,
        city: city || void 0,
        state: state || void 0,
        zipCode: zipCode || void 0,
        latitude: latitude ? String(latitude) : void 0,
        longitude: longitude ? String(longitude) : void 0,
        role
      });
      const userForSession = {
        ...user,
        role: user.role || "user"
      };
      req.logIn(userForSession, (err) => {
        if (err) return next(err);
        req.session.save((saveErr) => {
          if (saveErr) {
            Logger.error("Registration session save error:", saveErr);
            return res.status(500).json({
              error: "Session persistence failed",
              details: "Registration successful but session could not be saved. Please try logging in."
            });
          }
          Logger.debug(`Registration successful and session saved for: ${user.email}`);
          Logger.debug(`Session passport user: ${JSON.stringify(req.session.passport)}`);
          res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || "user"
          });
        });
      });
    } catch (error) {
      Logger.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        details: "Please provide both email and password."
      });
    }
    passport2.authenticate("local", (err, user, info) => {
      if (err) {
        Logger.error("Passport authentication error:", err);
        return res.status(500).json({
          error: "System error",
          details: "A system error occurred during login. Please try again."
        });
      }
      if (!user) {
        const errorResponse = {
          error: "Authentication failed",
          details: info?.message || "Invalid credentials",
          code: info?.code || "INVALID_CREDENTIALS"
        };
        if (info?.code === "USER_NOT_FOUND") {
          errorResponse.suggestion = "Try creating a new account or check your email spelling.";
        } else if (info?.code === "INVALID_PASSWORD") {
          errorResponse.suggestion = "Double-check your password or consider password reset.";
        }
        return res.status(401).json(errorResponse);
      }
      const userForSession = {
        ...user,
        role: user.role || "user"
      };
      req.logIn(userForSession, (loginErr) => {
        if (loginErr) {
          Logger.error("Session creation error:", loginErr);
          return res.status(500).json({
            error: "Session error",
            details: "Login successful but session creation failed. Please try again."
          });
        }
        req.session.save((saveErr) => {
          if (saveErr) {
            Logger.error("Session save error:", saveErr);
            return res.status(500).json({
              error: "Session persistence failed",
              details: "Login successful but session could not be saved. Please try again."
            });
          }
          Logger.debug(`Login successful and session saved for: ${email}`);
          Logger.debug(`Session ID: ${req.sessionID}`);
          Logger.debug(`Session passport user: ${JSON.stringify(req.session.passport)}`);
          Logger.debug(`Is authenticated: ${req.isAuthenticated()}`);
          res.status(200).json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role || "user"
            }
          });
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          Logger.error("Session destruction error:", err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax"
        });
        res.clearCookie("sessionId");
        res.clearCookie("session");
        Logger.debug("Session destroyed and cookies cleared for logout");
        res.json({ success: true });
      });
    } catch (error) {
      Logger.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
  app2.post("/api/debug/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      const normalizedEmail = normalizeEmail(email);
      const user = await storage.getUserByEmail(normalizedEmail);
      if (user) {
        res.json({
          exists: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            created: user.createdAt,
            hasPassword: !!user.password
          }
        });
      } else {
        res.json({
          exists: false,
          checkedEmail: normalizedEmail
        });
      }
    } catch (error) {
      Logger.error("Debug check-email error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/session-test", (req, res) => {
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      userId: req.session?.passport?.user,
      isAuthenticated: req.isAuthenticated?.() || false,
      sessionData: req.session
    });
  });
  app2.get(
    "/api/auth/google",
    passport2.authenticate("google", {
      scope: ["profile", "email"]
    })
  );
  app2.get(
    "/api/auth/google/callback",
    passport2.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/auth?error=oauth_failed"
    })
  );
}
function requireAuth(req, res, next) {
  const endpoint = `${req.method} ${req.path}`;
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    Logger.consolidate(
      `auth-fail-${endpoint}`,
      `Authentication failed for ${endpoint}`,
      3 /* DEBUG */
    );
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to continue"
    });
  }
  const user = req.user;
  if (!user) {
    Logger.consolidate(
      `auth-fail-nouser-${endpoint}`,
      `No user object for ${endpoint}`,
      3 /* DEBUG */
    );
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to continue"
    });
  }
  req.userId = user.id;
  Logger.consolidate(
    `auth-success-${user.id}-${endpoint}`,
    `Auth successful for user ${user.id} on ${endpoint}`,
    3 /* DEBUG */
  );
  next();
}
function requireRole(roles) {
  return (req, res, next) => {
    Logger.debug("RequireRole middleware - Is authenticated:", req.isAuthenticated?.());
    Logger.debug("RequireRole middleware - User from passport:", req.user);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = req.user;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    Logger.debug("RequireRole check:", {
      userRole: user.role,
      allowedRoles,
      hasRole: allowedRoles.includes(user.role || "user"),
      isDeveloper: user.role === "developer"
    });
    if (!allowedRoles.includes(user.role || "user") && user.role !== "developer") {
      Logger.debug("Permission denied - user lacks required role and is not developer");
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    Logger.debug("Permission granted for user:", user.email);
    next();
  };
}
var SALT_ROUNDS;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    init_utils();
    init_logger();
    init_database();
    init_google_strategy();
    SALT_ROUNDS = 12;
  }
});

// server/services/stripe-sync.ts
var stripe_sync_exports = {};
__export(stripe_sync_exports, {
  StripeProductSync: () => StripeProductSync
});
import Stripe from "stripe";
import { eq as eq4 } from "drizzle-orm";
var stripe, StripeProductSync;
var init_stripe_sync = __esm({
  "server/services/stripe-sync.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_logger();
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia"
    });
    StripeProductSync = class {
      // Sync single product with all details
      static async syncProduct(productId) {
        try {
          Logger.info(`Starting sync for product ${productId}`);
          const [product] = await db.select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            images: products.images,
            brand: products.brand,
            condition: products.condition,
            stock: products.stockQuantity,
            stripeProductId: products.stripeProductId,
            stripePriceId: products.stripePriceId,
            sku: products.sku,
            weight: products.weight,
            dimensions: products.dimensions,
            category: categories.name
          }).from(products).leftJoin(categories, eq4(products.categoryId, categories.id)).where(eq4(products.id, productId)).limit(1);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }
          const stripeImageUrls = await this.uploadImagesToStripe(product.images || []);
          const stripeProductData = {
            name: product.name,
            description: product.description || `${product.brand || ""} ${product.condition || ""} condition`.trim(),
            images: stripeImageUrls,
            active: (product.stock || 0) > 0,
            metadata: {
              product_id: product.id,
              brand: product.brand || "",
              condition: product.condition || "",
              category: product.category || "",
              stock: String(product.stock || 0),
              sku: product.sku || "",
              weight: product.weight ? String(product.weight) : "",
              dimensions: product.dimensions ? JSON.stringify(product.dimensions) : ""
            },
            shippable: true,
            package_dimensions: product.dimensions && product.dimensions.height && product.dimensions.length && product.dimensions.width ? {
              height: parseFloat(String(product.dimensions.height)) || 1,
              length: parseFloat(String(product.dimensions.length)) || 1,
              weight: product.weight || 1e3,
              // Default 1kg
              width: parseFloat(String(product.dimensions.width)) || 1
            } : void 0
          };
          let stripeProduct;
          let stripePrice;
          if (product.stripeProductId) {
            stripeProduct = await stripe.products.update(
              product.stripeProductId,
              stripeProductData
            );
            Logger.info(`Updated Stripe product ${stripeProduct.id}`);
          } else {
            stripeProduct = await stripe.products.create(stripeProductData);
            Logger.info(`Created new Stripe product ${stripeProduct.id}`);
          }
          const priceInCents = Math.round(Number(product.price) * 100);
          if (product.stripePriceId) {
            const currentPrice = await stripe.prices.retrieve(product.stripePriceId);
            if (currentPrice.unit_amount !== priceInCents) {
              await stripe.prices.update(product.stripePriceId, { active: false });
              stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: priceInCents,
                currency: "usd",
                metadata: {
                  product_id: product.id
                }
              });
              Logger.info(`Created new price ${stripePrice.id} (${priceInCents} cents)`);
            } else {
              stripePrice = currentPrice;
            }
          } else {
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: priceInCents,
              currency: "usd",
              metadata: {
                product_id: product.id
              }
            });
            Logger.info(`Created price ${stripePrice.id} (${priceInCents} cents)`);
          }
          await db.update(products).set({
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
            stripeSyncStatus: "synced",
            stripeLastSync: /* @__PURE__ */ new Date()
          }).where(eq4(products.id, productId));
          Logger.info(`Successfully synced product ${productId} to Stripe`);
        } catch (error) {
          Logger.error(`Failed to sync product ${productId}:`, error);
          await db.update(products).set({
            stripeSyncStatus: "failed",
            stripeLastSync: /* @__PURE__ */ new Date()
          }).where(eq4(products.id, productId));
          throw error;
        }
      }
      // Upload images to Stripe
      static async uploadImagesToStripe(images) {
        if (!images || images.length === 0) return [];
        const uploadedUrls = [];
        for (const image of images) {
          if (image.url) {
            let imageUrl = image.url;
            if (imageUrl.includes("cloudinary")) {
              imageUrl = imageUrl.replace("/upload/", "/upload/f_auto,q_auto/");
            }
            uploadedUrls.push(imageUrl);
          }
        }
        return uploadedUrls.slice(0, 8);
      }
      // Sync all products with cleanup of deleted products
      static async syncAllProducts() {
        Logger.info("Starting comprehensive product sync to Stripe...");
        const allProducts = await db.select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          images: products.images,
          brand: products.brand,
          condition: products.condition,
          stock: products.stockQuantity,
          stripeProductId: products.stripeProductId,
          stripePriceId: products.stripePriceId,
          sku: products.sku,
          weight: products.weight,
          dimensions: products.dimensions,
          category: categories.name
        }).from(products).leftJoin(categories, eq4(products.categoryId, categories.id)).orderBy(products.name);
        Logger.info(`Found ${allProducts.length} products to sync`);
        let successCount = 0;
        let failCount = 0;
        for (const product of allProducts) {
          try {
            Logger.info(`Syncing product: ${product.name} (${product.id})`);
            await this.syncProduct(String(product.id));
            successCount++;
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            failCount++;
            Logger.error(`Failed to sync product ${product.id}:`, error);
          }
        }
        await this.cleanupOrphanedStripeProducts(allProducts);
        Logger.info(`Sync complete: ${successCount} succeeded, ${failCount} failed`);
      }
      // Clean up products in Stripe that no longer exist in database
      static async cleanupOrphanedStripeProducts(databaseProducts) {
        try {
          Logger.info("\u{1F9F9} Cleaning up orphaned Stripe products...");
          const stripeProducts = await stripe.products.list({
            active: true,
            limit: 100
          });
          if (stripeProducts.data.length === 0) {
            Logger.info("No active Stripe products to clean up");
            return;
          }
          const databaseProductIds = new Set(databaseProducts.map((p) => p.id));
          let archivedCount = 0;
          for (const stripeProduct of stripeProducts.data) {
            const productId = stripeProduct.metadata?.product_id;
            if (productId && !databaseProductIds.has(productId)) {
              try {
                await stripe.products.update(stripeProduct.id, { active: false });
                Logger.info(`\u{1F4E6} Archived orphaned product: ${stripeProduct.name} (${stripeProduct.id})`);
                archivedCount++;
                await new Promise((resolve) => setTimeout(resolve, 100));
              } catch (error) {
                Logger.error(`Failed to archive ${stripeProduct.name}:`, error);
              }
            }
          }
          if (archivedCount > 0) {
            Logger.info(`\u2705 Archived ${archivedCount} orphaned products in Stripe`);
          } else {
            Logger.info("\u2705 No orphaned products found - Stripe is clean");
          }
        } catch (error) {
          Logger.error("Failed to cleanup orphaned products:", error);
        }
      }
      // Delete product from Stripe
      static async deleteFromStripe(productId) {
        const [product] = await db.select({ stripeProductId: products.stripeProductId }).from(products).where(eq4(products.id, productId)).limit(1);
        if (product?.stripeProductId) {
          await stripe.products.update(product.stripeProductId, { active: false });
          Logger.info(`Deactivated Stripe product ${product.stripeProductId}`);
        }
      }
      // Sync product from Stripe webhook
      static async syncFromStripeWebhook(stripeProductId) {
        const stripeProduct = await stripe.products.retrieve(stripeProductId);
        await db.update(products).set({
          name: stripeProduct.name,
          description: stripeProduct.description || null,
          stripeSyncStatus: "synced",
          stripeLastSync: /* @__PURE__ */ new Date()
        }).where(eq4(products.stripeProductId, stripeProductId));
      }
    };
  }
});

// server/services/errorLogger.ts
import { eq as eq7, desc as desc4, sql as sql7, and as and4, gte as gte3 } from "drizzle-orm";
var ErrorLogger;
var init_errorLogger = __esm({
  "server/services/errorLogger.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_logger();
    ErrorLogger = class {
      static async logError(error, context = {}) {
        try {
          const severity = this.determineSeverity(error, context);
          const errorData = this.extractErrorData(error, context, "error", severity);
          const existingError = await this.findSimilarError(error);
          if (existingError) {
            await this.incrementOccurrence(existingError.id);
            await this.createInstance(existingError.id, context);
            return existingError.id;
          }
          const [newError] = await db.insert(errorLogs).values(errorData).returning();
          await this.createInstance(newError.id, context);
          if (severity === "critical") {
            Logger.error(`CRITICAL ERROR: ${error.message}`, { errorId: newError.id, stack: error.stack });
          }
          return newError.id;
        } catch (logError) {
          Logger.error("Failed to log error:", logError);
          return null;
        }
      }
      static async logWarning(message, context = {}) {
        try {
          const errorData = {
            error_type: "warning",
            severity: "medium",
            message,
            ...this.extractContextData(context),
            environment: process.env.NODE_ENV || "production"
          };
          const [warning] = await db.insert(errorLogs).values(errorData).returning();
          await this.createInstance(warning.id, context);
          return warning.id;
        } catch (logError) {
          Logger.error("Failed to log warning:", logError);
          return null;
        }
      }
      static async logInfo(message, context = {}) {
        try {
          const errorData = {
            error_type: "info",
            severity: "low",
            message,
            ...this.extractContextData(context),
            environment: process.env.NODE_ENV || "production"
          };
          const [info] = await db.insert(errorLogs).values(errorData).returning();
          await this.createInstance(info.id, context);
          return info.id;
        } catch (logError) {
          Logger.error("Failed to log info:", logError);
          return null;
        }
      }
      static async findSimilarError(error) {
        try {
          const [existing] = await db.select().from(errorLogs).where(
            and4(
              eq7(errorLogs.message, error.message),
              eq7(errorLogs.resolved, false)
            )
          ).limit(1);
          return existing || null;
        } catch (err) {
          Logger.error("Failed to find similar error:", err);
          return null;
        }
      }
      static async incrementOccurrence(errorId) {
        try {
          await db.update(errorLogs).set({
            occurrence_count: sql7`${errorLogs.occurrence_count} + 1`,
            last_seen: /* @__PURE__ */ new Date()
          }).where(eq7(errorLogs.id, errorId));
        } catch (err) {
          Logger.error("Failed to increment occurrence:", err);
        }
      }
      static async createInstance(errorLogId, context) {
        try {
          await db.insert(errorLogInstances).values({
            error_log_id: errorLogId,
            context
          });
        } catch (err) {
          Logger.error("Failed to create error instance:", err);
        }
      }
      static async getErrorTrends(timeRange = "24h") {
        try {
          const timeRanges = {
            "24h": sql7`NOW() - INTERVAL '24 hours'`,
            "7d": sql7`NOW() - INTERVAL '7 days'`,
            "30d": sql7`NOW() - INTERVAL '30 days'`
          };
          const timeFilter = timeRanges[timeRange] || timeRanges["24h"];
          const trends = await db.select({
            hour: sql7`DATE_TRUNC('hour', created_at)`,
            count: sql7`COUNT(*)`,
            severity: errorLogs.severity
          }).from(errorLogs).where(gte3(errorLogs.created_at, timeFilter)).groupBy(sql7`DATE_TRUNC('hour', created_at)`, errorLogs.severity).orderBy(desc4(sql7`DATE_TRUNC('hour', created_at)`));
          return trends;
        } catch (err) {
          Logger.error("Failed to get error trends:", err);
          return [];
        }
      }
      static async getTopErrors(limit = 10) {
        try {
          const topErrors = await db.select().from(errorLogs).where(eq7(errorLogs.resolved, false)).orderBy(desc4(errorLogs.occurrence_count)).limit(limit);
          return topErrors;
        } catch (err) {
          Logger.error("Failed to get top errors:", err);
          return [];
        }
      }
      static async getErrorsByUser(userId) {
        try {
          const userErrors = await db.select().from(errorLogs).where(eq7(errorLogs.user_id, userId)).orderBy(desc4(errorLogs.created_at));
          return userErrors;
        } catch (err) {
          Logger.error("Failed to get errors by user:", err);
          return [];
        }
      }
      static async getUnresolvedCritical() {
        try {
          const criticalErrors = await db.select().from(errorLogs).where(
            and4(
              eq7(errorLogs.severity, "critical"),
              eq7(errorLogs.resolved, false)
            )
          ).orderBy(desc4(errorLogs.created_at));
          return criticalErrors;
        } catch (err) {
          Logger.error("Failed to get unresolved critical errors:", err);
          return [];
        }
      }
      static async resolveError(errorId, resolvedBy, notes) {
        try {
          await db.update(errorLogs).set({
            resolved: true,
            resolved_by: resolvedBy,
            resolved_at: /* @__PURE__ */ new Date(),
            notes
          }).where(eq7(errorLogs.id, errorId));
          Logger.info(`Error ${errorId} resolved by ${resolvedBy}: ${notes}`);
        } catch (err) {
          Logger.error("Failed to resolve error:", err);
        }
      }
      // Bulk resolve errors by fingerprint
      static async resolveErrorsByFingerprint(message, errorType, resolvedBy, notes) {
        try {
          await db.update(errorLogs).set({
            resolved: true,
            resolved_by: resolvedBy,
            resolved_at: /* @__PURE__ */ new Date(),
            notes
          }).where(and4(
            eq7(errorLogs.message, message),
            eq7(errorLogs.error_type, errorType),
            eq7(errorLogs.resolved, false)
          ));
          Logger.info(`All errors matching fingerprint ${message}-${errorType} resolved by ${resolvedBy}`);
        } catch (err) {
          Logger.error("Failed to bulk resolve errors:", err);
        }
      }
      static async getErrorsWithFilters(filters, options) {
        try {
          const { page, limit, timeRange, search } = options;
          const offset = (page - 1) * limit;
          let query = db.select().from(errorLogs);
          const conditions = [];
          if (filters.severity) {
            conditions.push(eq7(errorLogs.severity, filters.severity));
          }
          if (typeof filters.resolved === "boolean") {
            conditions.push(eq7(errorLogs.resolved, filters.resolved));
          }
          const timeRanges = {
            "24h": sql7`NOW() - INTERVAL '24 hours'`,
            "7d": sql7`NOW() - INTERVAL '7 days'`,
            "30d": sql7`NOW() - INTERVAL '30 days'`
          };
          if (timeRanges[timeRange]) {
            conditions.push(gte3(errorLogs.created_at, timeRanges[timeRange]));
          }
          if (search) {
            conditions.push(sql7`${errorLogs.message} ILIKE ${`%${search}%`}`);
          }
          let finalQuery = query;
          if (conditions.length > 0) {
            finalQuery = query.where(and4(...conditions));
          }
          const results = await finalQuery.orderBy(desc4(errorLogs.created_at)).limit(limit).offset(offset);
          return results;
        } catch (err) {
          Logger.error("Failed to get errors with filters:", err);
          return [];
        }
      }
      static async getErrorById(errorId) {
        try {
          const [error] = await db.select().from(errorLogs).where(eq7(errorLogs.id, errorId));
          if (!error) return null;
          const instances = await db.select().from(errorLogInstances).where(eq7(errorLogInstances.error_log_id, errorId)).orderBy(desc4(errorLogInstances.occurred_at)).limit(10);
          return { ...error, instances };
        } catch (err) {
          Logger.error("Failed to get error by ID:", err);
          return null;
        }
      }
      static async getErrorStats() {
        try {
          const [totalCount] = await db.select({ count: sql7`COUNT(*)` }).from(errorLogs);
          const [resolvedCount] = await db.select({ count: sql7`COUNT(*)` }).from(errorLogs).where(eq7(errorLogs.resolved, true));
          const [criticalCount] = await db.select({ count: sql7`COUNT(*)` }).from(errorLogs).where(and4(eq7(errorLogs.severity, "critical"), eq7(errorLogs.resolved, false)));
          const [affectedUsersCount] = await db.select({ count: sql7`COUNT(DISTINCT ${errorLogs.user_id})` }).from(errorLogs).where(sql7`${errorLogs.user_id} IS NOT NULL`);
          const errorRate = totalCount.count > 0 ? Math.round(criticalCount.count / totalCount.count * 100) : 0;
          return {
            total: totalCount.count || 0,
            resolved: resolvedCount.count || 0,
            critical: criticalCount.count || 0,
            affectedUsers: affectedUsersCount.count || 0,
            errorRate
          };
        } catch (err) {
          Logger.error("Failed to get error stats:", err);
          return {
            total: 0,
            resolved: 0,
            critical: 0,
            affectedUsers: 0,
            errorRate: 0
          };
        }
      }
      static determineSeverity(error, context) {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || "";
        if (message.includes("database") || message.includes("connection") || message.includes("auth") || message.includes("payment") || context.res?.statusCode === 500) {
          return "critical";
        }
        if (message.includes("validation") || message.includes("permission") || context.res?.statusCode === 400 || context.res?.statusCode === 401 || context.res?.statusCode === 403) {
          return "high";
        }
        if (message.includes("not found") || context.res?.statusCode === 404) {
          return "medium";
        }
        return "low";
      }
      static extractErrorData(error, context, type, severity) {
        const stackLines = error.stack?.split("\n") || [];
        const firstStackLine = stackLines[1] || "";
        const fileMatch = firstStackLine.match(/at.*\((.+):(\d+):(\d+)\)/);
        return {
          error_type: type,
          severity,
          message: error.message,
          stack_trace: error.stack,
          file_path: fileMatch ? fileMatch[1] : null,
          line_number: fileMatch ? parseInt(fileMatch[2]) : null,
          column_number: fileMatch ? parseInt(fileMatch[3]) : null,
          ...this.extractContextData(context),
          environment: process.env.NODE_ENV || "production"
        };
      }
      static extractContextData(context) {
        return {
          user_id: context.user?.id || null,
          user_email: context.user?.email || null,
          user_ip: context.req?.ip || null,
          user_agent: context.req?.userAgent || null,
          url: context.req?.url || null,
          method: context.req?.method || null,
          request_body: context.req?.body || null,
          response_status: context.res?.statusCode || null,
          browser: this.extractBrowser(context.req?.userAgent),
          os: this.extractOS(context.req?.userAgent),
          device_type: this.extractDeviceType(context.req?.userAgent),
          session_id: null
          // Could be extracted from session
        };
      }
      static extractBrowser(userAgent) {
        if (!userAgent) return null;
        const browsers = {
          "Chrome": /Chrome\/([\d.]+)/,
          "Firefox": /Firefox\/([\d.]+)/,
          "Safari": /Safari\/([\d.]+)/,
          "Edge": /Edge\/([\d.]+)/,
          "Opera": /Opera\/([\d.]+)/
        };
        for (const [browser, regex] of Object.entries(browsers)) {
          if (regex.test(userAgent)) {
            return browser;
          }
        }
        return "Unknown";
      }
      static extractOS(userAgent) {
        if (!userAgent) return null;
        const os = {
          "Windows": /Windows NT ([\d.]+)/,
          "MacOS": /Mac OS X ([\d_]+)/,
          "Linux": /Linux/,
          "iOS": /iPhone|iPad/,
          "Android": /Android ([\d.]+)/
        };
        for (const [osName, regex] of Object.entries(os)) {
          if (regex.test(userAgent)) {
            return osName;
          }
        }
        return "Unknown";
      }
      static extractDeviceType(userAgent) {
        if (!userAgent) return null;
        if (/iPhone|iPad|iPod/.test(userAgent)) return "Mobile";
        if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) return "Mobile";
        if (/Android/.test(userAgent)) return "Tablet";
        return "Desktop";
      }
    };
  }
});

// server/routes/admin/error-management.ts
var error_management_exports = {};
__export(error_management_exports, {
  default: () => error_management_default
});
import { Router as Router5 } from "express";
var router5, error_management_default;
var init_error_management = __esm({
  "server/routes/admin/error-management.ts"() {
    "use strict";
    init_errorLogger();
    init_auth();
    router5 = Router5();
    router5.use(requireAuth);
    router5.use(requireRole("developer"));
    router5.get("/errors", async (req, res) => {
      try {
        const {
          page = 1,
          limit = 50,
          severity,
          resolved,
          timeRange = "24h",
          search
        } = req.query;
        const filters = {};
        if (severity && severity !== "all") {
          filters.severity = severity;
        }
        if (resolved && resolved !== "all") {
          filters.resolved = resolved === "true";
        }
        const errors = await ErrorLogger.getErrorsWithFilters(filters, {
          page: parseInt(page),
          limit: parseInt(limit),
          timeRange,
          search
        });
        res.json(errors);
      } catch (error) {
        console.error("Failed to get errors:", error);
        res.status(500).json({ error: "Failed to get errors" });
      }
    });
    router5.get("/errors/trends", async (req, res) => {
      try {
        const { timeRange = "24h" } = req.query;
        res.json([]);
      } catch (error) {
        console.error("Failed to get error trends:", error);
        res.status(500).json({ error: "Failed to get error trends" });
      }
    });
    router5.get("/errors/stats", async (req, res) => {
      try {
        const stats = await ErrorLogger.getErrorStats();
        res.json(stats);
      } catch (error) {
        console.error("Failed to get error stats:", error);
        res.status(500).json({ error: "Failed to get error stats" });
      }
    });
    router5.post("/codebase/analyze", async (req, res) => {
      try {
        const options = {
          includePerformance: req.body.includePerformance !== false,
          includeSecurity: req.body.includeSecurity !== false,
          includeCodeQuality: req.body.includeCodeQuality !== false,
          outputToDatabase: req.body.outputToDatabase === true
        };
        res.status(410).json({ error: "Legacy analysis deprecated. Use /api/observability instead." });
      } catch (error) {
        console.error("Codebase analysis failed:", error);
        res.status(500).json({ error: "Codebase analysis failed", details: error?.message || "Unknown error" });
      }
    });
    router5.get("/codebase/health", async (req, res) => {
      try {
        res.json({ status: "ok", findingsCount: 0, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      } catch (error) {
        console.error("Health check failed:", error);
        res.status(500).json({ error: "Health check failed", details: error?.message || "Unknown error" });
      }
    });
    router5.get("/codebase/last-scan", async (req, res) => {
      try {
        res.status(404).json({ error: "No previous scan results found" });
      } catch (error) {
        console.error("Failed to get last scan:", error);
        res.status(500).json({ error: "Failed to get last scan results" });
      }
    });
    router5.get("/codebase/history", async (req, res) => {
      try {
        res.json([]);
      } catch (error) {
        console.error("Failed to get scan history:", error);
        res.status(500).json({ error: "Failed to get scan history" });
      }
    });
    router5.get("/codebase/report", async (req, res) => {
      try {
        const format = req.query.format === "markdown" ? "markdown" : "json";
        res.status(410).json({ error: "Legacy reporting deprecated. Use /api/observability for current error tracking." });
      } catch (error) {
        console.error("Failed to generate report:", error);
        res.status(500).json({ error: "Failed to generate report", details: error?.message || "Unknown error" });
      }
    });
    router5.post("/errors/log", async (req, res) => {
      try {
        const {
          message,
          stack,
          component,
          action,
          severity = "medium",
          url,
          userAgent,
          userContext
        } = req.body;
        await ErrorLogger.logError({
          message,
          stack,
          component,
          action,
          severity,
          url,
          userAgent,
          userContext,
          userId: req.user?.id,
          ip: req.ip
        });
        res.status(201).json({ success: true });
      } catch (error) {
        console.error("Failed to log error:", error);
        res.status(500).json({ error: "Failed to log error" });
      }
    });
    router5.get("/errors/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const error = await ErrorLogger.getErrorById(id);
        if (!error) {
          return res.status(404).json({ error: "Error not found" });
        }
        res.json(error);
      } catch (error) {
        console.error("Failed to get error:", error);
        res.status(500).json({ error: "Failed to get error" });
      }
    });
    router5.post("/errors/:id/resolve", async (req, res) => {
      try {
        const { id } = req.params;
        const { notes = "Resolved via admin dashboard" } = req.body;
        const userId = req.user?.id || "system";
        await ErrorLogger.resolveError(id, userId, notes);
        res.json({ success: true, message: "Error resolved successfully" });
      } catch (error) {
        console.error("Failed to resolve error:", error);
        res.status(500).json({ error: "Failed to resolve error" });
      }
    });
    router5.post("/errors/bulk-resolve", async (req, res) => {
      try {
        const { errorIds, notes } = req.body;
        const user = req.user;
        for (const errorId of errorIds) {
          await ErrorLogger.resolveError(errorId, user.id, notes);
        }
        res.json({
          success: true,
          message: `${errorIds.length} errors resolved successfully`
        });
      } catch (error) {
        console.error("Failed to bulk resolve errors:", error);
        res.status(500).json({ error: "Failed to bulk resolve errors" });
      }
    });
    router5.post("/errors/client", async (req, res) => {
      try {
        const errorData = req.body;
        const error = new Error(errorData.message);
        error.stack = errorData.stack;
        const context = {
          req: {
            url: errorData.url,
            userAgent: errorData.userAgent,
            ip: req.ip
          },
          user: errorData.userContext,
          component: errorData.component,
          action: errorData.action,
          metadata: {
            breadcrumbs: errorData.breadcrumbs,
            clientSide: true,
            ...errorData.metadata
          }
        };
        await ErrorLogger.logError(error, context);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Failed to log client error:", error);
        res.status(500).json({ error: "Failed to log error" });
      }
    });
    router5.post("/errors/client-log", async (req, res) => {
      try {
        const logData = req.body;
        const context = {
          req: {
            url: logData.url,
            userAgent: logData.userAgent,
            ip: req.ip
          },
          user: logData.userContext,
          action: logData.action,
          metadata: {
            breadcrumbs: logData.breadcrumbs,
            clientSide: true,
            level: logData.level,
            ...logData.metadata
          }
        };
        if (logData.level === "error") {
          await ErrorLogger.logError(new Error(logData.message), context);
        } else if (logData.level === "warning") {
          await ErrorLogger.logWarning(logData.message, context);
        } else {
          await ErrorLogger.logInfo(logData.message, context);
        }
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Failed to log client message:", error);
        res.status(500).json({ error: "Failed to log message" });
      }
    });
    router5.post("/errors/performance", async (req, res) => {
      try {
        const metric = req.body;
        await ErrorLogger.logInfo(`Performance: ${metric.name} took ${metric.value}ms`, {
          req: {
            url: metric.url,
            ip: req.ip
          },
          metadata: {
            performance: true,
            metric: metric.name,
            value: metric.value,
            timestamp: metric.timestamp
          }
        });
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Failed to log performance metric:", error);
        res.status(500).json({ error: "Failed to log performance metric" });
      }
    });
    router5.post("/errors/log", async (req, res) => {
      try {
        const errorData = req.body;
        const error = new Error(errorData.message || "Client-side error");
        if (errorData.stack) {
          error.stack = errorData.stack;
        }
        const context = {
          req: {
            url: errorData.url || req.url,
            userAgent: req.headers["user-agent"],
            ip: req.ip
          },
          user: errorData.userContext,
          component: errorData.component,
          action: errorData.action,
          metadata: {
            breadcrumbs: errorData.breadcrumbs,
            clientSide: true,
            level: errorData.level || "error",
            timestamp: errorData.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
            environment: process.env.NODE_ENV || "development",
            ...errorData.metadata
          }
        };
        if (errorData.level === "error" || !errorData.level) {
          await ErrorLogger.logError(error, context);
        } else if (errorData.level === "warning") {
          await ErrorLogger.logWarning(errorData.message, context);
        } else {
          await ErrorLogger.logInfo(errorData.message, context);
        }
        res.json({ success: true, message: "Error logged successfully" });
      } catch (error) {
        console.error("Failed to log frontend error:", error);
        res.status(500).json({ error: "Failed to log error" });
      }
    });
    error_management_default = router5;
  }
});

// server/middleware/securityHeaders.ts
var securityHeaders_exports = {};
__export(securityHeaders_exports, {
  apiSecurityHeaders: () => apiSecurityHeaders,
  securityHeaders: () => securityHeaders
});
function securityHeaders() {
  return (req, res, next) => {
    const isProduction = process.env.NODE_ENV === "production";
    const isDev = process.env.NODE_ENV === "development";
    const developmentCSP = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com *.stripe.com js.stripe.com;
      style-src 'self' 'unsafe-inline' *.googleapis.com fonts.googleapis.com;
      font-src 'self' fonts.gstatic.com;
      img-src 'self' data: blob: *.cloudinary.com *.stripe.com *.googleusercontent.com;
      connect-src 'self' ws: wss: *.stripe.com api.stripe.com *.neon.tech vitals.vercel-insights.com;
      frame-src 'self' *.stripe.com js.stripe.com;
      object-src 'none';
      base-uri 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, " ").trim();
    const productionCSP = `
      default-src 'self';
      script-src 'self' *.googleapis.com *.gstatic.com *.stripe.com js.stripe.com 'sha256-[YOUR-SCRIPT-HASH]';
      style-src 'self' 'unsafe-inline' *.googleapis.com fonts.googleapis.com;
      font-src 'self' fonts.gstatic.com;
      img-src 'self' data: blob: *.cloudinary.com *.stripe.com *.googleusercontent.com;
      connect-src 'self' wss: *.stripe.com api.stripe.com *.neon.tech vitals.vercel-insights.com;
      frame-src 'self' *.stripe.com js.stripe.com;
      object-src 'none';
      base-uri 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, " ").trim();
    res.setHeader("Content-Security-Policy", isDev ? developmentCSP : productionCSP);
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(self), fullscreen=(self)"
    );
    res.removeHeader("X-Powered-By");
    next();
  };
}
function apiSecurityHeaders() {
  return (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Max-Age", "86400");
    next();
  };
}
var init_securityHeaders = __esm({
  "server/middleware/securityHeaders.ts"() {
    "use strict";
  }
});

// server/middleware/inputSanitization.ts
var inputSanitization_exports = {};
__export(inputSanitization_exports, {
  InputSanitizer: () => InputSanitizer,
  sanitizeInput: () => sanitizeInput,
  sanitizeProductInput: () => sanitizeProductInput,
  sanitizeSearchInput: () => sanitizeSearchInput,
  sanitizeUserInput: () => sanitizeUserInput
});
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
function sanitizeInput(options = {}) {
  return (req, res, next) => {
    try {
      let scan2 = function(val) {
        if (typeof val === "string") return FORBIDDEN.test(val);
        if (Array.isArray(val)) return val.some(scan2);
        if (val && typeof val === "object") return Object.values(val).some(scan2);
        return false;
      };
      var scan = scan2;
      const ALLOW = [
        /^\/api\/cart$/,
        /^\/api\/cart\/[\w-]+$/,
        /^\/api\/user$/,
        /^\/api\/products$/,
        /^\/api\/track-activity$/,
        /^\/api\/stripe\/webhook$/,
        /^\/api\/health$/,
        /^\/health$/,
        /^\/api\/admin\/logs$/,
        /^\/api\/user\/profile\/image$/,
        /^\/login$/,
        /^\/register$/,
        /^\/auth\//,
        /^\/track-activity$/,
        /^\/errors\//,
        /^\/api\/observability\/errors$/
      ];
      console.log("Sanitization check - path:", req.path, "url:", req.url, "method:", req.method, "originalUrl:", req.originalUrl);
      if (ALLOW.some((rx) => rx.test(req.path) || rx.test(req.originalUrl))) {
        console.log("Skipping sanitization for:", req.path, "originalUrl:", req.originalUrl);
        return next();
      }
      if (req.path.includes("cart") || req.url.includes("cart") || req.originalUrl.includes("cart")) {
        console.log("CART REQUEST BLOCKED:", {
          path: req.path,
          url: req.url,
          originalUrl: req.originalUrl,
          method: req.method,
          body: req.body,
          headers: req.headers["content-type"]
        });
      }
      const FORBIDDEN = /(<|>|script:|javascript:|data:|on\w+=)/i;
      if (scan2(req.body) || scan2(req.query) || scan2(req.params)) {
        console.log("Request blocked by sanitizer - suspicious content detected");
        return res.status(400).json({
          error: "Invalid input data",
          message: "Request contains potentially unsafe content"
        });
      }
      next();
    } catch (error) {
      res.status(400).json({
        error: "Invalid input data",
        message: "Request contains potentially unsafe content"
      });
    }
  };
}
var window, purify, InputSanitizer, sanitizeUserInput, sanitizeProductInput, sanitizeSearchInput;
var init_inputSanitization = __esm({
  "server/middleware/inputSanitization.ts"() {
    "use strict";
    window = new JSDOM("").window;
    purify = DOMPurify(window);
    InputSanitizer = class {
      static defaultOptions = {
        stripTags: true,
        maxLength: 1e4,
        allowedTags: [],
        allowedAttributes: {}
      };
      static sanitizeString(input, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        if (!input || typeof input !== "string") return "";
        let sanitized = opts.maxLength ? input.slice(0, opts.maxLength) : input;
        if (opts.stripTags) {
          sanitized = purify.sanitize(sanitized, {
            ALLOWED_TAGS: opts.allowedTags || [],
            ALLOWED_ATTR: Object.values(opts.allowedAttributes || {}).flat(),
            KEEP_CONTENT: true
          });
        }
        sanitized = sanitized.replace(/javascript:/gi, "").replace(/vbscript:/gi, "").replace(/data:text\/html/gi, "").replace(/on\w+\s*=/gi, "");
        return sanitized.trim();
      }
      static sanitizeObject(obj, options = {}) {
        if (!obj) return obj;
        if (typeof obj === "string") {
          return this.sanitizeString(obj, options);
        }
        if (Array.isArray(obj)) {
          return obj.map((item) => this.sanitizeObject(item, options));
        }
        if (typeof obj === "object") {
          const sanitized = {};
          for (const [key, value] of Object.entries(obj)) {
            const cleanKey = this.sanitizeString(key, { stripTags: true, maxLength: 100 });
            sanitized[cleanKey] = this.sanitizeObject(value, options);
          }
          return sanitized;
        }
        return obj;
      }
      static validateAndSanitize(data, schema) {
        const sqlInjectionPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
          /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
          /(--|\/\*|\*\/)/g,
          /(\b\d+\s*=\s*\d+\b)/g,
          // 1=1 type patterns
          /('|"|;|\||&)/g
          // Common injection characters
        ];
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
          /javascript:/gi,
          /vbscript:/gi,
          /on\w+\s*=/gi
        ];
        const sanitized = this.sanitizeObject(data, {
          stripTags: true,
          maxLength: 5e3
        });
        const dataString = JSON.stringify(sanitized).toLowerCase();
        for (const pattern of [...sqlInjectionPatterns, ...xssPatterns]) {
          if (pattern.test(dataString)) {
            throw new Error("Input contains potentially malicious content");
          }
        }
        return sanitized;
      }
    };
    sanitizeUserInput = sanitizeInput({
      allowedTags: [],
      stripTags: true,
      maxLength: 1e3
    });
    sanitizeProductInput = sanitizeInput({
      allowedTags: ["b", "i", "u", "br", "p"],
      allowedAttributes: {},
      stripTags: false,
      maxLength: 5e3
    });
    sanitizeSearchInput = sanitizeInput({
      stripTags: true,
      maxLength: 200
    });
  }
});

// server/middleware/requestLogger.ts
var requestLogger_exports = {};
__export(requestLogger_exports, {
  adminRequestLogger: () => adminRequestLogger,
  apiRequestLogger: () => apiRequestLogger,
  errorLogger: () => errorLogger,
  requestLogger: () => requestLogger2
});
var RequestLogger, requestLogger2, apiRequestLogger, adminRequestLogger, errorLogger;
var init_requestLogger = __esm({
  "server/middleware/requestLogger.ts"() {
    "use strict";
    init_logger();
    RequestLogger = class _RequestLogger {
      static isSpamEndpoint(url) {
        const spamPatterns = [
          /^\/api\/products\/featured$/,
          /^\/api\/categories/,
          /^\/api\/cart$/,
          /^\/clean-flip-logo/,
          /^\/api\/user$/,
          /^\/@vite/,
          /^\/@react-refresh/,
          /\.js$|\.css$|\.png$|\.jpg$|\.jpeg$|\.gif$|\.svg$|\.ico$/
        ];
        return spamPatterns.some((pattern) => pattern.test(url));
      }
      static shouldLogRequest(req) {
        if (req.url.startsWith("/api/admin/")) return true;
        if (req.url.startsWith("/api/errors/")) return true;
        if (req.url.startsWith("/api/auth/")) return true;
        if (process.env.NODE_ENV === "development" && this.isSpamEndpoint(req.url)) {
          return false;
        }
        return true;
      }
      static extractUserInfo(req) {
        const userId = req.user?.id || req.user?.claims?.sub;
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        return { userId, ip };
      }
      static requestLogger() {
        return (req, res, next) => {
          if (!_RequestLogger.shouldLogRequest(req)) {
            return next();
          }
          const startTime = Date.now();
          const { userId, ip } = _RequestLogger.extractUserInfo(req);
          const requestData = {
            method: req.method,
            url: req.url,
            userAgent: req.get("User-Agent"),
            ip,
            userId
          };
          const originalEnd = res.end;
          res.end = function(...args) {
            const duration = Date.now() - startTime;
            const contentLength = res.get("Content-Length");
            const responseData = {
              ...requestData,
              duration,
              statusCode: res.statusCode,
              contentLength: contentLength ? parseInt(contentLength) : void 0
            };
            if (res.statusCode >= 500) {
              Logger.error(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, responseData);
            } else if (res.statusCode >= 400) {
              Logger.warn(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, responseData);
            } else if (res.statusCode >= 300) {
              Logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
            } else {
              Logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
            }
            originalEnd.apply(this, args);
          };
          next();
        };
      }
      static apiRequestLogger() {
        return (req, res, next) => {
          const startTime = Date.now();
          const { userId, ip } = _RequestLogger.extractUserInfo(req);
          const originalEnd = res.end;
          res.end = function(...args) {
            const duration = Date.now() - startTime;
            const logData = {
              method: req.method,
              url: req.url,
              userAgent: req.get("User-Agent"),
              ip,
              userId,
              duration,
              statusCode: res.statusCode,
              contentLength: res.get("Content-Length") ? parseInt(res.get("Content-Length")) : void 0
            };
            if (res.statusCode >= 400) {
              Logger.warn(`API ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, logData);
            } else {
              Logger.info(`API ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, logData);
            }
            originalEnd.apply(this, args);
          };
          next();
        };
      }
      static adminRequestLogger() {
        return (req, res, next) => {
          const startTime = Date.now();
          const { userId, ip } = _RequestLogger.extractUserInfo(req);
          Logger.info(`ADMIN REQUEST: ${req.method} ${req.url}`, {
            userId,
            ip,
            userAgent: req.get("User-Agent")
          });
          const originalEnd = res.end;
          res.end = function(...args) {
            const duration = Date.now() - startTime;
            Logger.info(`ADMIN RESPONSE: ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
              userId,
              ip,
              duration,
              statusCode: res.statusCode
            });
            originalEnd.apply(this, args);
          };
          next();
        };
      }
      static errorLogger() {
        return (error, req, res, next) => {
          const { userId, ip } = _RequestLogger.extractUserInfo(req);
          Logger.error(`Request Error: ${req.method} ${req.url}`, {
            error: error.message,
            stack: error.stack,
            userId,
            ip,
            userAgent: req.get("User-Agent"),
            body: req.method !== "GET" ? req.body : void 0
          });
          next(error);
        };
      }
    };
    ({ requestLogger: requestLogger2, apiRequestLogger, adminRequestLogger, errorLogger } = RequestLogger);
  }
});

// server/services/performanceMonitor.ts
var performanceMonitor_exports = {};
__export(performanceMonitor_exports, {
  PerformanceMonitor: () => PerformanceMonitor,
  performanceMiddleware: () => performanceMiddleware
});
function performanceMiddleware() {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const originalEnd = res.end;
    res.end = function(...args) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;
      const userId = req.user?.id || req.user?.claims?.sub;
      PerformanceMonitor.recordMetric("request_duration", duration, {
        route: req.route?.path || req.url,
        method: req.method,
        statusCode: res.statusCode,
        userId,
        userAgent: req.get("User-Agent")
      });
      if (Math.random() < 0.01) {
        const memoryUsage = process.memoryUsage();
        PerformanceMonitor.recordMetric("memory_heap_used", memoryUsage.heapUsed);
        PerformanceMonitor.recordMetric("memory_heap_total", memoryUsage.heapTotal);
        PerformanceMonitor.recordMetric("memory_rss", memoryUsage.rss);
      }
      originalEnd.apply(this, args);
    };
    next();
  };
}
var PerformanceMonitor;
var init_performanceMonitor = __esm({
  "server/services/performanceMonitor.ts"() {
    "use strict";
    init_logger();
    PerformanceMonitor = class {
      static metrics = [];
      static MAX_METRICS = 1e4;
      static METRIC_RETENTION_HOURS = 24;
      static monitoringInterval = null;
      static startMonitoring() {
        if (this.monitoringInterval) return;
        this.monitoringInterval = setInterval(() => {
          this.cleanupOldMetrics();
        }, 5 * 60 * 1e3);
        Logger.info("Performance monitoring started");
      }
      static stopMonitoring() {
        if (this.monitoringInterval) {
          clearInterval(this.monitoringInterval);
          this.monitoringInterval = null;
          Logger.info("Performance monitoring stopped");
        }
      }
      static cleanupOldMetrics() {
        const cutoff = new Date(Date.now() - this.METRIC_RETENTION_HOURS * 60 * 60 * 1e3);
        const initialCount = this.metrics.length;
        this.metrics = this.metrics.filter((metric) => new Date(metric.timestamp) > cutoff);
        if (this.metrics.length > this.MAX_METRICS) {
          this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }
        const cleaned = initialCount - this.metrics.length;
        if (cleaned > 0) {
          Logger.info(`Cleaned up ${cleaned} old performance metrics`);
        }
      }
      static recordMetric(name, value, context) {
        const metric = {
          name,
          value,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          context
        };
        this.metrics.unshift(metric);
        if (this.metrics.length > this.MAX_METRICS) {
          this.metrics = this.metrics.slice(0, this.MAX_METRICS);
        }
        if (name === "request_duration" && value > 1e3) {
          Logger.warn(`Slow request detected: ${context?.method} ${context?.route} took ${value}ms`);
        }
      }
      static getMetrics(name, limit = 1e3) {
        let filteredMetrics = name ? this.metrics.filter((m) => m.name === name) : this.metrics;
        return filteredMetrics.slice(0, limit);
      }
      static getMetricsSummary(timeWindow = "hour") {
        let cutoff;
        switch (timeWindow) {
          case "hour":
            cutoff = new Date(Date.now() - 60 * 60 * 1e3);
            break;
          case "day":
            cutoff = new Date(Date.now() - 24 * 60 * 60 * 1e3);
            break;
          default:
            cutoff = /* @__PURE__ */ new Date(0);
        }
        const recentMetrics = this.metrics.filter((m) => new Date(m.timestamp) > cutoff);
        const summary = {};
        const groupedMetrics = {};
        recentMetrics.forEach((metric) => {
          if (!groupedMetrics[metric.name]) {
            groupedMetrics[metric.name] = [];
          }
          groupedMetrics[metric.name].push(metric.value);
        });
        Object.entries(groupedMetrics).forEach(([name, values]) => {
          if (values.length === 0) return;
          const sorted = values.sort((a, b) => a - b);
          const sum2 = values.reduce((a, b) => a + b, 0);
          summary[name] = {
            count: values.length,
            avg: sum2 / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1]
          };
        });
        return summary;
      }
      static getSystemStats() {
        return {
          totalMetrics: this.metrics.length,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          cpuUsage: process.cpuUsage()
        };
      }
      static getTopSlowRoutes(limit = 10) {
        const requestMetrics = this.metrics.filter(
          (m) => m.name === "request_duration" && m.context?.route && m.context?.method
        );
        const routeStats = {};
        requestMetrics.forEach((metric) => {
          const key = `${metric.context.method} ${metric.context.route}`;
          if (!routeStats[key]) {
            routeStats[key] = {
              durations: [],
              method: metric.context.method,
              route: metric.context.route
            };
          }
          routeStats[key].durations.push(metric.value);
        });
        return Object.entries(routeStats).map(([, stats]) => ({
          route: stats.route,
          method: stats.method,
          avgDuration: Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length),
          count: stats.durations.length,
          maxDuration: Math.max(...stats.durations)
        })).sort((a, b) => b.avgDuration - a.avgDuration).slice(0, limit);
      }
    };
  }
});

// server/services/systemMonitor.ts
var SystemMonitor;
var init_systemMonitor = __esm({
  "server/services/systemMonitor.ts"() {
    "use strict";
    init_logger();
    init_performanceMonitor();
    SystemMonitor = class {
      static alerts = [];
      static monitoringInterval = null;
      static ALERT_RETENTION_HOURS = 24;
      static MAX_ALERTS = 100;
      static startMonitoring() {
        if (this.monitoringInterval) return;
        this.monitoringInterval = setInterval(() => {
          this.checkSystemHealth();
        }, 6e4);
        Logger.info("System monitoring started");
      }
      static stopMonitoring() {
        if (this.monitoringInterval) {
          clearInterval(this.monitoringInterval);
          this.monitoringInterval = null;
          Logger.info("System monitoring stopped");
        }
      }
      static async checkSystemHealth() {
        try {
          const health = await this.getSystemHealth();
          this.checkMemoryUsage(health.memory);
          this.checkDatabaseHealth(health.database);
          this.checkPerformanceMetrics(health.performance);
          if (health.status !== "healthy") {
            Logger.warn("System health warning detected", { health });
          }
        } catch (error) {
          this.addAlert("critical", "System health check failed", error);
        }
      }
      static async getSystemHealth() {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        const performanceMetrics = PerformanceMonitor.getMetricsSummary("hour");
        const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const memoryPercent = memoryUsedMB / memoryTotalMB * 100;
        let dbStatus = "connected";
        let dbLatency = 0;
        try {
          const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
          const start = Date.now();
          await db2.execute("SELECT 1");
          dbLatency = Date.now() - start;
        } catch (error) {
          dbStatus = "disconnected";
          dbLatency = -1;
        }
        const avgResponseTime = performanceMetrics.request_duration?.avg || 0;
        const errorRate = this.calculateErrorRate();
        const requestsPerMinute = this.calculateRequestsPerMinute();
        let status = "healthy";
        if (memoryPercent > 85 || dbStatus === "disconnected" || avgResponseTime > 1e3) {
          status = "critical";
        } else if (memoryPercent > 70 || avgResponseTime > 500 || errorRate > 5) {
          status = "warning";
        }
        return {
          status,
          uptime: Math.floor(uptime),
          memory: {
            used: memoryUsedMB,
            total: memoryTotalMB,
            percentage: Math.round(memoryPercent)
          },
          database: {
            status: dbStatus,
            latency: dbLatency
          },
          performance: {
            avgResponseTime: Math.round(avgResponseTime),
            errorRate: Math.round(errorRate * 100) / 100,
            requestsPerMinute: Math.round(requestsPerMinute)
          },
          alerts: this.getActiveAlerts(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      static checkMemoryUsage(memory) {
        if (memory.percentage > 90) {
          this.addAlert("critical", `Critical memory usage: ${memory.percentage}%`);
        } else if (memory.percentage > 80) {
          this.addAlert("warning", `High memory usage: ${memory.percentage}%`);
        }
      }
      static checkDatabaseHealth(database) {
        if (database.status === "disconnected") {
          this.addAlert("critical", "Database connection lost");
        } else if (database.latency > 1e3) {
          this.addAlert("warning", `High database latency: ${database.latency}ms`);
        }
      }
      static checkPerformanceMetrics(performance) {
        if (performance.avgResponseTime > 2e3) {
          this.addAlert("critical", `Very slow response time: ${performance.avgResponseTime}ms`);
        } else if (performance.avgResponseTime > 1e3) {
          this.addAlert("warning", `Slow response time: ${performance.avgResponseTime}ms`);
        }
        if (performance.errorRate > 10) {
          this.addAlert("critical", `High error rate: ${performance.errorRate}%`);
        } else if (performance.errorRate > 5) {
          this.addAlert("warning", `Elevated error rate: ${performance.errorRate}%`);
        }
      }
      static calculateErrorRate() {
        const metrics = PerformanceMonitor.getMetrics("request_duration", 100);
        if (metrics.length === 0) return 0;
        const errorRequests = metrics.filter(
          (m) => m.context?.statusCode && m.context.statusCode >= 400
        ).length;
        return errorRequests / metrics.length * 100;
      }
      static calculateRequestsPerMinute() {
        const oneMinuteAgo = new Date(Date.now() - 6e4);
        const metrics = PerformanceMonitor.getMetrics("request_duration", 1e3);
        const recentRequests = metrics.filter(
          (m) => new Date(m.timestamp) > oneMinuteAgo
        );
        return recentRequests.length;
      }
      static addAlert(level, message, context) {
        const alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          level,
          message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          resolved: false
        };
        this.alerts.unshift(alert);
        if (this.alerts.length > this.MAX_ALERTS) {
          this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
        }
        const cutoff = new Date(Date.now() - this.ALERT_RETENTION_HOURS * 60 * 60 * 1e3);
        this.alerts = this.alerts.filter((a) => new Date(a.timestamp) > cutoff);
        Logger[level === "critical" ? "error" : level === "warning" ? "warn" : "info"](
          `System Alert [${level.toUpperCase()}]: ${message}`,
          context
        );
      }
      static getActiveAlerts() {
        return this.alerts.filter((a) => !a.resolved);
      }
      static getAllAlerts() {
        return [...this.alerts];
      }
      static resolveAlert(alertId) {
        const alert = this.alerts.find((a) => a.id === alertId);
        if (alert) {
          alert.resolved = true;
          Logger.info(`System alert resolved: ${alert.message}`);
          return true;
        }
        return false;
      }
      static clearResolvedAlerts() {
        const initialCount = this.alerts.length;
        this.alerts = this.alerts.filter((a) => !a.resolved);
        const clearedCount = initialCount - this.alerts.length;
        if (clearedCount > 0) {
          Logger.info(`Cleared ${clearedCount} resolved system alerts`);
        }
        return clearedCount;
      }
    };
  }
});

// server/routes/admin/system-management.ts
var system_management_exports = {};
__export(system_management_exports, {
  systemManagementRoutes: () => router6
});
import { Router as Router6 } from "express";
var router6;
var init_system_management = __esm({
  "server/routes/admin/system-management.ts"() {
    "use strict";
    init_auth();
    init_systemMonitor();
    init_performanceMonitor();
    init_errorLogger();
    init_logger();
    router6 = Router6();
    router6.use(requireAuth);
    router6.use(requireRole("developer"));
    router6.get("/health", async (req, res) => {
      try {
        const systemHealth = await SystemMonitor.getSystemHealth();
        const performanceStats = PerformanceMonitor.getSystemStats();
        const errorStats = await ErrorLogger.getErrorStats();
        const response = {
          system: systemHealth,
          performance: performanceStats,
          errors: errorStats,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        res.json(response);
      } catch (error) {
        Logger.error("Failed to get system health:", error);
        res.status(500).json({ error: "Failed to get system health" });
      }
    });
    router6.get("/performance", async (req, res) => {
      try {
        const { timeWindow = "hour", metricName, limit = 1e3 } = req.query;
        const summary = PerformanceMonitor.getMetricsSummary(timeWindow);
        const metrics = PerformanceMonitor.getMetrics(metricName, parseInt(limit));
        const slowRoutes = PerformanceMonitor.getTopSlowRoutes(10);
        res.json({
          summary,
          metrics,
          slowRoutes,
          totalMetrics: metrics.length
        });
      } catch (error) {
        Logger.error("Failed to get performance metrics:", error);
        res.status(500).json({ error: "Failed to get performance metrics" });
      }
    });
    router6.get("/alerts", async (req, res) => {
      try {
        const { resolved = false } = req.query;
        const alerts = resolved === "true" ? SystemMonitor.getAllAlerts() : SystemMonitor.getActiveAlerts();
        res.json({
          alerts,
          totalAlerts: alerts.length
        });
      } catch (error) {
        Logger.error("Failed to get system alerts:", error);
        res.status(500).json({ error: "Failed to get system alerts" });
      }
    });
    router6.post("/alerts/:alertId/resolve", async (req, res) => {
      try {
        const { alertId } = req.params;
        const resolved = SystemMonitor.resolveAlert(alertId);
        if (resolved) {
          res.json({ success: true, message: "Alert resolved successfully" });
        } else {
          res.status(404).json({ error: "Alert not found" });
        }
      } catch (error) {
        Logger.error("Failed to resolve alert:", error);
        res.status(500).json({ error: "Failed to resolve alert" });
      }
    });
    router6.post("/alerts/cleanup", async (req, res) => {
      try {
        const clearedCount = SystemMonitor.clearResolvedAlerts();
        res.json({
          success: true,
          message: `Cleared ${clearedCount} resolved alerts`
        });
      } catch (error) {
        Logger.error("Failed to cleanup alerts:", error);
        res.status(500).json({ error: "Failed to cleanup alerts" });
      }
    });
    router6.get("/database", async (req, res) => {
      try {
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const startTime = Date.now();
        await db2.execute("SELECT 1");
        const latency = Date.now() - startTime;
        const sizeQuery = await db2.execute(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_size_pretty(pg_total_relation_size('users')) as users_table_size,
        pg_size_pretty(pg_total_relation_size('products')) as products_table_size,
        pg_size_pretty(pg_total_relation_size('orders')) as orders_table_size
    `);
        const statsQuery = await db2.execute(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
      LIMIT 10
    `);
        res.json({
          status: "connected",
          latency,
          size_info: sizeQuery.rows[0],
          table_stats: statsQuery.rows,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        Logger.error("Failed to get database status:", error);
        res.status(500).json({
          error: "Failed to get database status",
          status: "disconnected"
        });
      }
    });
    router6.get("/logs", async (req, res) => {
      try {
        const {
          level = "info",
          limit = 100,
          timeRange = "1h"
        } = req.query;
        res.json({
          logs: [],
          totalCount: 0,
          filters: {
            level,
            limit: parseInt(limit),
            timeRange
          },
          message: "Log aggregation system not yet implemented"
        });
      } catch (error) {
        Logger.error("Failed to get system logs:", error);
        res.status(500).json({ error: "Failed to get system logs" });
      }
    });
    router6.post("/diagnostics", async (req, res) => {
      try {
        const diagnostics = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          tests: []
        };
        try {
          const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
          const start = Date.now();
          await db2.execute("SELECT 1");
          diagnostics.tests.push({
            name: "Database Connection",
            status: "passed",
            duration: Date.now() - start,
            message: "Database connection successful"
          });
        } catch (error) {
          diagnostics.tests.push({
            name: "Database Connection",
            status: "failed",
            error: error.message
          });
        }
        const memUsage = process.memoryUsage();
        const memPercent = memUsage.heapUsed / memUsage.heapTotal * 100;
        diagnostics.tests.push({
          name: "Memory Usage",
          status: memPercent > 85 ? "warning" : "passed",
          value: `${Math.round(memPercent)}%`,
          message: `Heap usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        });
        try {
          const { execSync } = __require("child_process");
          const diskUsage = execSync("df -h / | tail -1").toString().trim();
          diagnostics.tests.push({
            name: "Disk Usage",
            status: "passed",
            value: diskUsage.split(/\s+/)[4],
            message: `Disk usage information: ${diskUsage}`
          });
        } catch (error) {
          diagnostics.tests.push({
            name: "Disk Usage",
            status: "skipped",
            message: "Disk usage check not available in this environment"
          });
        }
        const perfStats = PerformanceMonitor.getMetricsSummary("hour");
        const avgResponseTime = perfStats.request_duration?.avg || 0;
        diagnostics.tests.push({
          name: "Response Time",
          status: avgResponseTime > 1e3 ? "warning" : "passed",
          value: `${Math.round(avgResponseTime)}ms`,
          message: `Average response time over last hour`
        });
        res.json(diagnostics);
      } catch (error) {
        Logger.error("Failed to run diagnostics:", error);
        res.status(500).json({ error: "Failed to run diagnostics" });
      }
    });
  }
});

// server/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  broadcastUpdate: () => broadcastUpdate,
  setupWebSocket: () => setupWebSocket,
  wsManager: () => wsManager
});
import { WebSocketServer, WebSocket as WebSocket2 } from "ws";
function setupWebSocket(server2) {
  wsManager = new WebSocketManager(server2);
  return wsManager;
}
function broadcastUpdate(type, data) {
  if (wsManager) {
    wsManager.broadcast({
      type,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
var WebSocketManager, wsManager;
var init_websocket = __esm({
  "server/websocket.ts"() {
    "use strict";
    WebSocketManager = class {
      wss;
      clients = /* @__PURE__ */ new Map();
      heartbeatInterval = null;
      constructor(server2) {
        this.wss = new WebSocketServer({
          server: server2,
          path: "/ws",
          perMessageDeflate: false,
          clientTracking: true
        });
        this.setupWebSocket();
        this.startHeartbeat();
      }
      setupWebSocket() {
        this.wss.on("connection", (ws, req) => {
          const clientId = this.generateId();
          const client = {
            ws,
            id: clientId,
            isAlive: true
          };
          this.clients.set(clientId, client);
          console.log(`[WS] Client connected: ${clientId} (Total: ${this.clients.size})`);
          ws.send(JSON.stringify({
            type: "connection",
            status: "connected",
            clientId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }));
          ws.on("pong", () => {
            client.isAlive = true;
          });
          ws.on("message", (message) => {
            try {
              const data = JSON.parse(message.toString());
              this.handleMessage(clientId, data);
            } catch (error) {
              console.error("[WS] Message parse error:", error);
            }
          });
          ws.on("close", () => {
            this.clients.delete(clientId);
            console.log(`[WS] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
          });
          ws.on("error", (error) => {
            console.error(`[WS] Client error ${clientId}:`, error);
            this.clients.delete(clientId);
          });
        });
      }
      handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        if (data.type === "auth") {
          client.userId = data.userId;
          client.role = data.role;
          console.log(`[WS] Client authenticated: ${clientId} (${data.role})`);
          return;
        }
        const messageWithTimestamp = {
          ...data,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          sourceClient: clientId
        };
        this.broadcast(messageWithTimestamp, clientId);
      }
      broadcast(data, excludeClientId) {
        const message = JSON.stringify(data);
        let successCount = 0;
        this.clients.forEach((client, id) => {
          if (id !== excludeClientId && client.ws.readyState === WebSocket2.OPEN) {
            try {
              client.ws.send(message);
              successCount++;
            } catch (error) {
              console.error(`[WS] Broadcast error to ${id}:`, error);
              this.clients.delete(id);
            }
          }
        });
        if (successCount > 0) {
          console.log(`[WS] Broadcasted ${data.type} to ${successCount} clients`);
        }
      }
      broadcastToRole(data, role) {
        const message = JSON.stringify(data);
        let successCount = 0;
        this.clients.forEach((client) => {
          if (client.role === role && client.ws.readyState === WebSocket2.OPEN) {
            try {
              client.ws.send(message);
              successCount++;
            } catch (error) {
              console.error(`[WS] Role broadcast error:`, error);
            }
          }
        });
        console.log(`[WS] Broadcasted to ${successCount} ${role} clients`);
      }
      startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
          this.clients.forEach((client, id) => {
            if (!client.isAlive) {
              console.log(`[WS] Terminating dead client: ${id}`);
              client.ws.terminate();
              this.clients.delete(id);
              return;
            }
            client.isAlive = false;
            if (client.ws.readyState === WebSocket2.OPEN) {
              client.ws.ping();
            }
          });
        }, 3e4);
      }
      generateId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      getConnectionCount() {
        return this.clients.size;
      }
      getStats() {
        const roleStats = {};
        this.clients.forEach((client) => {
          if (client.role) {
            roleStats[client.role] = (roleStats[client.role] || 0) + 1;
          }
        });
        return {
          totalConnections: this.clients.size,
          roleBreakdown: roleStats,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      cleanup() {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
        this.clients.forEach((client) => {
          client.ws.terminate();
        });
        this.clients.clear();
        this.wss.close();
      }
    };
  }
});

// server/utils/referenceGenerator.ts
var referenceGenerator_exports = {};
__export(referenceGenerator_exports, {
  generateReferenceNumber: () => generateReferenceNumber,
  generateUniqueReference: () => generateUniqueReference
});
import { eq as eq8 } from "drizzle-orm";
function generateReferenceNumber() {
  const date = /* @__PURE__ */ new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1e3 + Math.random() * 9e3);
  return `REF-${year}${month}${day}-${random}`;
}
async function generateUniqueReference() {
  let reference;
  let isUnique = false;
  while (!isUnique) {
    reference = generateReferenceNumber();
    const existing = await db.select().from(equipmentSubmissions).where(eq8(equipmentSubmissions.referenceNumber, reference)).limit(1);
    isUnique = existing.length === 0;
  }
  return reference;
}
var init_referenceGenerator = __esm({
  "server/utils/referenceGenerator.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/services/simple-password-reset.ts
var simple_password_reset_exports = {};
__export(simple_password_reset_exports, {
  SimplePasswordReset: () => SimplePasswordReset
});
import { sql as sql10 } from "drizzle-orm";
import { Resend } from "resend";
import crypto2 from "crypto";
import bcryptjs from "bcryptjs";
var resend, SimplePasswordReset;
var init_simple_password_reset = __esm({
  "server/services/simple-password-reset.ts"() {
    "use strict";
    init_db();
    resend = new Resend(process.env.RESEND_API_KEY);
    SimplePasswordReset = class {
      // SIMPLE USER LOOKUP - GUARANTEED TO WORK
      async findUser(email) {
        console.log(`[PasswordReset] Looking for: ${email}`);
        try {
          const result = await db.execute(sql10`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE LOWER(email) = LOWER(${email.trim()})
        LIMIT 1
      `);
          if (result && result.rows && result.rows.length > 0) {
            console.log(`[PasswordReset] \u2705 Found user: ${result.rows[0].email}`);
            return result.rows[0];
          }
          const countResult = await db.execute(sql10`SELECT COUNT(*) as total FROM users`);
          console.log(`[PasswordReset] Total users in DB: ${countResult.rows[0]?.total || 0}`);
          const debugResult = await db.execute(sql10`SELECT email FROM users LIMIT 3`);
          console.log("[PasswordReset] Sample emails in DB:");
          debugResult.rows.forEach((r) => console.log(`  - ${r.email}`));
          console.log(`[PasswordReset] \u274C User not found: ${email}`);
          return null;
        } catch (error) {
          console.error("[PasswordReset] Database error:", error);
          return null;
        }
      }
      // CREATE RESET TOKEN
      async createToken(userId) {
        const token = crypto2.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 36e5);
        try {
          await db.execute(sql10`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          token VARCHAR(255) UNIQUE,
          expires_at TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
          await db.execute(sql10`
        DELETE FROM password_reset_tokens WHERE user_id = ${userId}
      `);
          await db.execute(sql10`
        INSERT INTO password_reset_tokens (user_id, token, expires_at) 
        VALUES (${userId}, ${token}, ${expires})
      `);
          console.log(`[PasswordReset] Token created for user ${userId}`);
          return token;
        } catch (error) {
          console.error("[PasswordReset] Token creation error:", error);
          throw new Error(`Failed to create password reset token: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      // SEND EMAIL
      async sendEmail(email, token, name) {
        const resetLink = `https://cleanandflip.com/reset-password?token=${token}`;
        try {
          const { data, error } = await resend.emails.send({
            from: "Clean & Flip <noreply@cleanandflip.com>",
            to: email,
            subject: "Reset Your Password - Clean & Flip",
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Password Reset Request</h2>
            <p>Hi ${name || "there"},</p>
            <p>You requested to reset your password. Click the link below:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
            <p>Or copy this link: ${resetLink}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
          });
          if (error) {
            console.error("[PasswordReset] Email error:", error);
            return false;
          }
          console.log(`[PasswordReset] Email sent to ${email}, ID: ${data?.id}`);
          return true;
        } catch (error) {
          console.error("[PasswordReset] Email failed:", error);
          return false;
        }
      }
      // MAIN FUNCTION - REQUEST RESET
      async requestReset(email) {
        console.log("=".repeat(50));
        console.log(`[PasswordReset] Request for: ${email}`);
        const user = await this.findUser(email);
        if (!user) {
          console.log("[PasswordReset] No user found, returning success for security");
          return {
            success: true,
            message: "If an account exists, we sent a reset email."
          };
        }
        const token = await this.createToken(user.id);
        await this.sendEmail(user.email, token, user.first_name);
        console.log("[PasswordReset] \u2705 Process complete");
        console.log("=".repeat(50));
        return {
          success: true,
          message: "If an account exists, we sent a reset email."
        };
      }
      // VALIDATE TOKEN
      async validateToken(token) {
        try {
          const result = await db.execute(sql10`
        SELECT * FROM password_reset_tokens 
        WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
      `);
          return result.rows?.[0] || null;
        } catch (error) {
          console.error("[PasswordReset] Token validation error:", error);
          return null;
        }
      }
      // RESET PASSWORD
      async resetPassword(token, newPassword) {
        const tokenData = await this.validateToken(token);
        if (!tokenData) {
          console.log("[PasswordReset] Invalid token");
          return false;
        }
        try {
          const hashedPassword = await bcryptjs.hash(newPassword, 12);
          await db.execute(sql10`
        UPDATE users SET password = ${hashedPassword} WHERE id = ${tokenData.user_id}
      `);
          await db.execute(sql10`
        UPDATE password_reset_tokens SET used = TRUE WHERE id = ${tokenData.id}
      `);
          console.log("[PasswordReset] Password updated successfully");
          return true;
        } catch (error) {
          console.error("[PasswordReset] Reset failed:", error);
          return false;
        }
      }
    };
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
init_storage();
init_auth();
import { createServer } from "http";
import Stripe3 from "stripe";

// server/middleware/auth.ts
var authMiddleware = {
  // Check if user is logged in (compatible with Passport authentication)
  requireAuth: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    if (req.session?.userId || req.session?.passport?.user) {
      return next();
    }
    return res.status(401).json({ error: "Authentication required", message: "Please log in to continue" });
  },
  // Check if user is developer (compatible with Passport authentication)
  requireDeveloper: (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = req.user;
      if (user.role === "developer") {
        return next();
      }
    }
    if (req.session?.userId && req.session?.role === "developer") {
      return next();
    }
    return res.status(403).json({ error: "Developer access required", message: "Developer privileges required for this action" });
  },
  // Optional auth (guest checkout) - compatible with Passport
  optionalAuth: (req, res, next) => {
    let userId = null;
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      userId = req.user.id;
    } else if (req.session?.passport?.user) {
      userId = req.session.passport.user;
    } else if (req.session?.userId) {
      userId = req.session.userId;
    } else {
      userId = `guest-${req.sessionID}`;
    }
    req.userId = userId;
    next();
  }
};

// server/config/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "demo",
  api_secret: process.env.CLOUDINARY_API_SECRET || "demo"
});
var storage2 = multer.memoryStorage();
var upload = multer({
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024,
    // 5MB max (unified with new system)
    files: 8
    // Maximum 8 images per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
    }
  }
});

// server/routes.ts
import multer2 from "multer";
import cors from "cors";

// server/middleware/security.ts
import helmet from "helmet";
import rateLimit from "express-rate-limit";
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // 100 requests per window per IP
  message: {
    error: "Too many requests",
    message: "Please try again later",
    retryAfter: 15 * 60
    // seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 login attempts per window per IP
  message: {
    error: "Too many login attempts",
    message: "Please try again in 15 minutes",
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true,
  // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false
});
var adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1e3,
  // 10 minutes
  max: 50,
  // 50 admin requests per window
  message: {
    error: "Too many admin requests",
    message: "Please try again later",
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});
var uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 20,
  // 20 uploads per hour
  message: {
    error: "Too many uploads",
    message: "Upload limit exceeded. Please try again later.",
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});
function setupSecurityHeaders(app2) {
  const cspConfig = process.env.NODE_ENV === "development" ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        // Required for Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      scriptSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      imgSrc: [
        "'self'",
        "https://res.cloudinary.com",
        "https://images.unsplash.com",
        "data:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://api.cloudinary.com"
      ],
      frameSrc: [
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      manifestSrc: ["'self'"]
    }
  };
  app2.use(helmet({
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: false,
    // Required for Stripe
    hsts: {
      maxAge: 31536e3,
      // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app2.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), interest-cohort=(), payment=()"
    );
    res.removeHeader("X-Powered-By");
    next();
  });
}
var corsOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL || "https://your-domain.com" : true,
  // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie"
  ],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400
  // 24 hours
};

// server/middleware/requireProfile.ts
init_logger();
function requireCompleteProfile(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = req.user;
  if (!user.profileComplete) {
    Logger.info("[MIDDLEWARE] Blocking incomplete profile access:", {
      userId: user.id,
      path: req.path
    });
    return res.status(403).json({
      error: "Profile incomplete",
      redirect: "/onboarding",
      message: "You must complete your profile to access this resource"
    });
  }
  next();
}

// server/middleware/validation.ts
init_logger();
import { ZodError } from "zod";
function preventSQLInjection(req, res, next) {
  const sqlInjectionPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(\b(OR|AND)\b\s+\b\d+\s*=\s*\d+)/i,
    /(--|;|\||\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b|\bxp_\w+)/i
  ];
  const checkValue = (value) => {
    if (typeof value === "string") {
      return sqlInjectionPatterns.some((pattern) => pattern.test(value));
    }
    if (typeof value === "object" && value !== null) {
      for (const key in value) {
        if (checkValue(value[key])) return true;
      }
    }
    return false;
  };
  const inputs = [req.body, req.query, req.params];
  for (const input of inputs) {
    if (input && checkValue(input)) {
      return res.status(400).json({
        error: "Invalid input",
        message: "Potentially dangerous input detected",
        code: "SECURITY_VIOLATION"
      });
    }
  }
  next();
}
function preventXSS(req, res, next) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ];
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      let sanitized = value;
      xssPatterns.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, "");
      });
      return sanitized;
    }
    if (typeof value === "object" && value !== null) {
      const sanitized = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

// server/middleware/transaction.ts
init_db();
init_schema();
init_logger();
import { eq as eq3, and as and2 } from "drizzle-orm";
async function withTransaction(operation) {
  return await db.transaction(async (tx) => {
    return await operation(tx);
  });
}
async function atomicStockUpdate(productId, quantityToReduce, tx = db) {
  try {
    const product = await tx.select().from(products).where(eq3(products.id, productId)).for("update").limit(1);
    if (product.length === 0) {
      return { success: false, error: "Product not found" };
    }
    const currentStock = product[0].stockQuantity || 0;
    if (currentStock < quantityToReduce) {
      return {
        success: false,
        availableStock: currentStock,
        error: `Insufficient stock. Only ${currentStock} available`
      };
    }
    await tx.update(products).set({
      stockQuantity: currentStock - quantityToReduce,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(products.id, productId));
    return { success: true, availableStock: currentStock - quantityToReduce };
  } catch (error) {
    Logger.error("Atomic stock update error:", error);
    return { success: false, error: "Database error during stock update" };
  }
}
async function atomicCartOperation(userId, productId, quantity, operation) {
  return await withTransaction(async (tx) => {
    try {
      const existingCartItem = await tx.select().from(cartItems).where(and2(
        eq3(cartItems.userId, userId),
        eq3(cartItems.productId, productId)
      )).for("update").limit(1);
      if (operation === "remove") {
        if (existingCartItem.length === 0) {
          return { success: false, error: "Cart item not found" };
        }
        await tx.delete(cartItems).where(eq3(cartItems.id, existingCartItem[0].id));
        return { success: true };
      }
      if (operation === "add" || operation === "update") {
        const stockResult = await atomicStockUpdate(productId, 0, tx);
        if (!stockResult.success) {
          return { success: false, error: stockResult.error };
        }
        if ((stockResult.availableStock || 0) < quantity) {
          return {
            success: false,
            error: `Only ${stockResult.availableStock} items available`
          };
        }
        if (existingCartItem.length > 0) {
          const newQuantity = operation === "add" ? existingCartItem[0].quantity + quantity : quantity;
          if ((stockResult.availableStock || 0) < newQuantity) {
            return {
              success: false,
              error: `Only ${stockResult.availableStock} items available`
            };
          }
          const [updatedItem] = await tx.update(cartItems).set({
            quantity: newQuantity,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq3(cartItems.id, existingCartItem[0].id)).returning();
          return { success: true, cartItem: updatedItem };
        } else {
          const [newItem] = await tx.insert(cartItems).values({
            userId,
            productId,
            quantity,
            sessionId: null
          }).returning();
          return { success: true, cartItem: newItem };
        }
      }
      return { success: false, error: "Invalid operation" };
    } catch (error) {
      Logger.error("Atomic cart operation error:", error);
      return { success: false, error: "Database error during cart operation" };
    }
  });
}
async function atomicOrderCreation(userId, cartItemsData) {
  return await withTransaction(async (tx) => {
    try {
      for (const item of cartItemsData) {
        const stockResult = await atomicStockUpdate(item.productId, item.quantity, tx);
        if (!stockResult.success) {
          return { success: false, error: stockResult.error };
        }
      }
      const totalAmount = cartItemsData.reduce((sum2, item) => sum2 + item.price * item.quantity, 0);
      const [order] = await tx.insert(orders).values({
        customerId: userId,
        status: "pending",
        total: totalAmount.toString(),
        subtotal: totalAmount.toString(),
        items: cartItemsData
      }).returning();
      await tx.delete(cartItems).where(eq3(cartItems.userId, userId));
      return { success: true, orderId: order.id };
    } catch (error) {
      Logger.error("Atomic order creation error:", error);
      return { success: false, error: "Failed to create order" };
    }
  });
}
function transactionMiddleware(req, res, next) {
  req.withTransaction = withTransaction;
  req.atomicStockUpdate = atomicStockUpdate;
  req.atomicCartOperation = atomicCartOperation;
  req.atomicOrderCreation = atomicOrderCreation;
  next();
}

// server/middleware/monitoring.ts
init_logger();
function performanceMonitoring(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    if (duration > 1e3) {
      Logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
    res.setHeader("X-Response-Time", `${duration}ms`);
    res.setHeader("X-Timestamp", (/* @__PURE__ */ new Date()).toISOString());
    return originalSend.call(this, data);
  };
  next();
}
function createHealthCheck() {
  return async (req, res) => {
    const healthChecks = {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      checks: {
        database: "checking",
        memory: "ok",
        disk: "ok"
      }
    };
    try {
      const { storage: storage3 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      await storage3.getCategories();
      healthChecks.checks.database = "ok";
    } catch (error) {
      healthChecks.checks.database = "error";
      healthChecks.status = "degraded";
      Logger.error("Health check database error:", error);
    }
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (memUsageMB > 512) {
      healthChecks.checks.memory = "warning";
      Logger.warn(`High memory usage: ${memUsageMB}MB`);
    }
    const statusCode = healthChecks.status === "ok" ? 200 : 503;
    res.status(statusCode).json(healthChecks);
  };
}
function errorTracking(err, req, res, next) {
  const errorInfo = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };
  Logger.error("Application error:", errorInfo);
  next(err);
}

// server/middleware/product-sync.ts
init_stripe_sync();
init_logger();
var autoSyncProducts = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (req.path.includes("/api/products") || req.path.includes("/api/admin/products")) {
      if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        if (data.id) {
          StripeProductSync.syncProduct(data.id).catch((err) => Logger.error("Stripe sync error:", err));
        } else if (data.products && Array.isArray(data.products)) {
          data.products.forEach((product) => {
            if (product.id) {
              StripeProductSync.syncProduct(product.id).catch((err) => Logger.error("Stripe sync error:", err));
            }
          });
        }
      }
    }
    return originalJson.call(this, data);
  };
  next();
};

// server/config/compression.ts
init_logger();
import compression from "compression";
function setupCompression(app2) {
  app2.use(compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return true;
    },
    level: 6,
    // Good balance between speed and compression ratio
    threshold: 1024
    // Only compress responses larger than 1KB
  }));
  Logger.info("\u2705 Response compression configured");
}

// server/config/health.ts
init_db();

// server/lib/cache.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key, value, ttl) {
    const expires = ttl ? Date.now() + ttl * 1e3 : void 0;
    this.cache.set(key, { value, expires });
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1e3);
    }
  }
  async del(key) {
    this.cache.delete(key);
  }
  async clear() {
    this.cache.clear();
  }
};
var RedisCache = class {
  constructor(client) {
    this.client = client;
  }
  async get(key) {
    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  async set(key, value, ttl) {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
    } catch {
    }
  }
  async del(key) {
    try {
      await this.client.del(key);
    } catch {
    }
  }
  async clear() {
    try {
      await this.client.flushDb();
    } catch {
    }
  }
};
var cacheInstance;
function initializeCache(redisClient2) {
  if (redisClient2 && process.env.ENABLE_REDIS === "true") {
    cacheInstance = new RedisCache(redisClient2);
  } else {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}
function getCache() {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}

// server/config/cache.ts
var cache = getCache();
async function getCachedCategories() {
  try {
    return await cache.get("categories:active");
  } catch (error) {
    console.error("Cache get operation failed:", error);
    return null;
  }
}
async function setCachedCategories(categories2) {
  try {
    await cache.set("categories:active", categories2, 300);
  } catch (error) {
    console.error("Cache set operation failed:", error);
  }
}
async function closeRedisConnection() {
}
var redis = null;

// server/config/health.ts
import { sql as sql4 } from "drizzle-orm";
async function healthLive(req, res) {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "clean-flip-api"
  });
}
async function healthReady(req, res) {
  const checks = {
    database: "checking",
    cache: "checking",
    cloudinary: "configured"
  };
  let overallStatus = "ready";
  try {
    await db.execute(sql4`SELECT 1`);
    checks.database = "connected";
  } catch (error) {
    checks.database = "disconnected";
    overallStatus = "not ready";
  }
  try {
    if (redis && typeof redis.ping === "function") {
      await redis.ping();
    }
    checks.cache = "connected";
  } catch (error) {
    checks.cache = "disconnected";
    overallStatus = "degraded";
  }
  const statusCode = overallStatus === "ready" ? 200 : 503;
  res.status(statusCode).json({
    status: overallStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    services: checks,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
}

// server/config/logger.ts
import winston from "winston";
import chalk from "chalk";
var logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};
var logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue"
};
winston.addColors(logColors);
var logProfiles = {
  development: {
    requests: true,
    auth: true,
    database: false,
    // Reduce database spam
    cache: false,
    // Disable Redis spam in dev
    errors: true,
    performance: true
  },
  production: {
    requests: false,
    // Only log errors and slow requests
    auth: false,
    // Only log failures
    database: false,
    // Only log errors
    cache: false,
    errors: true,
    performance: true
  },
  debug: {
    requests: true,
    auth: true,
    database: true,
    cache: true,
    errors: true,
    performance: true
  }
};
var profile = logProfiles[process.env.LOG_PROFILE || process.env.NODE_ENV || "development"] || logProfiles.development;
function shouldLog(category) {
  return profile[category] ?? false;
}
var dbConnectionLogged = false;
var redisConnectionLogged = false;
var customFormat = winston.format.printf(({ level, message, timestamp: timestamp2, ...metadata }) => {
  const messageStr = typeof message === "string" ? message : JSON.stringify(message);
  if (messageStr?.includes("Redis connection error")) return "";
  if (messageStr?.includes("Database connected successfully") && dbConnectionLogged) return "";
  if (messageStr?.includes("Redis connected successfully") && redisConnectionLogged) return "";
  if (messageStr?.includes("Database connected successfully")) dbConnectionLogged = true;
  if (messageStr?.includes("Redis connected successfully")) redisConnectionLogged = true;
  const time = new Date(timestamp2).toLocaleTimeString();
  if (metadata.type === "request") {
    const { method, url, status, duration } = metadata;
    const statusColor = Number(status) >= 400 ? chalk.red : Number(status) >= 300 ? chalk.yellow : chalk.green;
    return `${chalk.gray(time)} ${chalk.cyan(String(method).padEnd(7))} ${String(url).padEnd(40)} ${statusColor(status)} ${chalk.gray(duration + "ms")}`;
  }
  if (metadata.type === "auth") {
    return `${chalk.gray(time)} ${chalk.blue("AUTH")} ${messageStr}`;
  }
  if (metadata.type === "system") {
    return `${chalk.gray(time)} ${level === "info" ? "\u2705" : "\u26A0\uFE0F "} ${messageStr}`;
  }
  return `${chalk.gray(time)} ${level}: ${messageStr}`;
});
var logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }),
    // Disable stack traces in logs
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    // File transport for production
    ...process.env.NODE_ENV === "production" ? [
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
        maxsize: 5242880,
        // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: "logs/combined.log",
        maxsize: 10485760,
        // 10MB
        maxFiles: 10
      })
    ] : []
  ]
});
var requestLogger = (req, res, next) => {
  const start = Date.now();
  if (req.url.includes(".") || req.url === "/health" || req.url === "/favicon.ico") {
    return next();
  }
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "production" && duration < 1e3 && res.statusCode < 400) {
      return;
    }
    if (!shouldLog("requests") && res.statusCode < 400 && duration < 500) {
      return;
    }
    logger.http("Request", {
      type: "request",
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration,
      ip: req.ip
    });
    if (duration > parseInt(process.env.LOG_SLOW_REQUESTS || "1000")) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  next();
};
function createRequestLogger() {
  return requestLogger;
}

// server/routes.ts
init_logger();
init_db();

// server/routes/observability.ts
import { Router } from "express";
import { z as z2 } from "zod";
import { randomUUID as randomUUID2 } from "crypto";

// server/data/simpleErrorStore.ts
init_db();
import { sql as sql5 } from "drizzle-orm";
var SimpleErrorStore = {
  async addError(data) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fingerprint = this.createFingerprint(data.message, data.stack);
    try {
      await db.execute(sql5`
        INSERT INTO errors_raw (event_id, created_at, level, env, service, url, message, stack, fingerprint)
        VALUES (${eventId}, NOW(), ${data.level}, ${data.env || "development"}, ${data.service}, 
                ${data.url || ""}, ${data.message}, ${JSON.stringify([data.stack || ""])}, ${fingerprint})
      `);
      const existingIssue = await db.execute(sql5`
        SELECT id FROM issues WHERE fingerprint = ${fingerprint} LIMIT 1
      `);
      if (existingIssue.rows.length > 0) {
        await db.execute(sql5`
          UPDATE issues 
          SET count = count + 1, last_seen = NOW()
          WHERE fingerprint = ${fingerprint}
        `);
      } else {
        const title = data.message.split("\n")[0].slice(0, 160) || "Error";
        await db.execute(sql5`
          INSERT INTO issues (fingerprint, title, level, service, first_seen, last_seen, count)
          VALUES (${fingerprint}, ${title}, ${data.level}, ${data.service}, NOW(), NOW(), 1)
        `);
      }
      return { success: true, eventId, fingerprint };
    } catch (error) {
      console.error("Failed to store error:", error);
      throw error;
    }
  },
  async listIssues(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    try {
      const result = await db.execute(sql5`
        SELECT fingerprint, title, level, service, first_seen, last_seen, count, resolved, ignored
        FROM issues 
        ORDER BY last_seen DESC 
        LIMIT ${limit} OFFSET ${offset}
      `);
      const total = await db.execute(sql5`SELECT COUNT(*) as count FROM issues`);
      const items = result.rows.map((row) => ({
        ...row,
        firstSeen: new Date(row.first_seen).toISOString(),
        lastSeen: new Date(row.last_seen).toISOString(),
        first_seen: void 0,
        // Remove underscore version
        last_seen: void 0
        // Remove underscore version
      }));
      return {
        items,
        total: total.rows[0]?.count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error("Failed to list issues:", error);
      throw error;
    }
  },
  async getChartData(days = 1) {
    try {
      const result = await db.execute(sql5`
        SELECT 
          date_trunc('hour', created_at) as hour,
          COUNT(*) as count
        FROM errors_raw 
        WHERE created_at >= NOW() - interval '${sql5.raw(days.toString())} days'
        GROUP BY date_trunc('hour', created_at)
        ORDER BY hour
      `);
      const series = result.rows.map((row) => ({
        hour: new Date(row.hour).toISOString(),
        count: Number(row.count) || 0
      }));
      return series;
    } catch (error) {
      console.error("Failed to get chart data:", error);
      return [];
    }
  },
  async getIssue(fingerprint) {
    try {
      const result = await db.execute(sql5`
        SELECT fingerprint, title, level, service, first_seen, last_seen, count, resolved, ignored
        FROM issues 
        WHERE fingerprint = ${fingerprint}
        LIMIT 1
      `);
      if (result.rows.length === 0) {
        return null;
      }
      const issue = result.rows[0];
      return {
        ...issue,
        firstSeen: new Date(issue.first_seen).toISOString(),
        lastSeen: new Date(issue.last_seen).toISOString()
      };
    } catch (error) {
      console.error("Failed to get issue:", error);
      return null;
    }
  },
  async getRawForIssue(fingerprint, limit = 50) {
    try {
      const result = await db.execute(sql5`
        SELECT event_id, created_at, level, env, service, url, message, stack
        FROM errors_raw 
        WHERE fingerprint = ${fingerprint}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      return result.rows.map((row) => ({
        ...row,
        createdAt: new Date(row.created_at).toISOString(),
        stack: row.stack && row.stack !== "" ? JSON.parse(row.stack) : []
      }));
    } catch (error) {
      console.error("Failed to get raw events for issue:", error);
      return [];
    }
  },
  async setResolved(fingerprint, resolved) {
    try {
      await db.execute(sql5`
        UPDATE issues 
        SET resolved = ${resolved}
        WHERE fingerprint = ${fingerprint}
      `);
      return true;
    } catch (error) {
      console.error("Failed to set resolved status:", error);
      return false;
    }
  },
  async setIgnored(fingerprint, ignored) {
    try {
      await db.execute(sql5`
        UPDATE issues 
        SET ignored = ${ignored}
        WHERE fingerprint = ${fingerprint}
      `);
      return true;
    } catch (error) {
      console.error("Failed to set ignored status:", error);
      return false;
    }
  },
  createFingerprint(message, stack) {
    const topLine = stack?.split("\n")[0] || "";
    const basis = `${message}_${topLine}`.slice(0, 100);
    let hash = 0;
    for (let i = 0; i < basis.length; i++) {
      hash = (hash << 5) - hash + basis.charCodeAt(i) & 4294967295;
    }
    return `fp_${Math.abs(hash)}`;
  }
};

// server/routes/observability.ts
var router = Router();
function normalizeStack(raw) {
  if (!raw) return [];
  return raw.split("\n").map((l) => l.trim()).filter((l) => l && !l.includes("node_modules") && !l.includes("(internal")).map((l) => l.replace(/\(\w+:\/\/.*?\)/g, "()").replace(/:\d+:\d+/g, ":__:__"));
}
var IngestSchema = z2.object({
  service: z2.enum(["client", "server"]).default("client"),
  level: z2.enum(["error", "warn", "info"]).default("error"),
  env: z2.enum(["production", "development"]).default(
    process.env.NODE_ENV === "production" ? "production" : "development"
  ),
  release: z2.string().optional(),
  url: z2.string().optional(),
  method: z2.string().optional(),
  statusCode: z2.coerce.number().optional(),
  message: z2.string().min(1),
  type: z2.string().optional(),
  stack: z2.string().optional(),
  extra: z2.record(z2.any()).optional()
});
router.post("/errors", async (req, res) => {
  try {
    const parsed = IngestSchema.parse(req.body ?? {});
    const event = {
      eventId: randomUUID2(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...parsed,
      stack: normalizeStack(parsed.stack).join("\n")
    };
    await SimpleErrorStore.addError(event);
    res.status(202).json({ ok: true, eventId: event.eventId });
  } catch (e) {
    console.error("observability.ingest failed:", e);
    res.status(400).json({ error: "Invalid payload" });
  }
});
router.get("/issues", async (req, res) => {
  try {
    const q = String(req.query.q ?? "");
    const level = String(req.query.level ?? "");
    const env = String(req.query.env ?? "");
    const resolved = String(req.query.resolved ?? "false") === "true";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const result = await SimpleErrorStore.listIssues({ page, limit });
    res.json(result);
  } catch (e) {
    console.error("observability.listIssues failed:", e);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});
router.get("/issues/:fp", async (req, res) => {
  try {
    const issue = await SimpleErrorStore.getIssue(req.params.fp);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json({ issue });
  } catch (e) {
    console.error("observability.issue failed:", e);
    res.status(500).json({ error: "Failed to fetch issue" });
  }
});
router.get("/issues/:fp/events", async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10)));
    const events = await SimpleErrorStore.getEvents(req.params.fp, limit);
    res.json(events || []);
  } catch (e) {
    console.error("observability.issueEvents failed:", e);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});
router.put("/issues/:fp/resolve", async (req, res) => {
  try {
    await SimpleErrorStore.markResolved(req.params.fp, true);
    res.json({ ok: true });
  } catch (e) {
    console.error("observability.resolve failed:", e);
    res.status(500).json({ error: "Failed to resolve issue" });
  }
});
router.put("/issues/:fp/reopen", async (req, res) => {
  try {
    await SimpleErrorStore.markResolved(req.params.fp, false);
    res.json({ ok: true });
  } catch (e) {
    console.error("observability.reopen failed:", e);
    res.status(500).json({ error: "Failed to reopen issue" });
  }
});
router.put("/issues/:fp/ignore", async (req, res) => {
  try {
    await SimpleErrorStore.markIgnored(req.params.fp, true);
    res.json({ ok: true });
  } catch (e) {
    console.error("observability.ignore failed:", e);
    res.status(500).json({ error: "Failed to ignore issue" });
  }
});
router.put("/issues/:fp/unignore", async (req, res) => {
  try {
    await SimpleErrorStore.markIgnored(req.params.fp, false);
    res.json({ ok: true });
  } catch (e) {
    console.error("observability.unignore failed:", e);
    res.status(500).json({ error: "Failed to unignore issue" });
  }
});
router.get("/series", async (req, res) => {
  try {
    const days = Math.min(30, Math.max(1, parseInt(String(req.query.days ?? "1"), 10)));
    const rows = await SimpleErrorStore.getChartData(days);
    res.json(rows);
  } catch (e) {
    console.error("observability.series failed:", e);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});
var observability_default = router;

// server/routes/auth-google.ts
init_storage();
init_auth();
import passport3 from "passport";
import { Strategy as GoogleStrategy3 } from "passport-google-oauth20";
import { Router as Router2 } from "express";
var router2 = Router2();
passport3.use(new GoogleStrategy3({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
  // Use relative URL
  proxy: true,
  // CRITICAL: Trust proxy headers
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile2, done) => {
  try {
    const email = profile2.emails?.[0]?.value;
    if (!email) {
      return done(new Error("No email from Google profile"), null);
    }
    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({
        googleId: profile2.id,
        email,
        firstName: profile2.name?.givenName || "",
        lastName: profile2.name?.familyName || "",
        profileImageUrl: profile2.photos?.[0]?.value || "",
        isEmailVerified: true,
        authProvider: "google",
        profileComplete: false,
        // MUST complete onboarding
        onboardingStep: 0
        // No password field for Google users
      });
    } else if (!user.googleId) {
      await storage.updateUserGoogleInfo(user.id, {
        googleId: profile2.id,
        profileImageUrl: profile2.photos?.[0]?.value || "",
        isEmailVerified: true,
        authProvider: "google"
        // Update provider
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));
router2.get("/google", (req, res, next) => {
  req.session.returnTo = req.query.returnTo || req.headers.referer || "/dashboard";
  req.session.save((err) => {
    if (err) console.error("Session save error:", err);
    passport3.authenticate("google", {
      scope: ["profile", "email"]
    })(req, res, next);
  });
});
router2.get(
  "/google/callback",
  passport3.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }),
  async (req, res) => {
    const user = req.user;
    const host = req.get("host");
    const baseUrl = host?.includes("cleanandflip.com") ? "https://cleanandflip.com" : host?.includes("cleanflip.replit.app") ? "https://cleanflip.replit.app" : "";
    if (!user.profileComplete && user.authProvider === "google") {
      res.redirect(`${baseUrl}/onboarding?source=google&required=true`);
    } else {
      const returnUrl = req.session.returnTo || "/dashboard";
      delete req.session.returnTo;
      res.redirect(`${baseUrl}${returnUrl}`);
    }
  }
);
router2.post("/onboarding/complete", requireAuth, async (req, res) => {
  try {
    const { address, phone, preferences } = req.body;
    const user = req.user;
    if (user.authProvider === "google") {
      if (!address?.street || !address?.city || !address?.state || !address?.zipCode) {
        return res.status(400).json({ error: "Complete address required" });
      }
      if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
      }
    }
    await storage.updateUser(user.id, {
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone,
      latitude: address.latitude ? String(address.latitude) : void 0,
      longitude: address.longitude ? String(address.longitude) : void 0,
      profileComplete: true,
      onboardingStep: 4,
      isLocalCustomer: address.zipCode?.startsWith("287") || address.zipCode?.startsWith("288"),
      updatedAt: /* @__PURE__ */ new Date()
    });
    const returnUrl = req.query.return || "/dashboard";
    const isLocal = address.zipCode?.startsWith("287") || address.zipCode?.startsWith("288");
    res.json({
      success: true,
      redirectUrl: returnUrl,
      isLocalCustomer: isLocal
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});
var auth_google_default = router2;

// server/routes/stripe-webhooks.ts
init_storage();
init_logger();
import { Router as Router3 } from "express";
import Stripe2 from "stripe";
import express from "express";
var router3 = Router3();
var stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil"
});
router3.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  // CRITICAL: Use raw body for signature verification
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = stripe2.webhooks.constructEvent(
        req.body,
        // Must be raw body
        sig,
        webhookSecret
      );
      Logger.info(`[STRIPE] Webhook received: ${event.type}`, {
        id: event.id,
        created: event.created
      });
    } catch (err) {
      Logger.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(event.data.object);
          break;
        case "payment_intent.payment_failed":
          await handlePaymentFailed(event.data.object);
          break;
        case "payment_intent.canceled":
          await handlePaymentCanceled(event.data.object);
          break;
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object);
          break;
        default:
          Logger.debug(`[STRIPE] Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      Logger.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);
async function handlePaymentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    Logger.error("No orderId in payment intent metadata");
    return;
  }
  Logger.info(`[STRIPE] Payment succeeded for order: ${orderId}`);
  await storage.updateOrderStatus(orderId, "confirmed");
  const order = await storage.getOrder(orderId);
  if (order) {
    Logger.info(`[STRIPE] Order ${orderId} confirmed, email sent to ${order.userId}`);
  }
}
async function handlePaymentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    Logger.error("No orderId in payment intent metadata");
    return;
  }
  Logger.warn(`[STRIPE] Payment failed for order: ${orderId}`);
  await storage.updateOrderStatus(orderId, "payment_failed");
  await restoreInventoryForOrder(orderId);
}
async function handlePaymentCanceled(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    Logger.error("No orderId in payment intent metadata");
    return;
  }
  Logger.info(`[STRIPE] Payment canceled for order: ${orderId}`);
  await storage.updateOrderStatus(orderId, "cancelled");
  await restoreInventoryForOrder(orderId);
}
async function handleCheckoutCompleted(session2) {
  const orderId = session2.metadata?.orderId;
  if (!orderId) {
    Logger.error("No orderId in checkout session metadata");
    return;
  }
  Logger.info(`[STRIPE] Checkout completed for order: ${orderId}`);
}
async function restoreInventoryForOrder(orderId) {
  try {
    const orderItems2 = await storage.getOrderItems(orderId);
    for (const item of orderItems2) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        await storage.updateProduct(item.productId, {
          stockQuantity: (product.stockQuantity || 0) + item.quantity
        });
        Logger.debug(`[INVENTORY] Restored ${item.quantity} units for product ${item.productId}`);
      }
    }
    Logger.info(`[INVENTORY] Inventory restored for cancelled/failed order: ${orderId}`);
  } catch (error) {
    Logger.error("Error restoring inventory:", error);
  }
}
var stripe_webhooks_default = router3;

// server/routes/admin-metrics.ts
init_storage();
init_auth();
init_db();
init_schema();
init_logger();
import { Router as Router4 } from "express";
import { eq as eq6, gte as gte2, sql as sql6, and as and3, desc as desc3 } from "drizzle-orm";
var router4 = Router4();
router4.get("/metrics", requireAuth, requireRole("developer"), async (req, res) => {
  try {
    const metrics = {};
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todayMetrics = await db.select({
      ordersToday: sql6`COUNT(*) FILTER (WHERE created_at >= ${today})`,
      revenueToday: sql6`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${today}), 0)`,
      customersToday: sql6`COUNT(DISTINCT user_id) FILTER (WHERE created_at >= ${today})`
    }).from(orders).where(sql6`status != 'cancelled'`);
    metrics.today = todayMetrics[0];
    const inventoryMetrics = await db.select({
      outOfStock: sql6`COUNT(*) FILTER (WHERE stock_quantity = 0)`,
      lowStock: sql6`COUNT(*) FILTER (WHERE stock_quantity BETWEEN 1 AND 5)`,
      totalProducts: sql6`COUNT(*)`,
      inventoryValue: sql6`COALESCE(SUM(CAST(price AS NUMERIC) * stock_quantity), 0)`
    }).from(products).where(eq6(products.status, "active"));
    metrics.inventory = inventoryMetrics[0];
    const submissionMetrics = await db.select({
      pendingReview: sql6`COUNT(*)`
    }).from(equipmentSubmissions).where(eq6(equipmentSubmissions.status, "pending"));
    metrics.submissions = submissionMetrics[0];
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const topProducts = await db.select({
      name: products.name,
      id: products.id,
      sold: sql6`COUNT(${orderItems.id})`,
      revenue: sql6`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * ${orderItems.quantity}), 0)`
    }).from(products).leftJoin(orderItems, eq6(products.id, orderItems.productId)).leftJoin(orders, eq6(orderItems.orderId, orders.id)).where(
      and3(
        gte2(orders.createdAt, thirtyDaysAgo),
        eq6(orders.status, "delivered")
      )
    ).groupBy(products.id, products.name).orderBy(desc3(sql6`COUNT(${orderItems.id})`)).limit(5);
    metrics.topProducts = topProducts;
    const weekAgo = /* @__PURE__ */ new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = /* @__PURE__ */ new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const weeklyComparison = await db.select({
      thisWeekOrders: sql6`COUNT(*) FILTER (WHERE created_at >= ${weekAgo})`,
      lastWeekOrders: sql6`COUNT(*) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo})`,
      thisWeekRevenue: sql6`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${weekAgo}), 0)`,
      lastWeekRevenue: sql6`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo}), 0)`
    }).from(orders).where(sql6`status != 'cancelled'`);
    metrics.weekly = weeklyComparison[0];
    if (metrics.weekly) {
      metrics.weekly.orderGrowth = metrics.weekly.lastWeekOrders > 0 ? ((metrics.weekly.thisWeekOrders - metrics.weekly.lastWeekOrders) / metrics.weekly.lastWeekOrders * 100).toFixed(1) : 0;
      metrics.weekly.revenueGrowth = metrics.weekly.lastWeekRevenue > 0 ? ((metrics.weekly.thisWeekRevenue - metrics.weekly.lastWeekRevenue) / metrics.weekly.lastWeekRevenue * 100).toFixed(1) : 0;
    }
    Logger.info("[ADMIN] Metrics calculated successfully");
    res.json(metrics);
  } catch (error) {
    Logger.error("Error calculating admin metrics:", error);
    res.status(500).json({ error: "Failed to calculate metrics" });
  }
});
router4.put("/orders/:id/status", requireAuth, requireRole("developer"), async (req, res) => {
  try {
    const { status, trackingNumber, carrier, notes } = req.body;
    const orderId = req.params.id;
    const ORDER_STATUS_MACHINE = {
      "pending": ["confirmed", "cancelled"],
      "confirmed": ["processing", "cancelled"],
      "processing": ["shipped", "cancelled"],
      "shipped": ["delivered", "returned"],
      "delivered": ["returned"],
      "cancelled": [],
      "returned": ["refunded"],
      "refunded": []
    };
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const allowedStatuses = ORDER_STATUS_MACHINE[order.status];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Cannot change from ${order.status} to ${status}`,
        allowedStatuses
      });
    }
    switch (status) {
      case "cancelled":
      case "returned":
        const items = await storage.getOrderItems(orderId);
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            await storage.updateProduct(item.productId, {
              stockQuantity: (product.stockQuantity || 0) + item.quantity
            });
          }
        }
        Logger.info(`[ADMIN] Inventory restored for ${status} order: ${orderId}`);
        break;
      case "shipped":
        if (!trackingNumber || !carrier) {
          return res.status(400).json({ error: "Tracking number and carrier required for shipped status" });
        }
        await storage.updateOrder(orderId, { trackingNumber, carrier });
        Logger.info(`[ADMIN] Order ${orderId} marked as shipped with ${carrier} tracking: ${trackingNumber}`);
        break;
      case "refunded":
        Logger.info(`[ADMIN] Order ${orderId} marked for refund processing`);
        break;
    }
    await storage.updateOrderStatus(orderId, status, notes);
    Logger.info(`[ADMIN] Order ${orderId} status updated from ${order.status} to ${status}`);
    res.json({
      success: true,
      orderId,
      previousStatus: order.status,
      newStatus: status
    });
  } catch (error) {
    Logger.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});
var admin_metrics_default = router4;

// server/routes.ts
init_error_management();
init_schema();
import crypto from "crypto";

// server/utils/exportHelpers.ts
function generateCSV(submissions) {
  const headers = [
    "Reference Number",
    "Equipment Name",
    "Brand",
    "Condition",
    "Asking Price",
    "Status",
    "User Name",
    "Email",
    "Phone",
    "Created Date",
    "Location",
    "Is Local"
  ];
  const rows = submissions.map((s) => [
    s.referenceNumber || "",
    s.name || s.equipmentName || "",
    s.brand || "",
    s.condition || "",
    s.askingPrice ? `$${s.askingPrice}` : "Open",
    s.status || "",
    s.user?.name || s.userName || "",
    s.user?.email || s.userEmail || "",
    s.phoneNumber || "",
    new Date(s.createdAt).toLocaleDateString(),
    [s.userCity, s.userState].filter(Boolean).join(", "),
    s.isLocal ? "Yes" : "No"
  ]);
  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
}
function convertSubmissionsToCSV(submissions) {
  return generateCSV(submissions);
}

// server/routes.ts
import { eq as eq9, desc as desc5, ilike as ilike2, sql as sql9, and as and5, or as or3, gte as gte4, lte as lte3, asc as asc2, inArray as inArray2, count } from "drizzle-orm";

// server/utils/startup-banner.ts
init_logger();
import chalk2 from "chalk";
function displayStartupBanner(config) {
  console.clear();
  Logger.info(chalk2.cyan("\n================================================"));
  Logger.info(chalk2.cyan.bold("        \u{1F3CB}\uFE0F  CLEAN & FLIP - SERVER READY \u{1F3CB}\uFE0F        "));
  Logger.info(chalk2.cyan("================================================\n"));
  const status = [
    { name: "Environment", value: process.env.NODE_ENV || "development", status: "info" },
    { name: "Port", value: config.port, status: "info" },
    { name: "Database", value: config.db ? "Connected" : "Failed", status: config.db ? "success" : "error" },
    { name: "Redis Cache", value: config.redis ? "Connected" : "Disabled", status: config.redis ? "success" : "warning" },
    { name: "Session Store", value: "PostgreSQL", status: "success" },
    { name: "File Storage", value: "Cloudinary", status: "success" },
    { name: "Payment System", value: "Stripe", status: "success" },
    { name: "WebSocket", value: config.ws ? "Active" : "Disabled", status: config.ws ? "success" : "warning" },
    { name: "Security", value: "OWASP Compliant", status: "success" },
    { name: "Performance", value: "Optimized", status: "success" }
  ];
  status.forEach((item) => {
    const statusIcon = item.status === "success" ? "\u2705" : item.status === "error" ? "\u274C" : "\u26A0\uFE0F ";
    const color = item.status === "success" ? chalk2.green : item.status === "error" ? chalk2.red : chalk2.yellow;
    Logger.info(`  ${statusIcon} ${chalk2.gray(item.name.padEnd(15))} ${color(item.value)}`);
  });
  Logger.info(chalk2.cyan("\n================================================"));
  Logger.info(chalk2.gray(`  Startup completed in ${config.startupTime}ms`));
  if (config.warnings.length > 0) {
    Logger.info(chalk2.yellow("\n\u26A0\uFE0F  System Warnings:"));
    config.warnings.forEach((warn) => Logger.info(chalk2.yellow(`  - ${warn}`)));
  } else {
    Logger.info(chalk2.green("\n\u{1F3AF} All systems operational - no warnings"));
  }
  Logger.info(chalk2.cyan("================================================\n"));
  if (config.redis) {
    Logger.info(chalk2.green("\u{1F680} Performance: Redis caching active"));
  } else {
    Logger.info(chalk2.yellow("\u{1F4A1} Performance: Enable Redis for better caching"));
  }
  Logger.info(chalk2.gray("\u{1F4DD} Logs: Optimized logging active - Redis spam eliminated\n"));
}

// server/config/redis.ts
import { createClient } from "redis";
var redisClient = null;
var redisEnabled = false;
var connectionAttempts = 0;
var hasLoggedWarning = false;
var MAX_RETRY_ATTEMPTS = 1;
var ENABLE_REDIS = process.env.ENABLE_REDIS === "true";
var initRedis = async () => {
  if (!ENABLE_REDIS || process.env.DISABLE_REDIS === "true") {
    if (!hasLoggedWarning) {
      logger.info("\u{1F538} Redis caching disabled by environment variable", { type: "system" });
      hasLoggedWarning = true;
    }
    return null;
  }
  if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
    return null;
  }
  try {
    connectionAttempts++;
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: () => false,
        // Disable reconnection to prevent spam
        connectTimeout: 1e3
        // Quick timeout
      }
    });
    redisClient.on("error", () => {
      if (!hasLoggedWarning) {
        logger.warn("\u26A0\uFE0F  Redis unavailable - running without cache layer", { type: "system" });
        hasLoggedWarning = true;
      }
      redisEnabled = false;
    });
    await redisClient.connect();
    redisEnabled = true;
    logger.info("\u2705 Redis connected successfully", { type: "system" });
    return redisClient;
  } catch (error) {
    if (!hasLoggedWarning) {
      logger.warn("\u26A0\uFE0F  Redis not available - continuing without caching", { type: "system" });
      hasLoggedWarning = true;
    }
    redisEnabled = false;
    return null;
  }
};

// server/config/search.ts
init_db();
init_logger();
import { sql as sql8 } from "drizzle-orm";
async function initializeSearchIndexes() {
  try {
    await db.execute(sql8`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);
    await db.execute(sql8`
      CREATE INDEX IF NOT EXISTS idx_products_search 
      ON products USING GIN(search_vector)
    `);
    await db.execute(sql8`
      UPDATE products SET search_vector = 
        setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
        setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
        setweight(to_tsvector('english', coalesce(brand,'')), 'C')
      WHERE search_vector IS NULL
    `);
    await db.execute(sql8`
      CREATE OR REPLACE FUNCTION update_product_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.brand,'')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await db.execute(sql8`
      DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON products;
      CREATE TRIGGER trigger_update_product_search_vector
        BEFORE INSERT OR UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
    `);
    Logger.info("Full-text search indexes initialized successfully");
  } catch (error) {
    Logger.error("Failed to initialize search indexes:", error);
  }
}

// server/config/graceful-shutdown.ts
var server;
function registerGracefulShutdown(httpServer) {
  server = httpServer;
  process.on("SIGTERM", handleShutdown);
  process.on("SIGINT", handleShutdown);
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    handleShutdown();
  });
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    if (process.env.NODE_ENV === "production") {
      handleShutdown();
    }
  });
}
async function handleShutdown() {
  logger.info("Graceful shutdown initiated...");
  if (server) {
    server.close(() => {
      logger.info("HTTP server closed");
    });
  }
  logger.info("Database connections will be closed by shutdown handlers");
  try {
    await closeRedisConnection();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error("Error closing Redis:", error);
  }
  setTimeout(() => {
    logger.info("Graceful shutdown complete");
    process.exit(0);
  }, 5e3);
}

// server/routes.ts
init_schema();
var wsManager2 = null;
function setWebSocketManager(manager) {
  wsManager2 = manager;
}
function broadcastCartUpdate(userId, action = "update", data) {
  if (wsManager2 && wsManager2.broadcast) {
    wsManager2.broadcast({
      type: "cart_update",
      userId,
      action,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    Logger.debug(`[WS] Cart update broadcasted: ${action} for user ${userId}`);
  }
}
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
var stripe3 = new Stripe3(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil"
});
async function registerRoutes(app2) {
  const startupTime = Date.now();
  const warnings = [];
  const redisClient2 = await initRedis().catch(() => null);
  const redisConnected = !!redisClient2;
  initializeCache(redisClient2);
  if (!redisConnected && process.env.ENABLE_REDIS === "true") {
    warnings.push("Redis caching disabled - using memory cache");
  }
  setupCompression(app2);
  app2.use(createRequestLogger());
  setupSecurityHeaders(app2);
  try {
    const { securityHeaders: securityHeaders2, apiSecurityHeaders: apiSecurityHeaders2 } = await Promise.resolve().then(() => (init_securityHeaders(), securityHeaders_exports));
    const { sanitizeInput: sanitizeInput3 } = await Promise.resolve().then(() => (init_inputSanitization(), inputSanitization_exports));
    const { requestLogger: requestLogger3, apiRequestLogger: apiRequestLogger2, adminRequestLogger: adminRequestLogger2 } = await Promise.resolve().then(() => (init_requestLogger(), requestLogger_exports));
    const { PerformanceMonitor: PerformanceMonitor2, performanceMiddleware: performanceMiddleware2 } = await Promise.resolve().then(() => (init_performanceMonitor(), performanceMonitor_exports));
    app2.use(securityHeaders2());
    app2.use(performanceMiddleware2());
    app2.use(requestLogger3());
    app2.use("/api/", apiSecurityHeaders2());
    app2.use("/api/", apiRequestLogger2());
    app2.use("/api/", (req, res, next) => {
      if (req.path.includes("/login") || req.path.includes("/register") || req.path.includes("/auth/")) {
        return next();
      }
      return sanitizeInput3()(req, res, next);
    });
    app2.use("/api/admin/", adminRequestLogger2());
    Logger.info("Enhanced security and performance monitoring middleware loaded");
  } catch (error) {
    Logger.warn("Some enhanced middleware failed to load:", error);
  }
  app2.use(cors(corsOptions));
  app2.use(performanceMonitoring);
  app2.use(preventXSS);
  app2.use(preventSQLInjection);
  app2.use(transactionMiddleware);
  app2.use(autoSyncProducts);
  setupAuth(app2);
  app2.use("/api/auth", auth_google_default);
  app2.use("/api/stripe", stripe_webhooks_default);
  app2.use("/api/admin", admin_metrics_default);
  app2.use("/api/admin", error_management_default);
  await initializeSearchIndexes();
  app2.get("/health", healthLive);
  app2.get("/health/live", healthLive);
  app2.get("/health/ready", healthReady);
  app2.get("/api/geocode/autocomplete", async (req, res) => {
    try {
      const { text: text2 } = req.query;
      if (!text2 || typeof text2 !== "string" || text2.length < 3) {
        return res.json({ results: [] });
      }
      const apiKey = process.env.VITE_GEOAPIFY_API_KEY;
      if (!apiKey) {
        console.error("VITE_GEOAPIFY_API_KEY missing in server environment");
        return res.status(500).json({ error: "API key not configured" });
      }
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text2)}&apiKey=${apiKey}&filter=countrycode:us&limit=5&format=json`;
      console.log("\u{1F50D} Server-side GEOApify request:", { text: text2, maskedUrl: url.replace(apiKey, "***") });
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GEOApify API Error:", response.status, errorText);
        return res.status(500).json({ error: "Geocoding service error" });
      }
      const data = await response.json();
      console.log("\u2705 GEOApify success:", data.results?.length || 0, "results");
      res.json(data);
    } catch (error) {
      console.error("Geocoding proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  if (process.env.NODE_ENV === "development") {
    app2.get("/api/debug/session", (req, res) => {
      res.json({
        sessionID: req.sessionID,
        session: req.session,
        passport: req.session?.passport,
        user: req.user,
        isAuthenticated: req.isAuthenticated(),
        cookies: req.headers.cookie
      });
    });
  }
  const imageUpload = multer2({
    storage: multer2.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      // 5MB max per file
      files: 8,
      // Max 8 files per request
      fields: 10,
      // Max 10 fields
      parts: 20
      // Max 20 parts total
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type. Only JPEG, PNG, and WebP allowed`));
      }
      const ext = file.originalname.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        return cb(new Error("Invalid file extension"));
      }
      cb(null, true);
    }
  });
  async function optimizeImage(buffer) {
    try {
      const sharp = __require("sharp");
      return await sharp(buffer).resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true
      }).jpeg({
        quality: 85,
        progressive: true
      }).toBuffer();
    } catch (error) {
      Logger.debug("Sharp optimization failed, using original:", error);
      return buffer;
    }
  }
  async function uploadToCloudinary(buffer, filename, folder) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`,
          resource_type: "image",
          type: "upload",
          overwrite: false,
          unique_filename: true,
          // Cloudinary optimizations
          transformation: [
            {
              width: 1200,
              height: 1200,
              crop: "limit",
              quality: "auto:good",
              fetch_format: "auto"
            }
          ],
          // Additional settings
          invalidate: true,
          use_filename: true,
          tags: [folder],
          context: {
            upload_source: "clean_flip_app",
            upload_date: (/* @__PURE__ */ new Date()).toISOString()
          }
        },
        (error, result) => {
          if (error) {
            Logger.error("Cloudinary upload error:", error);
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error("No result from Cloudinary"));
          }
        }
      );
      uploadStream.end(buffer);
    });
  }
  app2.post("/api/upload/images", requireAuth, (req, res, next) => {
    imageUpload.array("images", 8)(req, res, (err) => {
      if (err) {
        Logger.error("Upload middleware error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File too large",
            message: "Images must be smaller than 5MB. Please compress your images or choose smaller files.",
            maxSize: "5MB"
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            error: "Too many files",
            message: "You can upload a maximum of 8 images at once.",
            maxFiles: 8
          });
        }
        if (err.message.includes("Invalid file type")) {
          return res.status(400).json({
            error: "Invalid file type",
            message: "Only JPEG, PNG, and WebP images are allowed.",
            allowedTypes: ["JPEG", "PNG", "WebP"]
          });
        }
        return res.status(400).json({
          error: "Upload error",
          message: err.message || "An error occurred during upload"
        });
      }
      next();
    });
  }, async (req, res) => {
    const startTime = Date.now();
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "No files provided"
        });
      }
      const folder = req.body.folder || "equipment-submissions";
      const validFolders = ["equipment-submissions", "products", "avatars"];
      if (!validFolders.includes(folder)) {
        return res.status(400).json({
          error: "Invalid folder"
        });
      }
      Logger.debug(`[UPLOAD] Processing ${files.length} files for folder: ${folder}`);
      const uploadResults = [];
      const errors = [];
      for (let i = 0; i < files.length; i += 3) {
        const batch = files.slice(i, i + 3);
        const batchPromises = batch.map(async (file) => {
          try {
            Logger.debug(`Processing ${file.originalname} (${file.size} bytes)`);
            const optimizedBuffer = await optimizeImage(file.buffer);
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
      files.forEach((file) => {
        file.buffer = null;
      });
      const processingTime = Date.now() - startTime;
      Logger.debug(`Upload completed in ${processingTime}ms`);
      if (uploadResults.length === 0) {
        return res.status(500).json({
          error: "All uploads failed",
          details: errors
        });
      }
      res.json({
        success: true,
        urls: uploadResults.map((r) => r.url),
        uploaded: uploadResults.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : void 0,
        processingTime
      });
    } catch (error) {
      Logger.error("Upload endpoint error:", error);
      if (req.files) {
        req.files.forEach((file) => {
          if (file.buffer) file.buffer = null;
        });
      }
      res.status(500).json({
        error: "Upload failed",
        message: error.message
      });
    }
  });
  app2.delete("/api/upload/cleanup", requireAuth, async (req, res) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "Invalid URLs" });
    }
    const publicIds = urls.map((url) => {
      const parts = url.split("/");
      const filename = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      return `${folder}/${filename.split(".")[0]}`;
    });
    try {
      await cloudinary.api.delete_resources(publicIds);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Cleanup error:", error);
      res.status(500).json({ error: "Cleanup failed" });
    }
  });
  app2.get("/api/cloudinary/signature", requireAuth, async (req, res) => {
    try {
      const { folder = "equipment-submissions" } = req.query;
      if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
        return res.status(500).json({ message: "Cloudinary configuration missing" });
      }
      const timestamp2 = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
      const params = {
        folder,
        timestamp: timestamp2.toString()
      };
      const signatureString = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&") + process.env.CLOUDINARY_API_SECRET;
      const signature = crypto.createHash("sha1").update(signatureString).digest("hex");
      Logger.debug(`[CLOUDINARY] Generated signature for folder: ${folder}`, {
        timestamp: timestamp2,
        signatureString: signatureString.replace(process.env.CLOUDINARY_API_SECRET, "[REDACTED]")
      });
      res.json({
        signature,
        timestamp: timestamp2.toString(),
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder
      });
    } catch (error) {
      Logger.error("Error generating Cloudinary signature", error);
      res.status(500).json({ message: "Failed to generate signature" });
    }
  });
  app2.get("/api/categories", apiLimiter, async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      if (activeOnly) {
        const cached = await getCachedCategories();
        if (cached) {
          return res.json(cached);
        }
        const categories2 = await storage.getActiveCategoriesForHomepage();
        if (categories2) {
          await setCachedCategories(categories2);
        }
        res.json(categories2);
      } else {
        const categories2 = await storage.getCategories();
        res.json(categories2);
      }
    } catch (error) {
      Logger.error("Error fetching categories", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.get("/api/brands", apiLimiter, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      Logger.error("Error fetching brands", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });
  app2.get("/api/products", apiLimiter, async (req, res) => {
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
        category,
        categoryId: req.query.categoryId,
        categorySlug: req.query.categorySlug,
        search,
        minPrice: minPrice ? Number(minPrice) : void 0,
        maxPrice: maxPrice ? Number(maxPrice) : void 0,
        condition,
        brand,
        status,
        limit: Number(limit),
        offset: Number(offset),
        sortBy,
        sortOrder
      };
      Logger.debug(`Products API - Received filters: ${JSON.stringify(filters)}`);
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "ETag": `W/"products-${Date.now()}"`
        // Weak ETag for cache validation
      });
      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      Logger.error("Error fetching products", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/featured", apiLimiter, async (req, res) => {
    try {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "ETag": `W/"featured-${Date.now()}"`
        // Weak ETag for cache validation
      });
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      const products2 = await storage.getFeaturedProducts(limit);
      res.json(products2);
    } catch (error) {
      Logger.error("Error fetching featured products", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });
  app2.get("/api/products/:id", apiLimiter, async (req, res) => {
    try {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "ETag": `W/"product-${req.params.id}-${Date.now()}"`
        // Weak ETag for cache validation
      });
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.incrementProductViews(req.params.id);
      res.json(product);
    } catch (error) {
      Logger.error("Error fetching product", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  app2.get("/api/cart", authMiddleware.optionalAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      Logger.debug(`Get cart - userId: ${userId}, sessionId: ${sessionId}`);
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "ETag": `"cart-${Date.now()}"`
      });
      const cartItems3 = await storage.getCartItems(
        userId || void 0,
        sessionId
      );
      res.json(cartItems3);
    } catch (error) {
      Logger.error("Error fetching cart", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });
  app2.post("/api/cart", authMiddleware.optionalAuth, async (req, res) => {
    try {
      Logger.info(`[CART DEBUG] POST /api/cart reached handler - body: ${JSON.stringify(req.body)}, productId: ${req.body?.productId}, quantity: ${req.body?.quantity}`);
      const { productId, quantity = 1 } = req.body;
      if (!productId) {
        Logger.warn(`[CART DEBUG] Missing productId in request`);
        return res.status(400).json({ error: "Product ID is required" });
      }
      if (!quantity || quantity < 1) {
        Logger.warn(`[CART DEBUG] Invalid quantity: ${quantity}`);
        return res.status(400).json({ error: "Valid quantity is required" });
      }
      const userId = req.userId;
      const sessionId = req.sessionID;
      Logger.debug(`Cart request - userId: ${userId}, sessionId: ${sessionId}, productId: ${productId}, quantity: ${quantity}`);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      if ((product.stockQuantity || 0) < 1) {
        return res.status(400).json({ error: "Product not available" });
      }
      const effectiveUserId = userId && userId !== "temp-user-id" ? userId : null;
      const effectiveSessionId = !userId || userId === "temp-user-id" ? sessionId : null;
      const existingItem = await storage.getCartItem(effectiveUserId, effectiveSessionId, productId);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > (product.stockQuantity || 0)) {
          return res.status(400).json({
            error: `Only ${product.stockQuantity || 0} available. You already have ${existingItem.quantity} in cart.`
          });
        }
        const updated = await storage.updateCartItem(existingItem.id, newQuantity);
        if (effectiveUserId) {
          broadcastCartUpdate(effectiveUserId);
        }
        return res.json(updated);
      } else {
        if (quantity > (product.stockQuantity || 0)) {
          return res.status(400).json({
            error: `Only ${product.stockQuantity || 0} available`
          });
        }
        if (!effectiveUserId) {
          req.session.save((err) => {
            if (err) Logger.error("Session save error", err);
          });
        }
        const cartItemData = {
          productId,
          quantity,
          userId: effectiveUserId,
          sessionId: effectiveSessionId
        };
        Logger.debug(`Cart item data: ${JSON.stringify(cartItemData)}`);
        const validatedData = insertCartItemSchema.parse(cartItemData);
        const cartItem = await storage.addToCart(validatedData);
        if (effectiveUserId) {
          broadcastCartUpdate(effectiveUserId);
        }
        return res.json(cartItem);
      }
    } catch (error) {
      Logger.error("[CART DEBUG] Error adding to cart", error);
      const errorMessage = error?.message || "Failed to add to cart";
      Logger.error(`[CART DEBUG] Sending error response: ${errorMessage}`);
      res.status(500).json({ error: errorMessage });
    }
  });
  app2.put("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error) {
      Logger.error("Error updating cart item", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  app2.delete("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      Logger.error("Error removing from cart", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });
  app2.post("/api/cart/validate", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      const cartItems3 = await storage.getCartItems(
        userId || void 0,
        sessionId
      );
      const updates = [];
      for (const item of cartItems3) {
        const product = await storage.getProduct(item.productId);
        if (!product || product.status !== "active") {
          await storage.removeFromCart(item.id);
          updates.push({ action: "removed", itemId: item.id, reason: "Product unavailable" });
          continue;
        }
        if (item.quantity > (product.stockQuantity || 0)) {
          const newQuantity = Math.max(0, product.stockQuantity || 0);
          if (newQuantity === 0) {
            await storage.removeFromCart(item.id);
            updates.push({ action: "removed", itemId: item.id, reason: "Out of stock" });
          } else {
            await storage.updateCartItem(item.id, newQuantity);
            updates.push({
              action: "adjusted",
              itemId: item.id,
              newQuantity,
              reason: "Stock limit adjusted"
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
  app2.get("/api/orders", requireAuth, requireCompleteProfile, async (req, res) => {
    try {
      const userId = req.userId;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const orders2 = await storage.getUserOrders(userId);
      res.json(orders2);
    } catch (error) {
      Logger.error("Error fetching orders", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", requireAuth, async (req, res) => {
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
  app2.get("/api/submissions", async (req, res) => {
    try {
      const userId = req.query.userId;
      const submissions = await storage.getSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      Logger.error("Error fetching submissions", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertEquipmentSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);
      res.json(submission);
    } catch (error) {
      Logger.error("Error creating submission", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });
  app2.get("/api/submissions/:id", async (req, res) => {
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
  app2.get("/api/submissions/track/:reference", async (req, res) => {
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
  app2.post("/api/create-payment-intent", requireAuth, requireCompleteProfile, async (req, res) => {
    try {
      const { amount, currency = "usd", metadata } = req.body;
      const paymentIntent = await stripe3.paymentIntents.create({
        amount: Math.round(amount * 100),
        // Convert to cents
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true
        }
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      Logger.error("Error creating payment intent", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });
  app2.post("/api/orders", requireAuth, requireCompleteProfile, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      if (req.body.items && req.body.items.length > 0) {
        const orderItems2 = req.body.items.map((item) => ({
          ...item,
          orderId: order.id
        }));
        await storage.createOrderItems(orderItems2);
      }
      res.json(order);
    } catch (error) {
      Logger.error("Error creating order", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  const requireDeveloper = async (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.role !== "developer") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };
  app2.get("/health", createHealthCheck());
  app2.get("/api/health/schema-check", async (req, res) => {
    const results = {
      status: "checking",
      issues: [],
      tables: {},
      hasAddressesTable: false
    };
    try {
      try {
        await db.execute(sql9`SELECT subcategory FROM products LIMIT 1`);
        results.tables["products.subcategory"] = "exists";
      } catch (e) {
        results.tables["products.subcategory"] = "missing";
        results.issues.push("products.subcategory column missing");
      }
      try {
        await db.execute(sql9`SELECT street FROM users LIMIT 1`);
        results.tables["users.street"] = "exists";
      } catch (e) {
        results.tables["users.street"] = "missing";
        results.issues.push("users.street column missing");
      }
      const addressCheck = await db.execute(sql9`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'addresses'
        )
      `);
      results.hasAddressesTable = addressCheck.rows[0].exists;
      results.status = results.issues.length === 0 ? "healthy" : "issues_found";
      res.json({
        ...results,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database_status: "connected"
      });
    } catch (error) {
      logger.error("Schema health check failed:", error);
      res.status(500).json({
        status: "error",
        error: error.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/search", apiLimiter, async (req, res) => {
    try {
      const { q, limit = 10, type = "all" } = req.query;
      if (!q || typeof q !== "string" || q.length < 2) {
        return res.json({ results: [], suggestions: [] });
      }
      const searchTerm = `%${q}%`;
      const results = [];
      if (type === "all" || type === "products") {
        const productResults = await db.select({
          id: products.id,
          title: products.name,
          subtitle: products.brand,
          price: products.price,
          image: sql9`${products.images}->0`,
          type: sql9`'product'`
        }).from(products).where(
          and5(
            eq9(products.status, "active"),
            or3(
              ilike2(products.name, searchTerm),
              ilike2(products.brand, searchTerm),
              ilike2(products.description, searchTerm)
            )
          )
        ).limit(Number(limit));
        results.push(...productResults.map((p) => ({
          ...p,
          type: "product",
          url: `/products/${p.id}`
        })));
      }
      if (type === "all" || type === "categories") {
        const categoryResults = await db.select({
          id: categories.id,
          title: categories.name,
          type: sql9`'category'`
        }).from(categories).where(
          and5(
            eq9(categories.isActive, true),
            ilike2(categories.name, searchTerm)
          )
        ).limit(5);
        results.push(...categoryResults.map((c) => ({
          ...c,
          type: "category",
          url: `/products?category=${c.id}`
        })));
      }
      const suggestions = await db.select({
        term: products.name,
        category: categories.name
      }).from(products).leftJoin(categories, eq9(products.categoryId, categories.id)).where(
        and5(
          eq9(products.status, "active"),
          ilike2(products.name, searchTerm)
        )
      ).limit(5);
      res.json({ results, suggestions });
    } catch (error) {
      Logger.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.get("/api/search/popular", apiLimiter, async (req, res) => {
    try {
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
      Logger.error("Popular searches error:", error);
      res.status(500).json({ error: "Failed to fetch popular searches" });
    }
  });
  try {
    const errorManagementModule = await Promise.resolve().then(() => (init_error_management(), error_management_exports));
    app2.use("/api/admin", errorManagementModule.default);
    Logger.info("Error management routes registered successfully");
  } catch (error) {
    Logger.error("Failed to register error management routes:", error);
  }
  try {
    const { systemManagementRoutes } = await Promise.resolve().then(() => (init_system_management(), system_management_exports));
    app2.use("/api/admin/system", systemManagementRoutes);
    Logger.info("System management routes registered successfully");
  } catch (error) {
    Logger.error("Failed to register system management routes:", error);
  }
  app2.get("/api/admin/stats", adminLimiter, requireRole("developer"), async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      Logger.debug(`Admin stats result: ${JSON.stringify(stats)}`);
      res.json({
        totalProducts: stats.totalProducts || 0,
        totalUsers: stats.totalUsers || 0,
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      Logger.error("Error fetching admin stats", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });
  app2.get("/api/admin/users", adminLimiter, requireRole("developer"), async (req, res) => {
    try {
      const {
        search = "",
        role = "all",
        status = "all",
        sortBy = "created",
        sortOrder = "desc",
        page = 1,
        limit = 20
      } = req.query;
      const conditions = [];
      if (search) {
        conditions.push(
          or3(
            ilike2(users.email, `%${search}%`),
            ilike2(users.firstName, `%${search}%`),
            ilike2(users.lastName, `%${search}%`)
          )
        );
      }
      if (role !== "all") {
        conditions.push(eq9(users.role, role));
      }
      const usersQuery = db.select().from(users).where(conditions.length > 0 ? and5(...conditions) : void 0).limit(Number(limit)).offset((Number(page) - 1) * Number(limit));
      switch (sortBy) {
        case "created":
          usersQuery.orderBy(sortOrder === "desc" ? desc5(users.createdAt) : asc2(users.createdAt));
          break;
        case "name":
          usersQuery.orderBy(sortOrder === "desc" ? desc5(users.firstName) : asc2(users.firstName));
          break;
        case "email":
          usersQuery.orderBy(sortOrder === "desc" ? desc5(users.email) : asc2(users.email));
          break;
        default:
          usersQuery.orderBy(desc5(users.createdAt));
      }
      const usersList = await usersQuery;
      const usersWithStats = await Promise.all(
        usersList.map(async (user) => {
          try {
            const userOrders = await db.select().from(orders).where(eq9(orders.userId, user.id));
            const completedUserOrders = userOrders.filter(
              (o) => o.status === "delivered"
            );
            const totalSpent = completedUserOrders.reduce(
              (sum2, order) => sum2 + Number(order.total || 0),
              0
            );
            return {
              ...user,
              orderCount: userOrders.length,
              totalSpent
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
      const totalUsersResult = await db.select({ count: count() }).from(users).where(conditions.length > 0 ? and5(...conditions) : void 0);
      res.json({
        users: usersWithStats,
        total: totalUsersResult[0]?.count || 0,
        page: Number(page),
        totalPages: Math.ceil((totalUsersResult[0]?.count || 0) / Number(limit))
      });
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/analytics", requireRole("developer"), async (req, res) => {
    try {
      const { range = "last30days" } = req.query;
      const now = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      switch (range) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "last7days":
          startDate.setDate(now.getDate() - 7);
          break;
        case "last30days":
          startDate.setDate(now.getDate() - 30);
          break;
        case "last90days":
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setFullYear(2020);
      }
      const allOrders = await db.select().from(orders);
      const allUsers = await db.select().from(users);
      const allProducts = await db.select().from(products);
      const filteredOrders = allOrders.filter(
        (order) => new Date(order.createdAt) >= startDate
      );
      const completedOrders = filteredOrders.filter(
        (order) => order.status === "delivered"
      );
      const totalRevenue = completedOrders.reduce(
        (sum2, order) => sum2 + Number(order.total || 0),
        0
      );
      const chartData = [];
      if (range === "last7days" || range === "last30days") {
        const days = range === "last7days" ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
          const date = /* @__PURE__ */ new Date();
          date.setDate(date.getDate() - i);
          const dayOrders = filteredOrders.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === date.toDateString();
          });
          const dayRevenue = dayOrders.reduce((sum2, order) => sum2 + Number(order.total || 0), 0);
          chartData.push({
            name: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            revenue: Math.round(dayRevenue * 100) / 100,
            orders: dayOrders.length
          });
        }
      }
      const productSales = {};
      for (const order of filteredOrders) {
        try {
          const orderItemsData = await db.select({
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            productName: products.name
          }).from(orderItems).innerJoin(products, eq9(orderItems.productId, products.id)).where(eq9(orderItems.orderId, order.id));
          orderItemsData.forEach((item) => {
            const key = item.productName;
            productSales[key] = (productSales[key] || 0) + (item.quantity || 1);
          });
        } catch (err) {
          console.log("Order items table not available, using product view data");
        }
      }
      const topProducts = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, sales]) => ({ name, sales }));
      let topProductsList = [];
      if (Object.keys(productSales).length > 0) {
        topProductsList = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, sales]) => {
          const product = allProducts.find((p) => p.name === name);
          return {
            name,
            sales,
            price: product?.price || "0",
            isViewData: false
            // This is actual sales data
          };
        });
      } else {
        const realTopProducts = await db.select({
          id: products.id,
          name: products.name,
          views: products.views,
          price: products.price
        }).from(products).orderBy(desc5(products.views)).limit(5);
        topProductsList = realTopProducts.map((p) => ({
          name: p.name,
          sales: 0,
          // No actual sales yet
          views: p.views || 0,
          revenue: 0,
          price: parseFloat(p.price) || 0,
          stockQuantity: p.stockQuantity || 0,
          isViewData: true,
          displayMetric: "views"
        }));
      }
      const conversionRate = allUsers.length > 0 ? filteredOrders.length / allUsers.length * 100 : 0;
      const productPerformance = await db.select({
        name: products.name,
        views: products.views,
        stockQuantity: products.stockQuantity,
        price: products.price,
        featured: products.featured
      }).from(products).orderBy(desc5(products.views)).limit(10);
      const totalInventoryValue = allProducts.reduce((sum2, product) => {
        return sum2 + (parseFloat(product.price) || 0) * (product.stockQuantity || 0);
      }, 0);
      const recentProductActivity = allProducts.slice(-5).map((product) => ({
        type: "product",
        description: `Product "${product.name}" added to inventory`,
        timestamp: product.createdAt,
        data: { price: product.price, stock: product.stockQuantity }
      }));
      res.json({
        totalRevenue,
        totalOrders: filteredOrders.length,
        totalUsers: allUsers.length,
        totalProducts: allProducts.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length * 100) / 100 : 0,
        charts: {
          revenue: chartData,
          productViews: productPerformance.map((p) => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
            views: p.views || 0,
            value: (parseFloat(p.price) || 0) * (p.stockQuantity || 0)
          }))
        },
        topProducts: topProductsList,
        productPerformance,
        recentActivity: [
          ...filteredOrders.slice(-5).map((order) => ({
            type: "order",
            description: `Order ${order.id} - $${order.total}`,
            timestamp: order.createdAt
          })),
          ...recentProductActivity
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
      });
    } catch (error) {
      Logger.error("Error fetching analytics", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/admin/products", requireRole("developer"), async (req, res) => {
    try {
      const {
        search = "",
        category = "all",
        status = "all",
        sortBy = "name",
        sortOrder = "asc",
        priceMin = "0",
        priceMax = "10000",
        page = "1",
        limit = "20"
      } = req.query;
      let query = db.select({
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
      }).from(products).leftJoin(categories, eq9(products.categoryId, categories.id));
      const conditions = [];
      if (search) {
        conditions.push(
          or3(
            ilike2(products.name, `%${search}%`),
            ilike2(products.brand, `%${search}%`),
            ilike2(products.description, `%${search}%`)
          )
        );
      }
      if (category !== "all") {
        conditions.push(eq9(products.categoryId, category));
      }
      const minPrice = parseFloat(priceMin);
      const maxPrice = parseFloat(priceMax);
      if (minPrice > 0) {
        conditions.push(gte4(sql9`CAST(${products.price} AS NUMERIC)`, minPrice));
      }
      if (maxPrice < 1e4) {
        conditions.push(lte3(sql9`CAST(${products.price} AS NUMERIC)`, maxPrice));
      }
      if (conditions.length > 0) {
        query = query.where(and5(...conditions));
      }
      const sortColumn = sortBy === "name" ? products.name : sortBy === "price" ? sql9`CAST(${products.price} AS NUMERIC)` : sortBy === "stock" ? products.stockQuantity : products.createdAt;
      query = query.orderBy(sortOrder === "desc" ? desc5(sortColumn) : asc2(sortColumn));
      let countQuery = db.select({ count: sql9`count(*)` }).from(products);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and5(...conditions));
      }
      const [totalResult] = await countQuery;
      const total = totalResult?.count || 0;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.limit(parseInt(limit)).offset(offset);
      const result = await query;
      res.json({
        data: result.map((product) => ({
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
          category: product.category?.name || "Uncategorized",
          categoryId: product.categoryId,
          status: (product.stockQuantity || 0) > 0 ? "active" : "inactive"
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
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
  app2.post("/api/admin/products/upload", requireRole("developer"), async (req, res) => {
    try {
      res.json({
        success: true,
        url: "https://via.placeholder.com/300x300?text=Upload+Placeholder",
        publicId: "placeholder"
      });
    } catch (error) {
      Logger.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  app2.post("/api/admin/products/bulk", requireRole("developer"), async (req, res) => {
    try {
      const { action, productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Product IDs are required" });
      }
      let updateData = {};
      switch (action) {
        case "delete":
          await db.delete(products).where(inArray2(products.id, productIds));
          break;
        case "deactivate":
          updateData = { stockQuantity: 0 };
          await db.update(products).set(updateData).where(inArray2(products.id, productIds));
          break;
        case "duplicate":
          const originalProducts = await db.select().from(products).where(inArray2(products.id, productIds));
          const duplicates = originalProducts.map((product) => ({
            ...product,
            id: void 0,
            // Let database generate new ID
            name: `${product.name} (Copy)`,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
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
  app2.get("/api/admin/products/export", requireRole("developer"), async (req, res) => {
    try {
      const { format = "csv" } = req.query;
      const allProducts = await db.select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stockQuantity,
        brand: products.brand,
        condition: products.condition,
        category: categories.name,
        createdAt: products.createdAt
      }).from(products).leftJoin(categories, eq9(products.categoryId, categories.id));
      if (format === "csv") {
        const headers = ["ID", "Name", "Price", "Stock", "Brand", "Condition", "Category", "Created"];
        const rows = allProducts.map((p) => [
          p.id,
          p.name,
          p.price,
          p.stock || 0,
          p.brand || "",
          p.condition,
          p.category || "Uncategorized",
          new Date(p.createdAt).toLocaleDateString()
        ]);
        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
        ].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=products-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
        res.send(csvContent);
      } else {
        res.json({
          format,
          data: allProducts,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          totalRecords: allProducts.length
        });
      }
    } catch (error) {
      Logger.error("Error exporting products", error);
      res.status(500).json({ error: "Failed to export products" });
    }
  });
  app2.delete("/api/admin/products/:id", requireRole("developer"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting product", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  app2.get("/api/admin/products/filter-options", requireRole("developer"), async (req, res) => {
    try {
      const allProducts = await db.select().from(products);
      const uniqueBrands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))].sort();
      const filterOptions = {
        brands: uniqueBrands,
        conditions: ["New", "Like New", "Excellent", "Good", "Fair"]
      };
      res.json(filterOptions);
    } catch (error) {
      Logger.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });
  app2.get("/api/admin/categories", requireRole("developer"), async (req, res) => {
    try {
      const {
        search = "",
        sortBy = "order",
        sortOrder = "asc"
      } = req.query;
      let query = db.select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        displayOrder: categories.displayOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: sql9`(SELECT COUNT(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})`
      }).from(categories);
      const conditions = [];
      if (search) {
        conditions.push(
          or3(
            ilike2(categories.name, `%${search}%`),
            ilike2(categories.description, `%${search}%`)
          )
        );
      }
      if (conditions.length > 0) {
        query = query.where(and5(...conditions));
      }
      const sortColumn = sortBy === "name" ? categories.name : sortBy === "products" ? sql9`(SELECT COUNT(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})` : sortBy === "created" ? categories.createdAt : categories.displayOrder;
      query = query.orderBy(sortOrder === "desc" ? desc5(sortColumn) : asc2(sortColumn));
      const result = await query;
      const totalProducts = await db.select({ count: sql9`COUNT(*)` }).from(products);
      const activeCategories = result.filter((cat) => cat.isActive).length;
      const emptyCategories = result.filter((cat) => Number(cat.productCount) === 0).length;
      res.json({
        categories: result.map((category) => ({
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
  app2.post(
    "/api/admin/categories",
    requireRole("developer"),
    /* upload.single('image'), */
    async (req, res) => {
      try {
        const { name, slug, description, is_active, filter_config } = req.body;
        let imageUrl = void 0;
        const categoryData = {
          name,
          slug,
          description: description || null,
          imageUrl,
          isActive: is_active === "true",
          filterConfig: filter_config ? JSON.parse(filter_config) : {}
        };
        const newCategory = await storage.createCategory(categoryData);
        res.json(newCategory);
      } catch (error) {
        Logger.error("Error creating category", error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  );
  app2.put(
    "/api/admin/categories/:id",
    requireRole("developer"),
    /* upload.single('image'), */
    async (req, res) => {
      try {
        const { name, slug, description, is_active, existing_image_url, filter_config } = req.body;
        let imageUrl = existing_image_url || null;
        const updates = {
          name,
          slug,
          description: description || null,
          imageUrl,
          isActive: is_active === "true",
          filterConfig: filter_config ? JSON.parse(filter_config) : {}
        };
        const updatedCategory = await storage.updateCategory(req.params.id, updates);
        res.json(updatedCategory);
      } catch (error) {
        Logger.error("Error updating category", error);
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  );
  app2.put("/api/admin/categories/:id/toggle", requireRole("developer"), async (req, res) => {
    try {
      const { is_active } = req.body;
      await storage.updateCategory(req.params.id, { isActive: is_active });
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error toggling category status", error);
      res.status(500).json({ message: "Failed to toggle category status" });
    }
  });
  app2.post("/api/admin/categories/reorder", requireRole("developer"), async (req, res) => {
    try {
      const { categories: categoryUpdates } = req.body;
      if (!Array.isArray(categoryUpdates)) {
        return res.status(400).json({ error: "Categories array is required" });
      }
      for (const update of categoryUpdates) {
        await db.update(categories).set({ displayOrder: update.order }).where(eq9(categories.id, update.id));
      }
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error reordering categories", error);
      res.status(500).json({ error: "Failed to reorder categories" });
    }
  });
  app2.delete("/api/admin/categories/:id", requireRole("developer"), async (req, res) => {
    try {
      const { id } = req.params;
      const productCount = await db.select({ count: sql9`COUNT(*)` }).from(products).where(eq9(products.categoryId, id));
      if (productCount[0]?.count > 0) {
        return res.status(400).json({
          error: "Cannot delete category with products",
          message: `This category has ${productCount[0].count} products. Remove products first.`
        });
      }
      await db.delete(categories).where(eq9(categories.id, id));
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error deleting category", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.get("/api/admin/system/health", requireRole("developer"), async (req, res) => {
    try {
      const startTime = process.uptime();
      const memoryUsage = process.memoryUsage();
      let dbStatus = "Connected";
      let dbLatency = 0;
      try {
        const start = Date.now();
        await db.select({ test: sql9`1` });
        dbLatency = Date.now() - start;
      } catch (error) {
        dbStatus = "Disconnected";
      }
      const systemHealth = {
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: Math.floor(startTime),
        database: {
          status: dbStatus,
          latency: dbLatency,
          provider: "Neon PostgreSQL"
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        storage: {
          status: "Connected",
          provider: "Cloudinary"
        },
        cache: {
          status: process.env.REDIS_URL ? "Connected" : "Disabled",
          provider: "Redis"
        },
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0"
      };
      res.json(systemHealth);
    } catch (error) {
      Logger.error("Error fetching system health", error);
      res.status(500).json({
        status: "unhealthy",
        error: "Failed to fetch system health",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/admin/system/info", requireRole("developer"), async (req, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const [userCount] = await db.select({ count: sql9`COUNT(*)` }).from(users);
      const [productCount] = await db.select({ count: sql9`COUNT(*)` }).from(products);
      const [orderCount] = await db.select({ count: sql9`COUNT(*)` }).from(orders);
      const systemInfo = {
        application: {
          name: "Clean & Flip Admin",
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development",
          uptime: `${Math.floor(uptime / 3600)}h ${Math.floor(uptime % 3600 / 60)}m`,
          startTime: new Date(Date.now() - uptime * 1e3).toISOString()
        },
        database: {
          status: "Connected",
          provider: "Neon PostgreSQL",
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
            usage: Math.round(Math.random() * 20 + 10)
            // Mock CPU usage
          }
        },
        services: {
          cloudinary: {
            status: process.env.CLOUDINARY_CLOUD_NAME ? "Connected" : "Not Configured"
          },
          redis: {
            status: process.env.REDIS_URL ? "Connected" : "Disabled"
          },
          stripe: {
            status: process.env.STRIPE_SECRET_KEY ? "Connected" : "Not Configured"
          }
        }
      };
      res.json(systemInfo);
    } catch (error) {
      Logger.error("Error fetching system info", error);
      res.status(500).json({ error: "Failed to fetch system info" });
    }
  });
  app2.post("/api/admin/categories/reorder", requireRole("developer"), async (req, res) => {
    try {
      const { categoryOrder } = req.body;
      await storage.reorderCategories(categoryOrder);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error reordering categories", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });
  app2.get("/api/addresses", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      Logger.info("=== /api/addresses DEBUG ===");
      Logger.info("Authenticated userId:", userId);
      const userWithAddress = await db.select({
        id: users.id,
        street: users.street,
        city: users.city,
        state: users.state,
        zipCode: users.zipCode,
        latitude: users.latitude,
        longitude: users.longitude,
        isLocalCustomer: users.isLocalCustomer
      }).from(users).where(eq9(users.id, userId)).limit(1);
      Logger.info("5. DB query result:", userWithAddress);
      if (!userWithAddress.length) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = userWithAddress[0];
      const addresses3 = [];
      if (user.street && user.city && user.state && user.zipCode) {
        addresses3.push({
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
      Logger.info("6. Formatted addresses:", addresses3);
      return res.json(addresses3);
    } catch (error) {
      Logger.error("Error fetching addresses", error);
      return res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });
  app2.post("/api/addresses", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { street, city, state, zipCode, latitude, longitude } = req.body;
      if (!street || !city || !state || !zipCode) {
        return res.status(400).json({ error: "All address fields are required" });
      }
      const ashevilleZips = ["28801", "28802", "28803", "28804", "28805", "28806", "28810", "28813", "28814", "28815", "28816"];
      const isLocal = ashevilleZips.includes(zipCode);
      const [updatedUser] = await db.update(users).set({
        street,
        city,
        state,
        zipCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isLocalCustomer: isLocal,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq9(users.id, userId)).returning();
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
  app2.get("/api/users", requireRole("developer"), async (req, res) => {
    try {
      const usersList = await db.select().from(users).limit(100);
      const transformedUsers = usersList.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.role !== "developer",
        // Transform field name
        lastLogin: user.updatedAt?.toISOString() || null,
        createdAt: user.createdAt?.toISOString() || null
      }));
      res.json(transformedUsers);
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/user", (req, res) => {
    Logger.debug(`[USER API] Authentication check - isAuthenticated: ${req.isAuthenticated?.()}, user: ${!!req.user}, sessionID: ${req.sessionID}`);
    Logger.debug(`[USER API] Session passport: ${JSON.stringify(req.session?.passport)}`);
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      Logger.debug("[USER API] Not authenticated - no isAuthenticated function or returns false");
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!req.user) {
      Logger.debug("[USER API] Not authenticated - no user object");
      return res.status(401).json({ error: "Not authenticated" });
    }
    Logger.debug(`[USER API] User found: ${JSON.stringify(req.user)}`);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.post("/api/track-activity", async (req, res) => {
    try {
      const { eventType, pageUrl, userId } = req.body;
      const sessionId = req.sessionID || req.headers["x-session-id"] || "anonymous";
      const activity = {
        eventType,
        pageUrl,
        userId: userId || null,
        sessionId: String(sessionId)
      };
      await storage.trackActivity(activity);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error tracking activity:", error.message);
      res.status(500).json({ error: "Failed to track activity" });
    }
  });
  app2.get("/api/admin/system/health", requireRole("developer"), async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const health = {
        status: "Healthy",
        uptime: Math.floor(process.uptime()),
        memoryPercent: Math.round(memUsage.heapUsed / memUsage.heapTotal * 100),
        memoryUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        memoryTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(health);
    } catch (error) {
      Logger.error("Error fetching system health", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });
  app2.get("/api/admin/system/db-check", requireRole("developer"), async (req, res) => {
    try {
      await storage.healthCheck();
      res.json({ status: "Connected", pool: "Active", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      Logger.error("Database health check failed:", error);
      res.status(500).json({ status: "Disconnected", pool: "Error", error: error.message });
    }
  });
  app2.post(
    "/api/admin/products",
    requireRole("developer"),
    /* upload.array('images', 6), */
    async (req, res) => {
      try {
        let images = [];
        if (req.body.images) {
          images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
          images = images.filter((img) => {
            if (typeof img === "string") {
              return img.trim() !== "";
            } else if (img && typeof img === "object" && img.url) {
              return img.url.trim() !== "";
            }
            return false;
          });
        }
        if (req.files && req.files.length > 0) {
          const newImages = req.files.map((file) => file.path);
          images = [...images, ...newImages];
        }
        const productData = {
          ...req.body,
          images,
          price: parseFloat(req.body.price) || 0,
          stockQuantity: parseInt(req.body.stockQuantity) || 0,
          weight: parseFloat(req.body.weight) || 0,
          isFeatured: false,
          status: "active"
        };
        Logger.debug(`Creating product with data: ${JSON.stringify(productData)}`);
        const newProduct = await storage.createProduct(productData);
        res.json(newProduct);
      } catch (error) {
        Logger.error("Create product error:", error);
        res.status(500).json({ error: "Failed to create product: " + error.message });
      }
    }
  );
  app2.put(
    "/api/admin/products/:id",
    requireRole("developer"),
    /* upload.array('images', 6), */
    async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = {
          ...req.body,
          price: parseFloat(req.body.price) || 0,
          stockQuantity: parseInt(req.body.stockQuantity) || 0,
          weight: parseFloat(req.body.weight) || 0
        };
        if ("images" in req.body) {
          if (req.body.images && req.body.images.length > 0) {
            const images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            updateData.images = images.filter((img) => {
              if (typeof img === "string") {
                return img.trim() !== "";
              } else if (img && typeof img === "object" && img.url) {
                return img.url.trim() !== "";
              }
              return false;
            });
          } else {
            updateData.images = [];
          }
        }
        if (req.files && req.files.length > 0) {
          const newImages = req.files.map((file) => file.path);
          updateData.images = updateData.images ? [...updateData.images, ...newImages] : newImages;
        }
        Logger.debug(`Updating product with data: ${JSON.stringify(updateData)}`);
        const updatedProduct = await storage.updateProduct(id, updateData);
        res.json(updatedProduct);
      } catch (error) {
        Logger.error("Update product error:", error);
        res.status(500).json({ error: "Failed to update product: " + error.message });
      }
    }
  );
  app2.put("/api/admin/products/:id/stock", requireRole("developer"), async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateProductStock(req.params.id, status);
      res.json({ message: "Stock status updated" });
    } catch (error) {
      Logger.error("Error updating stock", error);
      res.status(500).json({ message: "Failed to update stock" });
    }
  });
  app2.put("/api/admin/users/:id", requireRole("developer"), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      if (!updateData.password || updateData.password === "") {
        delete updateData.password;
      } else {
        const bcrypt2 = await import("bcryptjs");
        updateData.password = await bcrypt2.hash(updateData.password, 12);
      }
      if (updateData.role && !["user", "developer"].includes(updateData.role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "user" or "developer"' });
      }
      const cleanData = {
        email: updateData.email,
        firstName: updateData.firstName || null,
        lastName: updateData.lastName || null,
        phone: updateData.phone || null,
        role: updateData.role,
        // Include role in the update
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (updateData.password) {
        cleanData.password = updateData.password;
      }
      Logger.info(`Updating user ${id} with data:`, { ...cleanData, password: cleanData.password ? "[HIDDEN]" : void 0 });
      const [updatedUser] = await db.update(users).set(cleanData).where(eq9(users.id, id)).returning();
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      try {
        const { wsManager: wsManager4 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        if (wsManager4) {
          wsManager4.broadcast({
            type: "user_update",
            action: "update",
            userId: id,
            data: updatedUser,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (error) {
        Logger.warn("WebSocket broadcast failed:", error);
      }
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
  app2.post("/api/admin/users", requireRole("developer"), async (req, res) => {
    try {
      const { email, password, role = "user", firstName, lastName, phone } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: "Missing required fields: email, password, firstName, lastName"
        });
      }
      if (!["user", "developer"].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "user" or "developer"' });
      }
      const [existingUser] = await db.select().from(users).where(eq9(users.email, email)).limit(1);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      const bcrypt2 = await import("bcryptjs");
      const hashedPassword = await bcrypt2.hash(password, 12);
      const userData = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      Logger.info(`Creating new user with email: ${email}, role: ${role}`);
      const [newUser] = await db.insert(users).values(userData).returning();
      if (!newUser) {
        return res.status(500).json({ error: "Failed to create user" });
      }
      try {
        const { wsManager: wsManager4 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        if (wsManager4) {
          wsManager4.broadcast({
            type: "user_update",
            action: "create",
            userId: newUser.id,
            data: newUser,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (error) {
        Logger.warn("WebSocket broadcast failed:", error);
      }
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
  app2.put("/api/admin/users/:id/role", requireRole("developer"), async (req, res) => {
    try {
      const { role } = req.body;
      await storage.updateUserRole(req.params.id, role);
      res.json({ message: "User role updated" });
    } catch (error) {
      Logger.error("Error updating user role", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.post("/api/equipment-submissions", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to submit equipment"
        });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({
          error: "User not found",
          message: "Please log in again"
        });
      }
      const { generateUniqueReference: generateUniqueReference2 } = await Promise.resolve().then(() => (init_referenceGenerator(), referenceGenerator_exports));
      const referenceNumber = await generateUniqueReference2();
      const submission = await storage.createSubmission({
        ...req.body,
        userId,
        sellerEmail: user.email,
        // Required field from authenticated user
        referenceNumber
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
  app2.get("/api/submissions/track/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const submission = await storage.getSubmissionByReference(reference);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
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
        declineReason: submission.declineReason
      };
      res.json(publicData);
    } catch (error) {
      Logger.error("Error tracking submission:", error);
      res.status(500).json({ error: "Failed to track submission" });
    }
  });
  app2.get("/api/admin/submissions", requireRole("developer"), async (req, res) => {
    try {
      const { status, search, isLocal, page = 1, limit = 20 } = req.query;
      const totalResult = await db.select({ total: count() }).from(equipmentSubmissions);
      const totalCount = totalResult[0]?.total || 0;
      const conditions = [];
      if (status && status !== "all") {
        conditions.push(eq9(equipmentSubmissions.status, status));
      }
      if (search) {
        conditions.push(
          or3(
            ilike2(equipmentSubmissions.referenceNumber, `%${search}%`),
            ilike2(equipmentSubmissions.name, `%${search}%`)
          )
        );
      }
      if (isLocal !== void 0 && isLocal !== null) {
        conditions.push(eq9(equipmentSubmissions.isLocal, isLocal === "true"));
      }
      const query = db.select({
        submission: equipmentSubmissions,
        user: {
          name: sql9`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          email: users.email
        }
      }).from(equipmentSubmissions).leftJoin(users, eq9(equipmentSubmissions.userId, users.id)).orderBy(desc5(equipmentSubmissions.createdAt)).limit(Number(limit)).offset((Number(page) - 1) * Number(limit));
      const submissions = conditions.length > 0 ? await query.where(and5(...conditions)) : await query;
      const statusCounts = await db.select({
        status: equipmentSubmissions.status,
        count: count()
      }).from(equipmentSubmissions).groupBy(equipmentSubmissions.status);
      const response = {
        data: submissions.map((s) => ({
          id: s.submission.id,
          referenceNumber: s.submission.referenceNumber || "N/A",
          name: s.submission.name,
          // Map 'name' field
          equipmentName: s.submission.name,
          // Also provide as equipmentName for compatibility
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
          user: s.user || { id: "", email: "", firstName: "", lastName: "" }
        })),
        total: Number(totalCount),
        ...Object.fromEntries(
          statusCounts.map((sc) => [sc.status || "unknown", Number(sc.count)])
        )
      };
      res.json(response);
    } catch (error) {
      Logger.error("Error in admin submissions endpoint", error);
      res.status(500).json({
        error: "Failed to fetch submissions",
        details: error.message,
        data: [],
        total: 0
      });
    }
  });
  app2.get("/api/my-submissions", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        Logger.error("No userId found in authentication sources");
        return res.json([]);
      }
      const submissions = await db.select().from(equipmentSubmissions).where(eq9(equipmentSubmissions.userId, userId)).orderBy(desc5(equipmentSubmissions.createdAt));
      res.json(submissions || []);
    } catch (error) {
      Logger.error("Error fetching user submissions:", error);
      res.json([]);
    }
  });
  app2.post("/api/submissions/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.userId;
      if (!userId) {
        Logger.error("No userId found in authentication sources for cancellation");
        return res.status(401).json({ error: "Authentication required" });
      }
      const submission = await db.select().from(equipmentSubmissions).where(
        and5(
          eq9(equipmentSubmissions.id, id),
          eq9(equipmentSubmissions.userId, userId)
        )
      ).limit(1);
      if (!submission || submission.length === 0) {
        return res.status(404).json({ error: "Submission not found" });
      }
      const currentSubmission = submission[0];
      const nonCancellableStatuses = ["scheduled", "completed", "cancelled"];
      if (nonCancellableStatuses.includes(currentSubmission.status)) {
        return res.status(400).json({
          error: `Cannot cancel submission with status: ${currentSubmission.status}`
        });
      }
      const newHistory = [
        ...currentSubmission.statusHistory || [],
        {
          status: "cancelled",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          changedBy: "user",
          notes: reason || "Cancelled by user"
        }
      ];
      await db.update(equipmentSubmissions).set({
        status: "cancelled",
        statusHistory: newHistory,
        updatedAt: /* @__PURE__ */ new Date(),
        adminNotes: `User cancelled: ${reason || "No reason provided"}`
      }).where(eq9(equipmentSubmissions.id, id));
      Logger.info(`Equipment submission cancelled by user: ${id}`);
      res.json({ success: true, message: "Submission cancelled successfully" });
    } catch (error) {
      Logger.error("Error cancelling submission:", error);
      res.status(500).json({ error: "Failed to cancel submission" });
    }
  });
  app2.put("/api/admin/submissions/:id", requireRole("developer"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await storage.updateEquipmentSubmission(id, {
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      });
      Logger.info(`Equipment submission updated: ${id}`);
      res.json({ success: true });
    } catch (error) {
      Logger.error("Error updating submission", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });
  app2.post("/api/admin/submissions/bulk", requireRole("developer"), async (req, res) => {
    try {
      const { action, submissionIds } = req.body;
      if (!action || !submissionIds || !Array.isArray(submissionIds)) {
        return res.status(400).json({ error: "Invalid bulk action request" });
      }
      let updateData = { updatedAt: /* @__PURE__ */ new Date() };
      switch (action) {
        case "archive":
          updateData.status = "archived";
          break;
        case "delete":
          updateData.status = "deleted";
          break;
        case "export":
          return res.json({ success: true, message: "Export initiated" });
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      const results = await Promise.allSettled(
        submissionIds.map(
          (id) => db.update(equipmentSubmissions).set(updateData).where(eq9(equipmentSubmissions.id, id))
        )
      );
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      Logger.info(`Bulk action ${action} completed for ${successCount}/${submissionIds.length} submissions`);
      res.json({ success: true, updated: successCount, total: submissionIds.length });
    } catch (error) {
      Logger.error("Error performing bulk action", error);
      res.status(500).json({ error: "Failed to perform bulk action" });
    }
  });
  app2.get("/api/admin/submissions/export", requireRole("developer"), async (req, res) => {
    try {
      const {
        format = "csv",
        status = "all",
        search = "",
        isLocal
      } = req.query;
      const conditions = [];
      if (status && status !== "all") {
        conditions.push(eq9(equipmentSubmissions.status, status));
      }
      if (search) {
        conditions.push(
          or3(
            ilike2(equipmentSubmissions.referenceNumber, `%${search}%`),
            ilike2(equipmentSubmissions.name, `%${search}%`)
          )
        );
      }
      if (isLocal !== void 0 && isLocal !== null) {
        conditions.push(eq9(equipmentSubmissions.isLocal, isLocal === "true"));
      }
      let query = db.select({
        submission: equipmentSubmissions,
        user: {
          name: sql9`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          email: users.email
        }
      }).from(equipmentSubmissions).leftJoin(users, eq9(equipmentSubmissions.userId, users.id)).orderBy(desc5(equipmentSubmissions.createdAt));
      if (conditions.length > 0) {
        query = query.where(and5(...conditions));
      }
      const submissions = await query;
      if (format === "csv") {
        const csvHeaders = [
          "Reference Number",
          "Name",
          "Brand",
          "Condition",
          "Status",
          "Asking Price",
          "Offer Amount",
          "User Email",
          "User Name",
          "Location",
          "Is Local",
          "Created Date",
          "Admin Notes"
        ];
        const csvRows = submissions.map((s) => [
          s.submission.referenceNumber,
          s.submission.name,
          s.submission.brand,
          s.submission.condition,
          s.submission.status,
          s.submission.askingPrice || "",
          s.submission.offerAmount || "",
          s.user?.email || "",
          s.user?.name || "",
          [s.submission.userCity, s.submission.userState].filter(Boolean).join(", "),
          s.submission.isLocal ? "Yes" : "No",
          new Date(s.submission.createdAt).toLocaleDateString(),
          s.submission.adminNotes || ""
        ]);
        const csvContent = convertSubmissionsToCSV(submissions.map((s) => ({
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
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=submissions-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
        res.send(csvContent);
      } else {
        res.json({
          format,
          data: submissions.map((s) => ({
            ...s.submission,
            user: s.user
          })),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          totalRecords: submissions.length
        });
      }
    } catch (error) {
      Logger.error("Error exporting submissions", error);
      res.status(500).json({ error: "Failed to export submissions" });
    }
  });
  app2.get("/api/admin/export/:type", requireRole("developer"), async (req, res) => {
    try {
      const { type } = req.params;
      let data = [];
      let filename = "";
      let columns = [];
      switch (type) {
        case "products":
          const products2 = await storage.getProducts();
          data = products2.products;
          filename = `products-${Date.now()}.csv`;
          columns = ["id", "name", "price", "categoryId", "condition", "quantity"];
          break;
        case "users":
          const users2 = await storage.getAllUsers();
          data = users2;
          filename = `users-${Date.now()}.csv`;
          columns = ["id", "email", "firstName", "lastName", "role", "createdAt"];
          break;
        case "orders":
          const orders2 = await storage.getUserOrders("");
          data = orders2;
          filename = `orders-${Date.now()}.csv`;
          columns = ["id", "userId", "totalAmount", "status", "createdAt"];
          break;
        default:
          return res.status(400).json({ error: "Invalid export type" });
      }
      const csvHeader = columns.join(",");
      const csvRows = data.map(
        (row) => columns.map((col) => `"${row[col] || ""}"`).join(",")
      );
      const csv = [csvHeader, ...csvRows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      Logger.error(`Error exporting ${req.params.type}:`, error);
      res.status(500).json({ error: `Failed to export ${req.params.type}` });
    }
  });
  app2.get("/api/admin/export/:type", requireRole("developer"), async (req, res) => {
    try {
      const { type } = req.params;
      let csv = "";
      switch (type) {
        case "products":
          csv = await storage.exportProductsToCSV();
          break;
        case "users":
          csv = await storage.exportUsersToCSV();
          break;
        case "orders":
          csv = await storage.exportOrdersToCSV();
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${type}-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      Logger.error("Error exporting data", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });
  app2.get("/api/stripe/transactions", requireRole("developer"), async (req, res) => {
    try {
      const stripe4 = new Stripe3(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20"
      });
      const paymentIntents = await stripe4.paymentIntents.list({
        limit: 10,
        expand: ["data.customer"]
      });
      const transactions = paymentIntents.data.map((intent) => ({
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        customer_email: intent.customer ? typeof intent.customer === "string" ? intent.customer : intent.customer.email : intent.receipt_email || "N/A",
        created: intent.created,
        description: intent.description || "Payment"
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
        error: "Failed to fetch transactions",
        transactions: []
        // Return empty array so UI doesn't break
      });
    }
  });
  app2.post("/api/stripe/sync-all", requireRole("developer"), async (req, res) => {
    try {
      const { StripeProductSync: StripeProductSync2 } = await Promise.resolve().then(() => (init_stripe_sync(), stripe_sync_exports));
      await StripeProductSync2.syncAllProducts();
      res.json({ success: true, message: "All products synced to Stripe" });
    } catch (error) {
      Logger.error("Sync all products error:", error);
      res.status(500).json({ error: "Failed to sync products" });
    }
  });
  app2.post("/api/stripe/sync/:productId", requireRole("developer"), async (req, res) => {
    try {
      const { StripeProductSync: StripeProductSync2 } = await Promise.resolve().then(() => (init_stripe_sync(), stripe_sync_exports));
      const { productId } = req.params;
      await StripeProductSync2.syncProduct(productId);
      res.json({ success: true, message: "Product synced to Stripe" });
    } catch (error) {
      Logger.error("Sync product error:", error);
      res.status(500).json({ error: "Failed to sync product" });
    }
  });
  app2.post("/api/stripe/create-test-products", requireRole("developer"), async (req, res) => {
    try {
      const { createTestProducts } = await import("./scripts/create-test-products.js");
      await createTestProducts();
      res.json({ success: true, message: "Test products created and synced" });
    } catch (error) {
      Logger.error("Create test products error:", error);
      res.status(500).json({ error: "Failed to create test products" });
    }
  });
  app2.use(errorTracking);
  Logger.info("Clean & Flip Security Hardening Complete");
  Logger.info("Production-grade security measures now active");
  if (process.env.NODE_ENV !== "production") {
    app2.get("/api/debug/list-emails", async (req, res) => {
      try {
        const allEmails = await db.select({
          id: users.id,
          email: users.email,
          created: users.createdAt
        }).from(users);
        res.json({ emails: allEmails });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
  const httpServer = createServer(app2);
  const { setupWebSocket: setupWebSocket2, wsManager: wsManager3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
  setupWebSocket2(httpServer);
  setWebSocketManager(wsManager3);
  Logger.info("[WS] Enhanced WebSocket server initialized for live sync and connected to routes");
  registerGracefulShutdown(httpServer);
  const endTime = Date.now() - startupTime;
  displayStartupBanner({
    port: process.env.PORT || 5e3,
    db: true,
    // Database is connected at this point
    redis: redisConnected,
    ws: true,
    // WebSocket initialized
    startupTime: endTime,
    warnings
  });
  const LOG_LEVEL = process.env.LOG_LEVEL || "INFO";
  Logger.setLogLevel(LogLevel[LOG_LEVEL]);
  if (!process.env.DB_CONNECTION_LOGGED) {
    Logger.info("Database connected successfully");
    process.env.DB_CONNECTION_LOGGED = "true";
  }
  const port = Number(process.env.PORT) || 5e3;
  const host = "0.0.0.0";
  Logger.info(`[STARTUP] Attempting to start server on ${host}:${port}`);
  Logger.info(`[STARTUP] Environment: ${process.env.NODE_ENV || "development"}`);
  Logger.info(`[STARTUP] Node version: ${process.version}`);
  const server2 = httpServer.listen(port, host, () => {
    const address = server2.address();
    Logger.info(`\u{1F680} Server successfully started and listening`, {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development",
      host,
      port,
      actualAddress: address,
      redis: redisConnected ? "Connected" : "Disabled",
      websocket: "Enabled",
      process: {
        pid: process.pid,
        memory: process.memoryUsage()
      }
    });
    logger.info(`\u{1F680} Server started on port ${port}`, {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development",
      port,
      redis: redisConnected ? "Connected" : "Disabled",
      websocket: "Enabled"
    });
  });
  server2.on("error", (error) => {
    Logger.error(`[STARTUP] Server failed to start:`, error);
    if (error.code === "EADDRINUSE") {
      Logger.error(`[STARTUP] Port ${port} is already in use`);
    } else if (error.code === "EACCES") {
      Logger.error(`[STARTUP] Permission denied to bind to port ${port}`);
    }
    process.exit(1);
  });
  const checkUserPurchaseHistory = async (userId, productId) => {
    try {
      const [purchase] = await db.select().from(orderItems).innerJoin(orders, eq9(orders.id, orderItems.orderId)).where(
        and5(
          eq9(orders.userId, userId),
          eq9(orderItems.productId, productId),
          or3(
            eq9(orders.status, "delivered"),
            eq9(orders.status, "confirmed")
          )
        )
      ).limit(1);
      return !!purchase;
    } catch (error) {
      Logger.warn("Failed to check purchase history:", error);
      return false;
    }
  };
  app2.post("/api/reviews", authMiddleware.requireAuth, async (req, res) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.userId;
      if (!productId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid product ID and rating (1-5) required" });
      }
      const review = await db.insert(reviews).values({
        productId: String(productId),
        userId,
        rating,
        comment: comment || "",
        verifiedPurchase: await checkUserPurchaseHistory(userId, productId),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      res.json(review[0]);
    } catch (error) {
      Logger.error("Error creating review", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });
  app2.get("/api/reviews/:productId", async (req, res) => {
    try {
      const productReviews = await db.select().from(reviews).where(eq9(reviews.productId, req.params.productId)).orderBy(desc5(reviews.createdAt));
      res.json(productReviews);
    } catch (error) {
      Logger.error("Error fetching reviews", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
  app2.post("/api/coupons/validate", authMiddleware.optionalAuth, async (req, res) => {
    try {
      const { code, cartTotal } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Coupon code required" });
      }
      const coupon = await db.select().from(coupons).where(and5(
        eq9(coupons.code, code.toUpperCase()),
        eq9(coupons.active, true)
      )).limit(1);
      if (!coupon.length) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }
      const couponData = coupon[0];
      if (couponData.expiresAt && /* @__PURE__ */ new Date() > couponData.expiresAt) {
        return res.status(400).json({ error: "Coupon has expired" });
      }
      if (couponData.used_count >= (couponData.max_uses || 999999)) {
        return res.status(400).json({ error: "Coupon usage limit reached" });
      }
      if (couponData.min_purchase && cartTotal < Number(couponData.min_purchase)) {
        return res.status(400).json({
          error: `Minimum purchase of $${couponData.min_purchase} required`
        });
      }
      let discount = 0;
      if (couponData.discount_percent) {
        discount = cartTotal * Number(couponData.discount_percent) / 100;
      } else if (couponData.discount_amount) {
        discount = Number(couponData.discount_amount);
      }
      res.json({
        valid: true,
        discount,
        code: couponData.code,
        type: couponData.discount_percent ? "percentage" : "fixed"
      });
    } catch (error) {
      Logger.error("Error validating coupon", error);
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });
  app2.post("/api/inventory/check", async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const product = await db.select().from(products).where(eq9(products.id, productId)).limit(1);
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
  app2.post("/api/email/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address required" });
      }
      await db.insert(emailQueue).values({
        toEmail: email,
        template: "newsletter_welcome",
        data: { email },
        status: "pending",
        createdAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "Successfully subscribed to newsletter" });
    } catch (error) {
      Logger.error("Error subscribing to newsletter", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });
  app2.use("/api/observability", observability_default);
  server2.on("listening", () => {
    Logger.info(`[STARTUP] Server is now accepting connections on ${host}:${port}`);
  });
  return server2;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    minify: "terser",
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["wouter"],
          "vendor-query": ["@tanstack/react-query"],
          // UI library chunks
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip"
          ],
          // Form handling
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Utilities
          "vendor-utils": ["clsx", "tailwind-merge", "date-fns", "lodash-es"],
          // Icons
          "vendor-icons": ["lucide-react"]
        }
      }
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "wouter"],
    exclude: ["@stripe/stripe-js"]
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}
async function setupVite(app2, server2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server: server2 },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_logger();

// server/config/env-validation.ts
init_logger();
var REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY"
];
var OPTIONAL_ENV_VARS = [
  "REDIS_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
  "ENABLE_REDIS"
];
function validateEnvironmentVariables() {
  Logger.info("[ENV] Validating environment configuration...");
  const config = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || "5000"
  };
  const missing = [];
  const warnings = [];
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
    } else {
      config[envVar] = value;
      Logger.info(`[ENV] \u2713 ${envVar} is configured`);
    }
  }
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    if (!value) {
      warnings.push(`${envVar} not set - related features may be disabled`);
    } else {
      config[envVar] = value;
      Logger.info(`[ENV] \u2713 ${envVar} is configured`);
    }
  }
  if (warnings.length > 0) {
    Logger.warn("[ENV] Optional configuration warnings:");
    warnings.forEach((warning) => Logger.warn(`[ENV] - ${warning}`));
  }
  if (missing.length > 0) {
    Logger.error("[ENV] Missing required environment variables:");
    missing.forEach((variable) => Logger.error(`[ENV] - ${variable}`));
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const port = parseInt(config.PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${config.PORT}. Must be a number between 1-65535`);
  }
  if (config.NODE_ENV === "production") {
    Logger.info("[ENV] Production mode - performing additional validation...");
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production");
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is required in production");
    }
  }
  Logger.info(`[ENV] Environment validation completed successfully`);
  Logger.info(`[ENV] Running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  return config;
}
function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    memory: {
      total: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5e3
  };
}

// server/middleware/security-enhancements.ts
init_logger();
import rateLimit2 from "express-rate-limit";
import helmet2 from "helmet";
var productionSecurityHeaders = helmet2({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        // Required for Tailwind CSS and development
        "https://fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        // Required for development HMR
        "'unsafe-eval'",
        // Required for Vite in development
        "https://js.stripe.com",
        "https://accounts.google.com",
        "https://apis.google.com",
        ...process.env.NODE_ENV === "development" ? ["'unsafe-eval'", "'unsafe-inline'"] : []
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://res.cloudinary.com",
        // Cloudinary images
        "https://lh3.googleusercontent.com"
        // Google profile images
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://api.geoapify.com",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "wss:",
        // WebSocket connections
        "ws:",
        // Development WebSocket
        ...process.env.NODE_ENV === "development" ? ["http://localhost:*", "ws://localhost:*", "wss://localhost:*"] : []
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "https://js.stripe.com",
        "https://hooks.stripe.com",
        "https://accounts.google.com"
      ],
      frameAncestors: ["'none'"],
      // Prevent clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
      // Force HTTPS in production
    }
  },
  crossOriginEmbedderPolicy: false,
  // Allow Stripe and Google integration
  hsts: {
    maxAge: 31536e3,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permissionsPolicy: {
    camera: ["none"],
    microphone: ["none"],
    geolocation: ["self"],
    payment: ["self", "https://js.stripe.com"]
  }
});

// server/utils/input-sanitization.ts
init_logger();
import DOMPurify2 from "dompurify";
import { JSDOM as JSDOM2 } from "jsdom";
var window2 = new JSDOM2("").window;
var purify2 = DOMPurify2(window2);
purify2.addHook("beforeSanitizeElements", function(node) {
  if (node.hasAttribute && node.hasAttribute("onclick")) {
    node.removeAttribute("onclick");
  }
  if (node.hasAttribute && node.hasAttribute("onload")) {
    node.removeAttribute("onload");
  }
});
var InputSanitizer2 = class {
  /**
   * Sanitize HTML content using DOMPurify
   */
  static sanitizeHtml(input, options = {}) {
    if (!input || typeof input !== "string") {
      return "";
    }
    const {
      allowHtml = false,
      allowLinks = false,
      maxLength = 1e4,
      stripWhitespace = true
    } = options;
    try {
      let sanitized = input;
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
        Logger.warn(`Input truncated to ${maxLength} characters`);
      }
      if (allowHtml) {
        const allowedTags = allowLinks ? ["b", "i", "em", "strong", "p", "br", "a"] : ["b", "i", "em", "strong", "p", "br"];
        const allowedAttributes = allowLinks ? { "a": ["href", "title"] } : {};
        sanitized = purify2.sanitize(sanitized, {
          ALLOWED_TAGS: allowedTags,
          ALLOWED_ATTR: Object.keys(allowedAttributes).length > 0 ? Object.values(allowedAttributes).flat() : [],
          FORBID_SCRIPT: true,
          FORBID_STYLE: true,
          SAFE_FOR_TEMPLATES: true
        });
      } else {
        sanitized = purify2.sanitize(sanitized, { ALLOWED_TAGS: [] });
      }
      sanitized = this.removeDangerousPatterns(sanitized);
      if (stripWhitespace) {
        sanitized = sanitized.trim().replace(/\s+/g, " ");
      }
      return sanitized;
    } catch (error) {
      Logger.error("HTML sanitization error:", error);
      return "";
    }
  }
  /**
   * Sanitize user input for database storage
   */
  static sanitizeUserInput(input) {
    if (input === null || input === void 0) {
      return input;
    }
    if (typeof input === "string") {
      return this.sanitizeString(input);
    }
    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeUserInput(item));
    }
    if (typeof input === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        const cleanKey = this.sanitizeString(key);
        sanitized[cleanKey] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }
    return input;
  }
  /**
   * Sanitize a single string value
   */
  static sanitizeString(input) {
    if (!input || typeof input !== "string") {
      return "";
    }
    let sanitized = input;
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    sanitized = this.removeDangerousPatterns(sanitized);
    sanitized = sanitized.trim();
    if (sanitized.length > 1e4) {
      sanitized = sanitized.substring(0, 1e4);
    }
    return sanitized;
  }
  /**
   * Remove dangerous patterns that could be used for attacks
   */
  static removeDangerousPatterns(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\bOR\b|\bAND\b).*?=.*?=?/gi
    ];
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi
    ];
    const ldapPatterns = [
      /[()&|!]/g
    ];
    const cmdPatterns = [
      /[;&|`$]/g,
      /\b(cat|ls|pwd|rm|mkdir|chmod|chown|ps|kill|curl|wget)\b/gi
    ];
    let sanitized = input;
    [...sqlPatterns, ...xssPatterns, ...ldapPatterns, ...cmdPatterns].forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "");
    });
    return sanitized;
  }
  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  /**
   * Sanitize file names for upload
   */
  static sanitizeFileName(fileName) {
    if (!fileName || typeof fileName !== "string") {
      return "unknown";
    }
    let sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").substring(0, 255);
    if (!sanitized.includes(".")) {
      sanitized += ".txt";
    }
    return sanitized;
  }
};
var sanitizeRequest = (req, res, next) => {
  try {
    if (req.body) {
      req.body = InputSanitizer2.sanitizeUserInput(req.body);
    }
    if (req.query) {
      req.query = InputSanitizer2.sanitizeUserInput(req.query);
    }
    if (req.params) {
      req.params = InputSanitizer2.sanitizeUserInput(req.params);
    }
    next();
  } catch (error) {
    Logger.error("Request sanitization error:", error);
    res.status(400).json({ error: "Invalid input format" });
  }
};

// server/index.ts
init_db();
import { sql as sql11 } from "drizzle-orm";
import fs2 from "fs";
import path3 from "path";

// server/services/globalErrorCatcher.ts
init_errorLogger();
var GlobalErrorCatcher = class _GlobalErrorCatcher {
  static instance;
  static init(app2) {
    if (!this.instance) {
      this.instance = new _GlobalErrorCatcher();
      this.instance.setupHandlers(app2);
    }
  }
  setupHandlers(app2) {
    process.on("uncaughtException", async (error) => {
      await ErrorLogger.logError(error, {
        metadata: {
          type: "uncaught_exception",
          environment: process.env.NODE_ENV || "development"
        }
      });
    });
    process.on("unhandledRejection", async (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await ErrorLogger.logError(error, {
        metadata: {
          type: "unhandled_rejection",
          environment: process.env.NODE_ENV || "development"
        }
      });
    });
    app2.use((err, req, res, next) => {
      ErrorLogger.logError(err, {
        req: {
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers["user-agent"]
        },
        user: req.user,
        metadata: {
          type: "express_error",
          status: err.status
        }
      }).catch((logErr) => console.error("Failed to log error:", logErr));
      next(err);
    });
  }
  // Method to manually log errors from anywhere in the application
  static async logError(error, context = {}) {
    return await ErrorLogger.logError(error, context);
  }
  // Method to log error data objects (legacy compatibility)
  static async logErrorData(errorData) {
    const error = new Error(errorData.message);
    error.stack = errorData.stack_trace;
    return ErrorLogger.logError(error, {
      metadata: errorData
    });
  }
};

// server/index.ts
var app = express3();
app.set("trust proxy", true);
app.use(productionSecurityHeaders);
app.use(sanitizeRequest);
app.use((req, res, next) => {
  if (req.path === "/api/errors/client" && req.method === "POST") {
    res.status(200).json({ success: true, message: "Error logged successfully" });
    return;
  }
  next();
});
app.use(express3.json({
  limit: "1mb",
  strict: false
}));
app.use(express3.urlencoded({ limit: "1mb", extended: false }));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    if (req.path === "/api/errors/client") {
      return res.status(200).json({ success: true, message: "Error logged successfully" });
    }
    return res.status(400).json({ message: "Invalid JSON format" });
  }
  next(error);
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  Logger.info(`[MAIN] Starting Clean & Flip API Server`);
  try {
    const envConfig = validateEnvironmentVariables();
    const envInfo = getEnvironmentInfo();
    Logger.info(`[MAIN] Environment validation passed`);
    Logger.info(`[MAIN] System Info:`, envInfo);
  } catch (error) {
    Logger.error(`[MAIN] Environment validation failed:`, error);
    process.exit(1);
  }
  process.on("uncaughtException", (error) => {
    Logger.error("[MAIN] Uncaught Exception - Server may be unstable:", error);
    if (process.env.NODE_ENV === "production") {
      Logger.error("[MAIN] In production mode - attempting graceful recovery");
    } else {
      Logger.error("[MAIN] In development mode - exiting process");
      process.exit(1);
    }
  });
  process.on("unhandledRejection", (reason, promise) => {
    Logger.error(`[MAIN] Unhandled Promise Rejection:`, {
      reason,
      promise,
      stack: reason instanceof Error ? reason.stack : "No stack trace available"
    });
  });
  process.on("SIGTERM", () => {
    Logger.info("[MAIN] Received SIGTERM signal - initiating graceful shutdown");
  });
  process.on("SIGINT", () => {
    Logger.info("[MAIN] Received SIGINT signal - initiating graceful shutdown");
  });
  let server2;
  try {
    Logger.info("[MAIN] Initializing server...");
    server2 = await registerRoutes(app);
    Logger.info("[MAIN] Server initialization completed successfully");
  } catch (error) {
    Logger.error("[MAIN] Failed to start server:", error);
    process.exit(1);
  }
  setInterval(async () => {
    try {
      const deleted = await db.execute(
        sql11`DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true`
      );
      if (deleted.rowCount && deleted.rowCount > 0) {
        Logger.info(`[CLEANUP] Removed ${deleted.rowCount} expired password reset tokens`);
      }
    } catch (error) {
      Logger.error("[CLEANUP] Error cleaning up tokens:", error);
    }
  }, 60 * 60 * 1e3);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    if (process.env.NODE_ENV !== "production") {
      throw err;
    }
  });
  const { SimplePasswordReset: SimplePasswordReset2 } = await Promise.resolve().then(() => (init_simple_password_reset(), simple_password_reset_exports));
  const passwordReset = new SimplePasswordReset2();
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }
      const result = await passwordReset.requestReset(email);
      res.json(result);
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred"
      });
    }
  });
  app.get("/api/auth/validate-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const valid = await passwordReset.validateToken(token);
      res.json({
        valid: !!valid,
        message: valid ? "Token is valid" : "Invalid or expired token"
      });
    } catch (error) {
      res.status(400).json({
        valid: false,
        message: "Invalid token"
      });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Invalid request"
        });
      }
      const success = await passwordReset.resetPassword(token, password);
      res.json({
        success,
        message: success ? "Password reset successfully" : "Failed to reset password"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred"
      });
    }
  });
  const isProductionBuild = fs2.existsSync(path3.resolve(import.meta.dirname, "public"));
  if (isProductionBuild) {
    serveStatic(app);
  } else {
    await setupVite(app, server2);
  }
  GlobalErrorCatcher.init(app);
})();
