CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping', 'buy_one_get_one');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_confirmation', 'shipping_update', 'delivery_confirmation', 'price_drop', 'back_in_stock', 'newsletter', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('requested', 'approved', 'rejected', 'in_transit', 'received', 'processed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."size_type" AS ENUM('numeric', 'letter', 'custom', 'one_size');--> statement-breakpoint
CREATE TYPE "public"."sport_category" AS ENUM('basketball', 'football', 'soccer', 'baseball', 'tennis', 'golf', 'running', 'cycling', 'fitness', 'swimming', 'hockey', 'volleyball', 'wrestling', 'boxing', 'mma', 'general');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"logo_url" text,
	"website" varchar,
	"is_active" boolean DEFAULT true,
	"product_count" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "brands_name_unique" UNIQUE("name"),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" varchar,
	"user_id" varchar,
	"order_id" varchar,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_order_amount" numeric(10, 2),
	"maximum_discount_amount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"user_usage_limit" integer DEFAULT 1,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true,
	"applicable_categories" jsonb DEFAULT '[]'::jsonb,
	"applicable_brands" jsonb DEFAULT '[]'::jsonb,
	"excluded_products" jsonb DEFAULT '[]'::jsonb,
	"first_time_customer_only" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "email_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"email" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"subject" varchar NOT NULL,
	"content" text NOT NULL,
	"template_id" varchar,
	"status" varchar DEFAULT 'pending',
	"sent_at" timestamp,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar,
	"size_id" varchar,
	"location" varchar,
	"stock_quantity" integer DEFAULT 0,
	"reserved_quantity" integer DEFAULT 0,
	"low_stock_threshold" integer DEFAULT 5,
	"last_restocked" timestamp,
	"cost" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"is_active" boolean DEFAULT true,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"source" varchar,
	"unsubscribe_token" varchar,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "newsletter_subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "product_sizes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar,
	"size_id" varchar,
	"stock_quantity" integer DEFAULT 0,
	"price" numeric(10, 2),
	"sku" varchar,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"order_item_id" varchar,
	"user_id" varchar,
	"reason" varchar NOT NULL,
	"description" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"status" "return_status" DEFAULT 'requested',
	"refund_amount" numeric(10, 2),
	"restocking_fee" numeric(10, 2) DEFAULT '0',
	"admin_notes" text,
	"tracking_number" varchar,
	"processed_by" varchar,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar,
	"user_id" varchar,
	"order_id" varchar,
	"rating" integer NOT NULL,
	"title" varchar,
	"content" text,
	"is_verified_purchase" boolean DEFAULT false,
	"helpful_votes" integer DEFAULT 0,
	"is_approved" boolean DEFAULT true,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"carrier" varchar NOT NULL,
	"service_type" varchar NOT NULL,
	"min_weight" numeric(5, 2),
	"max_weight" numeric(5, 2),
	"min_distance" integer,
	"max_distance" integer,
	"base_rate" numeric(10, 2) NOT NULL,
	"per_pound_rate" numeric(10, 2),
	"estimated_days" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sizes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" varchar,
	"category_id" varchar,
	"size_type" "size_type" NOT NULL,
	"value" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"sort_order" integer DEFAULT 0,
	"measurements" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "latitude" SET DATA TYPE numeric(10, 8);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "longitude" SET DATA TYPE numeric(11, 8);--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "reference_number" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "phone_number" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "email" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "user_city" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "user_state" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "user_zip_code" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "is_local" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "distance" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "status_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "decline_reason" text;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "scheduled_pickup_date" timestamp;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "pickup_window_start" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "pickup_window_end" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "viewed_by_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "last_viewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "assigned_to" varchar;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "original_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "low_stock_threshold" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sport_category" "sport_category";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "materials" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "features" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "target_gender" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "age_group" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seasonality" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "condition_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quality_grade" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_defects" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "defect_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_on_sale" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "requires_shipping" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "local_pickup_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_weight" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_product_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_price_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_sync_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_last_sync" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_size_id_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."sizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_size_id_sizes_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."sizes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_brands_slug" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_brands_active" ON "brands" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_coupon_usage_coupon" ON "coupon_usage" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usage_user" ON "coupon_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_coupons_active" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_email_notifications_user" ON "email_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_email_notifications_type" ON "email_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_email_notifications_status" ON "email_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_inventory_product" ON "inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_low_stock" ON "inventory" USING btree ("stock_quantity");--> statement-breakpoint
CREATE INDEX "idx_newsletter_email" ON "newsletter_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_newsletter_active" ON "newsletter_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_product_sizes" ON "product_sizes" USING btree ("product_id","size_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_order" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_status" ON "return_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reviews_product" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_shipping_rates_carrier" ON "shipping_rates" USING btree ("carrier");--> statement-breakpoint
CREATE INDEX "idx_shipping_rates_active" ON "shipping_rates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_sizes_brand_category" ON "sizes" USING btree ("brand_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_sizes_type" ON "sizes" USING btree ("size_type");--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD CONSTRAINT "equipment_submissions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reference_number" ON "equipment_submissions" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "idx_status" ON "equipment_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "equipment_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_created_at" ON "equipment_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_products_category_brand" ON "products" USING btree ("category_id","brand_id");--> statement-breakpoint
CREATE INDEX "idx_products_condition" ON "products" USING btree ("condition");--> statement-breakpoint
CREATE INDEX "idx_products_sport_category" ON "products" USING btree ("sport_category");--> statement-breakpoint
CREATE INDEX "idx_products_price" ON "products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_products_featured" ON "products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_products_sale" ON "products" USING btree ("is_on_sale");--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD CONSTRAINT "equipment_submissions_reference_number_unique" UNIQUE("reference_number");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_unique" UNIQUE("sku");