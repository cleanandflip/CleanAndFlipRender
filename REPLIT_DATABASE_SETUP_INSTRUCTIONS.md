# Replit Database Setup Instructions

## Current Status
✅ **Replit PostgreSQL Database Created**
- Database Host: `ep-polished-fog-afk9khik.c-2.us-west-2.aws.neon.tech`
- Database: `neondb`
- User: `neondb_owner`
- Port: `5432`

✅ **Schema Migration Completed**
- All 21 tables successfully created
- Critical columns verified (products.continue_selling_when_out_of_stock, etc.)
- Database is ready for use

## Required Environment Variables
You need to add these environment variables to replace the external Neon databases:

```bash
# Replit Database Configuration (Unified)
DATABASE_URL=postgresql://neondb_owner:npg_qDgxFwrm9J8N@ep-polished-fog-afk9khik.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
DEV_DATABASE_URL=postgresql://neondb_owner:npg_qDgxFwrm9J8N@ep-polished-fog-afk9khik.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
PROD_DATABASE_URL=postgresql://neondb_owner:npg_qDgxFwrm9J8N@ep-polished-fog-afk9khik.c-2.us-west-2.aws.neon.th/neondb?sslmode=require

# Database connection details
PGHOST=ep-polished-fog-afk9khik.c-2.us-west-2.aws.neon.tech
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=npg_qDgxFwrm9J8N
PGPORT=5432
```

## Benefits of Replit Database
1. **Unified Environment**: Single database for both dev and production
2. **No External Dependencies**: Eliminates Neon database issues
3. **Automatic Backups**: Replit handles backups and recovery
4. **Integrated Billing**: Usage-based billing through Replit
5. **Easy Management**: Access through Replit's database tools

## Next Steps
1. Add the environment variables above to your Replit project
2. Restart the application to use the new database
3. Verify the application connects to `ep-polished-fog-afk9khik` instead of external databases

## Data Migration (Optional)
If you want to preserve existing data from your external databases:
1. Export data from lucky-poetry (dev) and muddy-moon (prod)
2. Import into the new Replit database
3. The schema is already synchronized and ready

## Verification Commands
```bash
# Check current connection
echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1

# List tables in Replit database
psql "$DATABASE_URL" -c "\dt"

# Verify critical columns
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'continue_selling_when_out_of_stock';"
```

Your Replit database is fully provisioned and ready to use!