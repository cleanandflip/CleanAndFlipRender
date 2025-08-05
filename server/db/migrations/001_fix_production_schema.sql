-- Production Schema Fix Migration
-- Ensures all required columns exist for production deployment
-- This migration is safe to run multiple times (idempotent)

BEGIN;

-- Fix 1: Add subcategory to products if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory TEXT;
    RAISE NOTICE 'Added subcategory column to products table';
  ELSE
    RAISE NOTICE 'Subcategory column already exists in products table';
  END IF;
END $$;

-- Fix 2: Handle user address fields
DO $$ 
BEGIN
  -- Check if addresses table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'addresses'
  ) THEN
    -- Addresses are in separate table, ensure users table has minimal address fields
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'street'
    ) THEN
      -- Add basic address fields to users for compatibility
      ALTER TABLE users 
      ADD COLUMN street VARCHAR(255),
      ADD COLUMN city VARCHAR(100),
      ADD COLUMN state VARCHAR(50),
      ADD COLUMN zip_code VARCHAR(20),
      ADD COLUMN latitude DECIMAL(10,8),
      ADD COLUMN longitude DECIMAL(11,8);
      RAISE NOTICE 'Added address columns to users table for compatibility';
    ELSE
      RAISE NOTICE 'Address columns already exist in users table';
    END IF;
  ELSE
    -- No addresses table, ensure users has address fields
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'street'
    ) THEN
      ALTER TABLE users 
      ADD COLUMN street VARCHAR(255),
      ADD COLUMN city VARCHAR(100),
      ADD COLUMN state VARCHAR(50),
      ADD COLUMN zip_code VARCHAR(20),
      ADD COLUMN country VARCHAR(100) DEFAULT 'US',
      ADD COLUMN latitude DECIMAL(10,8),
      ADD COLUMN longitude DECIMAL(11,8);
      RAISE NOTICE 'Added address columns to users table';
    ELSE
      RAISE NOTICE 'Address columns already exist in users table';
    END IF;
  END IF;
END $$;

-- Fix 3: Ensure all essential tables and columns exist
DO $$
BEGIN
  -- Check password_reset_tokens table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'password_reset_tokens'
  ) THEN
    CREATE TABLE password_reset_tokens (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      used_at TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT
    );
    RAISE NOTICE 'Created password_reset_tokens table';
  END IF;

  -- Check email_logs table  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'email_logs'
  ) THEN
    CREATE TABLE email_logs (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      to_email VARCHAR(255) NOT NULL,
      from_email VARCHAR(255),
      subject VARCHAR(500),
      template_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      sent_at TIMESTAMP,
      error TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE 'Created email_logs table';
  END IF;
END $$;

-- Fix 4: Add indexes for performance if they don't exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_street ON users(street) WHERE street IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_logs_template_type ON email_logs(template_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_logs_status ON email_logs(status);

COMMIT;

-- Post-migration validation
DO $$
DECLARE
  result_text TEXT;
BEGIN
  RAISE NOTICE '=== MIGRATION VALIDATION ===';
  
  -- Test critical queries
  BEGIN
    PERFORM subcategory FROM products LIMIT 1;
    RAISE NOTICE '✅ Products.subcategory: OK';
  EXCEPTION WHEN undefined_column THEN
    RAISE WARNING '❌ Products.subcategory: MISSING';
  END;
  
  BEGIN
    PERFORM street FROM users LIMIT 1;
    RAISE NOTICE '✅ Users.street: OK';
  EXCEPTION WHEN undefined_column THEN
    RAISE WARNING '❌ Users.street: MISSING';
  END;
  
  BEGIN
    PERFORM token FROM password_reset_tokens LIMIT 1;
    RAISE NOTICE '✅ Password reset tokens: OK';
  EXCEPTION WHEN undefined_table THEN
    RAISE WARNING '❌ Password reset tokens table: MISSING';
  EXCEPTION WHEN undefined_column THEN
    RAISE WARNING '❌ Password reset tokens.token: MISSING';
  END;
  
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
END $$;