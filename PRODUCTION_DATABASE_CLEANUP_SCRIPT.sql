-- PRODUCTION DATABASE CLEANUP SCRIPT
-- Removes all internal error tracking and legacy tables
-- Execute this against the production database to sync with development

-- Drop all error tracking tables (CASCADE to handle foreign keys)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS error_log_instances CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS errors_raw CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS issue_events CASCADE;

-- Drop legacy onboarding table 
DROP TABLE IF EXISTS user_onboarding CASCADE;

-- Verification query - should return empty result
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'activity_logs', 'error_log_instances', 'error_logs', 
  'errors_raw', 'issues', 'issue_events', 'user_onboarding'
)
ORDER BY table_name;

-- Show remaining tables to confirm cleanup
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;