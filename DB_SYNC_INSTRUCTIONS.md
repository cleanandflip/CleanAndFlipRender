# Database Synchronization System

## Overview

This system provides safe, production-ready database synchronization between development and production environments with PII masking and comprehensive safety guards.

## Features

- **Complete Database Sync**: Merge entire dev database to production
- **PII Protection**: Automatic masking of sensitive data
- **Production Safety**: Hard guards against accidental production writes
- **Dry Run Mode**: Plan and verify changes before applying
- **Selective Sync**: Choose specific tables or data types
- **Schema Sync**: Automatic schema updates via pg_dump/psql
- **Verification**: Post-sync validation with row counts and timestamps

## Quick Start

### 1. Run Dry Run (Safe)
```bash
./scripts/sync-dev-to-prod.sh
```

### 2. Execute Full Sync
```bash
./scripts/sync-dev-to-prod.sh --apply --yes --confirm=DEV->PROD
```

## Available Profiles

### `dev->prod:full` (Default)
- **Purpose**: Complete database merge with PII masking
- **Tables**: ALL tables (users, orders, products, etc.)
- **Safety**: PII fields automatically masked for production
- **Use Case**: Full environment sync

### `dev->prod:catalog`
- **Purpose**: Catalog/config only (no customer data)
- **Tables**: products, categories, coupons only
- **Safety**: No PII data transferred
- **Use Case**: Product updates, configuration changes

### `prod->dev:safe`
- **Purpose**: Pull production data to dev with masking
- **Tables**: Limited set with full PII masking
- **Safety**: All sensitive data deterministically masked
- **Use Case**: Testing with production-like data

## Command Options

```bash
./scripts/sync-dev-to-prod.sh [OPTIONS]

Options:
  --apply              Execute the sync (default: plan only)
  --confirm=DEV->PROD  Required confirmation for production writes  
  --yes                Skip interactive prompts
  --profile=PROFILE    Sync profile (default: dev->prod:full)
  --help               Show help message
```

## Examples

### Dry Run (Safe - No Changes)
```bash
./scripts/sync-dev-to-prod.sh
```

### Full Database Sync
```bash
./scripts/sync-dev-to-prod.sh --apply --yes --confirm=DEV->PROD
```

### Catalog Only Sync
```bash
./scripts/sync-dev-to-prod.sh --profile=dev->prod:catalog --apply --yes --confirm=DEV->PROD
```

### Pull Production Data to Dev
```bash
tsx scripts/db-sync.pro.ts --direction=prod->dev --mode=apply --yes
```

## Safety Features

### Production Write Protection
- Requires explicit `--confirm=DEV->PROD` flag
- Validates production host before writes
- Hard-coded production host validation
- Cannot accidentally write to wrong database

### PII Masking
Automatically masks sensitive fields:
- **Email**: `masked_abc123@example.com`
- **Names**: `FirstNameABC4`, `LastNameXYZ8`
- **Phone**: `555-123-4567`
- **Addresses**: `1234 Masked St`, `CityABC4`
- **Coordinates**: Shifted to safe ranges

### Data Integrity
- Upsert by primary key (no duplicates)
- "Newer wins" logic based on `updated_at`
- Comprehensive verification after sync
- Row count validation
- Timestamp validation

## File Structure

```
scripts/
├── db-sync.config.json     # Sync profiles and table configuration
├── db-sync.pro.ts          # Main sync engine (TypeScript)
├── sync-dev-to-prod.sh     # User-friendly wrapper script
└── test-google-auth-*.ts   # Test scripts
```

## Configuration

Edit `scripts/db-sync.config.json` to:
- Add/remove tables from sync
- Modify PII masking rules
- Create custom sync profiles
- Adjust batch sizes and timeouts

## Requirements

- **Node.js** with `tsx` installed
- **PostgreSQL** client tools (`pg_dump`, `psql`)
- **Environment variables** in `.env`:
  ```
  DEV_DATABASE_URL=postgresql://...
  PROD_DATABASE_URL=postgresql://...
  KNOWN_PROD_HOSTS=ep-muddy-moon-aeggx6le-pooler.c-2.us-east-2.aws.neon.tech
  ```

## Error Handling

The system will exit safely if:
- Missing required environment variables
- Database connection failures
- Schema incompatibilities
- Missing confirmation for production writes
- Table has no primary key

## Verification Output

After sync, you'll see:
```
📊 VERIFICATION:
  ✅ users: src=150, dst=150
    ↳ max updated_at: src=2025-08-18T06:28:10.667Z, dst=2025-08-18T06:28:10.667Z
  ✅ products: src=25, dst=25
  ✅ orders: src=45, dst=45
```

## Best Practices

1. **Always dry run first**: Use default mode to plan changes
2. **Backup production**: Take snapshot before major syncs
3. **Monitor logs**: Watch for warnings or errors
4. **Verify results**: Check row counts and key data
5. **Test incrementally**: Start with catalog-only syncs

## Support

For issues or questions:
1. Check the verification output for discrepancies
2. Review the sync plan in dry run mode
3. Ensure all environment variables are correct
4. Verify database connectivity from your environment