-- Clean slate user wipe for development environment only
-- WARNING: This will delete ALL user data - only use in development

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Truncate in dependency order (children first)
TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;
TRUNCATE TABLE cart_items RESTART IDENTITY CASCADE; 
TRUNCATE TABLE carts RESTART IDENTITY CASCADE;
TRUNCATE TABLE addresses RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify clean state
SELECT 'users' as table_name, count(*) as row_count FROM users
UNION ALL
SELECT 'addresses', count(*) FROM addresses  
UNION ALL
SELECT 'carts', count(*) FROM carts
UNION ALL
SELECT 'cart_items', count(*) FROM cart_items
UNION ALL  
SELECT 'sessions', count(*) FROM sessions;