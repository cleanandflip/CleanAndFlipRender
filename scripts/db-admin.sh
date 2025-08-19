#!/bin/bash

# Database Administration Script
# Provides commands for managing dev and prod databases with migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment variables are set
check_env() {
    if [ -z "$DEV_DATABASE_URL" ]; then
        log_error "DEV_DATABASE_URL not set"
        exit 1
    fi
    
    if [ -z "$PROD_DATABASE_URL" ]; then
        log_warning "PROD_DATABASE_URL not set (production commands will fail)"
    fi
}

# Create a new migration
create_migration() {
    local name=$1
    if [ -z "$name" ]; then
        log_error "Migration name required: ./scripts/db-admin.sh create <name>"
        exit 1
    fi
    
    log_info "Creating migration: $name"
    node-pg-migrate create "$name" -m server/db/migrations
    log_success "Migration created"
}

# Run migrations up
migrate_up() {
    local env=${1:-dev}
    local database_url
    
    if [ "$env" = "dev" ]; then
        database_url=$DEV_DATABASE_URL
        log_info "Running migrations UP on DEVELOPMENT database"
    elif [ "$env" = "prod" ]; then
        database_url=$PROD_DATABASE_URL
        log_info "Running migrations UP on PRODUCTION database"
        echo -n "Are you sure? Type 'MIGRATE PROD UP' to confirm: "
        read -r confirm
        if [ "$confirm" != "MIGRATE PROD UP" ]; then
            log_error "Operation cancelled"
            exit 1
        fi
    else
        log_error "Invalid environment: $env (use 'dev' or 'prod')"
        exit 1
    fi
    
    DATABASE_URL="$database_url" node-pg-migrate up -m server/db/migrations
    log_success "Migrations applied successfully"
}

# Run migrations down (rollback)
migrate_down() {
    local env=${1:-dev}
    local steps=${2:-1}
    local database_url
    
    if [ "$env" = "dev" ]; then
        database_url=$DEV_DATABASE_URL
        log_info "Rolling back $steps migration(s) on DEVELOPMENT database"
    elif [ "$env" = "prod" ]; then
        database_url=$PROD_DATABASE_URL
        log_warning "Rolling back $steps migration(s) on PRODUCTION database"
        echo -n "Are you sure? Type 'ROLLBACK $steps' to confirm: "
        read -r confirm
        if [ "$confirm" != "ROLLBACK $steps" ]; then
            log_error "Operation cancelled"
            exit 1
        fi
    else
        log_error "Invalid environment: $env (use 'dev' or 'prod')"
        exit 1
    fi
    
    for ((i=1; i<=steps; i++)); do
        log_info "Rolling back step $i of $steps"
        DATABASE_URL="$database_url" node-pg-migrate down -m server/db/migrations
    done
    
    log_success "Rollback completed"
}

# Check migration status
migration_status() {
    local env=${1:-dev}
    local database_url
    
    if [ "$env" = "dev" ]; then
        database_url=$DEV_DATABASE_URL
        log_info "Migration status for DEVELOPMENT database:"
    elif [ "$env" = "prod" ]; then
        database_url=$PROD_DATABASE_URL
        log_info "Migration status for PRODUCTION database:"
    else
        log_error "Invalid environment: $env (use 'dev' or 'prod')"
        exit 1
    fi
    
    DATABASE_URL="$database_url" node-pg-migrate status -m server/db/migrations
}

# Promote dev to prod (apply same migrations)
promote_to_prod() {
    log_warning "Promoting development migrations to production"
    echo -n "Are you sure? Type 'PROMOTE TO PROD' to confirm: "
    read -r confirm
    if [ "$confirm" != "PROMOTE TO PROD" ]; then
        log_error "Operation cancelled"
        exit 1
    fi
    
    log_info "Applying development migrations to production..."
    migrate_up prod
    log_success "Promotion completed"
}

# Show help
show_help() {
    echo "Database Administration Commands"
    echo ""
    echo "Usage: ./scripts/db-admin.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <name>           Create a new migration"
    echo "  up [dev|prod]          Run migrations up (default: dev)"
    echo "  down [dev|prod] [steps] Rollback migrations (default: dev, 1 step)"
    echo "  status [dev|prod]      Check migration status (default: dev)"
    echo "  promote                Promote dev migrations to prod"
    echo "  help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/db-admin.sh create add_users_table"
    echo "  ./scripts/db-admin.sh up dev"
    echo "  ./scripts/db-admin.sh down prod 2"
    echo "  ./scripts/db-admin.sh status prod"
    echo "  ./scripts/db-admin.sh promote"
    echo ""
}

# Main script logic
main() {
    local command=$1
    
    case "$command" in
        "create")
            check_env
            create_migration "$2"
            ;;
        "up")
            check_env
            migrate_up "$2"
            ;;
        "down")
            check_env
            migrate_down "$2" "$3"
            ;;
        "status")
            check_env
            migration_status "$2"
            ;;
        "promote")
            check_env
            promote_to_prod
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run the script
main "$@"