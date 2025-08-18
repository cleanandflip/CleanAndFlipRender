-- Clean up production database by removing all legacy error tracking tables
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS error_log_instances CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS errors_raw CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS issue_events CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;

-- Verify cleanup
SELECT 'Tables remaining after cleanup:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'activity_logs', 'error_log_instances', 'error_logs', 
  'errors_raw', 'issues', 'issue_events', 'user_onboarding'
)
ORDER BY table_name;