CREATE TYPE "public"."equipment_submission_status" AS ENUM('pending', 'under_review', 'approved', 'declined', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_type" AS ENUM('LOCAL_ONLY', 'SHIP_ONLY', 'LOCAL_OR_SHIP');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_condition" AS ENUM('new', 'like_new', 'good', 'fair', 'needs_repair');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'sold', 'pending', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'developer');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"action" varchar,
	"page" varchar,
	"page_url" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"street1" text NOT NULL,
	"street2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"geoapify_place_id" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_local" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"owner_id" text,
	"product_id" varchar,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"image_url" text,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"product_count" integer DEFAULT 0,
	"filter_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"description" text NOT NULL,
	"discount_type" varchar NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2),
	"max_discount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" varchar NOT NULL,
	"from_email" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"template_type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"sent_at" timestamp,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" varchar NOT NULL,
	"template" varchar NOT NULL,
	"data" jsonb,
	"status" varchar DEFAULT 'pending',
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"brand" varchar,
	"category" varchar NOT NULL,
	"condition" varchar NOT NULL,
	"description" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"asking_price" numeric(10, 2),
	"weight" integer,
	"dimensions" text,
	"year_purchased" integer,
	"original_price" numeric(10, 2),
	"seller_email" varchar NOT NULL,
	"seller_phone" varchar,
	"seller_location" text,
	"notes" text,
	"status" varchar DEFAULT 'pending',
	"admin_notes" text,
	"offered_price" numeric(10, 2),
	"reference_number" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "equipment_submissions_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "error_log_instances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"error_log_id" varchar,
	"occurred_at" timestamp DEFAULT now(),
	"context" jsonb
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"error_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"message" text NOT NULL,
	"stack_trace" text,
	"file_path" varchar,
	"line_number" integer,
	"column_number" integer,
	"user_id" varchar,
	"user_email" varchar,
	"user_ip" varchar,
	"user_agent" text,
	"url" varchar,
	"method" varchar,
	"request_body" jsonb,
	"response_status" integer,
	"browser" varchar,
	"os" varchar,
	"device_type" varchar,
	"session_id" varchar,
	"environment" varchar DEFAULT 'production',
	"resolved" boolean DEFAULT false,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"notes" text,
	"occurrence_count" integer DEFAULT 1,
	"first_seen" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "errors_raw" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"level" varchar NOT NULL,
	"env" varchar NOT NULL,
	"release" varchar,
	"service" varchar NOT NULL,
	"url" text,
	"method" varchar,
	"status_code" integer,
	"message" text NOT NULL,
	"type" varchar,
	"stack" jsonb,
	"fingerprint" varchar NOT NULL,
	"user_id" varchar,
	"tags" jsonb,
	"extra" jsonb,
	CONSTRAINT "errors_raw_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "issue_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" varchar NOT NULL,
	"hour" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" varchar NOT NULL,
	"title" text NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"level" varchar NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"affected_users" integer DEFAULT 0 NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"ignored" boolean DEFAULT false NOT NULL,
	"sample_event_id" varchar,
	"envs" jsonb NOT NULL,
	CONSTRAINT "issues_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"subscribed" boolean DEFAULT true,
	"unsubscribe_token" varchar,
	"subscribed_at" timestamp DEFAULT now(),
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "order_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"source_address_id" varchar,
	"formatted" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(11, 7),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "order_addresses_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"product_id" varchar,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"location" varchar,
	"description" text,
	"tracking_number" varchar,
	"carrier" varchar,
	"estimated_delivery" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"status" "order_status" DEFAULT 'pending',
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"stripe_payment_intent_id" varchar,
	"shipping_address_id" varchar,
	"billing_address_id" varchar,
	"notes" text,
	"tracking_number" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"ip_address" varchar(45),
	"user_agent" text,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"category_id" varchar,
	"subcategory" text,
	"brand" varchar,
	"weight" integer,
	"condition" "product_condition" NOT NULL,
	"status" "product_status" DEFAULT 'active',
	"images" jsonb DEFAULT '[]'::jsonb,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"stock_quantity" integer DEFAULT 1,
	"views" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"search_vector" "tsvector",
	"stripe_product_id" varchar,
	"stripe_price_id" varchar,
	"stripe_sync_status" varchar(50) DEFAULT 'pending',
	"stripe_last_sync" timestamp,
	"sku" varchar,
	"dimensions" jsonb,
	"cost" numeric(10, 2),
	"compare_at_price" numeric(10, 2),
	"is_local_delivery_available" boolean DEFAULT true,
	"is_shipping_available" boolean DEFAULT true,
	"available_local" boolean DEFAULT true,
	"available_shipping" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"description" text,
	"preferred_resolution" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"return_number" varchar NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"admin_notes" text,
	"refund_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "return_requests_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"verified" boolean DEFAULT false,
	"helpful" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_zones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"center_lat" numeric(10, 7),
	"center_lng" numeric(11, 7),
	"radius_km" numeric(8, 3),
	"polygon" jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_email_preferences" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"order_updates" boolean DEFAULT true,
	"marketing" boolean DEFAULT true,
	"price_alerts" boolean DEFAULT true,
	"newsletter" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone" varchar,
	"is_local_customer" boolean DEFAULT false,
	"role" "user_role" DEFAULT 'user',
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"google_id" varchar,
	"google_email" varchar,
	"google_picture" text,
	"profile_image_url" text,
	"auth_provider" varchar DEFAULT 'local',
	"is_email_verified" boolean DEFAULT false,
	"profile_complete" boolean DEFAULT false,
	"profile_address_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"product_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD CONSTRAINT "equipment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_log_instances" ADD CONSTRAINT "error_log_instances_error_log_id_error_logs_id_fk" FOREIGN KEY ("error_log_id") REFERENCES "public"."error_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_source_address_id_addresses_id_fk" FOREIGN KEY ("source_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_preferences" ADD CONSTRAINT "user_email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_profile_address_id_addresses_id_fk" FOREIGN KEY ("profile_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_type" ON "activity_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_addresses_user" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_coordinates" ON "addresses" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "idx_addresses_local" ON "addresses" USING btree ("is_local");--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_coupons_active" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_email_logs_status" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_logs_created_at" ON "email_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_email_logs_to_email" ON "email_logs" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "idx_email_queue_status" ON "email_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_queue_created_at" ON "email_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_submissions_user" ON "equipment_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "equipment_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_submissions_reference" ON "equipment_submissions" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "idx_submissions_category" ON "equipment_submissions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_error_logs_severity" ON "error_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_error_logs_type" ON "error_logs" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "idx_error_logs_user" ON "error_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_error_logs_resolved" ON "error_logs" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_error_logs_created" ON "error_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_errors_raw_created_at" ON "errors_raw" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_errors_raw_fingerprint" ON "errors_raw" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "idx_errors_raw_level" ON "errors_raw" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_issue_events_hour" ON "issue_events" USING btree ("hour");--> statement-breakpoint
CREATE INDEX "idx_issue_events_fingerprint" ON "issue_events" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "idx_issue_events_unique" ON "issue_events" USING btree ("fingerprint","hour");--> statement-breakpoint
CREATE INDEX "idx_issues_last_seen" ON "issues" USING btree ("last_seen");--> statement-breakpoint
CREATE INDEX "idx_issues_resolved" ON "issues" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_issues_level" ON "issues" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_newsletter_email" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribed" ON "newsletter_subscribers" USING btree ("subscribed");--> statement-breakpoint
CREATE INDEX "idx_order_tracking_order" ON "order_tracking" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_tracking_status" ON "order_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prt_token" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_prt_user_id" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prt_expires" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_products_search" ON "products" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_status" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_products_featured" ON "products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_products_created_at" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_products_price" ON "products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_stripe_product_id" ON "products" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX "idx_stripe_sync_status" ON "products" USING btree ("stripe_sync_status");--> statement-breakpoint
CREATE INDEX "idx_return_requests_order" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_user" ON "return_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_status" ON "return_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reviews_product" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_wishlists_user" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wishlists_product" ON "wishlists" USING btree ("product_id");