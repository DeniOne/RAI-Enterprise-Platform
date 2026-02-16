#!/bin/bash
# Restore script for PostgreSQL
# Usage: ./restore_db.sh <backup_file>

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Error: No backup file specified."
    echo "Usage: ./restore_db.sh <backup_file>"
    exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-agro_db}"

echo "Starting restore for database '$DB_NAME' from '$BACKUP_FILE'..."
echo "Host: $DB_HOST, Port: $DB_PORT, User: $DB_USER"

# Check if PGPASSWORD is set
if [ -z "$PGPASSWORD" ]; then
    echo "WARNING: PGPASSWORD environment variable is not set."
fi

# Drop and recreate database (WARNING: DESTRUCTIVE ACTION for Dev/Test drills)
echo "WARNING: This will drop and recreate database '$DB_NAME'. Continue? (y/n)"
read -r CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Restore cancelled."
    exit 0
fi

# psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
# psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE \"$DB_NAME\";"

# Restore content
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

echo "Restore completed successfully."
