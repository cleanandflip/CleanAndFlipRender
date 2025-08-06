-- Production Database Setup Script
-- Run this on production database if using separate database from Replit

BEGIN;

-- Create password_reset_tokens table if missing
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_prt_user_used ON password_reset_tokens(user_id, used);

-- Ensure users table has proper indexes
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_email_trim_lower ON users(LOWER(TRIM(email)));

-- Add foreign key constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_password_reset_tokens_user_id'
    ) THEN
        ALTER TABLE password_reset_tokens 
        ADD CONSTRAINT fk_password_reset_tokens_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure essential test users exist (only if users table is empty)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        INSERT INTO users (id, email, password, first_name, last_name, role, created_at)
        VALUES 
        (
            '9b2e3219-a07b-4570-a1ac-cc9558273dc9',
            'cleanandflipyt@gmail.com',
            '$2b$12$5mAEF.gkHhNzYn5cM5DlBOmLhKNh4gP8QHl/xX5xLZX5yZpL5CZqO', -- Placeholder - will be updated
            'Clean',
            'Flip',
            'admin',
            NOW()
        ),
        (
            'da323ef6-6982-4606-bd6c-c36b51efa7a1',
            'test3@gmail.com',
            '$2b$12$5mAEF.gkHhNzYn5cM5DlBOmLhKNh4gP8QHl/xX5xLZX5yZpL5CZqO', -- Placeholder - will be updated
            'test',
            '1',
            'user',
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Added test users to empty users table';
    END IF;
END $$;

COMMIT;

-- Verification queries
SELECT 'Users count:' as info, COUNT(*)::text as value FROM users
UNION ALL
SELECT 'Password reset tokens table exists:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') 
            THEN 'YES' ELSE 'NO' END
UNION ALL  
SELECT 'Sample user emails:', string_agg(email, ', ') FROM (SELECT email FROM users LIMIT 3) t;

-- Show table structure
SELECT 'Table structure for password_reset_tokens:' as info, '' as value
UNION ALL
SELECT column_name, data_type || ' ' || 
       CASE WHEN is_nullable = 'YES' THEN '(nullable)' ELSE '(not null)' END
FROM information_schema.columns 
WHERE table_name = 'password_reset_tokens' 
ORDER BY ordinal_position;