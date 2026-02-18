import { PrismaClient } from './generated-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        console.log('Ensuring pgcrypto extension...');
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        console.log('Ensuring ledger_entries schema compliance...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();`);


        console.log('Updating validate_double_entry_deferred_v6 (fixing advisory lock signature)...');
        await prisma.$executeRawUnsafe(`
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
        `);

        console.log('Updating create_ledger_entry_v1 function...');
        await prisma.$executeRawUnsafe(`
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
        `);
        console.log('Successfully updated function.');
    } catch (e) {
        console.error('Error updating function:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
