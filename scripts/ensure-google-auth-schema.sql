-- Google Auth Schema Migration for Both Environments
-- This script ensures both development and production databases have Google Auth columns

-- Add Google Auth columns to users table (safe for both databases)
DO $$
BEGIN
    -- Add google_sub column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_sub') THEN
        ALTER TABLE users ADD COLUMN google_sub TEXT UNIQUE;
        RAISE NOTICE 'Added google_sub column';
    END IF;

    -- Add google_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_email') THEN
        ALTER TABLE users ADD COLUMN google_email VARCHAR;
        RAISE NOTICE 'Added google_email column';
    END IF;

    -- Add google_email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_email_verified') THEN
        ALTER TABLE users ADD COLUMN google_email_verified BOOLEAN;
        RAISE NOTICE 'Added google_email_verified column';
    END IF;

    -- Add google_picture column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_picture') THEN
        ALTER TABLE users ADD COLUMN google_picture TEXT;
        RAISE NOTICE 'Added google_picture column';
    END IF;

    -- Add last_login_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login_at column';
    END IF;

    RAISE NOTICE 'Google Auth schema migration completed successfully';
END $$;