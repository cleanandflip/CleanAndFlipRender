# Database Management Scripts

This directory contains scripts for managing database operations, particularly for syncing changes from development to production.

## Scripts

### `sync-prod-db.sh`

A comprehensive script for syncing database schema changes from development to production.

#### Features

- **Safety First**: Creates backups before making any changes
- **Dry Run Mode**: Preview changes without applying them
- **Schema Comparison**: Compare dev and prod schemas
- **Manual Fixes**: Apply custom fixes for specific issues
- **Verification**: Verify the sync was successful
- **Error Handling**: Robust error handling and rollback capabilities

#### Usage

```bash
# Preview changes (recommended first step)
./scripts/sync-prod-db.sh --dry-run

# Apply changes with confirmation
./scripts/sync-prod-db.sh

# Apply changes without confirmation (CI/CD usage)
./scripts/sync-prod-db.sh --force

# Verbose output for debugging
./scripts/sync-prod-db.sh --verbose

# Get help
./scripts/sync-prod-db.sh --help
```

#### Prerequisites

1. **Environment Variables**: Ensure these are set in your Replit secrets:
   - `DATABASE_URL_PROD` - Production database URL
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Production DB credentials

2. **Tools**: The script requires:
   - `psql` (PostgreSQL client)
   - `npm` (Node.js package manager)
   - `drizzle-kit` (Database migrations)

3. **Configuration**: Ensure `drizzle.config.prod.ts` exists and is properly configured

#### Safety Features

- **Automatic Backups**: Creates timestamped schema backups
- **Dry Run Mode**: Test changes before applying
- **Confirmation Prompts**: Prevents accidental runs
- **Error Detection**: Stops on any critical errors
- **Verification**: Confirms changes were applied correctly

#### Example Workflow

```bash
# 1. First, see what would change
./scripts/sync-prod-db.sh --dry-run

# 2. Review the output, then apply changes
./scripts/sync-prod-db.sh

# 3. Deploy your application
# (Use Replit's deploy button)

# 4. Test Google OAuth and other features
```

#### Common Issues and Solutions

**Issue**: `DATABASE_URL_PROD environment variable not set`
**Solution**: Add the production database URL to your Replit secrets

**Issue**: `Permission denied` when running script
**Solution**: Run `chmod +x scripts/sync-prod-db.sh`

**Issue**: Schema sync fails with user input required
**Solution**: Run the drizzle command manually:
```bash
DATABASE_URL=$DATABASE_URL_PROD npx drizzle-kit push --config=drizzle.config.prod.ts
```

**Issue**: Google OAuth users can't sign in after sync
**Solution**: Verify the Google OAuth columns were added:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE '%google%';
```

#### What Gets Synced

The script syncs:
- ✅ Table schemas (new tables, columns, constraints)
- ✅ Indexes and performance optimizations
- ✅ Google OAuth specific columns
- ✅ Data type changes and nullable constraints
- ✅ Default values and enums

The script does NOT sync:
- ❌ Data/records (only schema)
- ❌ User passwords or sensitive data
- ❌ Application configuration

#### Troubleshooting

If the sync fails:

1. **Check the logs** for specific error messages
2. **Run in dry-run mode** to see what would change
3. **Verify credentials** are correct in Replit secrets
4. **Check database connectivity** to production
5. **Review schema differences** manually if needed

For complex schema changes, consider:
- Running migrations step by step
- Coordinating with your team
- Testing in a staging environment first

#### Contributing

When adding new database changes:

1. **Test locally** first with development database
2. **Update the sync script** if manual fixes are needed
3. **Document any special requirements** in this README
4. **Test the sync script** with --dry-run before merging

#### Support

For issues with this script:
1. Check the script output for specific error messages
2. Verify all prerequisites are met
3. Try running in verbose mode for more details
4. Check Replit's database configuration documentation