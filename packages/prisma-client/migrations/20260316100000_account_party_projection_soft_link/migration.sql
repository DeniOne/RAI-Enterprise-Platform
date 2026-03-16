ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "partyId" TEXT;

CREATE INDEX IF NOT EXISTS "accounts_companyId_partyId_idx"
ON "accounts"("companyId", "partyId");
