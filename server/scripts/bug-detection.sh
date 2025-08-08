#!/bin/bash

echo "🐛 CLEAN & FLIP BUG DETECTION SYSTEM"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p audit-reports

# 1. Find Hidden Errors in Catch Blocks
echo "1. HIDDEN ERROR DETECTION"
echo "-------------------------"
echo "Scanning for catch blocks that might hide errors..."

# Find catch blocks that don't properly handle errors
grep -r -n -A 3 -B 1 "catch" server/ --include="*.ts" | \
  grep -B 1 -A 3 -E "(console\.|return|throw)" | \
  grep -v "logger\|winston" > audit-reports/catch-blocks.txt

if [ -s audit-reports/catch-blocks.txt ]; then
  echo -e "${YELLOW}Found potential error handling issues:${NC}"
  head -20 audit-reports/catch-blocks.txt
else
  echo -e "${GREEN}✓ No problematic catch blocks found${NC}"
fi

# 2. Null Reference Detection
echo -e "\n2. NULL REFERENCE DETECTION"
echo "---------------------------"
echo "Scanning for potential null reference errors..."

# Find uses of ! operator that might cause null reference errors
grep -r -n "\!\." server/ --include="*.ts" | head -10 > audit-reports/null-refs.txt
if [ -s audit-reports/null-refs.txt ]; then
  echo -e "${YELLOW}Potential null reference risks:${NC}"
  cat audit-reports/null-refs.txt
else
  echo -e "${GREEN}✓ No dangerous null references found${NC}"
fi

# 3. Async/Await Issues
echo -e "\n3. ASYNC/AWAIT ISSUE DETECTION"
echo "------------------------------"
echo "Checking for missing await keywords..."

# Find Promise-returning functions without await
grep -r -n -B 2 -A 1 "Promise<" server/ --include="*.ts" | \
  grep -B 2 -A 1 -v "async\|await\|return.*Promise" | \
  head -15 > audit-reports/async-issues.txt

if [ -s audit-reports/async-issues.txt ]; then
  echo -e "${YELLOW}Potential async/await issues:${NC}"
  cat audit-reports/async-issues.txt
else
  echo -e "${GREEN}✓ No async/await issues detected${NC}"
fi

# 4. Database Query Issues
echo -e "\n4. DATABASE QUERY ISSUES"
echo "------------------------"
echo "Checking for potential database problems..."

# Find queries that might cause N+1 problems
echo "Checking for N+1 query patterns..."
grep -r -n -B 3 -A 3 "forEach\|map" server/ --include="*.ts" | \
  grep -B 3 -A 3 "from(" | head -20 > audit-reports/n1-queries.txt

if [ -s audit-reports/n1-queries.txt ]; then
  echo -e "${YELLOW}Potential N+1 query patterns found${NC}"
else
  echo -e "${GREEN}✓ No obvious N+1 patterns detected${NC}"
fi

# Check for missing error handling in database operations
echo -e "\nChecking database operations without error handling..."
grep -r -n -A 5 -B 2 "await.*db\." server/ --include="*.ts" | \
  grep -B 2 -A 5 -v "try\|catch" | head -20 > audit-reports/db-no-error-handling.txt

# 5. Import/Export Issues
echo -e "\n5. IMPORT/EXPORT VALIDATION"
echo "---------------------------"
echo "Checking for broken imports..."

# Find imports that might not resolve
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  grep -E "^import .* from ['\"]" "$file" 2>/dev/null | grep -E "@/|@server|@client|@shared" | while read import_line; do
    module=$(echo "$import_line" | sed -E "s/.*from ['\"]([^'\"]+)['\"].*/\1/")
    
    # Convert alias to actual path
    resolved_path=""
    case "$module" in
      "@/"*) resolved_path="client/src/${module#@/}" ;;
      "@server"*) resolved_path="server/${module#@server/}" ;;
      "@client"*) resolved_path="client/src/${module#@client/}" ;;
      "@shared"*) resolved_path="shared/${module#@shared/}" ;;
    esac
    
    if [ -n "$resolved_path" ]; then
      if [ ! -f "$resolved_path.ts" ] && [ ! -f "$resolved_path.tsx" ] && [ ! -f "$resolved_path/index.ts" ] && [ ! -d "$resolved_path" ]; then
        echo -e "${RED}Broken import: $module in $file${NC}"
      fi
    fi
  done
done

# 6. Security Vulnerabilities
echo -e "\n6. SECURITY VULNERABILITY SCAN"
echo "------------------------------"
echo "Checking for common security issues..."

# Check for eval usage
EVAL_COUNT=$(grep -r "eval(" . --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" | wc -l)
echo -e "eval() usage: ${YELLOW}$EVAL_COUNT${NC}"

# Check for innerHTML usage without sanitization
grep -r "innerHTML\s*=" client/ --include="*.ts" --include="*.tsx" | \
  grep -v "sanitize\|DOMPurify" > audit-reports/innerHTML-usage.txt
if [ -s audit-reports/innerHTML-usage.txt ]; then
  echo -e "${RED}Unsafe innerHTML usage found${NC}"
  head -5 audit-reports/innerHTML-usage.txt
fi

# 7. Performance Issues
echo -e "\n7. PERFORMANCE ISSUE DETECTION"
echo "------------------------------"
echo "Checking for performance problems..."

# Find large loops without pagination
grep -r -n -B 2 -A 5 "\.forEach\|\.map" server/ --include="*.ts" | \
  grep -B 2 -A 5 "from(" | \
  grep -v "limit\|first\|LIMIT" > audit-reports/large-loops.txt

if [ -s audit-reports/large-loops.txt ]; then
  echo -e "${YELLOW}Potentially expensive operations without limits:${NC}"
  head -10 audit-reports/large-loops.txt
fi

# 8. Memory Leak Detection
echo -e "\n8. MEMORY LEAK DETECTION"
echo "------------------------"
echo "Checking for potential memory leaks..."

# Find event listeners without cleanup
grep -r -n "addEventListener\|on(" client/ --include="*.ts" --include="*.tsx" | \
  wc -l | xargs echo "Event listeners found:"

# Find useEffect without cleanup
grep -r -n -A 10 "useEffect" client/ --include="*.tsx" | \
  grep -B 10 -A 2 "return.*=>" | wc -l | xargs echo "useEffect with cleanup functions:"

# 9. Code Duplication Detection
echo -e "\n9. CODE DUPLICATION DETECTION"
echo "-----------------------------"
echo "Checking for duplicate code patterns..."

# Find duplicate function patterns (simplified)
grep -r -E "^(const|function|export const)" . --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" | \
  cut -d: -f2- | sort | uniq -d | head -10 > audit-reports/duplicate-patterns.txt

if [ -s audit-reports/duplicate-patterns.txt ]; then
  echo -e "${YELLOW}Potential duplicate code patterns:${NC}"
  cat audit-reports/duplicate-patterns.txt
fi

# 10. Configuration Issues
echo -e "\n10. CONFIGURATION VALIDATION"
echo "----------------------------"
echo "Checking configuration consistency..."

# Check TypeScript config
if [ -f "tsconfig.json" ]; then
  echo -e "${GREEN}✓ TypeScript config found${NC}"
  # Check for strict mode
  if grep -q '"strict".*true' tsconfig.json; then
    echo -e "${GREEN}✓ Strict mode enabled${NC}"
  else
    echo -e "${YELLOW}Warning: Strict mode not enabled${NC}"
  fi
else
  echo -e "${RED}✗ TypeScript config missing${NC}"
fi

# Check Tailwind config
if [ -f "tailwind.config.ts" ] || [ -f "tailwind.config.js" ]; then
  echo -e "${GREEN}✓ Tailwind config found${NC}"
else
  echo -e "${YELLOW}Warning: Tailwind config missing${NC}"
fi

# Generate Bug Report Summary
echo -e "\n=========================================="
echo "🐛 BUG DETECTION SUMMARY"
echo "=========================================="
echo -e "Potential catch block issues: $(wc -l < audit-reports/catch-blocks.txt 2>/dev/null || echo 0)"
echo -e "Null reference risks: $(wc -l < audit-reports/null-refs.txt 2>/dev/null || echo 0)"
echo -e "Async/await issues: $(wc -l < audit-reports/async-issues.txt 2>/dev/null || echo 0)"
echo -e "eval() usage: $EVAL_COUNT"
echo -e "Performance concerns: $(wc -l < audit-reports/large-loops.txt 2>/dev/null || echo 0)"
echo "=========================================="

# Create detailed bug report
cat > audit-reports/BUG_DETECTION_REPORT_$(date +%Y%m%d_%H%M%S).md << EOF
# Clean & Flip - Bug Detection Report
Generated: $(date)

## Critical Issues Found
$(if [ -s audit-reports/catch-blocks.txt ]; then echo "❌ Error handling issues detected"; else echo "✅ Error handling looks good"; fi)
$(if [ -s audit-reports/null-refs.txt ]; then echo "❌ Null reference risks found"; else echo "✅ No null reference issues"; fi)
$(if [ "$EVAL_COUNT" -gt 0 ]; then echo "❌ Security: eval() usage detected"; else echo "✅ No eval() usage"; fi)

## Files Generated
- catch-blocks.txt - Error handling analysis
- null-refs.txt - Null reference analysis
- async-issues.txt - Async/await problems
- n1-queries.txt - Database query analysis
- db-no-error-handling.txt - Database error handling
- innerHTML-usage.txt - Security analysis
- large-loops.txt - Performance analysis
- duplicate-patterns.txt - Code duplication

## Recommendations
1. Review catch blocks for proper error handling
2. Add null checks where needed
3. Ensure all async operations are properly awaited
4. Add error handling to database operations
5. Consider pagination for large data operations

## Next Steps
1. Fix critical issues first
2. Add comprehensive error handling
3. Implement proper logging
4. Add unit tests for edge cases
EOF

echo -e "\n${GREEN}✅ Bug detection completed!${NC}"
echo -e "📄 Detailed report: audit-reports/BUG_DETECTION_REPORT_$(date +%Y%m%d_%H%M%S).md"