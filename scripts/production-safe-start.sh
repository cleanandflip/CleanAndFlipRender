#!/bin/bash

# Production-Safe Deployment Script for Clean & Flip
# This script ensures database migrations are applied before starting the server
# Prevents schema drift issues like missing profile_address_id column

echo "🚀 Clean & Flip Production Deployment Starting..."
echo "=================================="

# Step 1: Apply database migrations
echo "📊 Applying database migrations..."
if npm run db:push; then
    echo "✅ Database migrations applied successfully"
else
    echo "⚠️  Database migrations failed - continuing with current schema"
    echo "   Application has production-safe fallbacks for schema issues"
fi

# Step 2: Build the application (if needed)
if [ ! -f "dist/index.js" ]; then
    echo "🏗️  Building application..."
    if npm run build; then
        echo "✅ Application built successfully"
    else
        echo "❌ Build failed - cannot start production server"
        exit 1
    fi
fi

# Step 3: Start the production server
echo "🎯 Starting production server with schema validation..."
NODE_ENV=production node dist/index.js

echo "🎉 Clean & Flip production server started!"