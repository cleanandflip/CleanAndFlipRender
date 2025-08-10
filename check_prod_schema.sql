-- Check what exists in production database
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('google_id', 'google_email', 'google_picture', 'auth_provider', 'is_email_verified', 'profile_complete', 'onboarding_step')
ORDER BY column_name;