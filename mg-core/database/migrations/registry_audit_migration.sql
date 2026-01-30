-- =========================================================================================================
-- REGISTRY AUDIT LOG MIGRATION
-- =========================================================================================================
-- Purpose: Create storage for System Registry Audit events.
-- Scope:   Schema `registry`
-- =========================================================================================================

CREATE TABLE IF NOT EXISTS registry.audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp timestamptz NOT NULL DEFAULT now(),
    actor_id text NOT NULL, -- UUID or 'system'
    operation text NOT NULL, -- CREATE, UPDATE_META, UPDATE_LIFECYCLE
    entity_type text NOT NULL,
    entity_code text NOT NULL,
    field text,
    old_value text,
    new_value text
);

COMMENT ON TABLE registry.audit_log IS 'Immutable audit log for all write operations in System Registry.';

-- Grant permissions (reader can read, writer can insert)
GRANT SELECT ON registry.audit_log TO registry_reader;
GRANT INSERT, SELECT ON registry.audit_log TO registry_writer;

-- Index for searching history of an entity
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON registry.audit_log(entity_type, entity_code);
