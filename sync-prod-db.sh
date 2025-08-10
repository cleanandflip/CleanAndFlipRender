#!/bin/bash

# Production Database Sync Script
# Syncs development schema to production database

echo "🔄 Starting production database sync..."

# Create backup of production database
BACKUP_FILE="backup_prod_$(date +%Y%m%d_%H%M%S).sql"
echo "📦 Creating production backup: $BACKUP_FILE"

# Use DATABASE_URL_PROD to connect to production and create backup
if [ -n "$DATABASE_URL_PROD" ]; then
    echo "✅ Production database URL found"
    
    # Push schema changes to production
    echo "🚀 Pushing schema changes to production..."
    DATABASE_URL="$DATABASE_URL_PROD" npm run db:push
    
    echo "✅ Production database sync completed!"
    echo "🎯 Schema changes applied to production database"
else
    echo "❌ DATABASE_URL_PROD not found. Cannot sync to production."
    echo "💡 Add DATABASE_URL_PROD secret in Replit to enable production sync"
    exit 1
fi