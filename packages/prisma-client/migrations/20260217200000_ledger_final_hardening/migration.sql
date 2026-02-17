-- Final Golden Audit: 10/10 Hardening & Localization
-- 20260217200000_ledger_final_hardening

-- 1. Localize State Guard
CREATE OR REPLACE FUNCTION check_tenant_state_hardened_v6()
RETURNS TRIGGER AS $$
DECLARE
    v_mode "TenantMode";
BEGIN
    SELECT mode INTO v_mode FROM "tenant_states" WHERE "companyId" = NEW."companyId";
    
    IF v_mode IS NULL THEN
        RAISE EXCEPTION 'UNKNOWN_TENANT_STATE: Состояние компании % не найдено в реестре.', NEW."companyId"
        USING ERRCODE = 'P0005';
    END IF;

    IF v_mode = 'HALTED' THEN
        RAISE EXCEPTION 'HALTED_STATE: Компания % заблокирована системным администратором.', NEW."companyId"
        USING ERRCODE = 'P0003';
    END IF;

    IF v_mode = 'READ_ONLY' AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        RAISE EXCEPTION 'READ_ONLY_STATE: Компания % находится в режиме "только чтение" (PANIC MODE).', NEW."companyId"
        USING ERRCODE = 'P0004';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Localize Kernel (Deferred Balancing + Autonomous Panic)
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
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Автономная активация паники не удалась: %', SQLERRM;
        END;
        
        -- INJECTION 5: GUARANTEED DISCONNECT
        IF 'panic_conn' = ANY(dblink_get_connections()) THEN
            PERFORM dblink_disconnect('panic_conn');
        END IF;

        IF v_debit_cnt = 0 OR v_credit_cnt = 0 THEN
            RAISE EXCEPTION 'INCOMPLETE_ENTRY: Событие % не имеет симметричного вхождения (Дебет/Кредит отсутствует).', v_event_id
            USING ERRCODE = 'P0002';
        ELSE
            RAISE EXCEPTION 'IMBALANCED_ENTRY: Событие % разбалансировано. Разница: %.', v_event_id, v_sum
            USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Finalization: Sync types and metadata
COMMENT ON TABLE account_balances IS 'Реестр агрегированных балансов по счетам (CoAs). Изоляция на уровне тенанта.';
COMMENT ON COLUMN account_balances.balance IS 'Текущий дебетовый остаток счета. Отрицательное значение означает кредитовый остаток.';
