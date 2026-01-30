#!/bin/bash
# MatrixGin v2.0 - Database Migration Script (Linux/Mac)
# Description: Apply all migrations and seeds to PostgreSQL database
# Author: MatrixGin Development Team
# Date: 2025-01-21

# Default parameters
DATABASE_NAME="${DATABASE_NAME:-matrixgin_dev}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
SKIP_SEEDS=false
DROP_DATABASE=false
CREATE_DATABASE=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --database)
            DATABASE_NAME="$2"
            shift 2
            ;;
        --user)
            POSTGRES_USER="$2"
            shift 2
            ;;
        --host)
            POSTGRES_HOST="$2"
            shift 2
            ;;
        --port)
            POSTGRES_PORT="$2"
            shift 2
            ;;
        --skip-seeds)
            SKIP_SEEDS=true
            shift
            ;;
        --drop-database)
            DROP_DATABASE=true
            shift
            ;;
        --create-database)
            CREATE_DATABASE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --database NAME       Database name (default: matrixgin_dev)"
            echo "  --user USER          PostgreSQL user (default: postgres)"
            echo "  --host HOST          PostgreSQL host (default: localhost)"
            echo "  --port PORT          PostgreSQL port (default: 5432)"
            echo "  --skip-seeds         Skip seed data"
            echo "  --drop-database      Drop database before creating"
            echo "  --create-database    Create database"
            echo "  --help               Show this help"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Banner
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         MatrixGin v2.0 - Database Migration Tool          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) not found"
    print_info "Please install PostgreSQL"
    exit 1
fi

print_success "PostgreSQL client (psql) found"

# Connection parameters
export PGPASSWORD="${POSTGRES_PASSWORD}"
PSQL_CMD="psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT"

print_info "Database: $DATABASE_NAME"
print_info "Host: $POSTGRES_HOST:$POSTGRES_PORT"
print_info "User: $POSTGRES_USER"
echo ""

# Drop database if requested
if [ "$DROP_DATABASE" = true ]; then
    print_warning "Dropping database '$DATABASE_NAME'..."
    $PSQL_CMD -d postgres -c "DROP DATABASE IF EXISTS $DATABASE_NAME;" &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database dropped successfully"
    else
        print_error "Failed to drop database"
        exit 1
    fi
fi

# Create database if requested
if [ "$CREATE_DATABASE" = true ] || [ "$DROP_DATABASE" = true ]; then
    print_info "Creating database '$DATABASE_NAME'..."
    $PSQL_CMD -d postgres -c "CREATE DATABASE $DATABASE_NAME;" &> /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database created successfully"
    else
        print_warning "Database might already exist (this is OK)"
    fi
fi

echo ""
print_info "Starting migration process..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_PATH="$SCRIPT_DIR/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_PATH" ]; then
    print_error "Migrations directory not found: $MIGRATIONS_PATH"
    exit 1
fi

# Apply migrations
SUCCESS_COUNT=0
FAIL_COUNT=0

for file in "$MIGRATIONS_PATH"/*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo -n "Applying: $filename "
        
        if $PSQL_CMD -d "$DATABASE_NAME" -f "$file" &> /dev/null; then
            print_success "OK"
            ((SUCCESS_COUNT++))
        else
            print_error "FAILED"
            ((FAIL_COUNT++))
        fi
    fi
done

echo ""
print_info "Migrations completed: $SUCCESS_COUNT succeeded, $FAIL_COUNT failed"
echo ""

# Apply seeds if not skipped
if [ "$SKIP_SEEDS" = false ]; then
    print_info "Starting seed process..."
    echo ""
    
    SEEDS_PATH="$SCRIPT_DIR/seeds"
    
    if [ ! -d "$SEEDS_PATH" ]; then
        print_warning "Seeds directory not found: $SEEDS_PATH"
    else
        SEED_SUCCESS_COUNT=0
        SEED_FAIL_COUNT=0
        
        for file in "$SEEDS_PATH"/*.sql; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                echo -n "Applying: $filename "
                
                if $PSQL_CMD -d "$DATABASE_NAME" -f "$file" &> /dev/null; then
                    print_success "OK"
                    ((SEED_SUCCESS_COUNT++))
                else
                    print_error "FAILED"
                    ((SEED_FAIL_COUNT++))
                fi
            fi
        done
        
        echo ""
        print_info "Seeds completed: $SEED_SUCCESS_COUNT succeeded, $SEED_FAIL_COUNT failed"
        echo ""
    fi
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Migration Summary                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -n "Database: "
echo -e "${CYAN}$DATABASE_NAME${NC}"
echo -n "Migrations: "
echo -e "${GREEN}$SUCCESS_COUNT succeeded${NC} / ${RED}$FAIL_COUNT failed${NC}"

if [ "$SKIP_SEEDS" = false ]; then
    echo -n "Seeds: "
    echo -e "${GREEN}$SEED_SUCCESS_COUNT succeeded${NC} / ${RED}$SEED_FAIL_COUNT failed${NC}"
fi

echo ""

if [ $FAIL_COUNT -eq 0 ] && ([ "$SKIP_SEEDS" = true ] || [ $SEED_FAIL_COUNT -eq 0 ]); then
    print_success "All operations completed successfully!"
    echo ""
    print_info "Test users created (password: Test123!@#):"
    echo -e "  ${YELLOW}• admin@photomatrix.ru (Администратор)${NC}"
    echo -e "  ${YELLOW}• hr@photomatrix.ru (HR Менеджер)${NC}"
    echo -e "  ${YELLOW}• manager@photomatrix.ru (Руководитель департамента)${NC}"
    echo -e "  ${YELLOW}• photographer@photomatrix.ru (Фотограф)${NC}"
    echo -e "  ${YELLOW}• sales@photomatrix.ru (Менеджер по продажам)${NC}"
    echo ""
    print_info "Connect to database:"
    echo -e "  ${CYAN}psql -U $POSTGRES_USER -d $DATABASE_NAME${NC}"
    echo ""
    exit 0
else
    print_error "Some operations failed. Please check the errors above."
    echo ""
    exit 1
fi
