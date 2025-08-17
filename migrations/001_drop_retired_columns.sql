-- Drop retired columns (onboarding system removed)
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_completed_at";
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_step";
-- Note: profile_address_id is still used for primary address reference