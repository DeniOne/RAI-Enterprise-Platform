CREATE TYPE "RuntimeGovernanceEventType" AS ENUM (
  'FALLBACK_USED',
  'BUDGET_DEGRADED',
  'BUDGET_DENIED',
  'POLICY_BLOCKED',
  'PENDING_ACTION_CREATED',
  'NEEDS_MORE_DATA',
  'TOOL_FAILURE',
  'QUALITY_DRIFT_DETECTED',
  'GOVERNANCE_RECOMMENDATION_EMITTED',
  'QUEUE_SATURATION_DETECTED'
);

CREATE TABLE "runtime_governance_events" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "traceId" TEXT,
  "agentRole" TEXT,
  "toolName" TEXT,
  "eventType" "RuntimeGovernanceEventType" NOT NULL,
  "fallbackReason" TEXT,
  "fallbackMode" TEXT,
  "recommendationType" TEXT,
  "value" DOUBLE PRECISION,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "runtime_governance_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "runtime_governance_events_companyId_idx"
ON "runtime_governance_events"("companyId");

CREATE INDEX "runtime_governance_events_companyId_eventType_createdAt_idx"
ON "runtime_governance_events"("companyId", "eventType", "createdAt");

CREATE INDEX "runtime_governance_events_companyId_agentRole_createdAt_idx"
ON "runtime_governance_events"("companyId", "agentRole", "createdAt");

CREATE INDEX "runtime_governance_events_traceId_idx"
ON "runtime_governance_events"("traceId");

ALTER TABLE "runtime_governance_events"
ADD CONSTRAINT "runtime_governance_events_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
