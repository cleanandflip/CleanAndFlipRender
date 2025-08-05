#!/bin/bash

echo "🔧 QUICK FIXES FOR CLEAN & FLIP CODEBASE"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Replace console.log with proper logger in critical files
echo "1. Replacing console.log with proper logging..."

# Fix search.ts
if [ -f "server/config/search.ts" ]; then
  sed -i 's/console\.log(/Logger.info(/g' server/config/search.ts
  sed -i 's/console\.error(/Logger.error(/g' server/config/search.ts
  echo -e "${GREEN}✓ Fixed logging in search.ts${NC}"
fi

# Fix database.ts  
if [ -f "server/config/database.ts" ]; then
  sed -i 's/console\.log(/Logger.info(/g' server/config/database.ts
  sed -i 's/console\.error(/Logger.error(/g' server/config/database.ts
  sed -i 's/console\.warn(/Logger.warn(/g' server/config/database.ts
  echo -e "${GREEN}✓ Fixed logging in database.ts${NC}"
fi

# 2. Add missing environment variables to .env.example
echo -e "\n2. Updating .env.example with missing variables..."
if [ -f ".env.example" ]; then
  # Add missing variables if they don't exist
  grep -q "APP_URL=" .env.example || echo "APP_URL=http://localhost:5000" >> .env.example
  grep -q "FRONTEND_URL=" .env.example || echo "FRONTEND_URL=http://localhost:5000" >> .env.example
  grep -q "RESEND_API_KEY=" .env.example || echo "RESEND_API_KEY=your_resend_api_key_here" >> .env.example
  grep -q "DB_CONNECTION_LOGGED=" .env.example || echo "DB_CONNECTION_LOGGED=false" >> .env.example
  echo -e "${GREEN}✓ Updated .env.example${NC}"
fi

# 3. Count and report improvements
echo -e "\n3. Improvements Summary:"
echo "------------------------"
REMAINING_CONSOLE_LOGS=$(grep -r "console\." server/ --include="*.ts" | grep -v "logger" | wc -l)
echo -e "Remaining console.logs in server: ${YELLOW}$REMAINING_CONSOLE_LOGS${NC}"

echo -e "\n${GREEN}✅ Quick fixes applied successfully!${NC}"