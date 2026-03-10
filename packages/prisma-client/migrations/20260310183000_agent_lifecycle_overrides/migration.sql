ALTER TYPE "RuntimeGovernanceEventType"
ADD VALUE IF NOT EXISTS 'LIFECYCLE_OVERRIDE_SET';

ALTER TYPE "RuntimeGovernanceEventType"
ADD VALUE IF NOT EXISTS 'LIFECYCLE_OVERRIDE_CLEARED';

CREATE TABLE "rai_agent_lifecycle_overrides" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "clearedAt" TIMESTAMP(3),
  "clearedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rai_agent_lifecycle_overrides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rai_agent_lifecycle_overrides_companyId_role_isActive_createdAt_idx"
ON "rai_agent_lifecycle_overrides"("companyId", "role", "isActive", "createdAt");

CREATE INDEX "rai_agent_lifecycle_overrides_companyId_state_isActive_createdAt_idx"
ON "rai_agent_lifecycle_overrides"("companyId", "state", "isActive", "createdAt");

ALTER TABLE "rai_agent_lifecycle_overrides"
ADD CONSTRAINT "rai_agent_lifecycle_overrides_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
