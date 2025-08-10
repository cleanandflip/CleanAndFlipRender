-- Add Google OAuth fields to users table in production
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id varchar,
ADD COLUMN IF NOT EXISTS google_email varchar,
ADD COLUMN IF NOT EXISTS google_picture text,
ADD COLUMN IF NOT EXISTS auth_provider varchar DEFAULT 'local',
ADD COLUMN IF NOT EXISTS is_email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;

-- Add unique constraint for google_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_google_id_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);
    END IF;
END $$;

-- Create user_onboarding table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_onboarding (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    address_completed boolean DEFAULT false,
    phone_completed boolean DEFAULT false,
    preferences_completed boolean DEFAULT false,
    stripe_customer_created boolean DEFAULT false,
    welcome_email_sent boolean DEFAULT false,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    CONSTRAINT user_onboarding_user_id_unique UNIQUE(user_id),
    CONSTRAINT user_onboarding_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
);