import { PrismaClient } from './generated-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        console.log('Ensuring dblink extension...');
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS dblink;`;

        console.log('Ensuring pgcrypto extension...');
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

        console.log('Ensuring ledger_entries schema compliance...');
        await prisma.$executeRaw`ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();`;

        console.log('Ensuring account_balances schema compliance...');
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "account_balances" (
            "companyId" TEXT NOT NULL,
            "accountCode" TEXT NOT NULL,
            "balance" DECIMAL(20, 4) NOT NULL DEFAULT 0,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "account_balances_pkey" PRIMARY KEY ("companyId", "accountCode")
          );
        `;
        await prisma.$executeRaw`
          ALTER TABLE "account_balances"
          ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
        `;

        console.log('Updating check_tenant_state_hardened_v6...');
        await prisma.$executeRaw`
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
        `;

        console.log('Updating validate_double_entry_deferred_v6 (fixing advisory lock signature)...');
        await prisma.$executeRaw`
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
          
              -- INJECTION 1: FIXED LOCK SIGNATURE (int, int)
              PERFORM pg_advisory_xact_lock(hashtext(v_event_id), hashtext(v_company_id));
          
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
        `;

        console.log('Re-attaching deferred double-entry trigger...');
        await prisma.$executeRaw`
          DROP TRIGGER IF EXISTS trg_ledger_entries_double_entry ON "ledger_entries";
        `;
        await prisma.$executeRaw`
          CREATE CONSTRAINT TRIGGER trg_ledger_entries_double_entry
          AFTER INSERT OR UPDATE OR DELETE ON "ledger_entries"
          DEFERRABLE INITIALLY DEFERRED
          FOR EACH ROW
          EXECUTE FUNCTION validate_double_entry_deferred_v6();
        `;

        console.log('Updating balance layer functions and guards...');
        await prisma.$executeRaw`
          CREATE OR REPLACE FUNCTION update_account_balance_v1()
          RETURNS TRIGGER AS $$
          BEGIN
              INSERT INTO "account_balances" ("companyId", "accountCode", "balance", "updatedAt")
              VALUES (
                  NEW."companyId",
                  NEW."accountCode",
                  CASE WHEN NEW."type" = 'DEBIT' THEN NEW."amount" ELSE -NEW."amount" END,
                  NOW()
              )
              ON CONFLICT ("companyId", "accountCode")
              DO UPDATE SET
                  "balance" = "account_balances"."balance" + EXCLUDED."balance",
                  "updatedAt" = NOW();

              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        await prisma.$executeRaw`
          DROP TRIGGER IF EXISTS trg_ledger_entries_balance_update ON "ledger_entries";
        `;
        await prisma.$executeRaw`
          CREATE TRIGGER trg_ledger_entries_balance_update
          AFTER INSERT ON "ledger_entries"
          FOR EACH ROW
          EXECUTE FUNCTION update_account_balance_v1();
        `;
        await prisma.$executeRaw`
          ALTER TABLE "account_balances" DROP CONSTRAINT IF EXISTS "no_negative_cash";
        `;
        await prisma.$executeRaw`
          ALTER TABLE "account_balances"
          ADD CONSTRAINT "no_negative_cash"
          CHECK (
            "accountCode" NOT LIKE 'CASH%'
            OR "balance" >= 0
          );
        `;

        console.log('Updating create_ledger_entry_v1 function...');
        await prisma.$executeRaw`
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
        `;
        console.log('Successfully repaired ledger hardening artifacts.');
    } catch (e) {
        console.error('Error updating function:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
