#!/bin/bash

# Quick Deploy Script
# Syncs database and provides deployment instructions
# Usage: ./scripts/quick-deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Deploy Workflow${NC}"
echo "=========================="
echo ""

# Step 1: Sync database
echo -e "${BLUE}Step 1: Syncing production database...${NC}"
./scripts/sync-prod-db.sh --force

echo ""

# Step 2: Deployment instructions
echo -e "${GREEN}✅ Database sync complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Click the 'Deploy' button in Replit"
echo "2. Wait for deployment to complete"
echo "3. Test Google OAuth flow in production"
echo "4. Verify new user onboarding works"
echo ""
echo -e "${GREEN}🎯 Ready for deployment!${NC}"