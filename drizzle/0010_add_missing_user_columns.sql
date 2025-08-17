-- Migration: Add missing user columns for production compatibility
-- These columns are nullable and backward-compatible

-- Add missing user profile and onboarding columns
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "profile_address_id" uuid REFERENCES "addresses"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamptz;

-- Add missing optional user columns that may be referenced in code
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone" varchar(50),
  ADD COLUMN IF NOT EXISTS "role" varchar(20) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "google_id" varchar(255),
  ADD COLUMN IF NOT EXISTS "profile_image_url" text,
  ADD COLUMN IF NOT EXISTS "auth_provider" varchar(50) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "is_email_verified" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "google_email" varchar(255),
  ADD COLUMN IF NOT EXISTS "google_picture" text,
  ADD COLUMN IF NOT EXISTS "is_local_customer" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "profile_complete" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "idx_users_profile_address_id" ON "users"("profile_address_id");
CREATE INDEX IF NOT EXISTS "idx_users_onboarding_completed_at" ON "users"("onboarding_completed_at");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_google_id" ON "users"("google_id");
CREATE INDEX IF NOT EXISTS "idx_users_auth_provider" ON "users"("auth_provider");

-- Ensure cart uniqueness (prevent duplicate items)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_cart_owner_product_func"
ON "cart_items" (
  COALESCE(user_id::text, session_id),
  product_id,
  COALESCE(variant_id, '')
);