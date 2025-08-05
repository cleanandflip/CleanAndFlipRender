#!/bin/bash

echo "=========================================="
echo "🔍 CLEAN & FLIP COMPLETE CODEBASE AUDIT"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create audit report directory
mkdir -p audit-reports

# 1. TypeScript Compilation Check
echo "1. TYPESCRIPT COMPILATION CHECK"
echo "-------------------------------"
cd /home/runner/workspace

# Full TypeScript check
echo "Running complete TypeScript compilation check..."
npx tsc --noEmit 2>&1 | tee audit-reports/typescript-errors.log

# Count errors
TS_ERRORS=$(grep -c "error TS" audit-reports/typescript-errors.log || echo "0")
echo -e "\n${GREEN}✓ Total TypeScript Errors: $TS_ERRORS${NC}\n"

# Show first 20 errors with context if any exist
if [ $TS_ERRORS -gt 0 ]; then
  echo "First 20 TypeScript errors:"
  grep -A 2 -B 2 "error TS" audit-reports/typescript-errors.log | head -60
else
  echo -e "${GREEN}✓ No TypeScript compilation errors found!${NC}"
fi

# 2. Database Schema Consistency Check
echo -e "\n2. DATABASE SCHEMA CHECK"
echo "------------------------"

# Check if schema file exists
if [ -f "shared/schema.ts" ]; then
  echo -e "${GREEN}✓ Schema file found at shared/schema.ts${NC}"
  
  # Extract table names from schema
  echo "Tables defined in schema:"
  grep -E "export const .+ = pgTable" shared/schema.ts | sed 's/export const /  - /' | sed 's/ = pgTable.*//' > audit-reports/schema-tables.txt
  cat audit-reports/schema-tables.txt
  
  # Check for table references in code
  echo -e "\nChecking for table references in server code..."
  grep -r -h "from(" server/ --include="*.ts" | grep -oE "from\([a-zA-Z_]+\)" | sort | uniq | sed 's/from(//' | sed 's/)//' > audit-reports/code-tables.txt
  
  echo "Tables referenced in server code:"
  cat audit-reports/code-tables.txt | sed 's/^/  - /'
  
  # Find missing tables
  echo -e "\nChecking for missing table definitions..."
  while read table; do
    if ! grep -q "export const $table" shared/schema.ts 2>/dev/null; then
      echo -e "${YELLOW}Warning: Table '$table' referenced but not found in schema${NC}"
    fi
  done < audit-reports/code-tables.txt
else
  echo -e "${RED}✗ Schema file not found at shared/schema.ts${NC}"
fi

# 3. Environment Variable Check
echo -e "\n3. ENVIRONMENT VARIABLE CHECK"
echo "-----------------------------"

# Find all env vars used in code
echo "Environment variables referenced in code:"
grep -r "process\.env\." . --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" | \
  grep -oE "process\.env\.[A-Z_]+" | sort | uniq | sed 's/process\.env\.//' > audit-reports/used-env-vars.txt

cat audit-reports/used-env-vars.txt | sed 's/^/  - /'

# Check against .env.example
if [ -f ".env.example" ]; then
  echo -e "\n${GREEN}✓ Checking against .env.example...${NC}"
  while read var; do
    if ! grep -q "^$var=" .env.example; then
      echo -e "${YELLOW}Missing in .env.example: $var${NC}"
    fi
  done < audit-reports/used-env-vars.txt
else
  echo -e "${YELLOW}No .env.example file found${NC}"
fi

# 4. API Endpoint Validation
echo -e "\n4. API ENDPOINT VALIDATION"
echo "--------------------------"

# Find all route definitions
echo "Scanning for API endpoints..."
grep -r -E "(router\.|app\.)(get|post|put|delete|patch)\(" server/ --include="*.ts" | \
  sed -E 's/.*\.(get|post|put|delete|patch)\(["\x27]([^"\x27]+)["\x27].*/\1 \2/' | \
  sort | uniq > audit-reports/api-endpoints.txt

echo "Total endpoints found: $(wc -l < audit-reports/api-endpoints.txt)"
echo "Endpoints:"
cat audit-reports/api-endpoints.txt | sed 's/^/  /'

# Check for duplicate routes
echo -e "\nChecking for duplicate routes..."
sort audit-reports/api-endpoints.txt | uniq -d | while read dup; do
  echo -e "${YELLOW}Duplicate route: $dup${NC}"
done

# 5. Security Audit
echo -e "\n5. SECURITY AUDIT"
echo "-----------------"

# Check for hardcoded secrets
echo "Checking for hardcoded secrets..."
grep -r -i -E "(api_key|apikey|password|secret|private_key)" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="node_modules" --exclude-dir="dist" \
  | grep -v -E "(process\.env|import|export|interface|type|password\:|\.password)" \
  | grep -E "=\s*['\"][^'\"]{10,}['\"]" > audit-reports/potential-secrets.txt

if [ -s audit-reports/potential-secrets.txt ]; then
  echo -e "${RED}Potential hardcoded secrets found:${NC}"
  head -5 audit-reports/potential-secrets.txt
else
  echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi

# Check for console.logs in production code
echo -e "\nChecking for console.logs in server code..."
CONSOLE_LOGS=$(grep -r "console\." server/ --include="*.ts" | grep -v "logger" | wc -l)
echo -e "Console.logs found in server: ${YELLOW}$CONSOLE_LOGS${NC}"

# 6. Integration Health Check
echo -e "\n6. INTEGRATION HEALTH CHECK"
echo "---------------------------"

# Check Stripe integration
echo "Checking Stripe integration..."
if grep -q "stripe" package.json; then
  echo -e "${GREEN}✓ Stripe package installed${NC}"
  if grep -q "STRIPE_SECRET_KEY" audit-reports/used-env-vars.txt; then
    echo -e "${GREEN}✓ Stripe environment variable referenced${NC}"
  else
    echo -e "${RED}✗ STRIPE_SECRET_KEY not found in code${NC}"
  fi
else
  echo -e "${RED}✗ Stripe package not installed${NC}"
fi

# Check Cloudinary integration
echo -e "\nChecking Cloudinary integration..."
if grep -q "cloudinary" package.json; then
  echo -e "${GREEN}✓ Cloudinary package installed${NC}"
  if grep -q "CLOUDINARY_URL" audit-reports/used-env-vars.txt; then
    echo -e "${GREEN}✓ Cloudinary environment variable referenced${NC}"
  else
    echo -e "${RED}✗ CLOUDINARY_URL not found in code${NC}"
  fi
else
  echo -e "${RED}✗ Cloudinary package not installed${NC}"
fi

# Check Resend integration
echo -e "\nChecking Resend (email) integration..."
if grep -q "resend" package.json; then
  echo -e "${GREEN}✓ Resend package installed${NC}"
  if grep -q "RESEND_API_KEY" audit-reports/used-env-vars.txt; then
    echo -e "${GREEN}✓ Resend environment variable referenced${NC}"
  else
    echo -e "${RED}✗ RESEND_API_KEY not found in code${NC}"
  fi
else
  echo -e "${RED}✗ Resend package not installed${NC}"
fi

# 7. Performance Issues
echo -e "\n7. PERFORMANCE AUDIT"
echo "---------------------"

# Check for synchronous file operations
echo "Checking for synchronous file operations..."
SYNC_OPS=$(grep -r "Sync\(" server/ --include="*.ts" | grep -v "hashSync" | wc -l)
echo -e "Synchronous operations found: ${YELLOW}$SYNC_OPS${NC}"

# Check for potential missing await keywords
echo -e "\nChecking for potential missing await keywords..."
THEN_USAGE=$(grep -r "\.then\(" server/ --include="*.ts" | wc -l)
echo -e "Promise .then() usage found: ${YELLOW}$THEN_USAGE${NC}"

# 8. Frontend Component Check
echo -e "\n8. FRONTEND COMPONENT CHECK"
echo "---------------------------"

# Count components
COMPONENT_COUNT=$(find client/src/components -name "*.tsx" -o -name "*.jsx" | wc -l)
echo -e "Total components: ${BLUE}$COMPONENT_COUNT${NC}"

# 9. Database Query Audit
echo -e "\n9. DATABASE QUERY AUDIT"
echo "-----------------------"

# Check for queries without limits on large tables
echo "Checking for queries without limits..."
grep -r "from(" server/ --include="*.ts" | grep -v "limit\|first\|LIMIT" | wc -l | xargs echo "Queries without limits:"

# 10. Code Quality Metrics
echo -e "\n10. CODE QUALITY METRICS"
echo "------------------------"

# Count lines of code
echo "Lines of code analysis:"
echo -e "  TypeScript files: $(find . -name "*.ts" -not -path "./node_modules/*" | xargs wc -l | tail -1 | awk '{print $1}')"
echo -e "  React files: $(find . -name "*.tsx" -not -path "./node_modules/*" | xargs wc -l | tail -1 | awk '{print $1}')"

# Generate Summary Report
echo -e "\n=========================================="
echo "📊 AUDIT SUMMARY"
echo "=========================================="
echo -e "TypeScript Errors: ${GREEN}$TS_ERRORS${NC}"
echo -e "API Endpoints: ${BLUE}$(wc -l < audit-reports/api-endpoints.txt 2>/dev/null || echo 0)${NC}"
echo -e "Environment Variables: ${BLUE}$(wc -l < audit-reports/used-env-vars.txt 2>/dev/null || echo 0)${NC}"
echo -e "Components: ${BLUE}$COMPONENT_COUNT${NC}"
echo -e "Console.logs in server: ${YELLOW}$CONSOLE_LOGS${NC}"
echo -e "Sync operations: ${YELLOW}$SYNC_OPS${NC}"
echo "=========================================="

# Save timestamp
echo -e "\nAudit completed at: $(date)"
echo "Reports saved in: audit-reports/"

# Create comprehensive report
cat > audit-reports/COMPREHENSIVE_AUDIT_$(date +%Y%m%d_%H%M%S).md << EOF
# Clean & Flip - Comprehensive Audit Report
Generated: $(date)

## Summary
- TypeScript Errors: $TS_ERRORS
- API Endpoints: $(wc -l < audit-reports/api-endpoints.txt 2>/dev/null || echo 0)
- Components: $COMPONENT_COUNT
- Environment Variables: $(wc -l < audit-reports/used-env-vars.txt 2>/dev/null || echo 0)

## Files Generated
- typescript-errors.log
- schema-tables.txt
- code-tables.txt
- used-env-vars.txt
- api-endpoints.txt
- potential-secrets.txt

## Status
$(if [ $TS_ERRORS -eq 0 ]; then echo "✅ TypeScript compilation: CLEAN"; else echo "❌ TypeScript compilation: $TS_ERRORS errors"; fi)
$(if [ -f "shared/schema.ts" ]; then echo "✅ Database schema: FOUND"; else echo "❌ Database schema: MISSING"; fi)
$(if [ -f ".env.example" ]; then echo "✅ Environment template: FOUND"; else echo "❌ Environment template: MISSING"; fi)
EOF

echo -e "\n${GREEN}✅ Comprehensive audit completed successfully!${NC}"
echo -e "📄 Detailed report: audit-reports/COMPREHENSIVE_AUDIT_$(date +%Y%m%d_%H%M%S).md"