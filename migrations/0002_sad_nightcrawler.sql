DROP INDEX "idx_password_reset_tokens_token";--> statement-breakpoint
DROP INDEX "idx_password_reset_tokens_user_id";--> statement-breakpoint
DROP INDEX "idx_password_reset_tokens_expires_at";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "token" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ALTER COLUMN "ip_address" SET DATA TYPE varchar(45);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
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
ALTER TABLE "password_reset_tokens" DROP COLUMN "used_at";