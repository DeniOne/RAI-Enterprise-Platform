-- Audit log append-only enforcement.
-- Scope:
--   1) Block UPDATE/DELETE on audit_logs at DB level.
--   2) Preserve create-only application contract backed by tamper-evident metadata.

CREATE OR REPLACE FUNCTION enforce_audit_log_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    '[I-AUDIT-001] audit_logs is append-only. UPDATE/DELETE forbidden for id=%',
    OLD."id"
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON "audit_logs";
CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION enforce_audit_log_append_only();
