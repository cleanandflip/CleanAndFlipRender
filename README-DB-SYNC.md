# Database Synchronization System

Production-safe database synchronization between development and production environments.

## Quick Start

### Full Development to Production Sync

```bash
# Run the complete sync script
./scripts/sync-dev-to-prod.sh
```

This script will:
1. Show you exactly what will be synced (dry run)
2. Ask for confirmation
3. Sync ALL data from development to production
4. Verify the sync completed successfully

### Manual Sync Operations

#### Plan Only (Dry Run)
```bash
# See what would be synced without making changes
tsx scripts/db-sync.pro.ts --direction=dev->prod --profile=dev->prod:full --mode=plan
```

#### Catalog Only (Products, Categories, Coupons)
```bash
# Sync only catalog data (safe for production)
tsx scripts/db-sync.pro.ts --direction=dev->prod --profile=dev->prod:catalog --mode=apply --yes --confirm="DEV->PROD"
```

#### Pull Production Data to Dev (with PII masking)
```bash
# Pull production data to dev with automatic PII masking
tsx scripts/db-sync.pro.ts --direction=prod->dev --profile=prod->dev:safe --mode=apply
```

## Safety Features

- **Production Guards**: Requires explicit confirmation to write to production
- **Host Validation**: Validates production database host before applying changes
- **Dry Run Mode**: Always plan first to see what will change
- **PII Masking**: Automatically masks sensitive data when pulling from production
- **Batch Processing**: Handles large datasets efficiently
- **Verification**: Automatically verifies sync completed successfully

## Profiles

### `dev->prod:full`
- Syncs ALL tables and data from development to production
- Excludes only sessions table
- Perfect for deploying complete development state

### `dev->prod:catalog`
- Syncs only products, categories, and coupons
- Safe for production updates without affecting user data
- Ideal for content/catalog updates

### `prod->dev:safe`
- Pulls production data to development
- Automatically masks all PII (emails, names, addresses)
- Preserves data relationships while protecting privacy

## Environment Variables

Required in your `.env` file:

```bash
DEV_DATABASE_URL=postgresql://neondb_owner:***@ep-lucky-poetry-aetqlg65-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
PROD_DATABASE_URL=postgresql://neondb_owner:***@ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Advanced Usage

### Schema Only Sync
```bash
tsx scripts/db-sync.pro.ts --direction=dev->prod --scope=schema --mode=apply --yes --confirm="DEV->PROD"
```

### Data Only Sync
```bash
tsx scripts/db-sync.pro.ts --direction=dev->prod --scope=data --mode=apply --yes --confirm="DEV->PROD"
```

### Custom Batch Size
```bash
tsx scripts/db-sync.pro.ts --direction=dev->prod --mode=apply --batch-size=500
```

## What Gets Synced

The full sync includes:
- ✅ Users (with authentication data)
- ✅ Addresses
- ✅ Products and categories
- ✅ Orders and order items
- ✅ Shopping carts
- ✅ Reviews and ratings
- ✅ Equipment submissions
- ✅ Email preferences
- ✅ Wishlists
- ❌ Sessions (excluded for security)

## Troubleshooting

### Connection Issues
```bash
# Test database connections
tsx scripts/test-google-auth-dev.ts
```

### Verification Failed
If verification shows mismatched counts, run the sync again or check for:
- Concurrent modifications during sync
- Network interruptions
- Database constraints

### Permission Errors
Ensure your database user has:
- CREATE, INSERT, UPDATE permissions on destination
- SELECT permissions on source
- CONNECT permissions on both databases

## Safety Notes

- Always run in `plan` mode first
- Back up production before major syncs
- Monitor production during sync operations
- Use catalog-only profile for regular updates
- Never share database URLs in public repositories