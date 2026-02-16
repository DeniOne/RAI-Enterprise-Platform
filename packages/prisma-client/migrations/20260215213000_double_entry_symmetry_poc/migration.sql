-- Double-entry symmetry enforcement (PoC)
-- Validates that for each economicEventId:
-- 1) both DEBIT and CREDIT rows exist
-- 2) sum(DEBIT.amount) == sum(CREDIT.amount)
-- Implemented as DEFERRABLE constraint trigger.

CREATE OR REPLACE FUNCTION validate_double_entry_for_event(p_event_id text)
RETURNS void AS $$
DECLARE
  debit_sum  numeric(38, 8);
  credit_sum numeric(38, 8);
  debit_cnt  integer;
  credit_cnt integer;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount::numeric ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount::numeric ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE type = 'DEBIT'),
    COUNT(*) FILTER (WHERE type = 'CREDIT')
  INTO debit_sum, credit_sum, debit_cnt, credit_cnt
  FROM ledger_entries
  WHERE "economicEventId" = p_event_id;

  -- If no entries for the event, skip (e.g. OTHER events without projections)
  IF debit_cnt = 0 AND credit_cnt = 0 THEN
    RETURN;
  END IF;

  IF debit_cnt = 0 OR credit_cnt = 0 THEN
    RAISE EXCEPTION
      'Double-entry violation for economicEventId %: missing debit or credit rows (debit_cnt=%, credit_cnt=%)',
      p_event_id, debit_cnt, credit_cnt
      USING ERRCODE = '23514';
  END IF;

  IF debit_sum <> credit_sum THEN
    RAISE EXCEPTION
      'Double-entry violation for economicEventId %: debit_sum(%) != credit_sum(%)',
      p_event_id, debit_sum, credit_sum
      USING ERRCODE = '23514';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_validate_double_entry_symmetry()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM validate_double_entry_for_event(OLD."economicEventId");
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM validate_double_entry_for_event(NEW."economicEventId");
    IF NEW."economicEventId" IS DISTINCT FROM OLD."economicEventId" THEN
      PERFORM validate_double_entry_for_event(OLD."economicEventId");
    END IF;
    RETURN NEW;
  ELSE
    -- INSERT
    PERFORM validate_double_entry_for_event(NEW."economicEventId");
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_double_entry_symmetry ON ledger_entries;
CREATE CONSTRAINT TRIGGER trg_double_entry_symmetry
AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION trg_validate_double_entry_symmetry();

