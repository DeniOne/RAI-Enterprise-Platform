-- Hardened Ledger Integrity Migration (V6.1 - EXTREME BANKING GRADE)
-- 20260217000000_hardened_ledger_integrity

-- Safely create role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rai_app') THEN
    CREATE ROLE rai_app WITH LOGIN PASSWORD 'dev_password';
  END IF;
END
$$;

-- 0. Infrastructure
-- 0. Infrastructure
CREATE EXTENSION IF NOT EXISTS dblink;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantMode') THEN
        CREATE TYPE "TenantMode" AS ENUM ('ACTIVE', 'READ_ONLY', 'HALTED');
    END IF;
END $$;

-- 1. Precision & Scale Registry
CREATE TABLE IF NOT EXISTS "currency_precisions" (
    "currency" TEXT PRIMARY KEY,
    "scale" INTEGER NOT NULL DEFAULT 4,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "currency_precisions" ("currency", "scale") 
VALUES ('RUB', 2), ('USD', 2), ('EUR', 2), ('KZT', 2), ('BYN', 2)
ON CONFLICT ("currency") DO NOTHING;

-- 2. Panic Executor Security Model
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'panic_executor') THEN
        CREATE ROLE panic_executor WITH NOLOGIN;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "tenant_states" (
    "companyId" TEXT NOT NULL,
    "mode" "TenantMode" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_states_pkey" PRIMARY KEY ("companyId")
);

ALTER TABLE "tenant_states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_states" FORCE ROW LEVEL SECURITY;

-- Standard isolation
DROP POLICY IF EXISTS tenant_states_isolation_policy ON "tenant_states";
CREATE POLICY tenant_states_isolation_policy ON "tenant_states"
    FOR ALL
    USING ("companyId" = current_setting('app.current_company_id')); -- STRICT: Error if missing

-- Panic bypass
DROP POLICY IF EXISTS panic_executor_bypass ON "tenant_states";
CREATE POLICY panic_executor_bypass ON "tenant_states"
    FOR ALL
    TO panic_executor
    USING (true)
    WITH CHECK (true);

GRANT INSERT, UPDATE ON "tenant_states" TO panic_executor;

-- 3. Schema Enforcement
ALTER TABLE "economic_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economic_events" FORCE ROW LEVEL SECURITY;
ALTER TABLE "economic_events" DROP COLUMN IF EXISTS "amount"; -- Removed from schema, handle DB cleanup
ALTER TABLE "ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger_entries" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "economic_events";
CREATE POLICY tenant_isolation_policy ON "economic_events"
    FOR ALL
    USING ("companyId" = current_setting('app.current_company_id'))
    WITH CHECK ("companyId" = current_setting('app.current_company_id'));

DROP POLICY IF EXISTS tenant_isolation_policy ON "ledger_entries";
CREATE POLICY tenant_isolation_policy ON "ledger_entries"
    FOR ALL
    USING ("companyId" = current_setting('app.current_company_id'))
    WITH CHECK ("companyId" = current_setting('app.current_company_id'));

-- 4. Monotonic Sequence (Strict Enforcement)
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "sequenceNumber" INTEGER NOT NULL; -- NO DEFAULT
CREATE UNIQUE INDEX IF NOT EXISTS "ledger_entries_company_event_sequence_idx" ON "ledger_entries"("companyId", "economicEventId", "sequenceNumber");

-- 5. Security Definer Wrapper for Ledger Entries
CREATE OR REPLACE FUNCTION create_ledger_entry_v1(
    p_companyId TEXT,
    p_eventId TEXT,
    p_seqNum INTEGER,
    p_amount DECIMAL,
    p_type TEXT,
    p_accountCode TEXT,
    p_executionId TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO "ledger_entries" (
        "id", "companyId", "economicEventId", "sequenceNumber", "amount", "type", "accountCode", "executionId", "isImmutable", "updatedAt"
    ) VALUES (
        gen_random_uuid()::text, p_companyId, p_eventId, p_seqNum, p_amount, p_type, p_accountCode, p_executionId, true, NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION create_ledger_entry_v1 FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_ledger_entry_v1 TO rai_app;

-- 6. State Guard (Strict)
CREATE OR REPLACE FUNCTION check_tenant_state_hardened_v6()
RETURNS TRIGGER AS $$
DECLARE
    v_mode "TenantMode";
BEGIN
    SELECT mode INTO v_mode FROM "tenant_states" WHERE "companyId" = NEW."companyId";
    
    IF v_mode IS NULL THEN
        RAISE EXCEPTION 'UNKNOWN_TENANT_STATE: Company % state entry missing.', NEW."companyId"
        USING ERRCODE = 'P0005';
    END IF;

    IF v_mode = 'HALTED' THEN
        RAISE EXCEPTION 'HALTED_STATE: Company % restricted.', NEW."companyId"
        USING ERRCODE = 'P0003';
    END IF;

    IF v_mode = 'READ_ONLY' AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        RAISE EXCEPTION 'READ_ONLY_STATE: Company % in RO mode.', NEW."companyId"
        USING ERRCODE = 'P0004';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. The Kernel (Deferred Balancing + Autonomous Panic)
CREATE OR REPLACE FUNCTION validate_double_entry_deferred_v6()
RETURNS TRIGGER AS $$
DECLARE
    v_sum         decimal;
    v_debit_cnt   integer;
    v_credit_cnt  integer;
    v_event_id    text;
    v_company_id  text;
    v_dblink_conn text;
BEGIN
    v_event_id   := CASE WHEN TG_OP = 'DELETE' THEN OLD."economicEventId" ELSE NEW."economicEventId" END;
    v_company_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."companyId" ELSE NEW."companyId" END;

    IF v_event_id IS NULL OR v_company_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- INJECTION 1: 64-BIT EXTENDED ADVISORY LOCK
    PERFORM pg_advisory_xact_lock(hashtextextended(v_event_id, 0), hashtextextended(v_company_id, 0));

    SELECT
        COALESCE(SUM(CASE WHEN "type" = 'DEBIT' THEN amount ELSE -amount END), 0),
        COUNT(*) FILTER (WHERE "type" = 'DEBIT'),
        COUNT(*) FILTER (WHERE "type" = 'CREDIT')
    INTO v_sum, v_debit_cnt, v_credit_cnt
    FROM "ledger_entries"
    WHERE "economicEventId" = v_event_id;

    IF (v_debit_cnt > 0 OR v_credit_cnt > 0) AND (v_debit_cnt = 0 OR v_credit_cnt = 0 OR v_sum <> 0) THEN
        
        -- INJECTION 2: AUTONOMOUS PANIC ROLE + TIMEOUT
        BEGIN
            v_dblink_conn := 'dbname=' || current_database() || ' user=panic_executor';
            
            -- INJECTION 7: STATEMENT TIMEOUT
            PERFORM dblink_connect('panic_conn', v_dblink_conn);
            PERFORM dblink_exec('panic_conn', 'SET LOCAL statement_timeout = ''3s''');
            
            PERFORM dblink_exec('panic_conn', 
                format('INSERT INTO tenant_states ("companyId", mode, "updatedAt") 
                        VALUES (%L, ''READ_ONLY'', NOW()) 
                        ON CONFLICT ("companyId") DO UPDATE SET mode = ''READ_ONLY'', "updatedAt" = NOW()', 
                v_company_id));
            -- Disconnect moved to guarantee execution
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Autonomous panic persistence failed: %', SQLERRM;
        END;
        
        -- INJECTION 5: GUARANTEED DISCONNECT
        IF 'panic_conn' = ANY(dblink_get_connections()) THEN
            PERFORM dblink_disconnect('panic_conn');
        END IF;

        IF v_debit_cnt = 0 OR v_credit_cnt = 0 THEN
            RAISE EXCEPTION 'INCOMPLETE_ENTRY: Event % missing symmetry.', v_event_id
            USING ERRCODE = 'P0002';
        ELSE
            RAISE EXCEPTION 'IMBALANCED_ENTRY: Event % out of balance (%).', v_event_id, v_sum
            USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Re-attach triggers
DROP TRIGGER IF EXISTS trg_ledger_entries_double_entry ON "ledger_entries";
CREATE CONSTRAINT TRIGGER trg_ledger_entries_double_entry
AFTER INSERT OR UPDATE OR DELETE ON "ledger_entries"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_double_entry_deferred_v6();

-- 8. Currency Integrity (ISO 4217)
ALTER TABLE "economic_events" ADD CONSTRAINT "check_currency_iso" CHECK (currency ~ '^[A-Z]{3}$');
