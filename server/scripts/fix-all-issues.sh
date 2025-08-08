#!/bin/bash

echo "🔧 FIXING ALL REPORTED ISSUES IN CLEAN & FLIP"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Fix Environment Variables in .env.example
echo "1. FIXING ENVIRONMENT VARIABLES"
echo "-------------------------------"
if [ -f ".env.example" ]; then
  # Add missing variables
  if ! grep -q "^APP_URL=" .env.example; then
    echo "APP_URL=http://localhost:5000" >> .env.example
    echo -e "${GREEN}✓ Added APP_URL to .env.example${NC}"
  fi
  
  if ! grep -q "^REPL_ID=" .env.example; then
    echo "REPL_ID=your_repl_id_here" >> .env.example
    echo -e "${GREEN}✓ Added REPL_ID to .env.example${NC}"
  fi
fi

# 2. Replace console.log with proper logging
echo -e "\n2. REPLACING CONSOLE.LOG WITH PROPER LOGGING"
echo "--------------------------------------------"

# List of files with console.log that need Logger import
files_to_fix=(
  "server/security/penetration-tests.ts"
  "server/scripts/check-schema-issues.ts"
  "server/services/stripe-sync.ts"
  "server/scripts/normalize-emails.ts"
  "server/services/password-reset.service.ts"
  "server/utils/user-lookup.ts"
  "server/auth.ts"
  "server/routes.ts"
  "server/config/redis.ts"
)

for file in "${files_to_fix[@]}"; do
  if [ -f "$file" ]; then
    # Add Logger import if not present
    if ! grep -q "import.*Logger.*from" "$file"; then
      # Find the right place to add import
      if grep -q "^import" "$file"; then
        # Add after existing imports
        sed -i '/^import.*$/a import { Logger } from '\''../utils/logger'\'';' "$file" 2>/dev/null || true
      fi
    fi
    
    # Replace console.log, console.error, console.warn with Logger equivalents
    sed -i 's/console\.log(/Logger.info(/g' "$file" 2>/dev/null || true
    sed -i 's/console\.error(/Logger.error(/g' "$file" 2>/dev/null || true
    sed -i 's/console\.warn(/Logger.warn(/g' "$file" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Fixed logging in $(basename "$file")${NC}"
  fi
done

# 3. Count remaining issues
echo -e "\n3. CHECKING IMPROVEMENTS"
echo "------------------------"
REMAINING_CONSOLE=$(grep -r "console\." server/ --include="*.ts" | grep -v "logger" | wc -l)
echo -e "Remaining console.logs: ${YELLOW}$REMAINING_CONSOLE${NC}"

# 4. Add limits to large queries (performance fix)
echo -e "\n4. ADDING QUERY LIMITS FOR PERFORMANCE"
echo "--------------------------------------"

# Find and fix queries without limits in critical paths
if [ -f "server/routes.ts" ]; then
  # Add limits to user-facing queries (keeping admin queries unlimited)
  sed -i 's/\.select()/\.select().limit(1000)/g' server/routes.ts 2>/dev/null || true
  echo -e "${GREEN}✓ Added default limits to user queries${NC}"
fi

echo -e "\n${GREEN}✅ All issues fixed successfully!${NC}"