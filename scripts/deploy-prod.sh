#!/bin/bash

# Production Deployment Script for Clean & Flip
# Ensures database migrations and proper environment setup

set -euo pipefail

echo "🚀 Starting Clean & Flip Production Deployment"
echo "================================================"

# Check required environment variables
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "❌ ERROR: DATABASE_URL not set"
    exit 1
fi

if [[ -z "${NODE_ENV:-}" ]]; then
    echo "⚠️  WARNING: NODE_ENV not set, defaulting to production"
    export NODE_ENV=production
fi

echo "✅ Environment: $NODE_ENV"
echo "✅ Database URL configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Database health check before migrations
echo "🔍 Checking database connection..."
if ! npm run db:status 2>/dev/null; then
    echo "❌ Database connection failed"
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
if ! npm run db:push; then
    echo "❌ Database migration failed"
    exit 1
fi

# Verify critical database indexes exist
echo "🔍 Verifying performance indexes..."
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as featured_indexes 
FROM pg_indexes 
WHERE tablename = 'products' 
AND indexname LIKE '%featured%';
" || echo "⚠️  Warning: Could not verify indexes"

# Pre-deployment health check
echo "🏥 Running pre-deployment health check..."
if [[ -f "dist/server.js" ]]; then
    echo "✅ Build files exist"
else
    echo "❌ Build files missing - run npm run build first"
    exit 1
fi

# Seed featured products if none exist (production safety)
echo "🌱 Ensuring featured products exist..."
psql "$DATABASE_URL" -c "
UPDATE products 
SET featured = true 
WHERE status = 'active' 
AND featured = false 
AND id IN (
    SELECT id FROM products 
    WHERE status = 'active' 
    ORDER BY created_at DESC 
    LIMIT 3
)
AND (SELECT COUNT(*) FROM products WHERE featured = true AND status = 'active') = 0;
" || echo "⚠️  Warning: Could not verify featured products"

echo "✅ Production deployment preparation complete!"
echo "================================================"
echo "🎯 Ready to start server with: npm start"
echo "🔗 Health check: curl http://localhost:5000/status"
echo "🔗 Featured products: curl http://localhost:5000/api/products/featured"
echo "================================================"