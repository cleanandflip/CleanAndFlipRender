# Production Database Schema Synchronization

## Current Issue
The production database still contains legacy error tracking tables that have been removed from development:
- activity_logs
- error_log_instances  
- error_logs
- errors_raw
- issues
- issue_events
- user_onboarding

## Solution Steps

### 1. Execute Cleanup Script on Production

Run the provided SQL script against your production database:

```bash
# If using psql command line:
psql $PROD_DATABASE_URL -f PRODUCTION_DATABASE_CLEANUP_SCRIPT.sql

# Or copy/paste the commands from PRODUCTION_DATABASE_CLEANUP_SCRIPT.sql
# into your database management interface
```

### 2. Verify Tables Removed

After running the cleanup script, verify these tables are gone:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'activity_logs', 'error_log_instances', 'error_logs', 
  'errors_raw', 'issues', 'issue_events', 'user_onboarding'
)
ORDER BY table_name;
```
This should return an empty result.

### 3. Sync Schema with Drizzle

After manual cleanup, synchronize the schema:
```bash
# Set production database URL
export DATABASE_URL=$PROD_DATABASE_URL

# Push current schema to production
npm run db:push
```

## Expected Production Tables After Cleanup

The production database should only contain these core tables:
- addresses
- cart_items  
- categories
- coupons
- email_logs
- email_queue
- equipment_submissions
- newsletter_subscribers
- order_items
- order_tracking
- orders
- password_reset_tokens
- products
- return_requests
- reviews
- sessions
- service_zones
- user_email_preferences
- users
- wishlists

## Safety Notes

- The cleanup removes only internal tracking tables
- No user data or core business data is affected
- All e-commerce functionality remains intact
- Tables can be recreated if needed (though they won't be)

## Rollback Plan (If Needed)

If any issues arise, the development database schema can be used to restore:
```bash
# Export development schema
pg_dump $DEV_DATABASE_URL --schema-only > dev_schema.sql

# Apply to production (after backing up)
psql $PROD_DATABASE_URL < dev_schema.sql
```

## Status: Ready for Execution

The cleanup script is prepared and ready to execute against the production database.