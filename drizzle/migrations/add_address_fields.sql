-- Migration: Add structured address fields to users table
-- This migration adds new address fields while preserving existing data

-- Add new structured address columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS street VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Migrate existing address data to new format (basic parsing)
-- This is a simple migration - in production you might want more sophisticated parsing
UPDATE users 
SET 
  street = CASE 
    WHEN address IS NOT NULL AND address != '' THEN address 
    ELSE NULL 
  END,
  city = CASE 
    WHEN city_state_zip IS NOT NULL AND city_state_zip != '' 
    THEN TRIM(SPLIT_PART(SPLIT_PART(city_state_zip, ',', 1), ' ', 1))
    ELSE NULL 
  END,
  state = CASE 
    WHEN city_state_zip IS NOT NULL AND city_state_zip != '' 
    THEN TRIM(SPLIT_PART(SPLIT_PART(city_state_zip, ',', 2), ' ', 1))
    ELSE NULL 
  END,
  zip_code = CASE 
    WHEN city_state_zip IS NOT NULL AND city_state_zip != '' 
    THEN TRIM(SPLIT_PART(city_state_zip, ' ', -1))
    ELSE NULL 
  END
WHERE (street IS NULL OR street = '') 
  AND (address IS NOT NULL OR city_state_zip IS NOT NULL);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_users_zip_code ON users(zip_code);
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON users(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN users.street IS 'Street address (from address autocomplete)';
COMMENT ON COLUMN users.city IS 'City name (from address autocomplete)';
COMMENT ON COLUMN users.state IS 'State abbreviation (from address autocomplete)';
COMMENT ON COLUMN users.zip_code IS 'ZIP code (from address autocomplete)';
COMMENT ON COLUMN users.latitude IS 'Latitude coordinate for distance calculations';
COMMENT ON COLUMN users.longitude IS 'Longitude coordinate for distance calculations';