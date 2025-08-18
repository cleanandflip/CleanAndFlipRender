#!/bin/bash

# Production-Safe Database Sync Script
# Syncs development database to production with safety guards

set -e

echo "🚀 Clean & Flip Database Sync: DEV → PROD"
echo "=========================================="

# Check if required environment variables are set
if [ -z "$DEV_DATABASE_URL" ] || [ -z "$PROD_DATABASE_URL" ]; then
    echo "❌ Error: DEV_DATABASE_URL and PROD_DATABASE_URL must be set"
    exit 1
fi

# Extract host from production URL for safety check
PROD_HOST=$(echo "$PROD_DATABASE_URL" | sed -E 's/.*@([^\/]+)\/.*/\1/')
echo "📊 Production host: $PROD_HOST"

# Safety confirmation
echo ""
echo "⚠️  WARNING: This will sync ALL data from DEV to PROD"
echo "    This includes users, orders, products, and all other data"
echo "    Production data will be overwritten where conflicts exist"
echo ""
read -p "Are you sure you want to proceed? (type 'yes' to continue): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Sync cancelled"
    exit 1
fi

echo ""
echo "🔍 Step 1: Planning sync (dry run)..."
echo "------------------------------------"
tsx scripts/db-sync.pro.ts --direction=dev->prod --profile=dev->prod:full --mode=plan

echo ""
echo "⚠️  Last chance to cancel!"
read -p "Proceed with applying changes to production? (type 'APPLY' to continue): " final_confirmation

if [ "$final_confirmation" != "APPLY" ]; then
    echo "❌ Sync cancelled"
    exit 1
fi

echo ""
echo "🔄 Step 2: Applying sync to production..."
echo "---------------------------------------"
tsx scripts/db-sync.pro.ts \
    --direction=dev->prod \
    --profile=dev->prod:full \
    --mode=apply \
    --scope=all \
    --yes \
    --confirm="DEV->PROD"

echo ""
echo "✅ Database sync completed successfully!"
echo "🎉 Production database now matches development"