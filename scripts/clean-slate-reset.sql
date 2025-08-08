-- Clean Slate Database Reset
-- This script recreates all tables from scratch

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('user', 'developer', 'admin');

-- Sessions table (required for auth)
CREATE TABLE sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);
CREATE INDEX "IDX_session_expire" ON sessions(expire);

-- Users table
CREATE TABLE users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE NOT NULL,
  password varchar NOT NULL,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  phone varchar,
  street varchar(255),
  city varchar(100),
  state varchar(2),
  zip_code varchar(10),
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  role user_role DEFAULT 'user',
  is_admin boolean DEFAULT false,
  is_local_customer boolean DEFAULT false,
  stripe_customer_id varchar,
  stripe_subscription_id varchar,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  slug varchar UNIQUE NOT NULL,
  image_url text,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  product_count integer DEFAULT 0,
  filter_config jsonb DEFAULT '{}',
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  price decimal(10, 2) NOT NULL,
  category_id varchar REFERENCES categories(id),
  subcategory varchar,
  brand varchar,
  weight decimal(8, 2),
  condition varchar,
  status varchar DEFAULT 'active',
  images text[] DEFAULT '{}',
  specifications jsonb DEFAULT '{}',
  stock_quantity integer DEFAULT 0,
  views integer DEFAULT 0,
  featured boolean DEFAULT false,
  search_vector tsvector,
  stripe_product_id varchar,
  stripe_price_id varchar,
  stripe_sync_status varchar DEFAULT 'pending',
  stripe_last_sync timestamp,
  sku varchar,
  dimensions varchar,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE CASCADE,
  token varchar UNIQUE NOT NULL,
  expires_at timestamp NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp DEFAULT NOW()
);

-- Activity logs
CREATE TABLE activity_logs (
  id serial PRIMARY KEY,
  user_id varchar REFERENCES users(id),
  action varchar NOT NULL,
  resource_type varchar,
  resource_id varchar,
  details jsonb DEFAULT '{}',
  ip_address varchar,
  user_agent text,
  created_at timestamp DEFAULT NOW()
);

-- Create essential indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Insert admin user
INSERT INTO users (id, email, password, first_name, last_name, role, is_admin, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@cleanflip.com',
  '$2a$12$LQv3c1yqBwEADfbYVJWVOO8v8PdhZhCQtG8WQw8HVh0/bVXr5ZYpu', -- password123
  'Admin',
  'User',
  'admin',
  true,
  NOW(),
  NOW()
);