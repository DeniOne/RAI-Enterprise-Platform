-- Migration: Add Balance Layer (Double-Entry Solvency)
-- 20260217120000_add_balance_layer

-- 1. Create Balances Table (Composite PK)
CREATE TABLE IF NOT EXISTS "account_balances" (
    "companyId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "balance" NUMERIC(20,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_balances_pkey" PRIMARY KEY ("companyId", "accountCode")
);

-- 2. Enable RLS (Standard)
ALTER TABLE "account_balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account_balances" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON "account_balances";
CREATE POLICY tenant_isolation_policy ON "account_balances"
    FOR ALL
    USING ("companyId" = current_setting('app.current_company_id'))
    WITH CHECK ("companyId" = current_setting('app.current_company_id'));

-- 3. Trigger Function: Atomic Balance Update
CREATE OR REPLACE FUNCTION update_account_balance_v1()
RETURNS TRIGGER AS $$
BEGIN
    -- Upsert balance for Debit/Credit logic
    -- DEBIT: +Asset, -Liability, -Equity (Norms vary, but for "balance" we usually track signed value)
    -- RAI Standard: 
    -- Assets (CASH, AR) -> Debit Increases (+)
    -- Liabilities/Equity (AP, CAPITAL) -> Credit Increases (-) -> So Debit decreases it? 
    -- STOP.
    -- Canonical Ledger Balance:
    -- Sum of (DEBIT - CREDIT) for ALL accounts.
    -- Assets usually have Positive balance.
    -- Liabilities usually have Negative balance.
    
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

-- 4. Attach Trigger to Ledger Entries
DROP TRIGGER IF EXISTS trg_ledger_entries_balance_update ON "ledger_entries";
CREATE TRIGGER trg_ledger_entries_balance_update
AFTER INSERT ON "ledger_entries"
FOR EACH ROW
EXECUTE FUNCTION update_account_balance_v1();

-- 5. Solvency Constraint (The "Panic" Switch)
-- Only enforce non-negative balance for CASH accounts.
-- Other accounts (Equity, AP) can go negative (Credit balance).
ALTER TABLE "account_balances" DROP CONSTRAINT IF EXISTS "no_negative_cash";
ALTER TABLE "account_balances"
ADD CONSTRAINT "no_negative_cash"
CHECK (
    "accountCode" NOT LIKE 'CASH%' 
    OR "balance" >= 0
);
