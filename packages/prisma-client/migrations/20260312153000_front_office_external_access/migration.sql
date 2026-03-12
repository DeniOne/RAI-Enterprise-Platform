-- 20260312153000_front_office_external_access
-- Внешний front-office доступ для представителей контрагентов.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FRONT_OFFICE_USER';

DO $$
BEGIN
    CREATE TYPE "CounterpartyUserBindingStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "username" TEXT,
    ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

ALTER TABLE "invitations"
    ADD COLUMN IF NOT EXISTS "partyId" TEXT,
    ADD COLUMN IF NOT EXISTS "partyContactId" TEXT,
    ADD COLUMN IF NOT EXISTS "proposedLogin" TEXT,
    ADD COLUMN IF NOT EXISTS "contactSnapshotJson" JSONB,
    ADD COLUMN IF NOT EXISTS "metadataJson" JSONB;

CREATE INDEX IF NOT EXISTS "invitations_companyId_partyId_idx" ON "invitations"("companyId", "partyId");
CREATE INDEX IF NOT EXISTS "invitations_companyId_clientId_status_idx" ON "invitations"("companyId", "clientId", "status");

DO $$
BEGIN
    ALTER TABLE "invitations"
        ADD CONSTRAINT "invitations_companyId_partyId_fkey"
        FOREIGN KEY ("companyId", "partyId")
        REFERENCES "commerce_parties"("companyId", "id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "counterparty_user_bindings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "partyId" TEXT,
    "invitationId" TEXT,
    "partyContactId" TEXT,
    "telegramId" TEXT,
    "status" "CounterpartyUserBindingStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "contactSnapshotJson" JSONB,
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counterparty_user_bindings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "counterparty_user_bindings_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "counterparty_user_bindings_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "counterparty_user_bindings_accountId_fkey"
        FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "counterparty_user_bindings_companyId_partyId_fkey"
        FOREIGN KEY ("companyId", "partyId") REFERENCES "commerce_parties"("companyId", "id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "counterparty_user_bindings_invitationId_fkey"
        FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "counterparty_user_binding_unique" ON "counterparty_user_bindings"("companyId", "userId", "accountId");
CREATE INDEX IF NOT EXISTS "counterparty_user_bindings_companyId_accountId_status_idx" ON "counterparty_user_bindings"("companyId", "accountId", "status");
CREATE INDEX IF NOT EXISTS "counterparty_user_bindings_companyId_partyId_status_idx" ON "counterparty_user_bindings"("companyId", "partyId", "status");
CREATE INDEX IF NOT EXISTS "counterparty_user_bindings_companyId_telegramId_idx" ON "counterparty_user_bindings"("companyId", "telegramId");

ALTER TABLE "counterparty_user_bindings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "counterparty_user_bindings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "counterparty_user_bindings";
CREATE POLICY tenant_isolation_policy ON "counterparty_user_bindings"
    FOR ALL
    USING ("companyId" = current_setting('app.current_company_id', true))
    WITH CHECK ("companyId" = current_setting('app.current_company_id', true));
