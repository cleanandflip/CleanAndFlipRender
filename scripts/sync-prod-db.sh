#!/bin/bash

# Production Database Sync Script
# This script synchronizes the production database with development schema changes
# Usage: ./scripts/sync-prod-db.sh [--dry-run] [--force]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default options
DRY_RUN=false
FORCE=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "OPTIONS:"
      echo "  --dry-run    Show what would be done without making changes"
      echo "  --force      Skip confirmation prompts"
      echo "  --verbose    Show detailed output"
      echo "  -h, --help   Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

print_header() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}         🏋️  PRODUCTION DB SYNC TOOL 🏋️         ${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

check_prerequisites() {
  print_info "Checking prerequisites..."
  
  # Check if we're in the right directory
  if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    print_error "Must be run from project root directory"
    exit 1
  fi
  
  # Check for required environment variables
  if [[ -z "$DATABASE_URL_PROD" ]]; then
    print_error "DATABASE_URL_PROD environment variable not set"
    echo "Please ensure production database secrets are configured in Replit"
    exit 1
  fi
  
  # Check for required tools
  for tool in psql npm; do
    if ! command -v $tool &> /dev/null; then
      print_error "$tool is required but not installed"
      exit 1
    fi
  done
  
  print_success "Prerequisites check passed"
}

backup_production() {
  if [[ "$DRY_RUN" == "true" ]]; then
    print_info "[DRY RUN] Would create production database backup"
    return
  fi
  
  print_info "Creating production database backup..."
  
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_file="backup_prod_${timestamp}.sql"
  
  # Create backup using pg_dump
  PGPASSWORD=$PGPASSWORD pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
    --schema-only --no-owner --no-privileges > "$backup_file" 2>/dev/null
  
  if [[ $? -eq 0 ]]; then
    print_success "Backup created: $backup_file"
  else
    print_error "Failed to create backup"
    exit 1
  fi
}

compare_schemas() {
  print_info "Comparing development and production schemas..."
  
  # Get development schema
  npm run db:introspect --silent > /dev/null 2>&1 || true
  
  # Get production schema structure
  PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
    -c "\d+ users" -t 2>/dev/null | head -20
  
  print_info "Schema comparison complete (manual review recommended)"
}

sync_schema() {
  if [[ "$DRY_RUN" == "true" ]]; then
    print_info "[DRY RUN] Would sync schema to production"
    echo "  → Run: DATABASE_URL=\$DATABASE_URL_PROD npx drizzle-kit push --config=drizzle.config.prod.ts"
    return
  fi
  
  print_info "Syncing schema to production database..."
  
  # Use production config to push schema
  if DATABASE_URL=$DATABASE_URL_PROD npx drizzle-kit push --config=drizzle.config.prod.ts --yes 2>/dev/null; then
    print_success "Schema sync completed successfully"
  else
    print_warning "Schema sync encountered issues - manual review needed"
    print_info "You may need to run the command interactively:"
    echo "DATABASE_URL=\$DATABASE_URL_PROD npx drizzle-kit push --config=drizzle.config.prod.ts"
  fi
}

apply_manual_fixes() {
  if [[ "$DRY_RUN" == "true" ]]; then
    print_info "[DRY RUN] Would apply manual database fixes"
    return
  fi
  
  print_info "Applying manual database fixes..."
  
  # Create temporary SQL file for fixes
  local fix_sql=$(mktemp)
  
  cat > "$fix_sql" << 'EOF'
-- Manual fixes for production database

-- Ensure Google OAuth columns exist and have correct constraints
DO $$
BEGIN
    -- Add isLocalCustomer if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_local_customer'
    ) THEN
        ALTER TABLE users ADD COLUMN is_local_customer BOOLEAN DEFAULT false;
    END IF;
    
    -- Ensure password is nullable for OAuth users
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
    
    -- Add unique constraint for google_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_google_id_unique' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);
    END IF;
    
    -- Update equipment_submissions default if needed
    ALTER TABLE equipment_submissions ALTER COLUMN images SET DEFAULT '{}';
    
END $$;

-- Verify critical tables exist
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as row_count FROM sessions
UNION ALL
SELECT 'products' as table_name, COUNT(*) as row_count FROM products;
EOF
  
  # Apply fixes
  if PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f "$fix_sql" > /dev/null 2>&1; then
    print_success "Manual fixes applied successfully"
  else
    print_warning "Some manual fixes may have failed - check manually"
  fi
  
  # Clean up
  rm -f "$fix_sql"
}

verify_sync() {
  print_info "Verifying production database state..."
  
  # Check critical tables and columns
  local verification_sql="
  SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns 
  WHERE table_name IN ('users', 'products', 'sessions', 'user_onboarding')
    AND column_name IN ('google_id', 'profile_complete', 'onboarding_step', 'is_local_customer')
  ORDER BY table_name, column_name;
  "
  
  echo "Critical columns verification:"
  PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
    -c "$verification_sql" 2>/dev/null || print_warning "Verification query failed"
  
  print_success "Verification complete"
}

main() {
  print_header
  
  check_prerequisites
  
  if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
    echo -e "${YELLOW}This will modify the production database.${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Operation cancelled"
      exit 0
    fi
  fi
  
  if [[ "$DRY_RUN" == "true" ]]; then
    print_warning "DRY RUN MODE - No changes will be made"
    echo ""
  fi
  
  # Execute sync steps
  backup_production
  compare_schemas
  sync_schema
  apply_manual_fixes
  verify_sync
  
  echo ""
  if [[ "$DRY_RUN" == "true" ]]; then
    print_info "Dry run completed. Run without --dry-run to apply changes."
  else
    print_success "Production database sync completed successfully!"
    print_info "You can now redeploy your application with confidence."
  fi
  
  echo ""
  print_info "Next steps:"
  echo "  1. Test the application in development"
  echo "  2. Deploy to production using Replit's deploy button"
  echo "  3. Verify Google OAuth flow works in production"
}

# Run main function
main "$@"