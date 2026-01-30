-- Migration: 20250121000001_init_extensions
-- Description: Initialize PostgreSQL extensions and basic setup
-- Author: MatrixGin Development Team
-- Date: 2025-01-21

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "ltree" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;

-- Comments
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions';
COMMENT ON EXTENSION "ltree" IS 'Hierarchical tree-like structures';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for full-text search';

COMMIT;
