-- Fix Email Case Sensitivity Migration
-- This migration ensures all emails are lowercase and adds case-insensitive constraints

BEGIN;

-- 1. Convert all existing emails to lowercase in users table
UPDATE users SET email = LOWER(email) WHERE email != LOWER(email);

-- 2. Add unique constraint on lowercase email for users
DROP INDEX IF EXISTS idx_users_email_lower;
CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));

-- 3. Update equipment_submissions table if it has email field
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment_submissions' AND column_name = 'email'
  ) THEN
    UPDATE equipment_submissions SET email = LOWER(email) WHERE email != LOWER(email);
    DROP INDEX IF EXISTS idx_equipment_submissions_email_lower;
    CREATE INDEX idx_equipment_submissions_email_lower ON equipment_submissions (LOWER(email));
  END IF;
END $$;

-- 4. Update password_reset_tokens to ensure email consistency
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'password_reset_tokens' AND column_name = 'email'
  ) THEN
    UPDATE password_reset_tokens SET email = LOWER(email) WHERE email != LOWER(email);
  END IF;
END $$;

-- 5. Update email_logs table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_logs' AND column_name = 'to_email'
  ) THEN
    UPDATE email_logs SET to_email = LOWER(to_email) WHERE to_email != LOWER(to_email);
    UPDATE email_logs SET from_email = LOWER(from_email) WHERE from_email IS NOT NULL AND from_email != LOWER(from_email);
  END IF;
END $$;

-- 6. Add function to automatically lowercase emails on insert/update
CREATE OR REPLACE FUNCTION normalize_email() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = LOWER(TRIM(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Add trigger to users table
DROP TRIGGER IF EXISTS users_normalize_email ON users;
CREATE TRIGGER users_normalize_email
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION normalize_email();

-- 8. Add trigger to equipment_submissions if email column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment_submissions' AND column_name = 'email'
  ) THEN
    DROP TRIGGER IF EXISTS equipment_submissions_normalize_email ON equipment_submissions;
    CREATE TRIGGER equipment_submissions_normalize_email
      BEFORE INSERT OR UPDATE ON equipment_submissions
      FOR EACH ROW EXECUTE FUNCTION normalize_email();
  END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN email = LOWER(email) THEN 1 END) as lowercase_emails
FROM users;