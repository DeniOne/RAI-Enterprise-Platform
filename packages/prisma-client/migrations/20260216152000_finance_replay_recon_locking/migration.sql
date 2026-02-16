-- Finance ingest replay protection + optimistic locking primitives
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'economic_events'
  ) THEN
    ALTER TABLE "economic_events" ADD COLUMN IF NOT EXISTS "replayKey" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "economic_events_company_id_replay_key_key"
    ON "economic_events"("companyId", "replayKey");
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'consulting_cash_accounts'
  ) THEN
    ALTER TABLE "consulting_cash_accounts" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
  END IF;
END
$$;
