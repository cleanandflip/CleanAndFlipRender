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
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	"ip_address" varchar,
	"user_agent" text,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
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
CREATE TABLE "user_email_preferences" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"order_updates" boolean DEFAULT true,
	"marketing" boolean DEFAULT true,
	"price_alerts" boolean DEFAULT true,
	"newsletter" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
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
ALTER TABLE "products" ADD COLUMN "stripe_product_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_price_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_sync_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_last_sync" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" jsonb;--> statement-breakpoint
ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_preferences" ADD CONSTRAINT "user_email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_coupons_active" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_email_logs_status" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_logs_created_at" ON "email_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_email_logs_to_email" ON "email_logs" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "idx_newsletter_email" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_newsletter_subscribed" ON "newsletter_subscribers" USING btree ("subscribed");--> statement-breakpoint
CREATE INDEX "idx_order_tracking_order" ON "order_tracking" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_tracking_status" ON "order_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_expires_at" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_return_requests_order" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_user" ON "return_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_status" ON "return_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reviews_product" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("rating");--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD CONSTRAINT "equipment_submissions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reference_number" ON "equipment_submissions" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "idx_status" ON "equipment_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "equipment_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_created_at" ON "equipment_submissions" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "equipment_submissions" ADD CONSTRAINT "equipment_submissions_reference_number_unique" UNIQUE("reference_number");