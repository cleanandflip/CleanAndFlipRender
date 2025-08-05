-- Migration: Add comprehensive e-commerce features
-- Date: 2025-08-05
-- Description: Adds reviews, coupons, order tracking, and return requests

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_type VARCHAR NOT NULL, -- 'percentage' | 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- Order tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL,
  location VARCHAR,
  description TEXT,
  tracking_number VARCHAR,
  carrier VARCHAR,
  estimated_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON order_tracking(status);

-- Return requests table
CREATE TABLE IF NOT EXISTS return_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR NOT NULL,
  description TEXT,
  preferred_resolution VARCHAR NOT NULL, -- 'refund' | 'exchange'
  status VARCHAR DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'completed'
  return_number VARCHAR UNIQUE NOT NULL,
  images JSONB DEFAULT '[]',
  admin_notes TEXT,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);

-- Add average rating column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create function to update product ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and review count for the product
  UPDATE products 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update product ratings
DROP TRIGGER IF EXISTS trigger_update_product_rating_insert ON reviews;
CREATE TRIGGER trigger_update_product_rating_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

DROP TRIGGER IF EXISTS trigger_update_product_rating_update ON reviews;
CREATE TRIGGER trigger_update_product_rating_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

DROP TRIGGER IF EXISTS trigger_update_product_rating_delete ON reviews;
CREATE TRIGGER trigger_update_product_rating_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Insert sample coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, valid_until)
VALUES 
  ('SAVE10', '10% off orders over $100', 'percentage', 10.00, 100.00, 50.00, NOW() + INTERVAL '3 months'),
  ('FIRST15', '15% off your first order', 'percentage', 15.00, 50.00, 75.00, NOW() + INTERVAL '6 months'),
  ('FREE50', 'Free shipping on orders over $50', 'fixed', 5.99, 50.00, 5.99, NOW() + INTERVAL '1 year'),
  ('WELCOME20', '$20 off orders over $200', 'fixed', 20.00, 200.00, NULL, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- Update orders table to support tracking and return data
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';
COMMENT ON TABLE coupons IS 'Discount coupons and promotional codes';
COMMENT ON TABLE order_tracking IS 'Order status and shipping tracking information';
COMMENT ON TABLE return_requests IS 'Customer return and refund requests';