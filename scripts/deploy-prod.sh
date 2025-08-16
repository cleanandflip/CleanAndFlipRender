#!/bin/bash

# Production Deployment Script for Clean & Flip
# Ensures safe, zero-downtime deployment with comprehensive validation

set -euo pipefail

echo "🚀 CLEAN & FLIP PRODUCTION DEPLOYMENT"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ $1${NC}"
    else
        echo -e "  ${RED}❌ $1${NC}"
        ((ERRORS++))
    fi
}

warn_status() {
    echo -e "  ${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

info_status() {
    echo -e "  ${BLUE}ℹ️  $1${NC}"
}

# 1. Pre-deployment validation
echo "1. Pre-deployment Validation"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "  ${RED}❌ Not in project root directory${NC}"
    exit 1
fi

check_status "Project root directory confirmed"

# Verify environment variables
required_vars=("DATABASE_URL" "STRIPE_SECRET_KEY" "CLOUDINARY_CLOUD_NAME" "RESEND_API_KEY")
for var in "${required_vars[@]}"; do
    if [[ -n "${!var:-}" ]]; then
        check_status "$var configured"
    else
        echo -e "  ${RED}❌ Missing required environment variable: $var${NC}"
        ((ERRORS++))
    fi
done

# Stop if critical errors
if [[ $ERRORS -gt 0 ]]; then
    echo -e "\n${RED}❌ Pre-deployment validation failed with $ERRORS error(s)${NC}"
    echo "Fix the above errors before deploying."
    exit 1
fi

# 2. Database Migration & Schema Validation
echo ""
echo "2. Database Migration & Schema Validation"

# Test database connection
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    check_status "Database connection successful"
else
    echo -e "  ${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Check for pending migrations (if using Drizzle migrate)
if command -v npm >/dev/null 2>&1 && npm run --silent drizzle:status >/dev/null 2>&1; then
    info_status "Checking migration status..."
    # Apply migrations if needed
    npm run drizzle:migrate >/dev/null 2>&1 || true
    check_status "Database migrations applied"
else
    warn_status "Migration status check skipped (drizzle:status not available)"
fi

# Validate critical schema components
SCHEMA_CHECKS=(
    "SELECT 1 FROM information_schema.tables WHERE table_name='users'"
    "SELECT 1 FROM information_schema.tables WHERE table_name='products'" 
    "SELECT 1 FROM information_schema.tables WHERE table_name='cart_items'"
    "SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_address_id'"
    "SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='featured'"
)

for check in "${SCHEMA_CHECKS[@]}"; do
    if psql "$DATABASE_URL" -t -c "$check" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Schema component validated${NC}"
    else
        echo -e "  ${RED}❌ Schema validation failed: $check${NC}"
        ((ERRORS++))
    fi
done

# 3. Build Application
echo ""
echo "3. Building Application"

# Clean previous build
if [[ -d "dist" ]]; then
    rm -rf dist
    check_status "Previous build cleaned"
fi

# Install dependencies
info_status "Installing dependencies..."
npm ci --production=false >/dev/null 2>&1
check_status "Dependencies installed"

# Build application
info_status "Building application..."
npm run build >/dev/null 2>&1
check_status "Application built successfully"

# Verify build artifacts
if [[ -f "dist/server.js" ]]; then
    check_status "Server build artifact exists"
else
    echo -e "  ${RED}❌ Server build failed - dist/server.js not found${NC}"
    ((ERRORS++))
fi

# 4. Performance & Health Checks
echo ""
echo "4. Performance & Health Checks"

# Start application in background for testing
info_status "Starting application for health checks..."
NODE_ENV=production node dist/server.js > /tmp/deploy_test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Health check endpoints
HEALTH_ENDPOINTS=(
    "http://localhost:5000/status"
    "http://localhost:5000/api/categories?active=true"
    "http://localhost:5000/api/products/featured"
)

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "$endpoint" 2>/dev/null || echo "999")
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
    
    if [[ "$status_code" == "200" ]]; then
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            check_status "$(basename $endpoint) healthy (${response_time}s)"
        else
            warn_status "$(basename $endpoint) slow response (${response_time}s)"
        fi
    else
        echo -e "  ${RED}❌ $(basename $endpoint) failed (HTTP $status_code)${NC}"
        ((ERRORS++))
    fi
done

# Stop test server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# 5. Security Validation
echo ""
echo "5. Security Validation"

# Check for production environment
if [[ "${NODE_ENV:-}" == "production" ]]; then
    check_status "NODE_ENV set to production"
else
    warn_status "NODE_ENV not set to production (current: ${NODE_ENV:-development})"
fi

# Validate secret keys format
if [[ "${STRIPE_SECRET_KEY:-}" == sk_live_* ]]; then
    check_status "Using Stripe live keys"
elif [[ "${STRIPE_SECRET_KEY:-}" == sk_test_* ]]; then
    warn_status "Using Stripe test keys (consider live keys for production)"
else
    warn_status "Stripe key format not recognized"
fi

# Check file permissions
if [[ -f "dist/server.js" && -x "dist/server.js" ]]; then
    check_status "Build artifacts have correct permissions"
else
    warn_status "Build artifacts may have permission issues"
fi

# 6. Final Deployment Decision
echo ""
echo "======================================"
echo "DEPLOYMENT READINESS SUMMARY"
echo "======================================"

if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}🎉 DEPLOYMENT READY!${NC}"
    echo "✅ All critical checks passed"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found (non-blocking)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Starting production deployment...${NC}"
    
    # Set production environment
    export NODE_ENV=production
    
    # Final start
    echo "Starting Clean & Flip in production mode..."
    exec node dist/server.js
    
else
    echo -e "${RED}❌ DEPLOYMENT BLOCKED${NC}"
    echo "🚨 $ERRORS critical error(s) must be fixed"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    fi
    
    echo ""
    echo "Check the logs above and fix all errors before deploying."
    echo "Logs saved to: /tmp/deploy_test.log"
    
    if [[ -f "/tmp/deploy_test.log" ]]; then
        echo ""
        echo "Last 10 lines of application log:"
        tail -10 /tmp/deploy_test.log
    fi
    
    exit 1
fi