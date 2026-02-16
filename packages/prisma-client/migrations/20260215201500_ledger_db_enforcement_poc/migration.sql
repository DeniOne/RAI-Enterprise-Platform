-- Ledger DB-level enforcement (PoC)
-- Scope:
-- 1) Immutability protection for ledger_entries (when isImmutable=true)
-- 2) Idempotency guard for economic_events via metadata.idempotencyKey
-- 3) Basic ledger type constraint

-- 1) Basic type safety
ALTER TABLE ledger_entries
  DROP CONSTRAINT IF EXISTS chk_ledger_entries_type;

ALTER TABLE ledger_entries
  ADD CONSTRAINT chk_ledger_entries_type
  CHECK (type IN ('DEBIT', 'CREDIT'));

-- 2) Immutability trigger for ledger_entries
CREATE OR REPLACE FUNCTION enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."isImmutable" = TRUE THEN
      RAISE EXCEPTION 'Ledger immutability violation: DELETE blocked for entry %', OLD.id
        USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;

  -- TG_OP = UPDATE
  IF OLD."isImmutable" = TRUE THEN
    RAISE EXCEPTION 'Ledger immutability violation: UPDATE blocked for entry %', OLD.id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_ledger_immutability_upd ON ledger_entries;
CREATE TRIGGER trg_enforce_ledger_immutability_upd
BEFORE UPDATE ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION enforce_ledger_immutability();

DROP TRIGGER IF EXISTS trg_enforce_ledger_immutability_del ON ledger_entries;
CREATE TRIGGER trg_enforce_ledger_immutability_del
BEFORE DELETE ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION enforce_ledger_immutability();

-- 3) Idempotency guard (expression unique index)
-- Requires producer to pass metadata.idempotencyKey for replay-safe event writes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_economic_events_company_idempotency_key
ON economic_events ("companyId", (metadata->>'idempotencyKey'))
WHERE metadata ? 'idempotencyKey'
  AND metadata->>'idempotencyKey' IS NOT NULL
  AND metadata->>'idempotencyKey' <> '';

