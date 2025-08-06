# Database Scripts

Production database setup and verification tools.

## Scripts

- **`check-both-databases.ts`** - Compare development and production databases
- **`ensure-production-database.ts`** - Automated production database setup
- **`production-database-setup.sql`** - Manual SQL migration script

## Usage

```bash
# Verify database status
npx tsx scripts/database/check-both-databases.ts

# Setup production database
npx tsx scripts/database/ensure-production-database.ts

# Manual SQL setup (if needed)
psql $DATABASE_URL < scripts/database/production-database-setup.sql
```