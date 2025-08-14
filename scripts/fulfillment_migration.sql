-- 20250814_fulfillment_mode_two_values.sql
-- Migrate to two-value fulfillment system: LOCAL_ONLY and LOCAL_AND_SHIPPING

-- Add the new fulfillment_mode column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS fulfillment_mode TEXT NOT NULL DEFAULT 'LOCAL_AND_SHIPPING';

-- Add constraint to enforce only two allowed values
ALTER TABLE products
  ADD CONSTRAINT chk_fulfillment_mode_two_values
  CHECK (fulfillment_mode IN ('LOCAL_ONLY','LOCAL_AND_SHIPPING'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_fulfillment_mode
  ON products(fulfillment_mode);

-- Migrate existing data based on current boolean fields
UPDATE products 
SET fulfillment_mode = CASE 
  WHEN is_local_delivery_available = true AND is_shipping_available = false THEN 'LOCAL_ONLY'
  WHEN is_local_delivery_available = true AND is_shipping_available = true THEN 'LOCAL_AND_SHIPPING'
  ELSE 'LOCAL_AND_SHIPPING' -- Default fallback
END;