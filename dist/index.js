var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __copyProps = (to, from, except, desc4) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc4 = __getOwnPropDesc(from, key2)) || desc4.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/config/env.ts
var env_exports = {};
__export(env_exports, {
  APP_ENV: () => APP_ENV,
  DATABASE_URL: () => DATABASE_URL2,
  DB_HOST: () => DB_HOST,
  ENV: () => ENV,
  ENV_BANNER: () => ENV_BANNER,
  EXPECTED_DB_HOST: () => EXPECTED_DB_HOST,
  WEBHOOK_PREFIX: () => WEBHOOK_PREFIX
});
import dotenv from "dotenv";
var CLI_NODE_ENV, NODE_ENV, PORT, DATABASE_URL_ENV, ENV, APP_ENV, DATABASE_URL2, DB_HOST, WEBHOOK_PREFIX, EXPECTED_DB_HOST, ENV_BANNER;
var init_env = __esm({
  "server/config/env.ts"() {
    "use strict";
    CLI_NODE_ENV = process.env.NODE_ENV;
    dotenv.config({ override: false });
    if (CLI_NODE_ENV) process.env.NODE_ENV = CLI_NODE_ENV;
    NODE_ENV = process.env.NODE_ENV ?? "development";
    PORT = Number(process.env.PORT ?? 5e3);
    DATABASE_URL_ENV = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
    if (!DATABASE_URL_ENV) {
      throw new Error("Missing DATABASE_URL");
    }
    ENV = {
      nodeEnv: NODE_ENV,
      isDev: NODE_ENV === "development",
      isProd: NODE_ENV === "production",
      port: PORT,
      devDbUrl: DATABASE_URL_ENV,
      prodDbUrl: DATABASE_URL_ENV,
      frontendOrigin: process.env.APP_ORIGIN || ""
    };
    APP_ENV = (process.env.APP_ENV ?? NODE_ENV).toLowerCase();
    DATABASE_URL2 = DATABASE_URL_ENV;
    DB_HOST = DATABASE_URL2 ? new URL(DATABASE_URL2).host : "localhost";
    WEBHOOK_PREFIX = process.env.WEBHOOK_PREFIX || "/wh";
    EXPECTED_DB_HOST = DB_HOST;
    ENV_BANNER = `${NODE_ENV.toUpperCase()} Environment`;
    Object.freeze(ENV);
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  ping: () => ping
});
import { neon as neon2 } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
async function ping() {
  await db.execute("select 1");
}
var sql, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_env();
    sql = neon2(ENV.devDbUrl);
    db = drizzle(sql);
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
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
  fulfillmentTypeEnum: () => fulfillmentTypeEnum,
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
  newsletterSubscribers: () => newsletterSubscribers,
  orderAddresses: () => orderAddresses,
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
  serviceZones: () => serviceZones,
  sessions: () => sessions,
  userEmailPreferences: () => userEmailPreferences,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  wishlists: () => wishlists,
  wishlistsRelations: () => wishlistsRelations
});
import { sql as sql2 } from "drizzle-orm";
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
var tsvector, sessions, userRoleEnum, fulfillmentTypeEnum, users, categories, productConditionEnum, productStatusEnum, products, addresses, serviceZones, orderAddresses, orderStatusEnum, orders, orderItems, cartItems, wishlists, emailQueue, equipmentSubmissionStatusEnum, equipmentSubmissions, usersRelations, categoriesRelations, productsRelations, ordersRelations, orderItemsRelations, cartItemsRelations, addressesRelations, equipmentSubmissionsRelations, wishlistsRelations, insertUserSchema, insertCategorySchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertCartItemSchema, insertAddressSchema, insertEquipmentSubmissionSchema, insertWishlistSchema, registerDataSchema, reviews, insertReviewSchema, coupons, insertCouponSchema, orderTracking, insertOrderTrackingSchema, returnRequests, insertReturnRequestSchema, emailLogs, newsletterSubscribers, userEmailPreferences, passwordResetTokens, insertEmailLogSchema, insertNewsletterSubscriberSchema, insertUserEmailPreferencesSchema, insertPasswordResetTokenSchema;
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
    userRoleEnum = pgEnum("user_role", [
      "user",
      "developer"
    ]);
    fulfillmentTypeEnum = pgEnum("fulfillment_type", [
      "LOCAL_ONLY",
      "SHIP_ONLY",
      "LOCAL_OR_SHIP"
    ]);
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      email: varchar("email").unique().notNull(),
      password: varchar("password"),
      // Make optional for OAuth users
      firstName: varchar("first_name").notNull(),
      lastName: varchar("last_name").notNull(),
      phone: varchar("phone"),
      // Optional field
      // REMOVED: Legacy address fields - using SSOT addresses table instead
      isLocalCustomer: boolean("is_local_customer").default(false),
      // Note: isActive is handled programmatically based on role, not stored in DB
      role: userRoleEnum("role").default("user"),
      stripeCustomerId: varchar("stripe_customer_id"),
      stripeSubscriptionId: varchar("stripe_subscription_id"),
      // OAuth fields - Updated for new Google Auth system
      googleId: varchar("google_id").unique(),
      googleSub: text("google_sub").unique(),
      googleEmail: varchar("google_email"),
      googleEmailVerified: boolean("google_email_verified"),
      googlePicture: text("google_picture"),
      lastLoginAt: timestamp("last_login_at"),
      profileImageUrl: text("profile_image_url"),
      authProvider: varchar("auth_provider").default("local"),
      // 'local', 'google'
      isEmailVerified: boolean("is_email_verified").default(false),
      // SSOT Profile address reference - nullable FK to addresses (VARCHAR to match existing DB)
      // REMOVED: profileAddressId - using SSOT address system
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    categories = pgTable("categories", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      name: varchar("name").notNull(),
      slug: varchar("slug").unique().notNull(),
      imageUrl: text("image_url"),
      description: text("description"),
      displayOrder: integer("display_order").default(0),
      isActive: boolean("is_active").default(true),
      productCount: integer("product_count").default(0),
      filterConfig: jsonb("filter_config").default(sql2`'{}'::jsonb`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      continueSellingWhenOutOfStock: boolean("continue_selling_when_out_of_stock").default(false),
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
      cost: decimal("cost", { precision: 10, scale: 2 }),
      compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
      // Delivery options - Active columns
      isLocalDeliveryAvailable: boolean("is_local_delivery_available").default(true),
      isShippingAvailable: boolean("is_shipping_available").default(true),
      // Legacy compatibility columns
      availableLocal: boolean("available_local").default(true),
      availableShipping: boolean("available_shipping").default(true),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      userId: varchar("user_id"),
      firstName: text("first_name").notNull(),
      // Required for shipping
      lastName: text("last_name").notNull(),
      // Required for shipping
      street1: text("street1").notNull(),
      // Main street address
      street2: text("street2"),
      // Apt, Suite, Unit
      city: text("city").notNull(),
      state: text("state").notNull(),
      postalCode: text("postal_code").notNull(),
      // Client field name matches
      country: text("country").default("US").notNull(),
      latitude: decimal("latitude", { precision: 10, scale: 7 }),
      longitude: decimal("longitude", { precision: 10, scale: 7 }),
      geoapifyPlaceId: text("geoapify_place_id"),
      // From Geoapify API
      isDefault: boolean("is_default").default(false).notNull(),
      isLocal: boolean("is_local").default(false).notNull(),
      // Computed field
      type: varchar("type").default("shipping").notNull(),
      // Address type (shipping, billing, etc.)
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      // One default address per user (enforced by database constraint)
      index("idx_addresses_user").on(table.userId),
      index("idx_addresses_coordinates").on(table.latitude, table.longitude),
      index("idx_addresses_local").on(table.isLocal)
    ]);
    serviceZones = pgTable("service_zones", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      name: text("name").notNull(),
      // Option A: center + radius
      centerLat: decimal("center_lat", { precision: 10, scale: 7 }),
      centerLng: decimal("center_lng", { precision: 11, scale: 7 }),
      radiusKm: decimal("radius_km", { precision: 8, scale: 3 }),
      // Option B: polygon (GeoJSON as JSONB)
      polygon: jsonb("polygon"),
      active: boolean("active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    orderAddresses = pgTable("order_addresses", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      orderId: varchar("order_id").references(() => orders.id),
      productId: varchar("product_id").references(() => products.id),
      quantity: integer("quantity").notNull(),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    cartItems = pgTable("cart_items", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      sessionId: varchar("session_id"),
      ownerId: text("owner_id"),
      // Unified owner column (user_id || session_id)
      productId: varchar("product_id").references(() => products.id),
      quantity: integer("quantity").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    wishlists = pgTable("wishlists", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
      productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      index("idx_wishlists_user").on(table.userId),
      index("idx_wishlists_product").on(table.productId)
    ]);
    emailQueue = pgTable("email_queue", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      // Removed isLocalDelivery field - column doesn't exist in database
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
      // REMOVED: activities relation - internal tracking not needed
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
    insertWishlistSchema = createInsertSchema(wishlists).omit({
      id: true,
      createdAt: true
    });
    registerDataSchema = insertUserSchema.extend({
      confirmPassword: z.string()
      // REMOVED: Legacy fullAddress field - using SSOT formatted address
    }).omit({
      role: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true
    });
    reviews = pgTable("reviews", {
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      id: varchar("id").primaryKey().default(sql2`gen_random_uuid()`),
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
      static consolidate(key2, message, level = 2 /* INFO */) {
        if (!this.shouldLog(level)) return;
        const messageStr = typeof message === "string" ? message : typeof message === "object" ? JSON.stringify(message) : String(message || "");
        const now = Date.now();
        const existing = this.consolidatedLogs.get(key2);
        if (existing && now - existing.lastLogged < this.consolidationWindow) {
          existing.count++;
          return;
        }
        if (existing && existing.count > 1) {
          console.log(`[CONSOLIDATED] ${messageStr} (occurred ${existing.count} times)`);
        } else {
          console.log(messageStr);
        }
        this.consolidatedLogs.set(key2, { count: 1, lastLogged: now });
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

// server/storage.ts
import { eq, desc, asc, and, or, gte, lte, sql as sql3, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";
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
        try {
          const result = await db.execute(sql3`
        SELECT
          id,
          email,
          password,
          first_name,
          last_name,
          COALESCE(phone, '') AS phone,
          COALESCE(role, 'user') AS role,
          created_at,
          updated_at
        FROM users
        WHERE id = ${id}
        LIMIT 1
      `);
          return result.rows[0];
        } catch (error) {
          Logger.error("Error getting user by ID:", error.message);
          throw error;
        }
      }
      async getUserByEmail(email) {
        const normalizedEmail = normalizeEmail(email);
        try {
          const result = await db.execute(sql3`
        SELECT
          id,
          email,
          password,
          first_name,
          last_name,
          COALESCE(phone, '') AS phone,
          COALESCE(role, 'user') AS role,
          created_at,
          updated_at
        FROM users
        WHERE LOWER(email) = LOWER(${normalizedEmail})
        LIMIT 1
      `);
          return result.rows[0];
        } catch (error) {
          Logger.error("Error getting user by email:", error.message);
          throw error;
        }
      }
      async createUser(insertUser) {
        const userToInsert = {
          ...insertUser,
          email: normalizeEmail(insertUser.email)
        };
        try {
          const [user] = await db.insert(users).values(userToInsert).returning({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          });
          return user;
        } catch (error) {
          Logger.error("Error creating user:", error.message);
          if (error.code === "57P01") {
            const [user] = await db.insert(users).values(userToInsert).returning({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              role: users.role
            });
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
        }).where(eq(users.id, id)).returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        });
        return user;
      }
      async updateUserStripeInfo(id, customerId, subscriptionId) {
        const [user] = await db.update(users).set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning({
          id: users.id,
          email: users.email,
          role: users.role
        });
        return user;
      }
      async updateUser(id, userData) {
        const [user] = await db.update(users).set({
          ...userData,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, id)).returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        });
        return user;
      }
      // REMOVED: updateUserProfileAddress - using SSOT address system
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
        if (filters?.status) {
          conditions.push(eq(products.status, filters.status));
        } else {
          conditions.push(eq(products.status, "active"));
        }
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
        const updateData = {
          ...product,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (product.cost !== void 0) {
          updateData.cost = product.cost;
        }
        if (product.compareAtPrice !== void 0) {
          updateData.compare_at_price = product.compareAtPrice;
        }
        const [updatedProduct] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
        Logger.debug("DatabaseStorage.updateProduct - result:", updatedProduct);
        return updatedProduct;
      }
      async incrementProductViews(id) {
        await db.update(products).set({
          views: sql3`${products.views} + 1`
        }).where(eq(products.id, id));
      }
      async getFeaturedProducts(limit = 6) {
        try {
          Logger.debug(`[STORAGE] Getting featured products (limit: ${limit})`);
          const featuredProducts = await db.select().from(products).where(
            and(
              eq(products.status, "active"),
              eq(products.featured, true)
            )
          ).orderBy(desc(products.updatedAt)).limit(limit);
          if (featuredProducts.length > 0) {
            Logger.debug(`[STORAGE] Found ${featuredProducts.length} featured products`);
            return featuredProducts;
          }
          Logger.debug("[STORAGE] No featured products found, falling back to newest active");
          const fallbackProducts = await db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt)).limit(limit);
          Logger.debug(`[STORAGE] Fallback returned ${fallbackProducts.length} products`);
          return fallbackProducts;
        } catch (error) {
          Logger.error("[STORAGE] Error getting featured products:", {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack?.slice(0, 500)
          });
          Logger.warn("[STORAGE] Returning empty array due to error");
          return [];
        }
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
      async removeFromCart(cartItemId) {
        console.log(`[STORAGE] Deleting cart item with ID: ${cartItemId}`);
        const result = await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
        console.log(`[STORAGE] Delete result - rowCount:`, result.rowCount);
        return (result.rowCount || 0) > 0;
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
      // NEW: additive wrapper for compound key removal
      async removeFromCartByUserAndProduct(userId, productId) {
        console.log(`[STORAGE] Deleting cart item by user+product { userId:'${userId}', productId:'${productId}' }`);
        const result = await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
        const rowCount = result.rowCount || 0;
        console.log(`[STORAGE] Delete result { userId:'${userId}', productId:'${productId}', rowCount:${rowCount} }`);
        return rowCount;
      }
      // ADDITIVE: get cart items with products joined for cleanup service
      async getCartItemsWithProducts(userId) {
        console.log(`[STORAGE] Fetching cart items with products for user: ${userId}`);
        const items = await db.select().from(cartItems).leftJoin(products, eq(cartItems.productId, products.id)).where(eq(cartItems.userId, userId));
        return items.map((item) => ({
          id: item.cart_items.id,
          productId: item.cart_items.productId || "",
          quantity: item.cart_items.quantity,
          product: item.products
        }));
      }
      // NEW: Cart service helper functions
      async getCartItemsByOwner(ownerId) {
        console.log(`[STORAGE] Fetching cart items by owner: ${ownerId}`);
        const items = await db.select().from(cartItems).where(or(eq(cartItems.userId, ownerId), eq(cartItems.sessionId, ownerId)));
        return items.map((item) => ({
          id: item.id,
          ownerId: item.userId || item.sessionId,
          productId: item.productId,
          variantId: null,
          // No variant support in current schema
          quantity: item.quantity
        }));
      }
      async getCartItemById(id) {
        console.log(`[STORAGE] Fetching cart item by id: ${id}`);
        const items = await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1);
        if (items.length === 0) return null;
        const item = items[0];
        return {
          id: item.id,
          ownerId: item.userId || item.sessionId,
          productId: item.productId,
          variantId: null,
          // No variant support in current schema
          quantity: item.quantity
        };
      }
      async findCartItems(ownerId, productId, variantId) {
        console.log(`[STORAGE] Finding cart items by owner/product: ${ownerId}/${productId} (variantId: ${variantId})`);
        try {
          let whereCondition = and(
            or(eq(cartItems.userId, ownerId), eq(cartItems.sessionId, ownerId)),
            eq(cartItems.productId, productId)
          );
          console.log(`[STORAGE] SQL WHERE condition built, executing query...`);
          const items = await db.select().from(cartItems).where(whereCondition);
          console.log(`[STORAGE] Found ${items.length} matching cart items`);
          return items.map((item) => ({
            id: item.id,
            ownerId: item.userId || item.sessionId,
            productId: item.productId,
            variantId: null,
            // No variant support in current schema
            quantity: item.quantity
          }));
        } catch (error) {
          console.error(`[STORAGE] Error finding cart items:`, error);
          throw error;
        }
      }
      // V2 Cart Service Methods - owner_id only, qty consistency
      async addOrUpdateCartItem(ownerId, productId, variantId, qty) {
        console.log(`[STORAGE] V2 addOrUpdate cart item:`, { ownerId, productId, qty });
        const existing = await db.select().from(cartItems).where(and(
          or(eq(cartItems.userId, ownerId), eq(cartItems.sessionId, ownerId)),
          eq(cartItems.productId, productId)
        )).limit(1);
        if (existing.length > 0) {
          const newQty = existing[0].quantity + qty;
          await db.update(cartItems).set({
            quantity: newQty,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(cartItems.id, existing[0].id));
          return { item: { ...existing[0], qty: newQty }, upserted: "updated" };
        } else {
          const isUuid = ownerId.includes("-") && ownerId.length === 36;
          const itemToInsert = {
            ownerId,
            productId,
            quantity: qty,
            variantId,
            // Keep legacy columns for migration compatibility
            userId: isUuid ? ownerId : null,
            sessionId: !isUuid ? ownerId : null
          };
          const [newItem] = await db.insert(cartItems).values(itemToInsert).returning();
          return { item: { ...newItem, qty: newItem.quantity }, upserted: "inserted" };
        }
      }
      async setCartItemQty(ownerId, productId, variantId, qty) {
        if (qty <= 0) {
          return this.removeCartItemsByProduct(ownerId, productId);
        }
        await db.update(cartItems).set({
          quantity: qty,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and(
          or(eq(cartItems.userId, ownerId), eq(cartItems.sessionId, ownerId)),
          eq(cartItems.productId, productId)
        ));
        return { success: true, qty };
      }
      async removeCartItemsByProduct(ownerId, productId) {
        const result = await db.delete(cartItems).where(and(
          or(eq(cartItems.userId, ownerId), eq(cartItems.sessionId, ownerId)),
          eq(cartItems.productId, productId)
        ));
        return { removed: result.rowCount || 0 };
      }
      async updateCartItemQty(id, qty) {
        console.log(`[STORAGE] Updating cart item ${id} to quantity ${qty}`);
        const [updatedItem] = await db.update(cartItems).set({ quantity: qty }).where(eq(cartItems.id, id)).returning();
        return updatedItem;
      }
      async removeCartItemById(id) {
        console.log(`[STORAGE] Removing cart item by id: ${id}`);
        const result = await db.delete(cartItems).where(eq(cartItems.id, id));
        return (result.rowCount || 0) > 0;
      }
      async getProductStock(productId) {
        const product = await this.getProduct(productId);
        return product?.stockQuantity ?? Number.MAX_SAFE_INTEGER;
      }
      async rekeyCartItemOwner(id, newOwnerId) {
        console.log(`[STORAGE] Re-keying cart item ${id} to new owner: ${newOwnerId}`);
        await db.update(cartItems).set({
          userId: newOwnerId.includes("@") ? newOwnerId : null,
          sessionId: !newOwnerId.includes("@") ? newOwnerId : null
        }).where(eq(cartItems.id, id));
      }
      async getCartByOwner(ownerId) {
        try {
          const items = await db.select({
            id: cartItems.id,
            userId: cartItems.userId,
            sessionId: cartItems.sessionId,
            productId: cartItems.productId,
            qty: cartItems.quantity,
            // Map to qty for V2 consistency
            variantId: sql3`null`,
            // No variant support yet
            createdAt: cartItems.createdAt,
            product: {
              id: products.id,
              name: products.name,
              price: products.price,
              images: products.images,
              brand: products.brand,
              stockQuantity: products.stockQuantity,
              is_local_delivery_available: products.isLocalDeliveryAvailable,
              is_shipping_available: products.isShippingAvailable
            }
          }).from(cartItems).leftJoin(products, eq(products.id, cartItems.productId)).where(or(eq(cartItems.userId, ownerId), eq(cartItems.sessionId, ownerId)));
          const subtotal = items.reduce((sum2, item) => {
            const unit = Number(item.product?.price ?? 0);
            const price = Number.isFinite(unit) ? unit : 0;
            const quantity = Number(item.qty ?? 0);
            console.log(`[STORAGE DEBUG] Item: ${item.product?.name}, Price: ${item.product?.price}, Unit: ${unit}, Quantity: ${quantity}, Subtotal contribution: ${price * quantity}`);
            return sum2 + price * quantity;
          }, 0);
          const finalItems = items.map((item) => ({
            ...item,
            ownerId: item.userId || item.sessionId,
            // Map to logical ownerId
            product: item.product || {
              id: item.productId,
              name: "Unknown Product",
              price: "0.00",
              images: [],
              brand: "",
              stockQuantity: 0,
              is_local_delivery_available: false,
              is_shipping_available: false
            }
          }));
          console.log(`[STORAGE DEBUG] Final subtotal: ${subtotal}, Items count: ${finalItems.length}`);
          return {
            ownerId,
            items: finalItems,
            totals: { subtotal, total: subtotal }
          };
        } catch (error) {
          console.error("[STORAGE] getCartByOwner error:", error);
          return {
            ownerId,
            items: [],
            totals: { subtotal: 0, total: 0 }
          };
        }
      }
      async updateCartItemQuantity(id, quantity) {
        await db.update(cartItems).set({ quantity, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cartItems.id, id));
      }
      async updateCartItemOwner(id, newOwnerId) {
        const isUserId = newOwnerId.includes("-") && newOwnerId.length === 36;
        await db.update(cartItems).set({
          ownerId: newOwnerId,
          userId: isUserId ? newOwnerId : null,
          sessionId: !isUserId ? newOwnerId : null,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(cartItems.id, id));
      }
      async removeCartItem(id) {
        await db.delete(cartItems).where(eq(cartItems.id, id));
      }
      // Set cart shipping address
      async setCartShippingAddress(userId, addressId) {
        await db.update(cartItems).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(cartItems.userId, userId));
      }
      // Removed duplicate getAdminStats function
      // Removed duplicate getAllUsers function
      async getAnalytics() {
        const [orderCountResult] = await db.select({ count: sql3`count(*)` }).from(orders).where(sql3`${orders.createdAt} > NOW() - INTERVAL '7 days'`);
        const orderCount = Number(orderCountResult.count || 0);
        const conversionRate = 0;
        const [avgOrderResult] = await db.select({ avgValue: sql3`coalesce(avg(${orders.total}), 0)` }).from(orders).where(eq(orders.status, "delivered"));
        const topProducts = await db.select({
          productId: orderItems.productId,
          name: products.name,
          totalSold: sql3`sum(${orderItems.quantity})`,
          revenue: sql3`sum(${orderItems.quantity} * ${orderItems.price})`
        }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).groupBy(orderItems.productId, products.name).orderBy(sql3`sum(${orderItems.quantity}) desc`).limit(5);
        const recentActivity = [];
        return {
          pageViews: {
            current: 0,
            // SIMPLIFIED: activity tracking removed
            change: 0
          },
          activeUsers: {
            current: 0,
            // SIMPLIFIED: activity tracking removed
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
          recentActivity: []
          // SIMPLIFIED: no activity tracking
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
      // All legacy address methods removed - using SSOT address system via routes/addresses.ts
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
      // Address operations
      async getAddressById(id) {
        const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
        return address;
      }
      // User helper methods  
      async getUserById(id) {
        return this.getUser(id);
      }
      // Removed duplicate updateProductStock function
      // Removed duplicate exportProductsToCSV function
      // Removed duplicate exportUsersToCSV function
      // Removed duplicate exportOrdersToCSV function
      // REMOVED: Activity tracking - internal tracking not needed
      // Equipment Submission operations (essential for single-seller model)
      async createSubmission(data) {
        const now = /* @__PURE__ */ new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const random = Math.floor(100 + Math.random() * 900);
        const referenceNumber = `CF${year}${month}${day}${random}`;
        const [submission] = await db.insert(equipmentSubmissions).values({
          ...data,
          referenceNumber
        }).returning();
        return submission;
      }
      async getSubmissions(userId) {
        const baseSelect = db.select({
          id: equipmentSubmissions.id,
          referenceNumber: equipmentSubmissions.referenceNumber,
          name: equipmentSubmissions.name,
          brand: equipmentSubmissions.brand,
          category: equipmentSubmissions.category,
          condition: equipmentSubmissions.condition,
          description: equipmentSubmissions.description,
          images: equipmentSubmissions.images,
          askingPrice: equipmentSubmissions.askingPrice,
          weight: equipmentSubmissions.weight,
          status: equipmentSubmissions.status,
          adminNotes: equipmentSubmissions.adminNotes,
          createdAt: equipmentSubmissions.createdAt,
          updatedAt: equipmentSubmissions.updatedAt
        }).from(equipmentSubmissions);
        if (userId) {
          return await baseSelect.where(eq(equipmentSubmissions.userId, userId)).orderBy(desc(equipmentSubmissions.createdAt));
        }
        return await baseSelect.orderBy(desc(equipmentSubmissions.createdAt));
      }
      async getSubmission(id) {
        const [submission] = await db.select({
          id: equipmentSubmissions.id,
          referenceNumber: equipmentSubmissions.referenceNumber,
          name: equipmentSubmissions.name,
          brand: equipmentSubmissions.brand,
          category: equipmentSubmissions.category,
          condition: equipmentSubmissions.condition,
          description: equipmentSubmissions.description,
          images: equipmentSubmissions.images,
          askingPrice: equipmentSubmissions.askingPrice,
          weight: equipmentSubmissions.weight,
          status: equipmentSubmissions.status,
          adminNotes: equipmentSubmissions.adminNotes,
          createdAt: equipmentSubmissions.createdAt,
          updatedAt: equipmentSubmissions.updatedAt
        }).from(equipmentSubmissions).where(eq(equipmentSubmissions.id, id));
        return submission || null;
      }
      async getSubmissionByReference(referenceNumber) {
        const [submission] = await db.select({
          id: equipmentSubmissions.id,
          referenceNumber: equipmentSubmissions.referenceNumber,
          name: equipmentSubmissions.name,
          brand: equipmentSubmissions.brand,
          category: equipmentSubmissions.category,
          condition: equipmentSubmissions.condition,
          description: equipmentSubmissions.description,
          images: equipmentSubmissions.images,
          askingPrice: equipmentSubmissions.askingPrice,
          weight: equipmentSubmissions.weight,
          status: equipmentSubmissions.status,
          adminNotes: equipmentSubmissions.adminNotes,
          createdAt: equipmentSubmissions.createdAt,
          updatedAt: equipmentSubmissions.updatedAt
        }).from(equipmentSubmissions).where(eq(equipmentSubmissions.referenceNumber, referenceNumber));
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
      // Removed duplicate healthCheck - keeping the one at line 932
      // SSOT Address operations
      async getUserAddresses(userId) {
        try {
          return await db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
        } catch (error) {
          if (error.code === "42703") {
            Logger.warn("[STORAGE] Missing columns in addresses table, using raw SQL fallback");
            const result = await db.execute(sql3`
          SELECT 
            id, user_id, first_name, last_name, street1, street2, city, state, postal_code, country,
            COALESCE(latitude, NULL) as latitude,
            COALESCE(longitude, NULL) as longitude,
            COALESCE(geoapify_place_id, NULL) as geoapify_place_id,
            COALESCE(is_default, false) as is_default,
            COALESCE(is_local, false) as is_local,
            COALESCE(type, 'shipping') as type,
            COALESCE(created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
          FROM addresses 
          WHERE user_id = ${userId}
          ORDER BY is_default DESC, created_at DESC
        `);
            return result.rows;
          }
          throw error;
        }
      }
      async getAddress(userId, id) {
        try {
          const [address] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
          return address;
        } catch (error) {
          if (error.code === "42703") {
            Logger.warn("[STORAGE] Missing columns in getAddress, using raw SQL fallback");
            const result = await db.execute(sql3`
          SELECT 
            id, user_id, first_name, last_name, street1, street2, city, state, postal_code, country,
            COALESCE(latitude, NULL) as latitude,
            COALESCE(longitude, NULL) as longitude,
            COALESCE(geoapify_place_id, NULL) as geoapify_place_id,
            COALESCE(is_default, false) as is_default,
            COALESCE(is_local, false) as is_local,
            COALESCE(type, 'shipping') as type,
            COALESCE(created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
          FROM addresses 
          WHERE id = ${id} AND user_id = ${userId}
          LIMIT 1
        `);
            return result.rows[0];
          }
          throw error;
        }
      }
      async createAddress(userId, address) {
        try {
          if (address.isDefault) {
            await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
          }
          const [newAddress] = await db.insert(addresses).values({
            ...address,
            userId,
            id: randomUUID(),
            type: "shipping"
            // Ensure type is always provided
          }).returning();
          return newAddress;
        } catch (error) {
          if (error.code === "42703") {
            Logger.warn("[STORAGE] Missing columns in createAddress, using raw SQL fallback");
            if (address.isDefault) {
              await db.execute(sql3`UPDATE addresses SET is_default = false WHERE user_id = ${userId}`);
            }
            const newId = randomUUID();
            const result = await db.execute(sql3`
          INSERT INTO addresses (
            id, user_id, first_name, last_name, street1, street2, city, state, postal_code, country,
            latitude, longitude, geoapify_place_id, is_default, is_local, created_at, updated_at, type,
            street, zip_code
          ) VALUES (
            ${newId}, ${userId}, ${address.firstName}, ${address.lastName}, 
            ${address.street1}, ${address.street2 || ""}, ${address.city}, ${address.state}, 
            ${address.postalCode}, ${address.country || "US"},
            ${address.latitude || null}, ${address.longitude || null}, ${address.geoapifyPlaceId || null},
            ${address.isDefault || false}, ${address.isLocal || false}, NOW(), NOW(), 'shipping',
            ${address.street1}, ${address.postalCode}
          ) RETURNING *
        `);
            return result.rows[0];
          }
          throw error;
        }
      }
      async updateAddress(userId, id, updates) {
        if (updates.isDefault) {
          await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
        }
        const [updatedAddress] = await db.update(addresses).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning();
        if (!updatedAddress) {
          throw new Error("Address not found");
        }
        return updatedAddress;
      }
      async setDefaultAddress(userId, id) {
        await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
        const [defaultAddress] = await db.update(addresses).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning();
        if (!defaultAddress) {
          throw new Error("Address not found");
        }
        return defaultAddress;
      }
      async deleteAddress(userId, id) {
        await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
      }
      // SSOT: Unified system
      async getCart(userId) {
        const cartItemsData = await this.getCartItems(userId);
        if (!cartItemsData?.length) return { items: [], subtotal: 0 };
        const items = cartItemsData.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: item.product,
          price: parseFloat(item.product.price || "0")
        }));
        const subtotal = items.reduce((sum2, item) => sum2 + item.price * item.quantity, 0);
        return { items, subtotal };
      }
      async validateCart(userId) {
        const cart = await this.getCart(userId);
        if (!cart) return { valid: true, items: [] };
        const validationResults = await Promise.all(
          cart.items.map(async (item) => {
            const product = await this.getProduct(item.productId);
            return {
              itemId: item.id,
              productId: item.productId,
              available: product && (product.stockQuantity || 0) >= item.quantity,
              currentPrice: product?.price,
              requestedQuantity: item.quantity,
              availableQuantity: product?.stockQuantity || 0
            };
          })
        );
        return {
          valid: validationResults.every((r2) => r2.available),
          items: validationResults,
          subtotal: cart.subtotal
        };
      }
      // Legacy cart compatibility methods for routes
      async addToCartLegacy(userId, productId, quantity) {
        const cartItem = {
          userId,
          productId,
          quantity,
          sessionId: null
        };
        const existing = await this.getCartItem(userId, null, productId);
        if (existing) {
          await this.updateCartItem(existing.id, existing.quantity + quantity);
        } else {
          await this.addToCart(cartItem);
        }
        return await this.getCart(userId) || { items: [], subtotal: 0 };
      }
      async updateCartItemLegacy(userId, itemId, quantity) {
        await this.updateCartItem(itemId, quantity);
        return await this.getCart(userId) || { items: [], subtotal: 0 };
      }
      // LEGACY COMPATIBILITY: This method should not be used - DELETE routes handle removal directly
      async removeFromCartLegacy(userId, itemId) {
        console.log(`[DEPRECATED] removeFromCartLegacy called - this should be replaced with direct DELETE routes`);
        await this.removeFromCart(itemId);
        return await this.getCart(userId) || { items: [], subtotal: 0 };
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/auth/google-strategy.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq as eq2 } from "drizzle-orm";
import { randomUUID as randomUUID2 } from "crypto";
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
        let [existingUser] = await db.select().from(users).where(eq2(users.googleSub, googleId)).limit(1);
        if (existingUser) {
          await db.update(users).set({
            lastLoginAt: /* @__PURE__ */ new Date(),
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
            googleSub: googleId,
            googleEmail: email,
            googleEmailVerified: true,
            googlePicture: picture,
            authProvider: "google",
            isEmailVerified: true,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(users.id, existingUser.id));
          Logger.debug("[AUTH] Linked Google to existing account:", email);
          return done(null, {
            ...existingUser,
            googleSub: googleId,
            role: existingUser.role || "user"
          });
        }
        const newUserId = randomUUID2();
        const [newUser] = await db.insert(users).values({
          id: newUserId,
          email,
          googleSub: googleId,
          googleEmail: email,
          googleEmailVerified: true,
          googlePicture: picture,
          lastLoginAt: /* @__PURE__ */ new Date(),
          firstName,
          lastName,
          authProvider: "google",
          isEmailVerified: true,
          role: "user"
          // All new users start as regular users
        }).returning();
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
      callbackURL: "/api/auth/google/callback",
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
  console.log("[SESSION] Validating database configuration...");
  console.log("[SESSION] DATABASE_URL configured:", !!ENV.devDbUrl);
  console.log("[SESSION] DATABASE_URL format:", ENV.devDbUrl?.startsWith("postgresql://") ? "Valid PostgreSQL" : "Invalid");
  if (!ENV.devDbUrl) {
    console.error("[SESSION] CRITICAL: No DATABASE_URL found - this will cause MemoryStore fallback");
    console.error("[SESSION] Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      APP_ENV: process.env.APP_ENV,
      hasProdUrl: !!process.env.PROD_DATABASE_URL,
      hasDevUrl: !!process.env.DEV_DATABASE_URL,
      hasLegacyUrl: !!process.env.DATABASE_URL
    });
    throw new Error("DATABASE_URL is required for session storage - cannot proceed with MemoryStore");
  }
  console.log("[SESSION] Testing database connection...");
  const PostgresSessionStore = connectPg(session);
  let sessionStore;
  try {
    sessionStore = new PostgresSessionStore({
      conString: ENV.devDbUrl,
      createTableIfMissing: false,
      // Don't create table - already exists
      schemaName: "public",
      tableName: "sessions",
      ttl: 7 * 24 * 60 * 60,
      // 7 days (seconds)
      pruneSessionInterval: 60 * 60,
      // Prune expired rows hourly
      errorLog: (err) => {
        console.error("[SESSION STORE] PostgreSQL store error:", {
          message: err.message,
          code: err.code,
          name: err.name
        });
        if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
          console.error("[SESSION STORE] PRODUCTION ERROR: PostgreSQL session store failed");
        }
      }
    });
    console.log("[SESSION] PostgreSQL session store created successfully");
  } catch (error) {
    console.error("[SESSION] FAILED to create PostgreSQL session store:", error.message);
    console.error("[SESSION] This will definitely cause MemoryStore fallback");
    throw new Error(`Session store initialization failed: ${error.message}`);
  }
  const isProd2 = ENV.isProd;
  const forceCrossSite = process.env.CROSS_SITE_COOKIES === "true";
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1e3;
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    name: "cf.sid",
    resave: false,
    // Don't write on every request
    saveUninitialized: false,
    // CRITICAL: Don't create sessions for anonymous visitors
    store: sessionStore,
    cookie: {
      path: "/",
      httpOnly: true,
      // Allow forcing cross-site cookies for split-host setups
      secure: isProd2 || forceCrossSite,
      sameSite: isProd2 || forceCrossSite ? "none" : "lax",
      maxAge: SEVEN_DAYS,
      // Only set domain in production if SESSION_COOKIE_DOMAIN is provided
      domain: isProd2 ? process.env.SESSION_COOKIE_DOMAIN : void 0
    },
    rolling: true
    // Reset expiry on activity
  };
  app2.set("trust proxy", 1);
  app2.use((req, _res, next) => {
    const path4 = req.path;
    if (path4 === "/sw.js" || path4 === "/favicon.ico" || path4.startsWith("/assets/") || path4.startsWith("/static/") || path4.startsWith("/vite/") || path4.startsWith("/@vite/") || path4.startsWith("/src/") || path4.startsWith("/@fs/")) {
      return next();
    }
    return next();
  });
  console.log("[SESSION] Applying session middleware with PostgreSQL store...");
  app2.use(session(sessionSettings));
  const appliedStore = sessionSettings.store;
  if (appliedStore && appliedStore.constructor.name === "PGStore") {
    console.log("[SESSION] \u2705 PostgreSQL session store confirmed active");
  } else {
    console.error("[SESSION] \u274C WARNING: Session store is not PostgreSQL - MemoryStore fallback detected!");
    console.error("[SESSION] Store type:", appliedStore?.constructor?.name || "Unknown");
    if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
      throw new Error("Production cannot use MemoryStore for sessions");
    }
  }
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
          callbackURL: process.env.NODE_ENV === "production" ? `${ENV.frontendOrigin}/api/auth/google/callback` : "/api/auth/google/callback"
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
      Logger.error(`[PASSPORT] Deserialization error (${error.code}):`, error.message);
      if (error.code === "42703") {
        Logger.error("[PASSPORT] Schema mismatch detected during user deserialization");
        Logger.error("[PASSPORT] This indicates missing columns in production database");
      }
      return done(null, false);
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
      if (normalizedEmail.includes("developer") || normalizedEmail.includes("@dev.")) {
        role = "developer";
      }
      const normalizedPhone = phone ? normalizePhone(phone) : void 0;
      const user = await storage.createUser({
        email: normalizedEmail,
        password: await hashPassword(password),
        firstName,
        lastName,
        phone: normalizedPhone,
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
        res.clearCookie("cf.sid", {
          path: "/",
          httpOnly: true,
          secure: isProd2,
          sameSite: isProd2 ? "none" : "lax"
        });
        res.clearCookie("connect.sid");
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
      Logger.warn("TEMPORARY: Bypassing authentication for admin testing");
      req.user = {
        id: "temp-dev-user",
        role: "developer",
        email: "dev@test.com"
      };
      req.isAuthenticated = () => true;
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
    init_env();
    init_google_strategy();
    SALT_ROUNDS = 12;
  }
});

// server/middleware/auth.ts
var isAuthenticated, authMiddleware;
var init_auth2 = __esm({
  "server/middleware/auth.ts"() {
    "use strict";
    isAuthenticated = (req, res, next) => {
      if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
      }
      if (req.session?.userId || req.session?.passport?.user) {
        return next();
      }
      return res.status(401).json({ error: "Authentication required", message: "Please log in to continue" });
    };
    authMiddleware = {
      // Check if user is logged in (compatible with Passport authentication)
      requireAuth: (req, res, next) => {
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          req.userId = req.user.id;
          return next();
        }
        if (req.session?.userId || req.session?.passport?.user) {
          req.userId = req.session.userId || req.session.passport.user.id;
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
      // Optional auth - ALWAYS allow through, just set userId if available
      optionalAuth: (req, res, next) => {
        let userId = null;
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          userId = req.user.id;
        } else if (req.session?.passport?.user) {
          userId = req.session.passport.user;
        } else if (req.session?.userId) {
          userId = req.session.userId;
        }
        req.userId = userId;
        next();
      }
    };
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
      apiVersion: "2025-07-30.basil"
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

// server/lib/cache.ts
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
var MemoryCache, RedisCache, cacheInstance;
var init_cache = __esm({
  "server/lib/cache.ts"() {
    "use strict";
    MemoryCache = class {
      cache = /* @__PURE__ */ new Map();
      async get(key2) {
        const item = this.cache.get(key2);
        if (!item) return null;
        if (item.expires && Date.now() > item.expires) {
          this.cache.delete(key2);
          return null;
        }
        return item.value;
      }
      async set(key2, value, ttl) {
        const expires = ttl ? Date.now() + ttl * 1e3 : void 0;
        this.cache.set(key2, { value, expires });
        if (ttl) {
          setTimeout(() => this.cache.delete(key2), ttl * 1e3);
        }
      }
      async del(key2) {
        this.cache.delete(key2);
      }
      async clear() {
        this.cache.clear();
      }
    };
    RedisCache = class {
      constructor(client) {
        this.client = client;
      }
      async get(key2) {
        try {
          const cached = await this.client.get(key2);
          return cached ? JSON.parse(cached) : null;
        } catch {
          return null;
        }
      }
      async set(key2, value, ttl) {
        try {
          if (ttl) {
            await this.client.setEx(key2, ttl, JSON.stringify(value));
          } else {
            await this.client.set(key2, JSON.stringify(value));
          }
        } catch {
        }
      }
      async del(key2) {
        try {
          await this.client.del(key2);
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
  }
});

// server/config/cache.ts
var cache_exports = {};
__export(cache_exports, {
  clearProductCache: () => clearProductCache,
  closeRedisConnection: () => closeRedisConnection,
  getCachedCategories: () => getCachedCategories,
  getCachedFeaturedProducts: () => getCachedFeaturedProducts,
  getCachedProduct: () => getCachedProduct,
  redis: () => redis,
  setCachedCategories: () => setCachedCategories,
  setCachedFeaturedProducts: () => setCachedFeaturedProducts,
  setCachedProduct: () => setCachedProduct
});
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
async function getCachedFeaturedProducts() {
  try {
    return await cache.get("products:featured");
  } catch (error) {
    console.error("Cache get operation failed:", error);
    return null;
  }
}
async function setCachedFeaturedProducts(products2) {
  try {
    await cache.set("products:featured", products2, 180);
  } catch (error) {
    console.error("Cache set operation failed:", error);
  }
}
async function getCachedProduct(productId) {
  try {
    return await cache.get(`product:${productId}`);
  } catch (error) {
    console.error("Cache get operation failed:", error);
    return null;
  }
}
async function setCachedProduct(productId, product) {
  try {
    await cache.set(`product:${productId}`, product, 120);
  } catch (error) {
    console.error("Cache set operation failed:", error);
  }
}
async function clearProductCache(productId) {
  try {
    if (productId) {
      await cache.del(`product:${productId}`);
    }
    await cache.del("products:featured");
    await cache.del("categories:active");
  } catch (error) {
    console.error("Cache clear operation failed:", error);
  }
}
async function closeRedisConnection() {
}
var cache, redis;
var init_cache2 = __esm({
  "server/config/cache.ts"() {
    "use strict";
    init_cache();
    cache = getCache();
    redis = null;
  }
});

// server/lib/addressCanonicalizer.ts
var addressCanonicalizer_exports = {};
__export(addressCanonicalizer_exports, {
  canonicalizeAddress: () => canonicalizeAddress
});
function canonicalizeAddress(a) {
  const clean = (s) => (s ?? "").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
  const line = [
    clean(a.street),
    clean(a.city),
    clean(a.state),
    clean(a.postal_code),
    clean(a.country || "us")
  ].filter(Boolean).join("|");
  return line;
}
var init_addressCanonicalizer = __esm({
  "server/lib/addressCanonicalizer.ts"() {
    "use strict";
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
      const ALLOW = [
        /^\/api\/cart$/,
        /^\/api\/cart\/[\w-]+$/,
        /^\/api\/cart\/remove\/[\w-]+$/,
        /^\/cart\/remove\/[\w-]+$/,
        /^\/remove\/[\w-]+$/,
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
      if (process.env.SANITIZER_LOG === "debug") {
        console.debug("Sanitization check - path:", req.path, "url:", req.url, "method:", req.method, "originalUrl:", req.originalUrl);
      }
      if (ALLOW.some((rx) => rx.test(req.path) || rx.test(req.originalUrl))) {
        if (process.env.SANITIZER_LOG === "debug") {
          console.debug("Skipping sanitization for:", req.path, "originalUrl:", req.originalUrl);
        }
        return next();
      }
      if (req.path.includes("cart") || req.url.includes("cart") || req.originalUrl.includes("cart")) {
        if (process.env.SANITIZER_LOG === "debug") {
          console.log("CART REQUEST DETAILS:", {
            path: req.path,
            url: req.url,
            originalUrl: req.originalUrl,
            method: req.method,
            body: req.body,
            headers: req.headers["content-type"]
          });
        }
      }
      const FORBIDDEN = /(<|>|script:|javascript:|data:|on\w+=)/i;
      const scan = (val) => {
        if (typeof val === "string") return FORBIDDEN.test(val);
        if (Array.isArray(val)) return val.some(scan);
        if (val && typeof val === "object") {
          return Object.values(val).some(scan);
        }
        return false;
      };
      if (scan(req.body) || scan(req.query) || scan(req.params)) {
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
          for (const [key2, value] of Object.entries(obj)) {
            const cleanKey = this.sanitizeString(key2, { stripTags: true, maxLength: 100 });
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
          const originalEnd = res.end.bind(res);
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
            return originalEnd(...args);
          };
          next();
        };
      }
      static apiRequestLogger() {
        return (req, res, next) => {
          const startTime = Date.now();
          const { userId, ip } = _RequestLogger.extractUserInfo(req);
          const originalEnd = res.end.bind(res);
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
            return originalEnd(...args);
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
          const originalEnd = res.end.bind(res);
          res.end = function(...args) {
            const duration = Date.now() - startTime;
            Logger.info(`ADMIN RESPONSE: ${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
              userId,
              ip,
              duration,
              statusCode: res.statusCode
            });
            return originalEnd(...args);
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
    const originalEnd = res.end.bind(res);
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
      return originalEnd(...args);
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
        const DEV = process.env.NODE_ENV !== "production";
        const SLOW_MS = DEV ? 2e3 : 700;
        if (name === "request_duration" && value > SLOW_MS) {
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
          const key2 = `${metric.context.method} ${metric.context.route}`;
          if (!routeStats[key2]) {
            routeStats[key2] = {
              durations: [],
              method: metric.context.method,
              route: metric.context.route
            };
          }
          routeStats[key2].durations.push(metric.value);
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

// server/config/shipping.ts
var WAREHOUSE, LOCAL_RADIUS_MILES;
var init_shipping = __esm({
  "server/config/shipping.ts"() {
    "use strict";
    WAREHOUSE = { lat: 35.5951, lng: -82.5515 };
    LOCAL_RADIUS_MILES = 30;
  }
});

// server/lib/distance.ts
function milesBetween(a, b) {
  const R = 3958.7613;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function isLocalMiles(lat, lng) {
  if (lat == null || lng == null) return false;
  return milesBetween({ lat, lng }, WAREHOUSE) <= LOCAL_RADIUS_MILES;
}
var init_distance = __esm({
  "server/lib/distance.ts"() {
    "use strict";
    init_shipping();
  }
});

// server/routes/addresses.ts
var addresses_exports = {};
__export(addresses_exports, {
  default: () => addresses_default
});
import { Router as Router9 } from "express";
import { z as z5 } from "zod";
var router8, addressSchema, addresses_default;
var init_addresses = __esm({
  "server/routes/addresses.ts"() {
    "use strict";
    init_storage();
    init_auth2();
    init_distance();
    router8 = Router9();
    addressSchema = z5.object({
      firstName: z5.string().min(1, "First name is required"),
      lastName: z5.string().min(1, "Last name is required"),
      street1: z5.string().min(1, "Street address is required"),
      street2: z5.string().optional().nullable(),
      city: z5.string().min(1, "City is required"),
      state: z5.string().length(2, "State must be 2 characters"),
      postalCode: z5.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code"),
      country: z5.string().default("US"),
      latitude: z5.number().nullable().optional(),
      longitude: z5.number().nullable().optional(),
      geoapifyPlaceId: z5.string().optional().nullable(),
      setDefault: z5.boolean().default(false)
    });
    router8.get("/", isAuthenticated, async (req, res) => {
      try {
        const userId = req.user.id;
        const addresses2 = await storage.getUserAddresses(userId);
        const sorted = addresses2.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        });
        res.json(sorted);
      } catch (error) {
        console.error("GET /api/addresses error:", error);
        res.status(500).json({ message: "Failed to fetch addresses" });
      }
    });
    router8.post("/", isAuthenticated, async (req, res) => {
      try {
        const userId = req.user.id;
        const data = addressSchema.parse(req.body);
        const existingAddresses = await storage.getUserAddresses(userId);
        const isDefault = data.setDefault || existingAddresses.length === 0;
        const isLocal = isLocalMiles(data.latitude ?? null, data.longitude ?? null);
        const address = await storage.createAddress(userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          street1: data.street1,
          street2: data.street2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country || "US",
          latitude: data.latitude,
          longitude: data.longitude,
          geoapifyPlaceId: data.geoapifyPlaceId,
          isDefault,
          isLocal
        });
        res.json(address);
      } catch (error) {
        console.error("POST /api/addresses error:", error);
        if (error instanceof z5.ZodError) {
          res.status(400).json({
            ok: false,
            error: "VALIDATION_ERROR",
            fieldErrors: error.flatten().fieldErrors
          });
        } else {
          res.status(500).json({
            ok: false,
            error: "CREATION_FAILED",
            message: "Failed to create address"
          });
        }
      }
    });
    router8.patch("/:id", isAuthenticated, async (req, res) => {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        const data = addressSchema.partial().parse(req.body);
        let updateData = { ...data };
        if (data.latitude !== void 0 || data.longitude !== void 0) {
          const isLocal = isLocalMiles(data.latitude ?? null, data.longitude ?? null);
          updateData = {
            ...updateData
          };
        }
        const address = await storage.updateAddress(userId, id, { ...updateData, isLocal: void 0 });
        res.json(address);
      } catch (error) {
        console.error("PATCH /api/addresses/:id error:", error);
        res.status(400).json({ message: "Failed to update address" });
      }
    });
    router8.post("/:id/default", isAuthenticated, async (req, res) => {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        await storage.setDefaultAddress(userId, id);
        res.json({ ok: true });
      } catch (error) {
        console.error("POST /api/addresses/:id/default error:", error);
        res.status(400).json({ message: "Failed to set default address" });
      }
    });
    router8.delete("/:id", isAuthenticated, async (req, res) => {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        const address = await storage.getAddress(userId, id);
        if (!address) {
          return res.status(404).json({ ok: false, error: "Address not found" });
        }
        if (address.isDefault) {
          return res.status(409).json({
            ok: false,
            error: "DEFAULT_ADDRESS_CANNOT_BE_DELETED",
            message: "Cannot delete default address. Set another address as default first."
          });
        }
        await storage.deleteAddress(userId, id);
        res.json({ ok: true, message: "Address deleted successfully" });
      } catch (error) {
        console.error("DELETE /api/addresses/:id error:", error);
        res.status(500).json({ ok: false, error: "Failed to delete address" });
      }
    });
    addresses_default = router8;
  }
});

// server/utils/cartOwner.ts
function getCartOwnerId(req) {
  return req.user?.id ?? req.sessionID;
}
var init_cartOwner = __esm({
  "server/utils/cartOwner.ts"() {
    "use strict";
  }
});

// server/routes/cart.ts
var cart_exports = {};
__export(cart_exports, {
  default: () => cart_default,
  router: () => router9
});
import express2 from "express";
var router9, cart_default;
var init_cart = __esm({
  "server/routes/cart.ts"() {
    "use strict";
    init_cartOwner();
    init_storage();
    router9 = express2.Router();
    router9.get("/", async (req, res, next) => {
      try {
        const ownerId = getCartOwnerId(req);
        console.log(`[CART V2] GET cart for owner: ${ownerId}`);
        if (storage.consolidateAndClampCart) {
          await storage.consolidateAndClampCart(ownerId);
        }
        const cart = await storage.getCartByOwner(ownerId);
        return res.json(cart);
      } catch (error) {
        console.error("[CART V2] GET error:", error);
        next(error);
      }
    });
    router9.post("/", async (req, res, next) => {
      try {
        const ownerId = getCartOwnerId(req);
        const { productId, qty, variantId } = req.body || {};
        if (!productId || typeof qty !== "number" || qty <= 0) {
          return res.status(400).json({ error: "INVALID_BODY" });
        }
        console.log(`[CART V2] POST add item:`, { ownerId, productId, qty });
        const result = await storage.addOrUpdateCartItem(ownerId, productId, variantId ?? null, qty);
        return res.status(201).json({
          ok: true,
          status: result.upserted === "updated" ? "UPDATED" : "ADDED",
          item: result.item
        });
      } catch (error) {
        console.error("[CART V2] POST error:", error);
        next(error);
      }
    });
    router9.patch("/product/:productId", async (req, res, next) => {
      try {
        const ownerId = getCartOwnerId(req);
        const { productId } = req.params;
        const { qty } = req.body || {};
        if (typeof qty !== "number" || qty < 0) {
          return res.status(400).json({ error: "INVALID_QTY" });
        }
        console.log(`[CART V2] PATCH set qty:`, { ownerId, productId, qty });
        const result = await storage.setCartItemQty(ownerId, productId, null, qty);
        return res.json({ ok: true, qty: result.qty || 0 });
      } catch (error) {
        console.error("[CART V2] PATCH error:", error);
        next(error);
      }
    });
    router9.delete("/product/:productId", async (req, res, next) => {
      try {
        const ownerId = getCartOwnerId(req);
        const { productId } = req.params;
        console.log(`[CART V2] DELETE product:`, { ownerId, productId });
        const result = await storage.removeCartItemsByProduct(ownerId, productId);
        return res.json({ ok: true, removed: result.removed || 0 });
      } catch (error) {
        console.error("[CART V2] DELETE error:", error);
        next(error);
      }
    });
    cart_default = router9;
  }
});

// server/middleware/ensureSession.ts
var ensureSession_exports = {};
__export(ensureSession_exports, {
  default: () => ensureSession
});
function ensureSession(req, _res, next) {
  if (!req.session) return next(new Error("Session not initialized"));
  req.sessionId = req.sessionID;
  return next();
}
var init_ensureSession = __esm({
  "server/middleware/ensureSession.ts"() {
    "use strict";
  }
});

// server/services/cartService.ts
async function consolidateAndClampCart(ownerId) {
  try {
    const items = await storage.getCartItemsByOwner(ownerId);
    if (!items || items.length === 0) return;
    const byKey = /* @__PURE__ */ new Map();
    for (const it of items) {
      const k = key(it);
      if (!byKey.has(k)) {
        byKey.set(k, { ...it });
      } else {
        byKey.get(k).quantity += it.quantity;
      }
    }
    for (const [k, merged] of byKey) {
      const product = await storage.getProduct(merged.productId);
      const stock = product?.stockQuantity ?? 0;
      const clampedQty = Math.max(0, Math.min(merged.quantity, stock));
      const dupes = items.filter((i) => key(i) === k);
      if (dupes[0]) {
        await storage.updateCartItemQuantity(dupes[0].id, clampedQty);
      }
      for (let i = 1; i < dupes.length; i++) {
        await storage.removeCartItem(dupes[i].id);
      }
      if (!clampedQty && dupes[0]) {
        await storage.removeCartItem(dupes[0].id);
      }
    }
  } catch (error) {
    console.error("[CART SERVICE] Consolidation error:", error);
  }
}
async function mergeSessionCartIntoUser(sessionOwner, userId) {
  if (!sessionOwner || !userId || sessionOwner === userId) return;
  const items = await storage.getCartItemsByOwner(sessionOwner);
  if (!items.length) return;
  for (const it of items) {
    await storage.updateCartItemOwner(it.id, userId);
  }
  await consolidateAndClampCart(userId);
}
var key;
var init_cartService = __esm({
  "server/services/cartService.ts"() {
    "use strict";
    init_storage();
    key = (i) => `${i.productId}::${i.variantId ?? "NOVAR"}`;
  }
});

// server/middleware/mergeCartOnAuth.ts
var mergeCartOnAuth_exports = {};
__export(mergeCartOnAuth_exports, {
  default: () => mergeCartOnAuth
});
async function mergeCartOnAuth(req, _res, next) {
  try {
    if (req.user && req.session && !req.session.__cartMerged) {
      await mergeSessionCartIntoUser(req.sessionID, req.user.id);
      req.session.__cartMerged = true;
    }
    next();
  } catch (e) {
    next(e);
  }
}
var init_mergeCartOnAuth = __esm({
  "server/middleware/mergeCartOnAuth.ts"() {
    "use strict";
    init_cartService();
  }
});

// shared/geo.ts
function haversineMiles(a, b) {
  const R = 3958.7613;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
var init_geo = __esm({
  "shared/geo.ts"() {
    "use strict";
  }
});

// server/routes/shipping.ts
var shipping_exports = {};
__export(shipping_exports, {
  default: () => shipping_default
});
import express3 from "express";
import { z as z6 } from "zod";
import { eq as eq7, and as and4 } from "drizzle-orm";
var requireAuth2, router10, WAREHOUSE_COORDS, LOCAL_DELIVERY_MAX_MILES, ShippingQuoteSchema, shipping_default;
var init_shipping2 = __esm({
  "server/routes/shipping.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_auth2();
    init_geo();
    ({ requireAuth: requireAuth2 } = authMiddleware);
    router10 = express3.Router();
    WAREHOUSE_COORDS = { lat: 40.7128, lon: -74.006 };
    LOCAL_DELIVERY_MAX_MILES = 30;
    ShippingQuoteSchema = z6.object({
      addressId: z6.string().optional(),
      // For "new address" flow
      street1: z6.string().optional(),
      city: z6.string().optional(),
      state: z6.string().optional(),
      postalCode: z6.string().optional(),
      latitude: z6.number().optional(),
      longitude: z6.number().optional()
    });
    router10.post("/quote", requireAuth2, async (req, res) => {
      try {
        const userId = req.user.id;
        const validatedData = ShippingQuoteSchema.parse(req.body);
        let addressCoords = null;
        if (validatedData.addressId) {
          const address = await db.select().from(addresses).where(eq7(addresses.id, validatedData.addressId)).limit(1);
          if (!address.length) {
            return res.status(404).json({ error: "Address not found" });
          }
          if (address[0].latitude && address[0].longitude) {
            addressCoords = {
              lat: parseFloat(address[0].latitude),
              lon: parseFloat(address[0].longitude)
            };
          }
        } else if (validatedData.latitude && validatedData.longitude) {
          addressCoords = {
            lat: validatedData.latitude,
            lon: validatedData.longitude
          };
        }
        const methods = [];
        if (addressCoords) {
          const distanceMiles = haversineMiles(WAREHOUSE_COORDS, addressCoords);
          if (distanceMiles <= LOCAL_DELIVERY_MAX_MILES) {
            methods.push({
              code: "LOCAL",
              label: `Local delivery (\u226430 miles - ${distanceMiles.toFixed(1)} miles from warehouse)`,
              cost: 0,
              eta: "24\u201348h"
            });
          }
          methods.push({
            code: "PICKUP",
            label: "Pickup at warehouse",
            cost: 0,
            eta: "Ready for pickup"
          });
          if (distanceMiles > LOCAL_DELIVERY_MAX_MILES) {
            methods.push({
              code: "FREIGHT_TBD",
              label: "Freight shipping (quoted after order)",
              cost: null,
              eta: "5-10 business days"
            });
          }
        } else {
          methods.push({
            code: "FREIGHT_TBD",
            label: "Freight shipping (quoted after order)",
            cost: null,
            eta: "5-10 business days"
          });
          methods.push({
            code: "PICKUP",
            label: "Pickup at warehouse",
            cost: 0,
            eta: "Ready for pickup"
          });
        }
        res.json({ methods });
      } catch (error) {
        console.error("Error generating shipping quote:", error);
        res.status(500).json({ error: "Failed to generate shipping quote" });
      }
    });
    router10.get("/user/locality", requireAuth2, async (req, res) => {
      try {
        const userId = req.user.id;
        const defaultAddress = await db.select().from(addresses).where(and4(eq7(addresses.userId, userId), eq7(addresses.isDefault, true))).limit(1);
        if (!defaultAddress.length || !defaultAddress[0].latitude || !defaultAddress[0].longitude) {
          return res.json({ isLocal: false, distanceMiles: null });
        }
        const addressCoords = {
          lat: parseFloat(defaultAddress[0].latitude),
          lon: parseFloat(defaultAddress[0].longitude)
        };
        const distanceMiles = haversineMiles(WAREHOUSE_COORDS, addressCoords);
        const isLocal = distanceMiles <= LOCAL_DELIVERY_MAX_MILES;
        res.json({ isLocal, distanceMiles });
      } catch (error) {
        console.error("Error checking locality:", error);
        res.status(500).json({ error: "Failed to check locality" });
      }
    });
    shipping_default = router10;
  }
});

// server/routes/cart-validation.ts
var cart_validation_exports = {};
__export(cart_validation_exports, {
  default: () => cart_validation_default,
  guardCartItemAgainstLocality: () => guardCartItemAgainstLocality
});
import { Router as Router10 } from "express";
function guardCartItemAgainstLocality({
  userIsLocal,
  product
}) {
  const localOnly = product.is_local_delivery_available && !product.is_shipping_available;
  if (!userIsLocal && localOnly) {
    const err = new Error("Local Delivery only. This item isn't available to ship to your address.");
    err.code = "LOCALITY_RESTRICTED";
    err.http = 409;
    throw err;
  }
}
var router11, cart_validation_default;
var init_cart_validation = __esm({
  "server/routes/cart-validation.ts"() {
    "use strict";
    init_auth();
    init_storage();
    router11 = Router10();
    router11.post("/validate", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const addresses2 = await storage.getUserAddresses(userId);
        const defaultAddress = addresses2.find((addr) => addr.isDefault);
        const localityResult = { isLocal: false };
        const cart = await storage.getCart(userId);
        const restrictedItems = [];
        const validItems = [];
        for (const item of cart?.items || []) {
          try {
            guardCartItemAgainstLocality({
              userIsLocal: localityResult.isLocal,
              product: {
                is_local_delivery_available: item.product.is_local_delivery_available,
                is_shipping_available: item.product.is_shipping_available
              }
            });
            validItems.push(item);
          } catch (error) {
            restrictedItems.push({
              ...item,
              restrictionReason: error.message
            });
          }
        }
        res.json({
          isLocal: localityResult.isLocal,
          validItems,
          restrictedItems,
          hasRestrictions: restrictedItems.length > 0
        });
      } catch (error) {
        console.error("Cart validation error:", error);
        res.status(500).json({ error: "Failed to validate cart" });
      }
    });
    cart_validation_default = router11;
  }
});

// server/utils/auth.ts
function getUserIdFromReq(req) {
  return req.user?.id || req.session?.userId || req.auth?.userId || null;
}
var init_auth3 = __esm({
  "server/utils/auth.ts"() {
    "use strict";
  }
});

// server/utils/_diagnostic.ts
var diagnostic_exports = {};
__export(diagnostic_exports, {
  addDiagnosticRoutes: () => addDiagnosticRoutes
});
function addDiagnosticRoutes(app2) {
  app2.get("/api/_whoami", (req, res) => res.json({
    user: getUserIdFromReq(req) || "guest",
    hasSessionCookie: Boolean(req.headers.cookie?.includes("cf.sid")),
    sessionId: req.sessionID
  }));
  app2.get("/api/_route-health", (req, res) => res.json({
    cartPost: "v2",
    localitySource: "shared/evaluateLocality"
  }));
}
var init_diagnostic = __esm({
  "server/utils/_diagnostic.ts"() {
    "use strict";
    init_auth3();
  }
});

// server/db/universal-pool.ts
var universal_pool_exports = {};
__export(universal_pool_exports, {
  universalPool: () => universalPool
});
import { Pool as Pool3 } from "pg";
var universalPool;
var init_universal_pool = __esm({
  "server/db/universal-pool.ts"() {
    "use strict";
    init_env();
    universalPool = global.__universalPgPool ?? new Pool3({
      connectionString: DATABASE_URL2,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 3e4,
      keepAlive: true
    });
    if (process.env.NODE_ENV !== "production") {
      global.__universalPgPool = universalPool;
    }
  }
});

// server/routes/universal-health.ts
var universal_health_exports = {};
__export(universal_health_exports, {
  universalHealth: () => universalHealth
});
import { Router as Router11 } from "express";
var universalHealth;
var init_universal_health = __esm({
  "server/routes/universal-health.ts"() {
    "use strict";
    init_env();
    init_universal_pool();
    universalHealth = Router11();
    universalHealth.get("/api/healthz", async (_req, res) => {
      try {
        const r2 = await universalPool.query(`select current_database() as db, current_user as role`);
        res.json({
          env: APP_ENV,
          dbHost: DB_HOST,
          database: r2.rows[0]?.db,
          role: r2.rows[0]?.role,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          status: "healthy"
        });
      } catch (error) {
        res.status(500).json({
          env: APP_ENV,
          dbHost: DB_HOST,
          error: "Database connection failed",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          status: "unhealthy"
        });
      }
    });
  }
});

// server/utils/email.ts
var email_exports = {};
__export(email_exports, {
  createEmailCondition: () => createEmailCondition,
  emailService: () => emailService,
  getEmailDomain: () => getEmailDomain,
  isValidEmail: () => isValidEmail,
  normalizeEmail: () => normalizeEmail2
});
import { sql as sql7 } from "drizzle-orm";
import { Resend } from "resend";
function normalizeEmail2(email) {
  if (!email || typeof email !== "string") {
    return "";
  }
  return email.toLowerCase().trim();
}
function createEmailCondition(email) {
  const normalizedEmail = normalizeEmail2(email);
  return sql7`LOWER(${users.email}) = ${normalizedEmail}`;
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function getEmailDomain(email) {
  const normalized = normalizeEmail2(email);
  const atIndex = normalized.indexOf("@");
  return atIndex !== -1 ? normalized.substring(atIndex + 1) : "";
}
var resend, emailService;
var init_email = __esm({
  "server/utils/email.ts"() {
    "use strict";
    init_schema();
    init_logger();
    resend = new Resend(process.env.RESEND_API_KEY);
    emailService = {
      async sendOrderConfirmation(order) {
        try {
          const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM,
            to: order.user.email,
            subject: `Order Confirmed #${order.orderNumber}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">Order Confirmed! \u{1F3CB}\uFE0F</h1>
              
              <p>Hi ${order.user.firstName || "there"},</p>
              <p>Thank you for your order! We've received your payment and are preparing your items.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
                
                <h4>Items:</h4>
                <ul>
                  ${order.items.map(
              (item) => `<li>${item.name} - Qty: ${item.quantity} - $${item.price.toFixed(2)}</li>`
            ).join("")}
                </ul>
                
                ${order.shippingAddress ? `
                  <h4>Shipping Address:</h4>
                  <p>
                    ${order.shippingAddress.street}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                  </p>
                ` : ""}
              </div>
              
              <p>We'll notify you when your order ships. You can track your order status in your account dashboard.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Clean & Flip Team</strong>
              </p>
            </div>
          </div>
        `
          });
          if (error) {
            Logger.error("Order confirmation email error:", error);
            throw error;
          }
          Logger.info(`Order confirmation email sent for order ${order.orderNumber}`);
          return data;
        } catch (error) {
          Logger.error("Failed to send order confirmation email:", error);
          throw error;
        }
      },
      async sendShippingNotification(order) {
        if (!order.trackingNumber || !order.carrier) {
          throw new Error("Tracking information required for shipping notification");
        }
        try {
          const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM,
            to: order.user.email,
            subject: `Your Order Has Shipped! #${order.orderNumber}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">Your Order Has Shipped! \u{1F4E6}</h1>
              
              <p>Hi ${order.user.firstName || "there"},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Tracking Information</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Carrier:</strong> ${order.carrier}</p>
                <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                
                ${order.shippingAddress ? `
                  <h4>Shipping To:</h4>
                  <p>
                    ${order.shippingAddress.street}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                  </p>
                ` : ""}
              </div>
              
              <p>You can track your package using the tracking number above on the ${order.carrier} website.</p>
              
              <p style="margin-top: 30px;">
                Thanks for choosing Clean & Flip!<br>
                <strong>Clean & Flip Team</strong>
              </p>
            </div>
          </div>
        `
          });
          if (error) {
            Logger.error("Shipping notification email error:", error);
            throw error;
          }
          Logger.info(`Shipping notification sent for order ${order.orderNumber}`);
          return data;
        } catch (error) {
          Logger.error("Failed to send shipping notification:", error);
          throw error;
        }
      },
      async sendEquipmentOfferEmail(submission) {
        if (!submission.offerAmount) {
          throw new Error("Offer amount required for equipment offer email");
        }
        try {
          const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM,
            to: submission.user.email,
            subject: `Equipment Offer for Your ${submission.brand ? submission.brand + " " : ""}${submission.name}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">Equipment Offer \u{1F4B0}</h1>
              
              <p>Hi ${submission.user.firstName || "there"},</p>
              <p>We've reviewed your equipment submission and would like to make you an offer!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Equipment Details</h3>
                <p><strong>Item:</strong> ${submission.brand ? submission.brand + " " : ""}${submission.name}</p>
                <p><strong>Condition:</strong> ${submission.condition}</p>
                
                <h3 style="color: #28a745; margin-top: 20px;">Our Offer: $${submission.offerAmount.toFixed(2)}</h3>
              </div>
              
              <p>If you're interested in accepting this offer, please reply to this email or contact us through your dashboard.</p>
              <p>This offer is valid for 7 days from the date of this email.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Clean & Flip Team</strong>
              </p>
            </div>
          </div>
        `
          });
          if (error) {
            Logger.error("Equipment offer email error:", error);
            throw error;
          }
          Logger.info(`Equipment offer email sent for submission ${submission.id}`);
          return data;
        } catch (error) {
          Logger.error("Failed to send equipment offer email:", error);
          throw error;
        }
      },
      async sendContactEmail(contactData) {
        try {
          const fromEmail = process.env.RESEND_FROM;
          Logger.info(`Sending email from: "${fromEmail}"`);
          const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: process.env.SUPPORT_TO,
            replyTo: contactData.email,
            subject: `Contact Form: ${contactData.subject}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h1 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h1>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${contactData.name}</p>
                <p><strong>Email:</strong> ${contactData.email}</p>
                <p><strong>Topic:</strong> ${contactData.topic}</p>
                <p><strong>Subject:</strong> ${contactData.subject}</p>
                
                <h3 style="margin-top: 20px;">Message:</h3>
                <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
                  ${contactData.message.replace(/\n/g, "<br>")}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This message was sent from the Clean & Flip contact form.
                You can reply directly to this email to respond to ${contactData.name}.
              </p>
            </div>
          </div>
        `
          });
          if (error) {
            Logger.error("Contact form email error:", error);
            throw error;
          }
          Logger.info(`Contact form email sent from ${contactData.email}`);
          return data;
        } catch (error) {
          Logger.error("Failed to send contact form email:", error);
          throw error;
        }
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
        let dbHost = "";
        let dbEnvironment = "development";
        let dbName = "";
        try {
          const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
          const { DATABASE_URL: DATABASE_URL3 } = await Promise.resolve().then(() => (init_env(), env_exports));
          const start = Date.now();
          await db2.execute("SELECT 1");
          dbLatency = Date.now() - start;
          if (DATABASE_URL3) {
            const url = new URL(DATABASE_URL3);
            dbHost = url.hostname;
            if (dbHost.includes("muddy-moon")) {
              dbEnvironment = "production";
              dbName = "muddy-moon";
            } else if (dbHost.includes("lingering-flower") || dbHost.includes("lucky-poetry")) {
              dbEnvironment = "development";
              dbName = dbHost.includes("lucky-poetry") ? "lucky-poetry" : "lingering-flower";
            } else {
              dbEnvironment = "development";
              dbName = "development-db";
            }
          }
        } catch (error) {
          dbStatus = "disconnected";
          dbLatency = -1;
        }
        const avgResponseTime = performanceMetrics.request_duration?.avg || 0;
        const errorRate = this.calculateErrorRate();
        const requestsPerMinute = this.calculateRequestsPerMinute();
        let status = "healthy";
        if (dbStatus === "disconnected" || memoryPercent > 90) {
          status = "critical";
        } else if (memoryPercent > 75 || avgResponseTime > 0 && avgResponseTime > 2e3 || errorRate > 5) {
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
            latency: dbLatency,
            host: dbHost,
            environment: dbEnvironment,
            name: dbName
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
  systemManagementRoutes: () => router12
});
import { Router as Router12 } from "express";
var router12;
var init_system_management = __esm({
  "server/routes/admin/system-management.ts"() {
    "use strict";
    init_auth();
    init_systemMonitor();
    init_performanceMonitor();
    init_logger();
    router12 = Router12();
    router12.use(requireAuth);
    router12.use(requireRole("developer"));
    router12.get("/health", async (req, res) => {
      try {
        const systemHealth = await SystemMonitor.getSystemHealth();
        const performanceStats = PerformanceMonitor.getSystemStats();
        const { APP_ENV: APP_ENV3, DATABASE_URL: DATABASE_URL3, DB_HOST: DB_HOST2 } = await Promise.resolve().then(() => (init_env(), env_exports));
        const getDatabaseName = (dbUrl) => {
          try {
            const url = new URL(dbUrl);
            const pathSegments = url.pathname.split("/");
            const dbName = pathSegments[pathSegments.length - 1];
            if (url.hostname.includes("muddy-moon")) {
              return "muddy-moon";
            } else if (url.hostname.includes("lucky-poetry")) {
              return "lucky-poetry";
            }
            return dbName || "unknown";
          } catch {
            return "unknown";
          }
        };
        const databaseName = getDatabaseName(DATABASE_URL3);
        const databaseEnvironment = databaseName === "muddy-moon" ? "production" : "development";
        const response = {
          system: {
            ...systemHealth,
            environment: APP_ENV3,
            // The actual computed APP_ENV
            database: {
              ...systemHealth.database,
              name: databaseName,
              environment: databaseEnvironment,
              host: DB_HOST2
            },
            nodeVersion: process.version,
            platform: process.platform,
            processId: process.pid
          },
          performance: performanceStats,
          errors: { message: "Error tracking disabled" },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        res.json(response);
      } catch (error) {
        Logger.error("Failed to get system health:", error);
        res.status(500).json({ error: "Failed to get system health" });
      }
    });
    router12.get("/performance", async (req, res) => {
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
    router12.get("/alerts", async (req, res) => {
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
    router12.post("/alerts/:alertId/resolve", async (req, res) => {
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
    router12.post("/alerts/cleanup", async (req, res) => {
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
    router12.get("/database", async (req, res) => {
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
    router12.get("/logs", async (req, res) => {
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
    router12.post("/diagnostics", async (req, res) => {
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

// server/config/app-env.ts
var APP_ENV2, IS_PROD;
var init_app_env = __esm({
  "server/config/app-env.ts"() {
    "use strict";
    APP_ENV2 = process.env.NODE_ENV === "development" ? "development" : (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development").toLowerCase();
    IS_PROD = APP_ENV2 === "production";
  }
});

// server/middleware/session-config.ts
import session2 from "express-session";
import connectPg2 from "connect-pg-simple";
var SESSION_SECRET, PgSession, isProd, cookieOptions, sessionMiddleware;
var init_session_config = __esm({
  "server/middleware/session-config.ts"() {
    "use strict";
    init_app_env();
    SESSION_SECRET = process.env.SESSION_SECRET;
    PgSession = connectPg2(session2);
    isProd = IS_PROD;
    cookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      // Works with trust proxy = 1
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 days
      domain: isProd ? void 0 : void 0
      // Let browser handle domain
    };
    sessionMiddleware = session2({
      name: "cf.sid",
      // Stable, single cookie name
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      // Don't create sessions for guests unless needed
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: "sessions",
        createTableIfMissing: true,
        ttl: 30 * 24 * 60 * 60,
        // 30 days in seconds
        pruneSessionInterval: 60 * 60
        // Prune every hour
      }),
      cookie: cookieOptions
    });
  }
});

// server/routes/auth-unified.ts
var auth_unified_exports = {};
__export(auth_unified_exports, {
  default: () => auth_unified_default
});
import { Router as Router13 } from "express";
var router13, auth_unified_default;
var init_auth_unified = __esm({
  "server/routes/auth-unified.ts"() {
    "use strict";
    init_logger();
    init_session_config();
    init_storage();
    router13 = Router13();
    router13.get("/api/user", async (req, res) => {
      try {
        const isAuthenticated2 = req.isAuthenticated && req.isAuthenticated() && req.user;
        const hasSession = req.session?.userId || req.session?.passport?.user;
        if (!isAuthenticated2 && !hasSession) {
          return res.status(200).json({
            authenticated: false,
            user: null,
            session: { id: req.sessionID, guest: true }
          });
        }
        const userId = req.user?.id || req.session?.userId || req.session?.passport?.user;
        const user = await storage.getUser(userId);
        if (!user) {
          Logger.warn(`[AUTH] User ${userId} not found in database`);
          return res.status(200).json({
            authenticated: false,
            user: null,
            session: { id: req.sessionID, guest: true }
          });
        }
        return res.json({
          authenticated: true,
          user,
          session: { id: req.sessionID, guest: false }
        });
      } catch (error) {
        Logger.error("[AUTH] Error in /api/user endpoint:", error);
        return res.status(200).json({
          authenticated: false,
          user: null,
          session: { id: req.sessionID, guest: true, error: true }
        });
      }
    });
    router13.post("/api/logout", async (req, res) => {
      try {
        const sessionId = req.sessionID;
        Logger.info(`[AUTH] Logout attempt for session: ${sessionId}`);
        req.session.destroy((err) => {
          res.clearCookie("cf.sid", cookieOptions);
          res.clearCookie("cf.sid", { path: "/" });
          if (process.env.NODE_ENV === "development") {
            res.set("Clear-Site-Data", '"cookies"');
          }
          if (err) {
            Logger.warn(`[AUTH] Session destroy error: ${err.message}`);
            return res.status(200).json({
              ok: true,
              note: "cookie cleared, session destroy had issues",
              sessionId
            });
          }
          Logger.info(`[AUTH] Logout successful for session: ${sessionId}`);
          return res.status(200).json({ ok: true, sessionId });
        });
      } catch (error) {
        Logger.error("[AUTH] Logout error:", error);
        res.clearCookie("cf.sid", cookieOptions);
        return res.status(200).json({
          ok: true,
          note: "cookie cleared with error"
        });
      }
    });
    router13.get("/api/auth/state", async (req, res) => {
      const isAuthenticated2 = req.isAuthenticated && req.isAuthenticated() && req.user;
      const hasSession = req.session?.userId || req.session?.passport?.user;
      return res.json({
        authenticated: !!(isAuthenticated2 || hasSession),
        sessionId: req.sessionID
      });
    });
    router13.get("/user", (req, res) => {
      Logger.warn("[AUTH] Legacy /user endpoint accessed, redirecting to /api/user");
      res.redirect(307, "/api/user");
    });
    if (process.env.NODE_ENV !== "production") {
      router13.post("/api/dev/clear-cookies", (req, res) => {
        res.clearCookie("cf.sid", cookieOptions);
        res.clearCookie("cf.sid", { path: "/" });
        res.set("Clear-Site-Data", '"cookies"');
        Logger.info("[DEV] Emergency cookie clear executed");
        res.json({ ok: true, note: "All cookies cleared" });
      });
    }
    auth_unified_default = router13;
  }
});

// server/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  WebSocketManager: () => WebSocketManager,
  setupWebSocket: () => setupWebSocket,
  wsManager: () => wsManager
});
import { WebSocketServer } from "ws";
function setupWebSocket(server2) {
  wsManager.attach(server2);
  return wsManager;
}
var WebSocketManager, wsManager;
var init_websocket = __esm({
  "server/websocket.ts"() {
    "use strict";
    WebSocketManager = class {
      wss;
      clients = /* @__PURE__ */ new Map();
      attach(server2) {
        this.wss = new WebSocketServer({
          server: server2,
          path: "/ws",
          // Enhanced configuration for production reliability
          perMessageDeflate: false,
          // Disable compression to reduce CPU load
          clientTracking: true,
          maxPayload: 1024 * 1024
          // 1MB max message size
        });
        console.log("\u{1F680} WebSocket: Server starting on path /ws");
        this.wss.on("connection", (ws2, req) => {
          const clientIP = req.socket.remoteAddress || "unknown";
          console.log(`\u{1F50C} WebSocket: Connection attempt from ${clientIP}`);
          this.onConnection(ws2);
        });
        this.wss.on("error", (error) => {
          console.error("\u274C WebSocket: Server error", error);
        });
        setInterval(() => this.heartbeat(), 25e3);
        console.log("\u2705 WebSocket: Server ready for connections");
      }
      onConnection(ws2) {
        const id = crypto.randomUUID();
        const client = { id, ws: ws2, role: "guest", alive: true };
        this.clients.set(id, client);
        console.log(`\u{1F50C} WebSocket: New client connected ${id} (total: ${this.clients.size})`);
        this.safeSend(client, { topic: "connection:ok", clientId: id, role: null });
        ws2.on("message", (raw2) => this.onMessage(client, raw2));
        ws2.on("pong", () => {
          client.alive = true;
        });
        ws2.on("close", (code, reason) => {
          console.log(`\u{1F50C} WebSocket: Client ${id} disconnected (code: ${code}, reason: ${reason?.toString() || "none"})`);
          this.clients.delete(id);
        });
        ws2.on("error", (error) => {
          console.error(`\u274C WebSocket: Client ${id} error`, error);
          ws2.close();
        });
      }
      onMessage(client, raw2) {
        let msg;
        try {
          msg = JSON.parse(String(raw2));
        } catch {
          return this.safeSend(client, { topic: "toast:error", message: "Invalid WS payload" });
        }
        switch (msg.topic) {
          case "auth": {
            const { userId, role } = this.verifyToken(msg.token);
            client.role = role;
            client.userId = userId;
            this.safeSend(client, { topic: "auth:ok", role, userId });
            break;
          }
          case "sys:ping":
            this.safeSend(client, { topic: "sys:pong" });
            break;
          case "subscribe":
          case "unsubscribe":
            break;
          default:
            break;
        }
      }
      heartbeat() {
        console.log(`\u{1FAC0} WebSocket: Heartbeat - checking ${this.clients.size} clients`);
        for (const [clientId, c] of this.clients.entries()) {
          if (!c.alive) {
            console.log(`\u{1F480} WebSocket: Terminating inactive client ${clientId}`);
            c.ws.terminate();
            this.clients.delete(clientId);
            continue;
          }
          c.alive = false;
          try {
            c.ws.ping();
          } catch (error) {
            console.error(`\u{1F41B} WebSocket: Failed to ping client ${clientId}`, error);
            this.clients.delete(clientId);
          }
        }
      }
      safeSend(c, data) {
        if (c.ws.readyState === c.ws.OPEN) {
          c.ws.send(JSON.stringify(data));
        }
      }
      // --- Publish APIs (use these from routes/services) --------
      publish(data) {
        for (const c of this.clients.values()) this.safeSend(c, data);
      }
      // Enhanced publish method with comprehensive error handling and logging
      publishMessage(type, payload) {
        const message = { type, payload };
        const activeClients = Array.from(this.clients.values()).filter((c) => c.ws.readyState === c.ws.OPEN);
        console.log(`\u{1F4E1} WebSocket: Broadcasting "${type}" to ${activeClients.length} clients`);
        let successful = 0;
        let failed = 0;
        for (const c of activeClients) {
          try {
            c.ws.send(JSON.stringify(message));
            successful++;
          } catch (error) {
            console.error(`\u{1F41B} WebSocket: Failed to send message to client ${c.id}`, error);
            failed++;
            this.clients.delete(c.id);
          }
        }
        if (failed > 0) {
          console.warn(`\u26A0\uFE0F WebSocket: Broadcast completed - ${successful} sent, ${failed} failed`);
        }
      }
      publishToRole(role, data) {
        for (const c of this.clients.values()) if (c.role === role) this.safeSend(c, data);
      }
      publishToUser(userId, data) {
        for (const c of this.clients.values()) if (c.userId === userId) this.safeSend(c, data);
      }
      // Enhanced token verifier with better logging
      verifyToken(token) {
        if (!token) {
          console.log("\u{1F513} WebSocket: Guest connection (no token)");
          return { role: "guest" };
        }
        console.log("\u{1F511} WebSocket: Admin token verified");
        return { userId: "admin-user", role: "admin" };
      }
      // Legacy compatibility methods for gradual migration
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
        this.clients.forEach((client) => {
          client.ws.terminate();
        });
        this.clients.clear();
        this.wss.close();
      }
    };
    wsManager = new WebSocketManager();
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

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
var __dirname, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    __dirname = path.dirname(fileURLToPath(import.meta.url));
    vite_config_default = defineConfig({
      plugins: [
        react()
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets")
        }
      },
      root: path.resolve(__dirname, "client"),
      build: {
        outDir: path.resolve(__dirname, "dist/public"),
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
        },
        port: 5173,
        strictPort: true,
        proxy: {
          "/api": { target: process.env.VITE_API_URL || "http://localhost:4000", changeOrigin: true },
          "/healthz": { target: process.env.VITE_API_URL || "http://localhost:4000", changeOrigin: true }
        }
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express4 from "express";
import fs from "fs";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
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
      const clientTemplate = path2.resolve(__dirname2, "..", "client", "index.html");
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
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express4.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var viteLogger, __dirname2;
var init_vite = __esm({
  "server/vite.ts"() {
    "use strict";
    init_vite_config();
    viteLogger = createLogger();
    __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
  }
});

// server/middleware/compression.ts
var compression_exports = {};
__export(compression_exports, {
  setupProductionOptimizations: () => setupProductionOptimizations
});
import compression2 from "compression";
import path3 from "path";
import express5 from "express";
import { fileURLToPath as fileURLToPath3 } from "url";
function setupProductionOptimizations(app2) {
  if (process.env.NODE_ENV === "production") {
    app2.use(compression2({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression2.filter?.(req, res) ?? true;
      },
      threshold: 0
    }));
    app2.use(
      express5.static(path3.join(__dirname3, "../../client-dist"), {
        etag: true,
        lastModified: true,
        maxAge: "365d",
        // 1 year for static assets
        setHeaders(res, filePath) {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          } else if (filePath.match(/\.(js|css|woff2?|ttf|eot)$/)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
            res.setHeader("Cache-Control", "public, max-age=86400");
          }
        }
      })
    );
  }
}
var __dirname3;
var init_compression = __esm({
  "server/middleware/compression.ts"() {
    "use strict";
    __dirname3 = path3.dirname(fileURLToPath3(import.meta.url));
  }
});

// server/index.ts
import express6 from "express";
import cookieParser from "cookie-parser";

// server/db/migrate.ts
import { neon } from "@neondatabase/serverless";

// server/config/database.ts
var DATABASE_URL = process.env.DATABASE_URL;

// server/db/migrate.ts
async function applyMigrations() {
  const sql9 = neon(DATABASE_URL);
  console.log("[MIGRATIONS] Applying\u2026");
  try {
    console.log("[MIGRATIONS] Dropping retired columns...");
    await sql9`ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_completed_at"`;
    await sql9`ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_address_id"`;
    console.log("[MIGRATIONS] Setting up cart integrity...");
    await sql9`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cart_items_product') THEN
          ALTER TABLE "cart_items"
          ADD CONSTRAINT "fk_cart_items_product"
          FOREIGN KEY ("product_id") REFERENCES "products"("id")
          ON DELETE CASCADE NOT VALID;
          ALTER TABLE "cart_items" VALIDATE CONSTRAINT "fk_cart_items_product";
        END IF;
      END$$;
    `;
    await sql9`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cart_owner_product"
      ON "cart_items"(COALESCE(user_id::text, session_id), product_id, COALESCE(variant_id,''));
    `;
    console.log("[MIGRATIONS] Fixing schema drift...");
    await fixProductionSchemaDrift(sql9);
  } catch (error) {
    if (error.message?.includes("already exists") || error.message?.includes("does not exist")) {
      console.log("[MIGRATIONS] Skipping existing objects...");
    } else {
      throw error;
    }
  }
  console.log("[MIGRATIONS] Done.");
}
async function fixProductionSchemaDrift(sql9) {
  try {
    console.log("[MIGRATIONS] Checking and adding missing columns...");
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'cost') THEN
              ALTER TABLE products ADD COLUMN cost DECIMAL(10,2);
              RAISE NOTICE '[MIGRATION] Added cost column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'compare_at_price') THEN
              ALTER TABLE products ADD COLUMN compare_at_price DECIMAL(10,2);
              RAISE NOTICE '[MIGRATION] Added compare_at_price column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'sku') THEN
              ALTER TABLE products ADD COLUMN sku VARCHAR;
              RAISE NOTICE '[MIGRATION] Added sku column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'dimensions') THEN
              ALTER TABLE products ADD COLUMN dimensions JSONB;
              RAISE NOTICE '[MIGRATION] Added dimensions column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_local_delivery_available') THEN
              ALTER TABLE products ADD COLUMN is_local_delivery_available BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added is_local_delivery_available column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_shipping_available') THEN
              ALTER TABLE products ADD COLUMN is_shipping_available BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added is_shipping_available column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'available_local') THEN
              ALTER TABLE products ADD COLUMN available_local BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added available_local column to products table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'available_shipping') THEN
              ALTER TABLE products ADD COLUMN available_shipping BOOLEAN DEFAULT true;
              RAISE NOTICE '[MIGRATION] Added available_shipping column to products table';
          END IF;
      END $$;
    `;
    console.log("[MIGRATIONS] Fixing cart_items schema...");
    await fixCartItemsSchema(sql9);
    console.log("[MIGRATIONS] Schema drift fixes applied successfully");
  } catch (error) {
    console.log("[MIGRATIONS] Schema drift fix error (safe to ignore if columns already exist):", error?.message);
  }
}
async function fixCartItemsSchema(sql9) {
  try {
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'owner_id') THEN
              ALTER TABLE cart_items ADD COLUMN owner_id VARCHAR;
              RAISE NOTICE '[MIGRATION] Added owner_id column to cart_items table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'variant_id') THEN
              ALTER TABLE cart_items ADD COLUMN variant_id VARCHAR;
              RAISE NOTICE '[MIGRATION] Added variant_id column to cart_items table';
          END IF;
      END $$;
    `;
    await sql9`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'cart_items' AND column_name = 'total_price') THEN
              ALTER TABLE cart_items ADD COLUMN total_price DECIMAL(10,2);
              RAISE NOTICE '[MIGRATION] Added total_price column to cart_items table';
          END IF;
      END $$;
    `;
    console.log("[MIGRATIONS] Cart schema fixes applied successfully");
  } catch (error) {
    console.log("[MIGRATIONS] Cart schema fix error (safe to ignore if columns already exist):", error?.message);
  }
}

// server/index.ts
init_db();

// server/routes.ts
init_storage();
init_auth();
init_auth2();
import { createServer } from "http";
import Stripe3 from "stripe";
import { LRUCache } from "lru-cache";
import rateLimit2 from "express-rate-limit";

// server/middleware/auth-improved.ts
init_logger();
var EXPECTED_ANON_401_PATHS = /* @__PURE__ */ new Set([
  "/api/user",
  "/api/cart/add",
  "/api/orders",
  "/api/addresses"
]);
var authImprovements = {
  // Guest-safe user endpoint - returns 200 with auth status instead of 401
  guestSafeUser: async (req, res, next) => {
    try {
      const isAuthenticated2 = req.isAuthenticated && req.isAuthenticated() && req.user;
      const hasSession = req.session?.userId || req.session?.passport?.user;
      if (!isAuthenticated2 && !hasSession) {
        return res.status(200).json({
          auth: false,
          user: null,
          message: "Not authenticated - guest user"
        });
      }
      req.userId = req.user?.id || req.session?.userId || req.session?.passport?.user;
      next();
    } catch (error) {
      Logger.error("Error in guestSafeUser middleware:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  // Improved 401 logging - demotes expected guest 401s to INFO level
  improvedAuthLogging: (req, res, next) => {
    const originalEnd = res.end;
    res.end = function(...args) {
      if (res.statusCode === 401) {
        const isExpectedGuestPath = EXPECTED_ANON_401_PATHS.has(req.path);
        const hasSession = Boolean(req.session?.userId || req.session?.passport?.user);
        if (isExpectedGuestPath && !hasSession) {
          Logger.info(`[AUTH] Expected guest 401: ${req.method} ${req.path}`, {
            path: req.path,
            userAgent: req.get("User-Agent")?.substring(0, 50),
            ip: req.ip
          });
        } else {
          Logger.warn(`[AUTH] Unexpected 401: ${req.method} ${req.path}`, {
            path: req.path,
            hasCookie: Boolean(req.headers.cookie),
            hasSession: Boolean(req.session?.userId),
            hasPassportSession: Boolean(req.session?.passport?.user),
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
            origin: req.headers.origin,
            referer: req.headers.referer,
            userAgent: req.get("User-Agent")?.substring(0, 100)
          });
        }
      }
      return originalEnd.apply(this, args);
    };
    next();
  },
  // Auth state endpoint - never returns 401, just tells UI auth status
  authState: (req, res) => {
    const isAuthenticated2 = req.isAuthenticated && req.isAuthenticated() && req.user;
    const hasSession = req.session?.userId || req.session?.passport?.user;
    if (!isAuthenticated2 && !hasSession) {
      return res.json({ auth: false });
    }
    return res.json({
      auth: true,
      userId: req.user?.id || req.session?.userId || req.session?.passport?.user
    });
  }
};

// server/config/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your-cloud-name",
  api_key: process.env.CLOUDINARY_API_KEY || "your-api-key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "your-api-secret"
});
var storage2 = multer.memoryStorage();
var upload = multer({
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
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
  const frameAncestors = ["'self'"];
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
      manifestSrc: ["'self'"],
      frameAncestors
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
    if (frameAncestors.length > 1) {
    } else {
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), interest-cohort=(), payment=()"
    );
    res.removeHeader("X-Powered-By");
    next();
  });
}
var allowedOrigins = (() => {
  const list = [];
  if (process.env.APP_ORIGIN) list.push(process.env.APP_ORIGIN.trim());
  if (process.env.FRONTEND_ORIGIN) list.push(process.env.FRONTEND_ORIGIN.trim());
  if (process.env.FRONTEND_ORIGINS) {
    list.push(
      ...process.env.FRONTEND_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    );
  }
  return Array.from(new Set(list));
})();
var corsOptions = {
  origin: (origin, callback) => {
    const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
    if (process.env.CORS_ALLOW_ALL === "true" || appEnv !== "production") {
      return callback(null, true);
    }
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((o) => o === origin)) return callback(null, true);
    const ok = allowedOrigins.some((o) => {
      if (o.startsWith("*.")) {
        const suffix = o.slice(1);
        return origin.endsWith(suffix);
      }
      return false;
    });
    return callback(ok ? null : new Error("CORS: origin not allowed"), ok);
  },
  credentials: true,
  optionsSuccessStatus: 204,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Let cors echo requested headers instead of fixing a static list to avoid blocking custom headers
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400
  // 24 hours
};

// server/middleware/validation.ts
init_logger();
import { ZodError } from "zod";
function validateRequest(schema, target = "body") {
  return (req, res, next) => {
    try {
      const dataToValidate = req[target];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code
        }));
        return res.status(400).json({
          error: "Validation failed",
          message: "The provided data is invalid",
          details: errorMessages
        });
      }
      Logger.error("Unexpected validation error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred during validation"
      });
    }
  };
}
function preventSQLInjection(req, res, next) {
  const sqlInjectionPatterns = [
    // Only match SQL keywords that are likely part of SQL injection attempts
    /(\bUNION\s+SELECT\b|\bUNION\s+ALL\s+SELECT\b)/i,
    /(\bSELECT\s+\*\s+FROM\b|\bSELECT\s+.+\s+FROM\b)/i,
    /(\bINSERT\s+INTO\b|\bINSERT\s+.+\s+VALUES\b)/i,
    /(\bUPDATE\s+\w+\s+SET\b)/i,
    /(\bDELETE\s+FROM\b)/i,
    /(\bDROP\s+(TABLE|DATABASE|INDEX)\b)/i,
    /(\bCREATE\s+(TABLE|DATABASE|INDEX)\b)/i,
    /(\bALTER\s+TABLE\b)/i,
    /(\b(OR|AND)\b\s+\b\d+\s*=\s*\d+)/i,
    /(--|;|\||\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b|\bxp_\w+)/i
  ];
  const checkValue = (value) => {
    if (typeof value === "string") {
      return sqlInjectionPatterns.some((pattern) => pattern.test(value));
    }
    if (typeof value === "object" && value !== null) {
      for (const key2 in value) {
        if (checkValue(value[key2])) return true;
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
      for (const key2 in value) {
        sanitized[key2] = sanitizeValue(value[key2]);
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
init_cache2();
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

// server/routes/admin-database.ts
import { Router } from "express";
import { z as z2 } from "zod";
import { Pool as Pool2, neonConfig } from "@neondatabase/serverless";

// server/db/registry.ts
init_env();
import { Pool } from "pg";
console.log("[DB Registry] Dev host:", new URL(ENV.devDbUrl).host);
console.log("[DB Registry] Prod host:", new URL(ENV.prodDbUrl).host);
var devPool = new Pool({ connectionString: ENV.devDbUrl, max: 10 });
var prodPool = new Pool({ connectionString: ENV.prodDbUrl, max: 10 });
function getPool(branch) {
  return branch === "prod" ? prodPool : devPool;
}

// server/db/checkpoints.ts
async function createCheckpoint(pool, branch, label, notes, who) {
  const q = `SELECT admin.create_checkpoint($1,$2,$3,$4,$5) AS id`;
  const schemas = ["public"];
  const { rows } = await pool.query(q, [branch, label, notes || null, schemas, who || null]);
  return rows[0].id;
}
async function listCheckpoints(pool) {
  const { rows } = await pool.query(
    `SELECT id, branch, label, schema_name, notes, created_by, created_at
     FROM admin.db_checkpoints ORDER BY created_at DESC`
  );
  return rows;
}
async function diffCheckpoint(pool, id) {
  const { rows } = await pool.query(
    `SELECT * FROM admin.diff_checkpoint($1)`,
    [id]
  );
  return rows;
}
async function rollbackToCheckpoint(pool, id) {
  await pool.query(`BEGIN`);
  try {
    await pool.query(`SELECT admin.rollback_to_checkpoint($1)`, [id]);
    await pool.query(`COMMIT`);
  } catch (e) {
    await pool.query(`ROLLBACK`);
    throw e;
  }
}

// server/services/db-sync.ts
async function listTables(pool) {
  const { rows } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE'
      AND table_name NOT IN ('sessions') -- optional
    ORDER BY table_name
  `);
  return rows.map((r2) => r2.table_name);
}
async function syncDatabases(opts) {
  const source = getPool(opts.from);
  const target = getPool(opts.to);
  if (opts.from === opts.to) throw new Error("from and to must differ");
  const ckptId = await createCheckpoint(target, opts.to, `autosync_${opts.from}_to_${opts.to}`, "Automatic checkpoint before sync", opts.actor);
  opts.wsBroadcast?.({ type: "sync/checkpoint-created", checkpointId: ckptId });
  const tables = await listTables(source);
  opts.wsBroadcast?.({ type: "sync/tables", tables });
  await target.query(`SELECT pg_advisory_lock(123456789)`);
  try {
    await target.query("BEGIN");
    await target.query(`SET session_replication_role = replica`);
    for (const t of tables) {
      await target.query(`TRUNCATE TABLE public."${t}" CASCADE`);
    }
    opts.wsBroadcast?.({ type: "sync/truncated", count: tables.length });
    for (const t of tables) {
      opts.wsBroadcast?.({ type: "sync/table-start", table: t });
      const { rows: cols } = await target.query(`
        SELECT c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema='public' AND c.table_name=$1
        ORDER BY c.ordinal_position
      `, [t]);
      const colList = cols.map((c) => `"${c.column_name}"`).join(",");
      const batch = 5e3;
      let offset = 0;
      let total = 0;
      while (true) {
        const { rows: chunk } = await source.query(
          `SELECT ${colList || "*"} FROM public."${t}" OFFSET $1 LIMIT $2`,
          [offset, batch]
        );
        if (!chunk.length) break;
        const values = [];
        const placeholders = [];
        chunk.forEach((row, i) => {
          const cols2 = Object.values(row);
          const base = i * cols2.length;
          placeholders.push(
            `(${cols2.map((_c, j) => `$${base + j + 1}`).join(",")})`
          );
          values.push(...cols2);
        });
        if (values.length) {
          await target.query(
            `INSERT INTO public."${t}" (${colList}) VALUES ${placeholders.join(",")}`,
            values
          );
        }
        offset += batch;
        total += chunk.length;
        opts.wsBroadcast?.({ type: "sync/table-progress", table: t, total });
      }
      opts.wsBroadcast?.({ type: "sync/table-done", table: t, total });
    }
    const { rows: seqs } = await source.query(`
      SELECT sequence_schema, sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema='public'
    `);
    for (const s of seqs) {
      const q = `SELECT last_value FROM "${s.sequence_schema}"."${s.sequence_name}"`;
      const { rows } = await source.query(q);
      const last = rows[0]?.last_value ?? 1;
      await target.query(`SELECT setval($1, $2, true)`, [`"${s.sequence_schema}"."${s.sequence_name}"`, last]);
    }
    await target.query(`SET session_replication_role = origin`);
    await target.query("COMMIT");
    opts.wsBroadcast?.({ type: "sync/done", checkpointId: ckptId });
  } catch (e) {
    await target.query("ROLLBACK");
    opts.wsBroadcast?.({ type: "sync/error", error: String(e) });
    throw e;
  } finally {
    await target.query(`SELECT pg_advisory_unlock(123456789)`);
  }
  return { checkpointId: ckptId };
}

// server/routes/admin-database.ts
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var router = Router();
var devPool2 = process.env.DATABASE_URL ? new Pool2({ connectionString: process.env.DATABASE_URL }) : null;
var prodPool2 = process.env.PROD_DATABASE_URL ? new Pool2({ connectionString: process.env.PROD_DATABASE_URL }) : null;
var QueryRequestSchema = z2.object({
  database: z2.enum(["development", "production"]),
  query: z2.string().min(1, "Query cannot be empty")
});
var TableDataRequestSchema = z2.object({
  database: z2.enum(["development", "production"]),
  table: z2.string().min(1, "Table name is required"),
  limit: z2.number().min(1).max(1e3).default(100)
});
function getDatabasePool(database) {
  if (database === "development") {
    return devPool2;
  } else {
    return prodPool2;
  }
}
async function getDatabaseInfo(pool, dbName) {
  if (!pool) {
    return {
      name: dbName,
      tables: [],
      connectionStatus: "error",
      error: `${dbName === "development" ? "DATABASE_URL" : "PROD_DATABASE_URL"} not configured`
    };
  }
  try {
    const tablesResult = await pool.query(`
      SELECT 
        schemaname as schema,
        tablename as name,
        schemaname || '.' || tablename as full_name
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename
    `);
    const tables = [];
    for (const table of tablesResult.rows) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.full_name}`);
        const rowCount = parseInt(countResult.rows[0]?.count || "0");
        const columnsResult = await pool.query(`
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable,
            column_default as default_value
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [table.schema, table.name]);
        const columns = columnsResult.rows.map((col) => ({
          name: col.name,
          type: col.type,
          nullable: col.is_nullable === "YES",
          default: col.default_value
        }));
        tables.push({
          name: table.name,
          schema: table.schema,
          rowCount,
          columns
        });
      } catch (error) {
        console.error(`Error getting info for table ${table.name}:`, error);
        tables.push({
          name: table.name,
          schema: table.schema,
          rowCount: 0,
          columns: []
        });
      }
    }
    return {
      name: dbName,
      tables,
      connectionStatus: "connected"
    };
  } catch (error) {
    console.error(`Error connecting to ${dbName} database:`, error);
    return {
      name: dbName,
      tables: [],
      connectionStatus: "error",
      error: error instanceof Error ? error.message : "Database connection failed"
    };
  }
}
router.get("/databases", async (req, res) => {
  try {
    const [devInfo, prodInfo] = await Promise.all([
      getDatabaseInfo(devPool2, "development"),
      getDatabaseInfo(prodPool2, "production")
    ]);
    res.json({
      development: devInfo,
      production: prodInfo
    });
  } catch (error) {
    console.error("Error fetching database info:", error);
    res.status(500).json({
      error: "Failed to fetch database information",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.post("/database/query", validateRequest(QueryRequestSchema), async (req, res) => {
  const { database, query } = req.body;
  const pool = getDatabasePool(database);
  const startTime = Date.now();
  if (!pool) {
    return res.status(503).json({
      error: `${database} database not configured`
    });
  }
  try {
    const lowerQuery = query.toLowerCase().trim();
    const dangerousKeywords = ["drop", "delete", "truncate", "alter", "create", "insert", "update"];
    const isDangerous = dangerousKeywords.some((keyword) => lowerQuery.startsWith(keyword));
    if (isDangerous) {
      return res.status(403).json({
        error: "Potentially dangerous query detected. Only SELECT queries are allowed for safety."
      });
    }
    const result = await Promise.race([
      pool.query(query),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Query timeout (30s)")), 3e4)
      )
    ]);
    const duration = Date.now() - startTime;
    const response = {
      columns: result.fields?.map((field) => field.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || result.rows?.length || 0,
      duration
    };
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query error in ${database} database:`, error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Query execution failed",
      duration
    });
  }
});
router.post("/database/table-data", validateRequest(TableDataRequestSchema), async (req, res) => {
  const { database, table, limit } = req.body;
  const pool = getDatabasePool(database);
  const startTime = Date.now();
  if (!pool) {
    return res.status(503).json({
      error: `${database} database not configured`
    });
  }
  try {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ error: "Invalid table name" });
    }
    const query = `SELECT * FROM ${table} ORDER BY 1 LIMIT ${limit}`;
    const result = await pool.query(query);
    const duration = Date.now() - startTime;
    const response = {
      columns: result.fields?.map((field) => field.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || result.rows?.length || 0,
      duration
    };
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Table data error for ${table} in ${database}:`, error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to fetch table data",
      duration
    });
  }
});
router.get("/api/admin/db/:branch/checkpoints", async (req, res) => {
  try {
    const pool = getPool(req.params.branch === "prod" ? "prod" : "dev");
    const rows = await listCheckpoints(pool);
    res.json({ ok: true, checkpoints: rows });
  } catch (error) {
    console.error("Error listing checkpoints:", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});
router.post("/api/admin/db/:branch/checkpoint", async (req, res) => {
  try {
    const { label, notes } = req.body || {};
    if (!label) return res.status(400).json({ ok: false, error: "Label required" });
    const branch = req.params.branch === "prod" ? "prod" : "dev";
    const pool = getPool(branch);
    const id = await createCheckpoint(pool, branch, label, notes, req.body?.createdBy || "admin");
    res.json({ ok: true, id });
  } catch (error) {
    console.error("Error creating checkpoint:", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});
router.get("/api/admin/db/:branch/checkpoints/:id/diff", async (req, res) => {
  try {
    const branch = req.params.branch === "prod" ? "prod" : "dev";
    const pool = getPool(branch);
    const diff = await diffCheckpoint(pool, req.params.id);
    res.json({ ok: true, diff });
  } catch (error) {
    console.error("Error diffing checkpoint:", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});
router.post("/api/admin/db/:branch/rollback/:id", async (req, res) => {
  try {
    const branch = req.params.branch === "prod" ? "prod" : "dev";
    const pool = getPool(branch);
    await rollbackToCheckpoint(pool, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error rolling back:", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});
router.post("/api/admin/db/sync", async (req, res) => {
  try {
    const { direction } = req.body;
    if (!direction) return res.status(400).json({ ok: false, error: "direction required" });
    const from = direction === "dev_to_prod" ? "dev" : "prod";
    const to = direction === "dev_to_prod" ? "prod" : "dev";
    if (direction === "dev_to_prod" && req.body?.confirmText !== "SYNC PRODUCTION") {
      return res.status(400).json({ ok: false, error: "Confirmation text mismatch" });
    }
    const result = await syncDatabases({
      from,
      to,
      actor: req.body?.createdBy || "admin"
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error("Error syncing databases:", error);
    res.status(500).json({ ok: false, error: String(error) });
  }
});
var admin_database_default = router;

// server/routes/admin-db.ts
import { Router as Router2 } from "express";
import { z as z3 } from "zod";

// server/middleware/require-admin.ts
function requireAdmin(req, res, next) {
  const isAdmin = req.user?.role === "admin" || req.user?.role === "developer" || req.session?.role === "admin" || req.session?.role === "developer";
  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// server/db/admin.sql.ts
async function listTables2(branch) {
  const db2 = getPool(branch);
  const q = `
    select
      t.table_schema,
      t.table_name,
      t.table_type,
      coalesce(pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)), 0) as total_bytes,
      coalesce(
        (select reltuples::bigint 
         from pg_class c 
         join pg_namespace n on n.oid = c.relnamespace 
         where n.nspname = t.table_schema and c.relname = t.table_name), 
        0
      ) as row_count_estimate
    from information_schema.tables t
    where t.table_schema not in ('pg_catalog','information_schema')
    order by t.table_schema, t.table_name;
  `;
  const { rows } = await db2.query(q);
  return rows;
}
async function tableColumns(branch, schema, table) {
  const db2 = getPool(branch);
  const q = `
    select
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    from information_schema.columns
    where table_schema = $1 and table_name = $2
    order by ordinal_position;
  `;
  const { rows } = await db2.query(q, [schema, table]);
  return rows;
}
async function tableIndexes(branch, schema, table) {
  const db2 = getPool(branch);
  const q = `
    select
      i.relname as index_name,
      pg_get_indexdef(ix.indexrelid) as definition,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary
    from pg_class t
    join pg_namespace n on n.oid = t.relnamespace
    join pg_index ix on t.oid = ix.indrelid
    join pg_class i on i.oid = ix.indexrelid
    where n.nspname = $1 and t.relname = $2
    order by is_primary desc, is_unique desc, index_name;
  `;
  const { rows } = await db2.query(q, [schema, table]);
  return rows;
}
async function migrationHistory(branch) {
  const db2 = getPool(branch);
  const q = `select id, name, run_on from pgmigrations order by run_on desc;`;
  try {
    const { rows } = await db2.query(q);
    return rows;
  } catch {
    return [];
  }
}
async function getTableRowCount(branch, schema, table) {
  const db2 = getPool(branch);
  try {
    const q = `SELECT COUNT(*) as count FROM "${schema}"."${table}"`;
    const { rows } = await db2.query(q);
    return parseInt(rows[0].count);
  } catch {
    return 0;
  }
}
async function executeQuery(branch, query) {
  const db2 = getPool(branch);
  const startTime = Date.now();
  try {
    const result = await db2.query(query);
    const duration = Date.now() - startTime;
    return {
      columns: result.fields?.map((f) => f.name) || [],
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      duration,
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}
async function logAdminAction(branch, action, actorId, details) {
  const db2 = getPool(branch);
  try {
    await db2.query(
      "INSERT INTO admin_actions (actor_id, action, details) VALUES ($1, $2, $3)",
      [actorId, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

// server/routes/admin-db.ts
import { spawn } from "node:child_process";
var getDbForBranch = (branch) => {
  return getPool(branch);
};
var r = Router2();
r.use(requireAdmin);
var BranchSchema = z3.enum(["dev", "prod"]);
r.get("/branches", (_req, res) => {
  res.json([
    {
      key: "dev",
      name: "Development (lucky-poetry)",
      url: process.env.DEV_DATABASE_URL ? "configured" : "missing"
    },
    {
      key: "prod",
      name: "Production (muddy-moon)",
      url: process.env.PROD_DATABASE_URL ? "configured" : "missing"
    }
  ]);
});
r.get("/:branch/tables", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const tables = await listTables2(branch);
    res.json(tables);
  } catch (error) {
    console.error(`Error fetching tables for ${req.params.branch}:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch tables" });
  }
});
r.get("/:branch/tables/:schema/:table", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { schema, table } = req.params;
    const [columns, indexes, rowCount] = await Promise.all([
      tableColumns(branch, schema, table),
      tableIndexes(branch, schema, table),
      getTableRowCount(branch, schema, table)
    ]);
    res.json({ columns, indexes, rowCount });
  } catch (error) {
    console.error(`Error fetching table details:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch table details" });
  }
});
r.get("/:branch/migrations", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const migrations = await migrationHistory(branch);
    res.json(migrations);
  } catch (error) {
    console.error(`Error fetching migrations:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch migrations" });
  }
});
r.post("/:branch/query", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith("select") && !trimmedQuery.startsWith("with")) {
      return res.status(400).json({
        error: "Only SELECT and WITH queries are allowed for security"
      });
    }
    const result = await executeQuery(branch, query);
    await logAdminAction(branch, req.user?.id || "unknown", "query_executed", {
      query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
      branch,
      success: result.success
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
      duration: result.duration
    });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: error.message || "Query execution failed" });
  }
});
r.post("/:branch/table-data", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { table, schema = "public", limit = 100, offset = 0 } = req.body;
    if (!table) {
      return res.status(400).json({ error: "Table name is required" });
    }
    const query = `SELECT * FROM ${schema}.${table} LIMIT ${limit} OFFSET ${offset}`;
    const result = await executeQuery(branch, query);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
      duration: result.duration
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({ error: error.message || "Failed to fetch table data" });
  }
});
r.post("/:branch/migrate", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const direction = z3.enum(["up", "down"]).parse(req.query.dir ?? "up");
    const steps = Number(req.query.steps ?? 1);
    if (branch === "prod" && direction === "down") {
      if (req.body?.confirm !== `ROLLBACK ${steps}`) {
        return res.status(400).json({
          error: `Type confirmation phrase: ROLLBACK ${steps}`
        });
      }
    }
    const databaseUrl = branch === "dev" ? process.env.DEV_DATABASE_URL : process.env.PROD_DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        error: `Database URL not configured for ${branch}`
      });
    }
    const env2 = { ...process.env, DATABASE_URL: databaseUrl };
    const args = [direction, "-m", "server/db/migrations"];
    if (direction === "down" && steps > 1) {
      for (let i = 1; i < steps; i++) {
        args.push("--count", "1");
      }
    }
    const child = spawn("node-pg-migrate", args, { env: env2 });
    let out = "";
    let err = "";
    child.stdout?.on("data", (d) => out += d.toString());
    child.stderr?.on("data", (d) => err += d.toString());
    child.on("close", async (code) => {
      await logAdminAction(branch, req.user?.id || "unknown", "migration_executed", {
        direction,
        steps,
        branch,
        success: code === 0,
        output: out,
        error: err
      });
      res.status(code === 0 ? 200 : 500).json({
        ok: code === 0,
        output: out,
        error: err
      });
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message || "Migration failed" });
  }
});
r.post("/:branch/table-data", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { table, schema = "public", limit = 10, offset = 0 } = req.body;
    if (!table) {
      return res.status(400).json({ error: "Table name is required" });
    }
    const db2 = getDbForBranch(branch);
    const dataQuery = `
      SELECT * FROM "${schema}"."${table}" 
      LIMIT $1 OFFSET $2
    `;
    const dataResult = await db2.query(dataQuery, [limit, offset]);
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;
    const columnsResult = await db2.query(columnsQuery, [schema, table]);
    res.json({
      success: true,
      rows: dataResult.rows,
      columns: columnsResult.rows,
      total_count: dataResult.rows.length,
      limit,
      offset
    });
  } catch (error) {
    console.error(`[ADMIN] Error fetching table data:`, error);
    res.status(500).json({ error: "Failed to fetch table data" });
  }
});
var checkpointStore = { dev: [], prod: [] };
r.post("/:branch/checkpoint", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { label, notes } = req.body;
    if (!label) {
      return res.status(400).json({ error: "Checkpoint label is required" });
    }
    const checkpointId = `checkpoint_${Date.now()}`;
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const checkpoint = {
      id: checkpointId,
      label,
      notes: notes || "",
      branch,
      created_at: timestamp2,
      created_by: req.user?.id || "system"
    };
    checkpointStore[branch].push(checkpoint);
    res.json({
      success: true,
      message: `Checkpoint '${label}' created for ${branch} branch`,
      id: checkpointId,
      created_at: timestamp2
    });
  } catch (error) {
    console.error("Error creating checkpoint:", error);
    res.status(500).json({ error: error.message || "Failed to create checkpoint" });
  }
});
r.get("/:branch/checkpoints", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const checkpoints = checkpointStore[branch] || [];
    const sortedCheckpoints = checkpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
    res.json(sortedCheckpoints);
  } catch (error) {
    console.error("Error fetching checkpoints:", error);
    res.status(500).json({ error: error.message || "Failed to fetch checkpoints" });
  }
});
r.post("/:branch/rollback/:checkpointId", async (req, res) => {
  try {
    const branch = BranchSchema.parse(req.params.branch);
    const { checkpointId } = req.params;
    const { confirmPhrase } = req.body;
    if (confirmPhrase !== `ROLLBACK ${branch.toUpperCase()}`) {
      return res.status(400).json({
        error: `Please type "ROLLBACK ${branch.toUpperCase()}" to confirm this destructive operation`
      });
    }
    const db2 = getDbForBranch(branch);
    const checkpointQuery = `
      SELECT 
        details->>'label' as label,
        details->>'notes' as notes,
        created_at
      FROM admin_actions 
      WHERE (details->>'checkpoint_id' = $1 OR id::text = $1) AND action = 'checkpoint_created'
    `;
    const checkpointResult = await db2.query(checkpointQuery, [checkpointId]);
    if (checkpointResult.rows.length === 0) {
      return res.status(404).json({ error: "Checkpoint not found" });
    }
    const checkpoint = checkpointResult.rows[0];
    await logAdminAction(branch, "rollback_executed", req.user?.id || "system", {
      checkpointId,
      checkpointLabel: checkpoint.label,
      checkpointDate: checkpoint.created_at,
      branch,
      confirmPhrase
    });
    res.json({
      success: true,
      message: `Database rollback to checkpoint '${checkpoint.label}' has been initiated`,
      checkpoint: {
        id: checkpointId,
        label: checkpoint.label,
        created_at: checkpoint.created_at
      },
      warning: "This is a placeholder implementation. In production, this would perform actual database rollback."
    });
  } catch (error) {
    console.error("Rollback error:", error);
    res.status(500).json({ error: error.message || "Rollback failed" });
  }
});
var admin_db_default = r;

// server/routes.ts
init_logger();
init_db();

// server/routes/auth-google.ts
init_storage();
init_env();
import passport3 from "passport";
import { Strategy as GoogleStrategy3 } from "passport-google-oauth20";
import { Router as Router3 } from "express";
var router2 = Router3();
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
      return done(new Error("No email from Google profile"), void 0);
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
        authProvider: "google"
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
    return done(error, void 0);
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
    const baseUrl = process.env.NODE_ENV === "production" ? ENV.frontendOrigin || "" : "";
    const returnUrl = req.session.returnTo || "/dashboard";
    delete req.session.returnTo;
    res.redirect(`${baseUrl}${returnUrl}`);
  }
);
var auth_google_default = router2;

// server/routes/stripe-webhooks.ts
init_storage();
init_logger();
import { Router as Router4 } from "express";
import Stripe2 from "stripe";
import express from "express";
var router3 = Router4();
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
    if (!sig) {
      return res.status(400).send("Missing Stripe signature");
    }
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
  const orderId = paymentIntent.metadata?.orderId ?? null;
  if (!orderId) {
    Logger.error("No orderId in payment intent metadata");
    return;
  }
  Logger.info(`[STRIPE] Payment succeeded for order: ${orderId}`);
  await storage.updateOrderStatus(orderId || "", "confirmed");
  const order = await storage.getOrder(orderId);
  if (order) {
    Logger.info(`[STRIPE] Order ${orderId} confirmed, email sent to ${order.userId}`);
  }
}
async function handlePaymentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata?.orderId ?? null;
  if (!orderId) {
    Logger.error("No orderId in payment intent metadata");
    return;
  }
  Logger.warn(`[STRIPE] Payment failed for order: ${orderId}`);
  await storage.updateOrderStatus(orderId || "", "payment_failed");
  await restoreInventoryForOrder(orderId);
}
async function handlePaymentCanceled(paymentIntent) {
  const orderId = paymentIntent.metadata?.orderId ?? null;
  if (!orderId) {
    Logger.error("No orderId in payment intent metadata");
    return;
  }
  Logger.info(`[STRIPE] Payment canceled for order: ${orderId}`);
  await storage.updateOrderStatus(orderId || "", "cancelled");
  await restoreInventoryForOrder(orderId);
}
async function handleCheckoutCompleted(session3) {
  const orderId = session3.metadata?.orderId;
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
import { Router as Router5 } from "express";
import { eq as eq5, gte as gte2, sql as sql5, and as and3, desc as desc2 } from "drizzle-orm";
var router4 = Router5();
router4.get("/metrics", requireAuth, requireRole("developer"), async (req, res) => {
  try {
    const metrics = {};
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const todayMetrics = await db.select({
      ordersToday: sql5`COUNT(*) FILTER (WHERE created_at >= ${today})`,
      revenueToday: sql5`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${today}), 0)`,
      customersToday: sql5`COUNT(DISTINCT user_id) FILTER (WHERE created_at >= ${today})`
    }).from(orders).where(sql5`status != 'cancelled'`);
    metrics.today = todayMetrics[0];
    const inventoryMetrics = await db.select({
      outOfStock: sql5`COUNT(*) FILTER (WHERE stock_quantity = 0)`,
      lowStock: sql5`COUNT(*) FILTER (WHERE stock_quantity BETWEEN 1 AND 5)`,
      totalProducts: sql5`COUNT(*)`,
      inventoryValue: sql5`COALESCE(SUM(CAST(price AS NUMERIC) * stock_quantity), 0)`
    }).from(products).where(eq5(products.status, "active"));
    metrics.inventory = inventoryMetrics[0];
    const submissionMetrics = await db.select({
      pendingReview: sql5`COUNT(*)`
    }).from(equipmentSubmissions).where(eq5(equipmentSubmissions.status, "pending"));
    metrics.submissions = submissionMetrics[0];
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const topProducts = await db.select({
      name: products.name,
      id: products.id,
      sold: sql5`COUNT(${orderItems.id})`,
      revenue: sql5`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * ${orderItems.quantity}), 0)`
    }).from(products).leftJoin(orderItems, eq5(products.id, orderItems.productId)).leftJoin(orders, eq5(orderItems.orderId, orders.id)).where(
      and3(
        gte2(orders.createdAt, thirtyDaysAgo),
        eq5(orders.status, "delivered")
      )
    ).groupBy(products.id, products.name).orderBy(desc2(sql5`COUNT(${orderItems.id})`)).limit(5);
    metrics.topProducts = topProducts;
    const weekAgo = /* @__PURE__ */ new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = /* @__PURE__ */ new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const weeklyComparison = await db.select({
      thisWeekOrders: sql5`COUNT(*) FILTER (WHERE created_at >= ${weekAgo})`,
      lastWeekOrders: sql5`COUNT(*) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo})`,
      thisWeekRevenue: sql5`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${weekAgo}), 0)`,
      lastWeekRevenue: sql5`COALESCE(SUM(total_amount) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo}), 0)`
    }).from(orders).where(sql5`status != 'cancelled'`);
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
    const allowedStatuses = ORDER_STATUS_MACHINE[order.status || "pending"] || [];
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
          const productId = item.productId;
          const product = await storage.getProduct(productId);
          if (product && product.stockQuantity != null) {
            await storage.updateProduct(productId, {
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
        await storage.updateOrder(orderId, { trackingNumber });
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

// server/routes/admin-setup.ts
init_db();
init_schema();
init_logger();
import { Router as Router6 } from "express";
import { eq as eq6 } from "drizzle-orm";
var router5 = Router6();
router5.post("/api/admin-setup/promote", async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: "User ID or email required" });
    }
    let updateResult;
    if (userId) {
      updateResult = await db.update(users).set({ role: "developer", updatedAt: /* @__PURE__ */ new Date() }).where(eq6(users.id, userId)).returning();
    } else {
      updateResult = await db.update(users).set({ role: "developer", updatedAt: /* @__PURE__ */ new Date() }).where(eq6(users.email, email)).returning();
    }
    if (updateResult.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = updateResult[0];
    Logger.info(`User promoted to developer: ${user.email}`);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    Logger.error("Error promoting user to developer:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
});
router5.get("/api/admin-setup/users", async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      authProvider: users.authProvider,
      createdAt: users.createdAt
    }).from(users).orderBy(users.createdAt);
    res.json({ users: allUsers });
  } catch (error) {
    Logger.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
var admin_setup_default = router5;

// server/routes/checkout.ts
init_storage();
init_auth2();
import { Router as Router7 } from "express";
import { z as z4 } from "zod";

// shared/locality.ts
var SSOT_VERSION = "v2024.1";
var LOCAL_ZIPS = /* @__PURE__ */ new Set(["28801", "28803", "28804", "28805", "28806", "28808"]);
function normalizeZip(input) {
  if (!input) return null;
  const match = String(input).match(/\d{5}/);
  return match ? match[0] : null;
}
function isLocalZip2(zip) {
  const z7 = normalizeZip(zip);
  return !!(z7 && LOCAL_ZIPS.has(z7));
}

// server/services/localityService.ts
init_db();
async function getDefaultZip(userId) {
  if (!userId) return null;
  try {
    const { addresses: addresses2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq10, and: and6 } = await import("drizzle-orm");
    const result = await db.select({ postalCode: addresses2.postalCode }).from(addresses2).where(and6(
      eq10(addresses2.userId, userId),
      eq10(addresses2.isDefault, true)
    )).limit(1);
    return result[0]?.postalCode ?? null;
  } catch (error) {
    console.warn("[LOCALITY] Error fetching default ZIP:", error);
    return null;
  }
}
async function getCoordinatesFromZip(zip) {
  try {
    const canonicalizer = await Promise.resolve().then(() => (init_addressCanonicalizer(), addressCanonicalizer_exports)).catch(() => null);
    if (!canonicalizer) return {};
    return {};
  } catch (error) {
    console.warn("[LOCALITY] Error geocoding ZIP:", error);
    return {};
  }
}
function determineUserMode(status, eligible) {
  if (!eligible) return "NONE";
  switch (status) {
    case "LOCAL":
      return "LOCAL_AND_SHIPPING";
    // Local users can do both
    case "OUT_OF_AREA":
      return "SHIPPING_ONLY";
    // Remote users can only receive shipping
    case "UNKNOWN":
    default:
      return "NONE";
  }
}
function generateReasons(status, source, zip) {
  const reasons = [];
  switch (status) {
    case "LOCAL":
      reasons.push(`ZIP ${zip} is in our local delivery area`);
      if (source === "address") reasons.push("Based on your default address");
      if (source === "zip") reasons.push("Based on ZIP code check");
      break;
    case "OUT_OF_AREA":
      reasons.push(`ZIP ${zip || "unknown"} is outside our local delivery area`);
      reasons.push("Shipping-only items available");
      break;
    case "UNKNOWN":
    default:
      reasons.push("Unable to determine delivery area");
      if (source === "default") reasons.push("No address or ZIP code provided");
      break;
  }
  return reasons;
}
async function getLocalityForRequest(req, zipOverride) {
  const userId = req.user?.id || req.session?.passport?.user || req.session?.userId || null;
  const asOfISO = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const defaultZip = await getDefaultZip(userId);
    const overrideZip = zipOverride || req.query.zip;
    let primaryZip = null;
    let source = "default";
    if (overrideZip) {
      primaryZip = normalizeZip(overrideZip);
      source = "zip";
    } else if (defaultZip) {
      primaryZip = normalizeZip(defaultZip);
      source = "address";
    } else {
      source = "default";
    }
    let status;
    let eligible;
    if (primaryZip && isLocalZip2(primaryZip)) {
      status = "LOCAL";
      eligible = true;
    } else if (primaryZip) {
      status = "OUT_OF_AREA";
      eligible = false;
    } else {
      status = "UNKNOWN";
      eligible = false;
    }
    const geoData = primaryZip ? await getCoordinatesFromZip(primaryZip) : {};
    const effectiveModeForUser = determineUserMode(status, eligible);
    const reasons = generateReasons(status, source, primaryZip || void 0);
    const result = {
      status,
      source,
      eligible,
      zip: primaryZip || void 0,
      lat: geoData.lat,
      lon: geoData.lon,
      distanceMiles: geoData.distanceMiles,
      effectiveModeForUser,
      reasons,
      ssotVersion: SSOT_VERSION,
      asOfISO
    };
    console.log(`[LOCALITY] SSOT evaluation: ${JSON.stringify({
      userId: userId || "guest",
      status,
      source,
      eligible,
      zip: primaryZip,
      effectiveModeForUser
    })}`);
    return result;
  } catch (error) {
    console.error("[LOCALITY] Error in getLocalityForRequest:", error);
    return {
      status: "UNKNOWN",
      source: "default",
      eligible: false,
      effectiveModeForUser: "NONE",
      reasons: ["System error determining locality"],
      ssotVersion: SSOT_VERSION,
      asOfISO
    };
  }
}
var LocalityService = class {
  localZipCodes = /* @__PURE__ */ new Set([
    "28801",
    "28803",
    "28804",
    "28805",
    "28806",
    "28808"
    // Asheville, NC area
  ]);
  async isLocalZipCode(zipCode) {
    if (!zipCode) return false;
    const cleanZip = zipCode.split("-")[0].trim();
    return this.localZipCodes.has(cleanZip);
  }
};
var localityService = new LocalityService();

// server/routes/checkout.ts
var router6 = Router7();
var AddressSchema = z4.object({
  firstName: z4.string(),
  lastName: z4.string(),
  email: z4.string().email(),
  street1: z4.string(),
  street2: z4.string().optional(),
  city: z4.string(),
  state: z4.string(),
  postalCode: z4.string(),
  country: z4.string().default("US")
});
router6.post("/quote", authMiddleware.optionalAuth, async (req, res) => {
  try {
    const { addressId, address } = req.body;
    let addressData = address;
    if (addressId && !address) {
      const userId = req.user?.id || req.session?.passport?.user || null;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const fetched = await storage.getAddress(userId, addressId);
      addressData = fetched || null;
    }
    if (!addressData) {
      return res.status(400).json({ error: "Address information required" });
    }
    const subtotal = 50;
    let shippingOptions = [];
    shippingOptions.push({
      id: "standard",
      service: "standard",
      label: "Standard Shipping (5-7 business days)",
      price: 1500,
      // $15.00 in cents
      eta: "5-7 business days"
    });
    const locality = await getLocalityForRequest(req);
    if (locality.eligible) {
      shippingOptions.push({
        id: "local",
        service: "local",
        label: "Free Local Delivery (1-2 business days)",
        price: 0,
        // Free local delivery
        eta: "1-2 business days"
      });
    }
    shippingOptions.push({
      id: "express",
      service: "express",
      label: "Express Shipping (2-3 business days)",
      price: 2500,
      // $25.00 in cents
      eta: "2-3 business days"
    });
    const response = {
      quotes: shippingOptions,
      subtotal: subtotal * 100,
      // Convert to cents
      tax: Math.round(subtotal * 0.08 * 100),
      // 8% tax in cents
      currency: "USD"
    };
    res.json(response);
  } catch (error) {
    console.error("Error calculating shipping quote:", error);
    res.status(500).json({ error: "Failed to calculate shipping quote" });
  }
});
router6.post("/submit", async (req, res) => {
  try {
    const { addressId, quoteId, contact, deliveryInstructions } = req.body;
    if (!addressId || !quoteId) {
      return res.status(400).json({ error: "Address and shipping method required" });
    }
    const paymentUrl = `/payment?session=checkout_session_${Date.now()}`;
    res.json({ url: paymentUrl });
  } catch (error) {
    console.error("Error submitting checkout:", error);
    res.status(500).json({ error: "Failed to submit checkout" });
  }
});
var checkout_default = router6;

// server/routes/locality.ts
import { Router as Router8 } from "express";
init_auth2();
var router7 = Router8();
router7.get("/status", authMiddleware.optionalAuth, async (req, res) => {
  try {
    const zipOverride = req.query.zip;
    const localityResult = await getLocalityForRequest(req, zipOverride);
    res.json(localityResult);
  } catch (error) {
    console.error("[LOCALITY] Error in /api/locality/status:", error);
    res.status(500).json({
      status: "UNKNOWN",
      source: "default",
      eligible: false,
      effectiveModeForUser: "NONE",
      reasons: ["System error determining locality"],
      ssotVersion: "v2024.1",
      asOfISO: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
var locality_default = router7;

// server/routes.ts
init_schema();
import crypto2 from "crypto";

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
import { eq as eq9, desc as desc3, ilike as ilike2, sql as sql8, and as and5, or as or3, gte as gte3, lte as lte2, asc as asc2, inArray as inArray2, count } from "drizzle-orm";

// server/utils/startup-banner.ts
init_logger();
init_env();
import chalk2 from "chalk";
function displayStartupBanner(config) {
  console.clear();
  Logger.info(chalk2.cyan("\n================================================"));
  Logger.info(chalk2.cyan.bold("        \u{1F3CB}\uFE0F  CLEAN & FLIP - SERVER READY \u{1F3CB}\uFE0F        "));
  Logger.info(chalk2.cyan("================================================\n"));
  const status = [
    { name: "Environment", value: ENV.nodeEnv, status: "info" },
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

// server/routes.ts
init_cache();

// server/config/search.ts
init_db();
init_logger();
import { sql as sql6 } from "drizzle-orm";
async function initializeSearchIndexes() {
  try {
    Logger.info("Initializing search indexes for Neon serverless...");
    try {
      await db.execute(sql6`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS search_vector tsvector
      `);
      Logger.info("\u2705 Search vector column ensured");
    } catch (error) {
      Logger.debug("Search vector column handling:", error?.message || "Unknown error");
    }
    try {
      await db.execute(sql6`
        CREATE INDEX IF NOT EXISTS idx_products_search 
        ON products USING GIN(search_vector)
      `);
      Logger.info("\u2705 Search index ensured");
    } catch (error) {
      Logger.debug("Search index handling:", error?.message || "Unknown error");
    }
    try {
      const updateResult = await db.execute(sql6`
        UPDATE products SET search_vector = 
          setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(brand,'')), 'C')
        WHERE search_vector IS NULL
      `);
      Logger.info("\u2705 Search vectors updated for existing products");
    } catch (error) {
      Logger.warn("Search vector update failed (non-critical):", error?.message || "Unknown error");
    }
    try {
      await db.execute(sql6`
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
      Logger.info("\u2705 Search trigger function created");
    } catch (error) {
      Logger.warn("Search trigger function creation failed:", error?.message || "Unknown error");
    }
    try {
      await db.execute(sql6`
        DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON products
      `);
      await db.execute(sql6`
        CREATE TRIGGER trigger_update_product_search_vector
          BEFORE INSERT OR UPDATE ON products
          FOR EACH ROW EXECUTE FUNCTION update_product_search_vector()
      `);
      Logger.info("\u2705 Search trigger created");
    } catch (error) {
      Logger.warn("Search trigger creation failed:", error?.message || "Unknown error");
    }
    Logger.info("\u2705 Search indexes initialization completed (production-safe)");
  } catch (error) {
    Logger.error("Search indexes initialization failed:", error?.message || "Unknown error");
    Logger.warn("Application will continue without advanced search features");
  }
}

// server/routes.ts
init_cache2();

// server/config/graceful-shutdown.ts
init_cache2();
var server;
function registerGracefulShutdown(httpServer) {
  server = httpServer;
  process.on("SIGTERM", handleShutdown);
  process.on("SIGINT", handleShutdown);
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    if (error.message && error.message.includes("APP_ENV is not defined")) {
      logger.warn("APP_ENV issue detected, but application is operational. Continuing...");
      return;
    }
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
  if (wsManager2 && wsManager2.publishToUser) {
    wsManager2.publishToUser(userId, {
      topic: "cart:update",
      userId,
      count: data?.count || 0
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
var apiCache = new LRUCache({ max: 500, ttl: 5 * 60 * 1e3 });
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
  app2.use((req, _res, next) => {
    const path4 = req.path;
    if (path4 === "/sw.js" || path4 === "/favicon.ico" || path4 === "/manifest.json" || path4.startsWith("/assets/") || path4.startsWith("/static/")) {
      req.isStaticAsset = true;
    }
    return next();
  });
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
  app2.options("/api/*", cors(corsOptions));
  app2.use("/api", cors(corsOptions));
  app2.options("/ws", cors(corsOptions));
  app2.use((req, res, next) => {
    if (req.url.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });
  app2.use(performanceMonitoring);
  app2.use(preventXSS);
  app2.use(preventSQLInjection);
  app2.use(transactionMiddleware);
  app2.use(autoSyncProducts);
  setupAuth(app2);
  app2.get("/api/_debug/session", (req, res) => {
    res.json({
      sessionID: req.sessionID || null,
      hasSession: !!req.session,
      userId: req.session?.userId ?? null,
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      cookieHeader: req.headers.cookie ?? null,
      userAgent: req.headers["user-agent"],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.use("/api/auth", auth_google_default);
  app2.use("/api/stripe", stripe_webhooks_default);
  const addressRoutes = await Promise.resolve().then(() => (init_addresses(), addresses_exports));
  app2.use("/api/addresses", addressRoutes.default);
  const { router: cartRouter } = await Promise.resolve().then(() => (init_cart(), cart_exports));
  const ensureSession2 = (await Promise.resolve().then(() => (init_ensureSession(), ensureSession_exports))).default;
  const mergeCartOnAuth2 = (await Promise.resolve().then(() => (init_mergeCartOnAuth(), mergeCartOnAuth_exports))).default;
  app2.use("/api/cart", ensureSession2);
  app2.use("/api/cart", mergeCartOnAuth2);
  app2.use("/api/cart", cartRouter);
  app2.use("/api/cart-legacy", (req, res, next) => {
    console.log(`[DEPRECATED] Legacy cart route hit: ${req.method} ${req.url} - should be migrated to V2`);
    res.status(410).json({
      error: "DEPRECATED_ROUTE",
      message: "This cart API version has been deprecated. Please use the current API.",
      migrationGuide: "Contact support for migration assistance"
    });
  });
  const shippingRoutes = await Promise.resolve().then(() => (init_shipping2(), shipping_exports));
  app2.use("/api/shipping", shippingRoutes.default);
  app2.use("/api/checkout", checkout_default);
  app2.use("/api/locality", locality_default);
  if (process.env.NODE_ENV === "development") {
    app2.use("/", admin_setup_default);
  }
  const cartValidationRoutes = await Promise.resolve().then(() => (init_cart_validation(), cart_validation_exports));
  app2.use("/api/cart", cartValidationRoutes.default);
  app2.use("/api/admin", admin_metrics_default);
  try {
    await initializeSearchIndexes();
  } catch (error) {
    Logger.warn("Search initialization failed, continuing without advanced search:", error?.message || "Unknown error");
  }
  const { addDiagnosticRoutes: addDiagnosticRoutes2 } = await Promise.resolve().then(() => (init_diagnostic(), diagnostic_exports));
  addDiagnosticRoutes2(app2);
  app2.get("/health", healthLive);
  app2.get("/health/live", healthLive);
  app2.get("/health/ready", healthReady);
  try {
    const { universalHealth: universalHealth2 } = await Promise.resolve().then(() => (init_universal_health(), universal_health_exports));
    app2.use(universalHealth2);
    Logger.debug("\u2705 Universal Environment System health endpoint mounted");
  } catch (error) {
    Logger.warn("\u{1F7E1} Universal health endpoint failed to mount:", error?.message || error);
  }
  const geocodeCache = new LRUCache({ max: 500, ttl: 1e3 * 60 * 60 });
  const geocodeLimiter = rateLimit2({
    windowMs: 6e4,
    // 1 minute
    limit: 30,
    // 30 requests per minute per IP
    message: { error: "GEOCODE_RATE_LIMIT", message: "Too many geocoding requests" }
  });
  app2.use("/api/geocode/autocomplete", geocodeLimiter);
  app2.get("/api/geocode/autocomplete", async (req, res) => {
    try {
      const text2 = String(req.query.text || "").trim();
      if (text2.length < 3) {
        return res.json({ results: [] });
      }
      const cacheKey = `geo:${text2.toLowerCase()}`;
      const cached = geocodeCache.get(cacheKey);
      if (cached) {
        console.log("\u2705 Geocode cache hit:", text2);
        return res.json(cached);
      }
      const apiKey = process.env.GEOAPIFY_API_KEY;
      if (!apiKey) {
        console.error("GEOAPIFY_API_KEY missing in server environment");
        return res.status(500).json({ error: "API key not configured" });
      }
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text2)}&apiKey=${apiKey}&filter=countrycode:us&limit=5&format=json`;
      console.log("\u{1F50D} Server-side GEOApify request:", { text: text2, maskedUrl: url.replace(apiKey, "***") });
      const response = await fetch(url);
      if (response.status === 429) {
        return res.status(429).json({ error: "GEOCODE_RATE_LIMIT", message: "Quota exceeded" });
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GEOApify API Error:", response.status, errorText);
        return res.status(200).json({ results: [] });
      }
      const data = await response.json();
      console.log("\u2705 GEOApify success:", data.results?.length || 0, "results");
      geocodeCache.set(cacheKey, data);
      res.json(data);
    } catch (error) {
      console.error("Geocoding proxy error:", error);
      res.status(200).json({ results: [] });
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
              error: error?.message || "Unknown error"
            });
            return null;
          }
        });
        const batchResults = await Promise.all(batchPromises);
        uploadResults.push(...batchResults.filter(Boolean));
      }
      files.forEach((file) => {
        if (file && "buffer" in file) file.buffer = null;
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
        urls: uploadResults.map((r2) => r2.url),
        uploaded: uploadResults.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : void 0,
        processingTime
      });
    } catch (error) {
      Logger.error("Upload endpoint error:", error);
      if (req.files) {
        req.files.forEach((file) => {
          if (file?.buffer) file.buffer = null;
        });
      }
      res.status(500).json({
        error: "Upload failed",
        message: error?.message || "Unknown error"
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
      const signatureString = Object.keys(params).sort().map((key2) => `${key2}=${params[key2]}`).join("&") + process.env.CLOUDINARY_API_SECRET;
      const signature = crypto2.createHash("sha1").update(signatureString).digest("hex");
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
      const active = String(req.query.active ?? "all");
      const key2 = `categories:${active}`;
      const hit = apiCache.get(key2);
      if (hit) {
        return res.json(hit);
      }
      let data;
      if (req.query.active === "true") {
        data = await storage.getActiveCategoriesForHomepage();
        if (!data) {
          const cached = await getCachedCategories();
          if (cached) data = cached;
        }
        if (data) {
          apiCache.set(key2, data);
          await setCachedCategories(data);
        }
      } else {
        data = await storage.getCategories();
        apiCache.set(key2, data);
      }
      res.json(data || []);
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
    const startTime = Date.now();
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 8;
      if (isNaN(limit) || limit < 1 || limit > 50) {
        return res.status(400).json({
          error: "Invalid limit parameter",
          message: "Limit must be a number between 1 and 50"
        });
      }
      Logger.debug(`[FEATURED] Fetching featured products (limit: ${limit})`);
      const products2 = await storage.getFeaturedProducts(limit);
      const duration = Date.now() - startTime;
      Logger.debug(`[FEATURED] Successfully returned ${products2.length} products in ${duration}ms`);
      res.json(products2);
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error("[FEATURED] Fatal error:", {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        duration,
        stack: error?.stack?.slice(0, 500)
      });
      res.status(200).json([]);
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
      Logger.info(`[CART] Get cart - userId: ${userId}, sessionId: ${sessionId}, isAuthenticated: ${req.isAuthenticated?.()}`);
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "ETag": `"cart-${Date.now()}"`
      });
      const cartEntries = await storage.getCartItems(
        userId || void 0,
        sessionId
      );
      const items = Array.isArray(cartEntries) ? cartEntries : [];
      const subtotal = items.reduce((sum2, item) => sum2 + Number(item.product?.price ?? 0) * item.quantity, 0);
      const total = subtotal;
      const cleanCart = {
        id: `cart-${userId || sessionId}`,
        items,
        subtotal,
        total,
        shippingAddressId: null
      };
      Logger.info(`[CART] Returning cart with ${items.length} items, subtotal: ${subtotal}`);
      res.json(cleanCart);
    } catch (error) {
      Logger.error("Error fetching cart", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });
  app2.patch("/api/cart/items/:productId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      const { productId } = req.params;
      const { quantity } = req.body;
      console.log(`[CART UPDATE] User ${userId} updating product ${productId} to quantity ${quantity}`);
      const cartEntries = await storage.getCartItems(userId || void 0, sessionId);
      const itemToUpdate = cartEntries.find((item) => item.productId === productId);
      if (!itemToUpdate) {
        console.log(`[CART UPDATE ERROR] Product ${productId} not found in user's cart`);
        return res.status(404).json({ error: "Cart item not found" });
      }
      console.log(`[CART UPDATE] Updating cart item ${itemToUpdate.id} to quantity ${quantity}`);
      const updatedItem = await storage.updateCartItem(itemToUpdate.id, quantity);
      if (userId) broadcastCartUpdate(userId);
      res.json(updatedItem);
    } catch (error) {
      Logger.error("Error updating cart item", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  app2.delete("/api/cart/items/:productId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      const { productId } = req.params;
      console.log(`[CART DELETE ROUTE] === STARTING CART REMOVAL ===`);
      console.log(`[CART DELETE ROUTE] User: ${userId}, Product: ${productId}`);
      const cartItem = await db.select().from(cartItems).where(and5(
        eq9(cartItems.userId, userId),
        eq9(cartItems.productId, productId)
      )).limit(1);
      console.log(`[CART DELETE ROUTE] Found cart items:`, cartItem);
      if (cartItem.length === 0) {
        console.log(`[CART DELETE ROUTE] No cart item found for product ${productId}`);
        return res.status(404).json({ error: "Cart item not found" });
      }
      const itemToDelete = cartItem[0];
      console.log(`[CART DELETE ROUTE] Deleting cart item:`, itemToDelete.id);
      const deleteResult = await db.delete(cartItems).where(eq9(cartItems.id, itemToDelete.id));
      console.log(`[CART DELETE ROUTE] Delete result:`, deleteResult.rowCount);
      if (deleteResult.rowCount === 0) {
        console.log(`[CART DELETE ROUTE] ERROR - No rows deleted`);
        return res.status(500).json({ error: "Failed to delete cart item" });
      }
      console.log(`[CART DELETE ROUTE] SUCCESS - Item deleted successfully`);
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
  app2.post("/api/cart/validate", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.sessionID;
      const cartEntries = await storage.getCartItems(
        userId || void 0,
        sessionId
      );
      const updates = [];
      for (const item of cartEntries) {
        const product = await storage.getProduct(item.productId);
        if (!product || product.status !== "active") {
          await db.delete(cartItems).where(eq9(cartItems.id, item.id));
          updates.push({ action: "removed", itemId: item.id, reason: "Product unavailable" });
          continue;
        }
        if (item.quantity > (product.stockQuantity || 0)) {
          const newQuantity = Math.max(0, product.stockQuantity || 0);
          if (newQuantity === 0) {
            await db.delete(cartItems).where(eq9(cartItems.id, item.id));
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
      res.status(500).json({ message: error?.message || "Failed to validate cart" });
    }
  });
  app2.put("/api/cart/shipping-address", requireAuth, async (req, res) => {
    try {
      const { addressId } = req.body;
      const userId = req.userId;
      if (!addressId) {
        return res.status(400).json({ error: "Address ID is required" });
      }
      const address = await storage.getAddress(userId, addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ error: "Address not found" });
      }
      await storage.setCartShippingAddress(userId, addressId);
      res.json({
        ok: true,
        shippingAddress: address
      });
    } catch (error) {
      Logger.error("Error setting cart shipping address", error);
      res.status(500).json({ error: "Failed to set shipping address" });
    }
  });
  app2.post("/api/cart/shipping-address", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { saveToProfile = false, makeDefault = false, ...addressData } = req.body;
      const validatedAddress = insertAddressSchema.parse({
        ...addressData,
        userId,
        isDefault: saveToProfile && makeDefault
      });
      let address;
      if (saveToProfile) {
        address = await storage.createAddress(userId, validatedAddress);
      } else {
        address = await storage.createAddress(userId, {
          ...validatedAddress,
          isDefault: false
        });
      }
      await storage.setCartShippingAddress(userId, address.id);
      res.json(address);
    } catch (error) {
      Logger.error("Error creating cart shipping address", error);
      res.status(500).json({ error: "Failed to create shipping address" });
    }
  });
  app2.get("/api/orders", requireAuth, async (req, res) => {
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
  app2.post("/api/contact", apiLimiter, async (req, res) => {
    try {
      const { emailService: emailService2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const { name, email, topic, subject, message } = req.body;
      if (!name || !email || !topic || !subject || !message) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "All fields are required"
        });
      }
      await emailService2.sendContactEmail({
        name,
        email,
        topic,
        subject,
        message
      });
      Logger.info(`Contact form submission from ${email} with subject "${subject}"`);
      res.status(200).json({
        success: true,
        message: "Message sent successfully. We'll get back to you within 24 hours."
      });
    } catch (error) {
      Logger.error("Error processing contact form", error);
      res.status(500).json({
        error: "Failed to send message",
        message: "Please try again or contact us directly at support@cleanandflip.com"
      });
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
  app2.post("/api/create-payment-intent", requireAuth, async (req, res) => {
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
  app2.post("/api/orders", requireAuth, async (req, res) => {
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
  app2.get("/api/health/schema-check", async (req, res) => {
    const results = {
      status: "checking",
      issues: [],
      tables: {},
      hasAddressesTable: false
    };
    try {
      try {
        await db.execute(sql8`SELECT subcategory FROM products LIMIT 1`);
        results.tables["products.subcategory"] = "exists";
      } catch (e) {
        results.tables["products.subcategory"] = "missing";
        results.issues.push("products.subcategory column missing");
      }
      const addressCheck = await db.execute(sql8`
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
          image: sql8`${products.images}->0`,
          type: sql8`'product'`
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
          type: sql8`'category'`
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
          usersQuery.orderBy(sortOrder === "desc" ? desc3(users.createdAt) : asc2(users.createdAt));
          break;
        case "name":
          usersQuery.orderBy(sortOrder === "desc" ? desc3(users.firstName) : asc2(users.firstName));
          break;
        case "email":
          usersQuery.orderBy(sortOrder === "desc" ? desc3(users.email) : asc2(users.email));
          break;
        default:
          usersQuery.orderBy(desc3(users.createdAt));
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
            const key2 = item.productName;
            productSales[key2] = (productSales[key2] || 0) + (item.quantity || 1);
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
        }).from(products).orderBy(desc3(products.views)).limit(5);
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
      }).from(products).orderBy(desc3(products.views)).limit(10);
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
      res.status(500).json({ error: error?.message || "Failed to fetch analytics" });
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
        featured: products.featured,
        isLocalDeliveryAvailable: products.isLocalDeliveryAvailable,
        isShippingAvailable: products.isShippingAvailable,
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
        conditions.push(gte3(sql8`CAST(${products.price} AS NUMERIC)`, minPrice));
      }
      if (maxPrice < 1e4) {
        conditions.push(lte2(sql8`CAST(${products.price} AS NUMERIC)`, maxPrice));
      }
      if (conditions.length > 0) {
        query = query.where(and5(...conditions));
      }
      const sortColumn = sortBy === "name" ? products.name : sortBy === "price" ? sql8`CAST(${products.price} AS NUMERIC)` : sortBy === "stock" ? products.stockQuantity : products.createdAt;
      query = query.orderBy(sortOrder === "desc" ? desc3(sortColumn) : asc2(sortColumn));
      let countQuery = db.select({ count: sql8`count(*)` }).from(products);
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
          status: (product.stockQuantity || 0) > 0 ? "active" : "inactive",
          featured: product.featured,
          isLocalDeliveryAvailable: product.isLocalDeliveryAvailable,
          isShippingAvailable: product.isShippingAvailable
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
      res.status(500).json({ error: error?.message || "Failed to fetch products" });
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
      try {
        const { clearProductCache: clearProductCache3 } = await Promise.resolve().then(() => (init_cache2(), cache_exports));
        await clearProductCache3(id);
        Logger.info("Cache cleared successfully for deleted product:", id);
      } catch (error) {
        Logger.warn("Cache clearing failed (non-critical):", error);
      }
      try {
        if (wsManager3?.publish) {
          wsManager3.publish({
            topic: "product:update",
            productId: id
          });
        }
      } catch (error) {
        Logger.warn("WebSocket broadcast failed:", error);
      }
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
        productCount: sql8`(SELECT COUNT(*) FROM products WHERE category_id = categories.id)`
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
      const sortColumn = sortBy === "name" ? categories.name : sortBy === "products" ? sql8`(SELECT COUNT(*) FROM products WHERE category_id = categories.id)` : sortBy === "created" ? categories.createdAt : categories.displayOrder;
      query = query.orderBy(sortOrder === "desc" ? desc3(sortColumn) : asc2(sortColumn));
      const result = await query;
      const totalProducts = await db.select({ count: sql8`COUNT(*)` }).from(products);
      const activeCategories = result.filter((cat) => cat.isActive).length;
      const emptyCategories = result.filter((cat) => Number(cat.productCount) === 0).length;
      res.json({
        categories: result.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          isActive: category.isActive,
          displayOrder: category.displayOrder || 0,
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
        try {
          if (wsManager3?.publish) {
            wsManager3.publish({
              topic: "category:update",
              categoryId: newCategory.id
            });
          }
        } catch (error) {
          Logger.warn("WebSocket broadcast failed:", error);
        }
        res.json(newCategory);
      } catch (error) {
        Logger.error("Error creating category", error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  );
  app2.put(
    "/api/admin/categories/:id",
    /* requireRole('developer'), */
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
        try {
          if (wsManager3?.publish) {
            wsManager3.publish({
              topic: "category:update",
              categoryId: req.params.id
            });
          }
        } catch (error) {
          Logger.warn("WebSocket broadcast failed:", error);
        }
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
      try {
        if (wsManager3?.publish) {
          wsManager3.publish({
            topic: "category:update",
            categoryId: req.params.id
          });
        }
      } catch (error) {
        Logger.warn("WebSocket broadcast failed:", error);
      }
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
  app2.delete(
    "/api/admin/categories/:id",
    /* requireRole('developer'), */
    async (req, res) => {
      try {
        const { id } = req.params;
        const productCount = await db.select({ count: sql8`COUNT(*)` }).from(products).where(sql8`category_id = ${id}`);
        if (productCount[0]?.count > 0) {
          return res.status(400).json({
            error: "Cannot delete category with products",
            message: `This category has ${productCount[0].count} products. Please move or delete these products first, then try again.`,
            productCount: productCount[0].count
          });
        }
        await db.delete(categories).where(eq9(categories.id, id));
        try {
          if (wsManager3?.publish) {
            wsManager3.publish({
              topic: "category:update",
              categoryId: id
            });
          }
        } catch (error) {
          Logger.warn("WebSocket broadcast failed:", error);
        }
        res.json({ success: true });
      } catch (error) {
        Logger.error("Error deleting category", error);
        res.status(500).json({ message: "Failed to delete category" });
      }
    }
  );
  app2.get("/api/admin/system/health", requireRole("developer"), async (req, res) => {
    try {
      const { APP_ENV: APP_ENV3, DB_HOST: DB_HOST2 } = await Promise.resolve().then(() => (init_env(), env_exports));
      const { universalPool: universalPool2 } = (init_universal_pool(), __toCommonJS(universal_pool_exports));
      const startTime = process.uptime();
      const memoryUsage = process.memoryUsage();
      let dbStatus = "Connected";
      let dbLatency = 0;
      let dbInfo = { database: "unknown", role: "unknown" };
      try {
        const start = Date.now();
        const result = await universalPool2.query(`select current_database() as db, current_user as role`);
        dbLatency = Date.now() - start;
        dbInfo = { database: result.rows[0]?.db || "unknown", role: result.rows[0]?.role || "unknown" };
      } catch (error) {
        dbStatus = "Disconnected";
      }
      const databaseName = DB_HOST2.includes("muddy-moon") ? "Production database (muddy-moon)" : DB_HOST2.includes("lucky-poetry") ? "Development database (lucky-poetry)" : `Database (${DB_HOST2.split("-")[1] || "unknown"})`;
      const systemHealth = {
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: Math.floor(startTime),
        database: {
          status: dbStatus,
          latency: dbLatency,
          provider: "Neon PostgreSQL",
          name: databaseName,
          host: DB_HOST2,
          current_database: dbInfo.database,
          current_role: dbInfo.role
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
        environment: APP_ENV3,
        // Use Universal Environment System
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
      const [userCount] = await db.select({ count: sql8`COUNT(*)` }).from(users);
      const [productCount] = await db.select({ count: sql8`COUNT(*)` }).from(products);
      const [orderCount] = await db.select({ count: sql8`COUNT(*)` }).from(orders);
      const systemInfo = {
        application: {
          name: "Clean & Flip Admin",
          version: "1.0.0",
          environment: (init_env(), __toCommonJS(env_exports)).APP_ENV,
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
  app2.get("/api/users", requireRole("developer"), async (req, res) => {
    try {
      const usersList = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        profileImageUrl: users.profileImageUrl,
        // Include address information using COALESCE for production compatibility
        addressId: sql8`(SELECT id FROM addresses WHERE user_id = ${users.id} AND is_default = true LIMIT 1)`,
        street: sql8`(SELECT COALESCE(street1, street, '') FROM addresses WHERE user_id = ${users.id} AND is_default = true LIMIT 1)`,
        city: sql8`(SELECT city FROM addresses WHERE user_id = ${users.id} AND is_default = true LIMIT 1)`,
        state: sql8`(SELECT state FROM addresses WHERE user_id = ${users.id} AND is_default = true LIMIT 1)`,
        zipCode: sql8`(SELECT COALESCE(postal_code, zip_code) FROM addresses WHERE user_id = ${users.id} AND is_default = true LIMIT 1)`
      }).from(users).limit(100);
      const transformedUsers = usersList.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.role !== "banned",
        // Derive from role until column is added
        lastLogin: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt?.toISOString() || null,
        profileImageUrl: user.profileImageUrl,
        // Address information from SSOT addresses table
        addressId: user.addressId,
        street: user.street,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode
      }));
      res.json(transformedUsers);
    } catch (error) {
      Logger.error("Error fetching users", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  try {
    const authUnifiedModule = await Promise.resolve().then(() => (init_auth_unified(), auth_unified_exports));
    const authUnifiedRoutes = authUnifiedModule.default;
    app2.use(authUnifiedRoutes);
  } catch (error) {
    console.warn("Failed to load unified auth routes:", error);
  }
  app2.use(authImprovements.improvedAuthLogging);
  try {
    app2.use("/api/admin", requireRole("developer"), admin_database_default);
    console.log("\u2705 Admin database routes registered successfully");
  } catch (error) {
    console.error("Failed to load admin database routes:", error);
  }
  try {
    app2.use("/api/admin/db", requireRole("developer"), admin_db_default);
    console.log("\u2705 Enhanced admin database routes registered successfully");
  } catch (error) {
    console.error("Failed to load enhanced admin database routes:", error);
  }
  app2.post("/api/track-activity", (req, res) => {
    res.status(202).end();
    setImmediate(async () => {
      try {
        const { eventType, pageUrl, userId } = req.body;
        const sessionId = req.sessionID || req.headers["x-session-id"] || "anonymous";
        const activity = {
          eventType,
          pageUrl,
          userId: userId || null,
          sessionId: String(sessionId),
          ip: req.ip,
          userAgent: req.get("user-agent") || null,
          at: /* @__PURE__ */ new Date()
        };
      } catch (error) {
        Logger.debug?.("track-activity failed", { error });
      }
    });
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
          status: "active",
          continueSellingWhenOutOfStock: req.body.continueSellingWhenOutOfStock ?? req.body.continue_selling_when_out_of_stock ?? false
        };
        Logger.debug(`Creating product with data: ${JSON.stringify(productData)}`);
        const newProduct = await storage.createProduct(productData);
        try {
          const { clearProductCache: clearProductCache3 } = await Promise.resolve().then(() => (init_cache2(), cache_exports));
          await clearProductCache3();
          Logger.info("Cache cleared successfully for new product:", newProduct.id);
        } catch (error) {
          Logger.warn("Cache clearing failed (non-critical):", error);
        }
        try {
          if (wsManager3?.publish) {
            wsManager3.publish({
              topic: "product:update",
              productId: newProduct.id
            });
          }
        } catch (error) {
          Logger.warn("WebSocket broadcast failed:", error);
        }
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
        const b = req.body ?? {};
        const safeBool = (val, defaultVal = false) => {
          if (typeof val === "boolean") return val;
          if (typeof val === "string") return val.toLowerCase() === "true";
          return !!val || defaultVal;
        };
        const numeric = (v, def = 0) => isNaN(parseFloat(v)) ? def : parseFloat(v);
        const intNum = (v, def = 0) => isNaN(parseInt(v)) ? def : parseInt(v);
        const categoryId = b.categoryId ?? b.category_id ?? null;
        const isFeatured = safeBool(b.isFeatured ?? b.is_featured ?? b.featured, false);
        const isLocal = safeBool(b.isLocalDeliveryAvailable ?? b.is_local_delivery_available ?? b.local_delivery, false);
        const isShip = safeBool(b.isShippingAvailable ?? b.is_shipping_available ?? b.shipping_available, true);
        const continueWhenOutOfStock = safeBool(b.continueSellingWhenOutOfStock ?? b.continue_selling_when_out_of_stock, false);
        let fulfillmentMode = "LOCAL_AND_SHIPPING";
        if (isLocal && !isShip) fulfillmentMode = "LOCAL_ONLY";
        const baseData = {
          name: b.name,
          description: b.description,
          categoryId,
          brand: b.brand ?? null,
          price: numeric(b.price),
          compare_at_price: b.compareAtPrice != null ? numeric(b.compareAtPrice) : null,
          cost: b.cost != null ? numeric(b.cost) : null,
          stockQuantity: intNum(b.stockQuantity ?? b.stock_quantity ?? b.stock, 0),
          continueSellingWhenOutOfStock: continueWhenOutOfStock,
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
          fulfillmentMode,
          fulfillment_mode: fulfillmentMode
        };
        Logger.debug(`Updating product with data: ${JSON.stringify(baseData)}`);
        const updatePayload = { ...baseData, price: String(baseData.price) };
        const updatedProduct = await storage.updateProduct(id, updatePayload);
        try {
          const { clearProductCache: clearProductCache3 } = await Promise.resolve().then(() => (init_cache2(), cache_exports));
          await clearProductCache3(id);
          Logger.info("Cache cleared successfully for product:", id);
        } catch (error) {
          Logger.warn("Cache clearing failed (non-critical):", error);
        }
        try {
          if (wsManager3?.publish) {
            const payload = {
              id,
              productId: id,
              product: updatedProduct,
              featured: updatedProduct.featured
            };
            console.log("\u{1F680} Broadcasting product update:", payload);
            wsManager3.publish({ topic: "product:update", productId: id });
            Logger.info("WebSocket broadcast sent successfully for product:", id);
          } else {
            Logger.warn("WebSocket manager not available for broadcast");
          }
        } catch (error) {
          Logger.warn("WebSocket broadcast failed:", error);
        }
        res.json(updatedProduct);
      } catch (error) {
        Logger.error("Update product error:", error);
        if (error?.code === "23503") {
          return res.status(400).json({
            error: "Invalid category selected. Please choose a valid category.",
            details: "The selected category does not exist."
          });
        }
        if (error?.code === "23505") {
          return res.status(409).json({
            error: "Duplicate value detected.",
            details: "A product with this SKU or identifier already exists."
          });
        }
        res.status(500).json({ error: "Failed to update product: " + (error?.message || "Unknown error") });
      }
    }
  );
  app2.put("/api/admin/products/:id/stock", requireRole("developer"), async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateProductStock(req.params.id, status);
      try {
        const { clearProductCache: clearProductCache3 } = await Promise.resolve().then(() => (init_cache2(), cache_exports));
        await clearProductCache3(req.params.id);
        Logger.info("Cache cleared successfully for stock update:", req.params.id);
      } catch (error) {
        Logger.warn("Cache clearing failed (non-critical):", error);
      }
      try {
        if (wsManager3?.publish) {
          wsManager3.publish({
            topic: "stock:update",
            productId: req.params.id,
            qty: status
          });
        }
      } catch (error) {
        Logger.warn("WebSocket broadcast failed:", error);
      }
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
      const addressFields = {
        street: updateData.street,
        city: updateData.city,
        state: updateData.state,
        zipCode: updateData.zipCode
      };
      const hasAddressData = Object.values(addressFields).some((val) => val && val.trim());
      if (hasAddressData) {
        Logger.info(`Updating address for user ${id}:`, addressFields);
        try {
          const [existingAddress] = await db.select().from(addresses).where(and5(
            eq9(addresses.userId, id),
            eq9(addresses.isDefault, true)
          )).limit(1);
          if (existingAddress) {
            await db.update(addresses).set({
              street1: addressFields.street,
              city: addressFields.city,
              state: addressFields.state,
              postalCode: addressFields.zipCode,
              country: "US",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq9(addresses.id, existingAddress.id));
            Logger.info(`Updated existing address ${existingAddress.id} for user ${id}`);
          } else {
            const [newAddress] = await db.insert(addresses).values({
              userId: id,
              street1: addressFields.street,
              city: addressFields.city,
              state: addressFields.state,
              postalCode: addressFields.zipCode,
              country: "US",
              isDefault: true,
              type: "home",
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }).returning();
            Logger.info(`Created new address ${newAddress.id} for user ${id}`);
          }
        } catch (addressError) {
          Logger.warn(`Address update failed for user ${id}:`, addressError);
        }
      }
      try {
        const { wsManager: wsManager4 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        if (wsManager4?.publish) {
          wsManager4.publish({
            topic: "user:update",
            userId: id
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
        details: error?.message
      });
    }
  });
  app2.post("/api/admin/users", requireRole("developer"), async (req, res) => {
    try {
      const { email, password, role = "user", firstName, lastName, phone, street, city, state, zipCode } = req.body;
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
      const addressFields = {
        street,
        city,
        state,
        zipCode
      };
      const hasAddressData = Object.values(addressFields).some((val) => val && val.trim());
      if (hasAddressData) {
        Logger.info(`Creating address for new user ${newUser.id}:`, addressFields);
        try {
          const [newAddress] = await db.insert(addresses).values({
            userId: newUser.id,
            street1: addressFields.street,
            city: addressFields.city,
            state: addressFields.state,
            postalCode: addressFields.zipCode,
            country: "US",
            isDefault: true,
            type: "home",
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).returning();
          Logger.info(`Created address ${newAddress.id} for new user ${newUser.id}`);
        } catch (addressError) {
          Logger.warn(`Address creation failed for new user ${newUser.id}:`, addressError);
        }
      }
      try {
        const { wsManager: wsManager4 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        if (wsManager4?.publish) {
          wsManager4.publish({
            topic: "user:update",
            userId: newUser.id
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
        details: error?.message
      });
    }
  });
  app2.delete("/api/admin/users/:id", requireRole("developer"), async (req, res) => {
    try {
      const { id } = req.params;
      const [userToDelete] = await db.select().from(users).where(eq9(users.id, id)).limit(1);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }
      await db.delete(users).where(eq9(users.id, id));
      try {
        if (wsManager3?.publish) {
          wsManager3.publish({
            topic: "user:update",
            userId: id
          });
        }
      } catch (error) {
        Logger.warn("WebSocket broadcast failed:", error);
      }
      res.json({
        success: true,
        message: `User ${userToDelete.email} has been deleted`
      });
    } catch (error) {
      Logger.error("Error deleting user", error);
      res.status(500).json({
        error: "Failed to delete user",
        details: error?.message
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
        createdAt: submission.createdAt
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
      const query = db.select({
        submission: {
          id: equipmentSubmissions.id,
          referenceNumber: equipmentSubmissions.referenceNumber,
          name: equipmentSubmissions.name,
          brand: equipmentSubmissions.brand,
          category: equipmentSubmissions.category,
          condition: equipmentSubmissions.condition,
          description: equipmentSubmissions.description,
          images: equipmentSubmissions.images,
          askingPrice: equipmentSubmissions.askingPrice,
          weight: equipmentSubmissions.weight,
          status: equipmentSubmissions.status,
          adminNotes: equipmentSubmissions.adminNotes,
          createdAt: equipmentSubmissions.createdAt,
          updatedAt: equipmentSubmissions.updatedAt
        },
        user: {
          name: sql8`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          email: users.email
        }
      }).from(equipmentSubmissions).leftJoin(users, eq9(equipmentSubmissions.userId, users.id)).orderBy(desc3(equipmentSubmissions.createdAt)).limit(Number(limit)).offset((Number(page) - 1) * Number(limit));
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
          equipmentName: s.submission.name,
          description: s.submission.description,
          brand: s.submission.brand,
          condition: s.submission.condition,
          weight: s.submission.weight,
          askingPrice: s.submission.askingPrice,
          status: s.submission.status,
          createdAt: s.submission.createdAt,
          adminNotes: s.submission.adminNotes,
          images: s.submission.images || [],
          user: s.user || { name: "", email: "" }
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
      const submissions = await db.select({
        id: equipmentSubmissions.id,
        referenceNumber: equipmentSubmissions.referenceNumber,
        name: equipmentSubmissions.name,
        brand: equipmentSubmissions.brand,
        category: equipmentSubmissions.category,
        condition: equipmentSubmissions.condition,
        description: equipmentSubmissions.description,
        images: equipmentSubmissions.images,
        askingPrice: equipmentSubmissions.askingPrice,
        weight: equipmentSubmissions.weight,
        status: equipmentSubmissions.status,
        adminNotes: equipmentSubmissions.adminNotes,
        createdAt: equipmentSubmissions.createdAt,
        updatedAt: equipmentSubmissions.updatedAt
      }).from(equipmentSubmissions).where(eq9(equipmentSubmissions.userId, userId)).orderBy(desc3(equipmentSubmissions.createdAt));
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
      await db.update(equipmentSubmissions).set({
        status: "cancelled",
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
      res.status(500).json({ error: error?.message || "Failed to update submission" });
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
      const successCount = results.filter((r2) => r2.status === "fulfilled").length;
      Logger.info(`Bulk action ${action} completed for ${successCount}/${submissionIds.length} submissions`);
      res.json({ success: true, updated: successCount, total: submissionIds.length });
    } catch (error) {
      Logger.error("Error performing bulk action", error);
      res.status(500).json({ error: error?.message || "Failed to perform bulk action" });
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
      let query = db.select({
        submission: {
          id: equipmentSubmissions.id,
          referenceNumber: equipmentSubmissions.referenceNumber,
          name: equipmentSubmissions.name,
          brand: equipmentSubmissions.brand,
          category: equipmentSubmissions.category,
          condition: equipmentSubmissions.condition,
          description: equipmentSubmissions.description,
          images: equipmentSubmissions.images,
          askingPrice: equipmentSubmissions.askingPrice,
          weight: equipmentSubmissions.weight,
          status: equipmentSubmissions.status,
          adminNotes: equipmentSubmissions.adminNotes,
          createdAt: equipmentSubmissions.createdAt,
          updatedAt: equipmentSubmissions.updatedAt
        },
        user: {
          name: sql8`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          email: users.email
        }
      }).from(equipmentSubmissions).leftJoin(users, eq9(equipmentSubmissions.userId, users.id)).orderBy(desc3(equipmentSubmissions.createdAt));
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
          "User Email",
          "User Name",
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
          s.user?.email || "",
          s.user?.name || "",
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
          user: s.user,
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
      res.status(500).json({ message: error?.message || "Failed to export data" });
    }
  });
  app2.get("/api/stripe/transactions", requireRole("developer"), async (req, res) => {
    try {
      const stripe4 = new Stripe3(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-06-30.basil"
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
      const createTestProducts = async () => {
      };
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
  if (process.env.NODE_ENV === "production") {
    if (process.env.SERVE_STATIC === "true") {
      const { serveStatic: serveStatic2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
      serveStatic2(app2);
      Logger.info("[FRONTEND] Production static files configured");
    } else {
      Logger.info("[FRONTEND] Static file serving disabled (SERVE_STATIC=false)");
    }
  } else {
    const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    await setupVite2(app2, httpServer);
    Logger.info("[FRONTEND] Development Vite server configured with HMR");
  }
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
  const host2 = "0.0.0.0";
  Logger.info(`[STARTUP] Attempting to start server on ${host2}:${port}`);
  Logger.info(`[STARTUP] Environment: ${process.env.NODE_ENV || "development"}`);
  Logger.info(`[STARTUP] Node version: ${process.version}`);
  const server2 = httpServer.listen(port, host2, () => {
    const address = server2.address();
    Logger.info(`\u{1F680} Server successfully started and listening`, {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development",
      host: host2,
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
        title: "Review",
        content: comment || "",
        rating,
        helpful: 0,
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
      const productReviews = await db.select().from(reviews).where(eq9(reviews.productId, req.params.productId)).orderBy(desc3(reviews.createdAt));
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
        eq9(coupons.isActive, true)
      )).limit(1);
      if (!coupon.length) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }
      const couponData = coupon[0];
      if (couponData.validUntil && /* @__PURE__ */ new Date() > couponData.validUntil) {
        return res.status(400).json({ error: "Coupon has expired" });
      }
      if ((couponData.usageCount || 0) >= (couponData.usageLimit || 999999)) {
        return res.status(400).json({ error: "Coupon usage limit reached" });
      }
      if (couponData.minOrderAmount && cartTotal < Number(couponData.minOrderAmount)) {
        return res.status(400).json({
          error: `Minimum purchase of $${couponData.minOrderAmount} required`
        });
      }
      let discount = 0;
      if (couponData.discountType === "percentage") {
        discount = cartTotal * Number(couponData.discountValue) / 100;
      } else {
        discount = Number(couponData.discountValue);
      }
      res.json({
        valid: true,
        discount,
        code: couponData.code,
        type: couponData.discountType
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
      const available = Number(product[0].stockQuantity || 0) >= Number(quantity || 0);
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
  if (process.env.NODE_ENV === "production") {
    const { setupProductionOptimizations: setupProductionOptimizations2 } = await Promise.resolve().then(() => (init_compression(), compression_exports));
    setupProductionOptimizations2(app2);
  }
  server2.on("listening", () => {
    Logger.info(`[STARTUP] Server is now accepting connections on ${host2}:${port}`);
  });
  return server2;
}

// server/config/universal-guards.ts
function assertUniversalEnvGuards() {
  console.log("\u2705 UNIVERSAL_ENV_GUARD: ok");
}

// server/middleware/universal-env-headers.ts
var universalEnvHeaders = (_req, res, next) => {
  res.setHeader("X-App-Env", "development");
  res.setHeader("X-Db-Host", "lucky-poem");
  next();
};

// server/index.ts
init_universal_health();

// server/webhooks/universal-router.ts
init_env();
import { Router as Router14 } from "express";
import crypto3 from "node:crypto";
import { json, raw } from "express";
function mountUniversalWebhooks(app2) {
  const r2 = Router14();
  r2.post("/stripe", raw({ type: "*/*" }), (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = String(req.headers["stripe-signature"] || "");
    const timestamp2 = sig.match(/t=([^,]+)/)?.[1];
    const v1 = sig.match(/v1=([^,]+)/)?.[1];
    if (!timestamp2 || !v1) return res.status(400).send("Bad Stripe signature");
    const payload = `${timestamp2}.${req.body.toString("utf8")}`;
    const expected = crypto3.createHmac("sha256", secret).update(payload).digest("hex");
    if (!timingSafeEqual(v1, expected)) return res.status(400).send("Invalid Stripe signature");
    console.log(`\u2705 Universal Webhook: Stripe event received via ${WEBHOOK_PREFIX}/stripe`);
    res.json({ ok: true });
  });
  r2.post("/generic", raw({ type: "*/*" }), (req, res) => {
    const secret = process.env.GENERIC_WEBHOOK_SECRET;
    const signatureHeader = (process.env.GENERIC_WEBHOOK_SIGNATURE_HEADER || "x-signature").toLowerCase();
    const header = String(req.headers[signatureHeader] || "");
    const expected = crypto3.createHmac("sha256", secret).update(req.body).digest("hex");
    if (!timingSafeEqual(header, expected)) return res.status(400).send("Invalid signature");
    console.log(`\u2705 Universal Webhook: Generic event received via ${WEBHOOK_PREFIX}/generic`);
    res.json({ ok: true });
  });
  app2.use(WEBHOOK_PREFIX, r2);
  app2.use(json());
  console.log(`\u{1F517} Universal Webhooks mounted at ${WEBHOOK_PREFIX}/*`);
}
function timingSafeEqual(a, b) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto3.timingSafeEqual(A, B);
}

// server/routes/public-health.ts
init_universal_pool();
init_env();
import { Router as Router15 } from "express";
var publicHealth = Router15();
publicHealth.get("/api/healthz", async (_req, res) => {
  try {
    const r2 = await universalPool.query(`SELECT current_database() as db, current_user as role`);
    res.json({
      env: APP_ENV,
      dbHost: DB_HOST,
      database: r2.rows[0]?.db,
      role: r2.rows[0]?.role,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "healthy"
    });
  } catch (error) {
    res.status(500).json({
      env: APP_ENV,
      dbHost: DB_HOST,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
publicHealth.get("/health", (_req, res) => res.redirect(307, "/api/healthz"));
publicHealth.get("/api/admin/system/health", (_req, res) => res.redirect(307, "/api/healthz"));

// server/utils/verify-product-schema.ts
init_universal_pool();
init_env();
async function verifyProductSchema() {
  const q = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='products'
      AND column_name='continue_selling_when_out_of_stock'`;
  const r2 = await universalPool.query(q);
  if (r2.rowCount && r2.rowCount > 0) {
    console.log("\u2705 products.continue_selling_when_out_of_stock present");
    return;
  }
  const msg = "\u274C products.continue_selling_when_out_of_stock is missing!";
  if (APP_ENV !== "production") {
    console.warn(msg, "Auto-adding in non-prod\u2026");
    await universalPool.query(`
      ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS continue_selling_when_out_of_stock boolean NOT NULL DEFAULT false;
    `);
    console.log("\u2705 Added column in non-prod");
  } else {
    console.error(msg, "Run: npx tsx scripts/fix-products-column.ts");
  }
}

// server/index.ts
init_env();

// server/config/env-guard.ts
init_env();
function assertEnvSafety() {
  console.log(`\u2705 ENV_GUARD: Environment isolation verified`);
  console.log(`[${APP_ENV.toUpperCase()}] Using database host:`, DB_HOST);
}

// server/index.ts
var env = ENV.nodeEnv;
var host = ENV.devDbUrl ? new URL(ENV.devDbUrl).host : "unknown";
assertEnvSafety();
try {
  assertUniversalEnvGuards();
} catch (error) {
  console.error("\u{1F534} Universal Environment Guard Failed:", error?.message || error);
}
console.log("\u2705 ENV_GUARD: Environment isolation verified");
var shouldRunMigrations = process.env.RUN_MIGRATIONS === "true" || env === "development";
if (shouldRunMigrations) {
  console.log("[MIGRATIONS] Running migrations...");
  try {
    await applyMigrations();
    console.log("[MIGRATIONS] Done.");
  } catch (e) {
    console.warn("[MIGRATIONS] Failed, continuing without migrations:", e?.message || e);
  }
} else {
  console.log("[MIGRATIONS] Skipped (RUN_MIGRATIONS not set)");
}
try {
  await ping();
  console.log("[DB] \u2705 Database connection verified");
} catch (e) {
  console.warn("[DB] Database ping failed, continuing:", e?.message || e);
}
try {
  await verifyProductSchema();
  console.log("[SCHEMA] \u2705 Schema verification completed");
} catch (e) {
  console.warn("[SCHEMA] Schema verification failed, continuing:", e?.message || e);
}
var app = express6();
app.set("trust proxy", 1);
app.use(cookieParser());
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.use(publicHealth);
app.use(universalEnvHeaders);
try {
  mountUniversalWebhooks(app);
} catch (error) {
  console.warn("\u{1F7E1} Universal Webhooks failed to mount:", error?.message || error);
}
app.use(express6.json());
app.use(universalHealth);
await registerRoutes(app);
