# EXECUTE THESE COMMANDS ON PRODUCTION DATABASE NOW

## Copy and paste these exact SQL commands into your production database interface:

```sql
-- Drop all legacy error tracking tables
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS error_log_instances CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS errors_raw CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS issue_events CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;
```

## Verification command (run after the above):
```sql
-- This should return empty result after cleanup
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'activity_logs', 'error_log_instances', 'error_logs', 
  'errors_raw', 'issues', 'issue_events', 'user_onboarding'
)
ORDER BY table_name;
```

## Steps:
1. Open your production database interface (the one in the screenshot)
2. Copy the DROP TABLE commands above  
3. Paste and execute them
4. Run the verification query
5. Confirm it returns empty result
6. Production database will now match development

## Expected Result:
After execution, your production database will only contain the core e-commerce tables and no legacy error tracking infrastructure.