#!/bin/bash

# Production Readiness Comprehensive Check
# Verifies database schema, performance, and environment for Clean & Flip

set -euo pipefail

echo "🔍 PRODUCTION READINESS CHECK"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 1. Environment Variables Check
echo "1. Environment Configuration"
if [[ -n "${DATABASE_URL:-}" ]]; then
    check_status "DATABASE_URL configured"
else
    echo -e "  ${RED}❌ DATABASE_URL not set${NC}"
    ((ERRORS++))
fi

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
    check_status "STRIPE_SECRET_KEY configured"
else
    echo -e "  ${RED}❌ STRIPE_SECRET_KEY not set${NC}"
    ((ERRORS++))
fi

if [[ -n "${CLOUDINARY_CLOUD_NAME:-}" ]]; then
    check_status "CLOUDINARY_CLOUD_NAME configured"
else
    echo -e "  ${RED}❌ CLOUDINARY_CLOUD_NAME not set${NC}"
    ((ERRORS++))
fi

if [[ -n "${RESEND_API_KEY:-}" ]]; then
    check_status "RESEND_API_KEY configured"
else
    echo -e "  ${RED}❌ RESEND_API_KEY not set${NC}"
    ((ERRORS++))
fi

if [[ -n "${REDIS_URL:-}" ]]; then
    check_status "REDIS_URL configured (optional)"
else
    warn_status "REDIS_URL not set (performance will be impacted)"
fi

# 2. Database Health Check
echo ""
echo "2. Database Health"

# Test connection
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    check_status "Database connection successful"
else
    echo -e "  ${RED}❌ Database connection failed${NC}"
    ((ERRORS++))
    exit 1
fi

# Check PostgreSQL version
PG_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" 2>/dev/null | head -1)
if [[ $PG_VERSION == *"PostgreSQL 16"* ]]; then
    check_status "PostgreSQL 16.x (optimal version)"
else
    warn_status "PostgreSQL version: $PG_VERSION (consider upgrading to 16.x)"
fi

# 3. Critical Tables Check
echo ""
echo "3. Database Schema Validation"

REQUIRED_TABLES=("users" "products" "addresses" "cart_items" "orders" "categories")
for table in "${REQUIRED_TABLES[@]}"; do
    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null)
    if [[ "$COUNT" -eq 1 ]]; then
        check_status "Table '$table' exists"
    else
        echo -e "  ${RED}❌ Table '$table' missing${NC}"
        ((ERRORS++))
    fi
done

# 4. Critical Indexes Check
echo ""
echo "4. Performance Indexes"

CRITICAL_INDEXES=(
    "idx_products_featured_status_updated"
    "idx_products_active_created"
    "idx_products_featured_active"
    "users_email_unique"
    "cart_items_owner_prod_uidx"
)

for index in "${CRITICAL_INDEXES[@]}"; do
    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname='$index';" 2>/dev/null)
    if [[ "$COUNT" -eq 1 ]]; then
        check_status "Index '$index' exists"
    else
        echo -e "  ${RED}❌ Index '$index' missing${NC}"
        ((ERRORS++))
    fi
done

# 5. Data Integrity Check
echo ""
echo "5. Data Integrity"

# Check foreign key constraints
FK_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('users', 'cart_items', 'orders', 'addresses');
" 2>/dev/null)

if [[ "$FK_COUNT" -ge 5 ]]; then
    check_status "Foreign key constraints ($FK_COUNT found)"
else
    echo -e "  ${RED}❌ Missing foreign key constraints (found: $FK_COUNT, expected: ≥5)${NC}"
    ((ERRORS++))
fi

# Check for featured products
FEATURED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM products WHERE featured = true AND status = 'active';" 2>/dev/null)
if [[ "$FEATURED_COUNT" -gt 0 ]]; then
    check_status "Featured products available ($FEATURED_COUNT found)"
else
    warn_status "No featured products found (homepage will show newest products)"
fi

# 6. API Performance Check
echo ""
echo "6. API Performance"

if command -v curl >/dev/null 2>&1; then
    # Test featured products endpoint
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:5000/api/products/featured" 2>/dev/null || echo "999")
    if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
        check_status "Featured products API (<${RESPONSE_TIME}s)"
    elif (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
        warn_status "Featured products API (${RESPONSE_TIME}s - consider optimization)"
    else
        echo -e "  ${RED}❌ Featured products API too slow (${RESPONSE_TIME}s)${NC}"
        ((ERRORS++))
    fi

    # Test status endpoint
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/status" 2>/dev/null || echo "000")
    if [[ "$STATUS_CODE" == "200" ]]; then
        check_status "Status endpoint responding"
    else
        echo -e "  ${RED}❌ Status endpoint failed (HTTP $STATUS_CODE)${NC}"
        ((ERRORS++))
    fi
else
    warn_status "curl not available - skipping API tests"
fi

# 7. Security Check
echo ""
echo "7. Security Configuration"

# Check if we're not in development for production
if [[ "${NODE_ENV:-}" == "production" ]]; then
    check_status "NODE_ENV set to production"
else
    warn_status "NODE_ENV not set to production (current: ${NODE_ENV:-development})"
fi

# Check if secrets are not default values
if [[ "${STRIPE_SECRET_KEY:-}" == sk_test_* ]]; then
    warn_status "Using Stripe test keys (expected for development)"
elif [[ "${STRIPE_SECRET_KEY:-}" == sk_live_* ]]; then
    check_status "Using Stripe live keys (production ready)"
else
    warn_status "Stripe key format not recognized"
fi

# 8. Build Check
echo ""
echo "8. Build Artifacts"

if [[ -f "package.json" ]]; then
    check_status "package.json exists"
else
    echo -e "  ${RED}❌ package.json missing${NC}"
    ((ERRORS++))
fi

if [[ -d "node_modules" ]]; then
    check_status "Dependencies installed"
else
    echo -e "  ${RED}❌ node_modules missing - run npm install${NC}"
    ((ERRORS++))
fi

# Final Summary
echo ""
echo "=========================================="
echo "PRODUCTION READINESS SUMMARY"
echo "=========================================="

if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}🎉 PRODUCTION READY!${NC}"
    echo "✅ No critical errors found"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found (non-blocking)${NC}"
    fi
    echo ""
    echo "Ready to deploy with:"
    echo "  ./scripts/deploy-prod.sh"
    exit 0
else
    echo -e "${RED}❌ NOT PRODUCTION READY${NC}"
    echo "🚨 $ERRORS critical error(s) must be fixed"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Fix the above errors before deploying to production."
    exit 1
fi