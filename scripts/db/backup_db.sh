#!/bin/bash
# Backup script for PostgreSQL
# Usage: ./backup_db.sh [output_dir]

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR=${1:-"./backups"}
mkdir -p "$OUTPUT_DIR"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-agro_db}"

OUTPUT_FILE="$OUTPUT_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "Starting backup for database '$DB_NAME' to '$OUTPUT_FILE'..."
echo "Host: $DB_HOST, Port: $DB_PORT, User: $DB_USER"

# Check if PGPASSWORD is set, if not warn
if [ -z "$PGPASSWORD" ]; then
    echo "WARNING: PGPASSWORD environment variable is not set. You might be prompted for password."
fi

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$OUTPUT_FILE"

echo "Backup completed successfully: $OUTPUT_FILE"
