-- =========================================================================================================
-- REGISTRY GUARDRAILS MIGRATION
-- =========================================================================================================
-- Purpose: Enforce strict architectural limitations (NO DELETE, IMMUTABLE CODE)
-- Scope:   Schemas `registry`, `security`, `legal`
-- Roles:   registry_owner, registry_writer, registry_reader
-- =========================================================================================================

DO $$ 
BEGIN
    -- 1. SAFE ROLE CREATION
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'registry_owner') THEN
        CREATE ROLE registry_owner WITH NOLOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'registry_writer') THEN
        CREATE ROLE registry_writer WITH NOINHERIT NOLOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'registry_reader') THEN
        CREATE ROLE registry_reader WITH NOINHERIT NOLOGIN;
    END IF;
END $$;

-- 2. SCHEMA OWNERSHIP & PERMISSIONS
ALTER SCHEMA registry OWNER TO registry_owner;
ALTER SCHEMA security OWNER TO registry_owner;
ALTER SCHEMA legal OWNER TO registry_owner;

GRANT USAGE ON SCHEMA registry, security, legal TO registry_writer, registry_reader;

-- 3. GUARDRAIL FUNCTIONS
CREATE OR REPLACE FUNCTION registry.forbid_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'DELETION FORBIDDEN: Foundation entities are append-only. Archive them instead. Table: %', TG_TABLE_NAME;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION registry.forbid_code_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS DISTINCT FROM OLD.code THEN
        RAISE EXCEPTION 'IMMUTABILITY VIOLATION: The "code" field is system identity and cannot be changed. Table: %', TG_TABLE_NAME;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION registry.forbid_delete() OWNER TO registry_owner;
ALTER FUNCTION registry.forbid_code_update() OWNER TO registry_owner;

-- 4. APPLY TRIGGERS (DYNAMICALLY)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('registry', 'security', 'legal') 
          AND table_type = 'BASE TABLE'
    LOOP
        -- Drop existing triggers to avoid duplication errors on re-run
        EXECUTE format('DROP TRIGGER IF EXISTS trg_forbid_delete ON %I.%I', tbl.table_schema, tbl.table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_forbid_code_update ON %I.%I', tbl.table_schema, tbl.table_name);
        
        -- Apply DELETE guardrail
        EXECUTE format('
            CREATE TRIGGER trg_forbid_delete
            BEFORE DELETE ON %I.%I
            FOR EACH ROW EXECUTE FUNCTION registry.forbid_delete()', 
            tbl.table_schema, tbl.table_name);
            
        -- Apply UPDATE guardrail (code immutability)
        EXECUTE format('
            CREATE TRIGGER trg_forbid_code_update
            BEFORE UPDATE ON %I.%I
            FOR EACH ROW EXECUTE FUNCTION registry.forbid_code_update()', 
            tbl.table_schema, tbl.table_name);
            
    END LOOP;
END $$;

-- 5. DEFAULT PRIVILEGES (FUTURE TABLES)
-- Note: executed as current user (likely postgres), granting to roles
ALTER DEFAULT PRIVILEGES IN SCHEMA registry, security, legal GRANT SELECT ON TABLES TO registry_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA registry, security, legal GRANT SELECT, INSERT, UPDATE ON TABLES TO registry_writer;

-- 6. GRANT EXISTING TABLES
GRANT SELECT ON ALL TABLES IN SCHEMA registry, security, legal TO registry_reader;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA registry, security, legal TO registry_writer;

-- Explicitly revoke DELETE from everyone (defense in depth)
REVOKE DELETE ON ALL TABLES IN SCHEMA registry, security, legal FROM PUBLIC, registry_writer, registry_reader, registry_owner;
