-- Ensure all required columns exist in equipment_submissions table
-- This migration is idempotent and safe to run multiple times

-- Add missing columns if they don't exist
ALTER TABLE equipment_submissions
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS offer_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS decline_reason TEXT,
ADD COLUMN IF NOT EXISTS scheduled_pickup_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS pickup_window_start TEXT,
ADD COLUMN IF NOT EXISTS pickup_window_end TEXT;

-- Backfill reference numbers for existing submissions without them
UPDATE equipment_submissions 
SET reference_number = 'REF-' || to_char(created_at, 'YYYYMMDD') || '-' || 
    lpad(extract(hour from created_at)::text || extract(minute from created_at)::text, 4, '0')
WHERE reference_number IS NULL OR reference_number = '';

-- Create unique constraint on reference_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'equipment_submissions_reference_number_unique'
    ) THEN
        ALTER TABLE equipment_submissions 
        ADD CONSTRAINT equipment_submissions_reference_number_unique 
        UNIQUE (reference_number);
    END IF;
END $$;

-- Ensure reference_number is NOT NULL
ALTER TABLE equipment_submissions 
ALTER COLUMN reference_number SET NOT NULL;

-- Create index on reference_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_equipment_submissions_reference_number 
ON equipment_submissions(reference_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_equipment_submissions_status 
ON equipment_submissions(status);

-- Create index on user_id for user submissions
CREATE INDEX IF NOT EXISTS idx_equipment_submissions_user_id 
ON equipment_submissions(user_id);