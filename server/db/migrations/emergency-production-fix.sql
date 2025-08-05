-- Emergency Production Fix Migration
-- Safe to run multiple times (idempotent)

BEGIN;

-- Fix 1: Ensure subcategory column exists in products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory VARCHAR(100);
    UPDATE products SET subcategory = 'General' WHERE subcategory IS NULL;
    RAISE NOTICE 'Added subcategory column to products table';
  ELSE
    RAISE NOTICE 'Subcategory column already exists in products table';
  END IF;
END $$;

-- Fix 2: Ensure user address fields exist
DO $$ 
BEGIN
  -- Check if addresses table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'addresses'
  ) THEN
    -- Addresses are in separate table, ensure users table has minimal address fields for compatibility
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'street'
    ) THEN
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

-- Fix 3: Ensure essential tables exist
DO $$
BEGIN
  -- Password reset tokens table
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

  -- Email logs table  
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

COMMIT;