CREATE TABLE "expert_reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "riskTier" TEXT NOT NULL,
    "requiresHumanDecision" BOOLEAN NOT NULL DEFAULT true,
    "payloadJson" JSONB DEFAULT '{}'::jsonb,
    "outcomeAction" TEXT,
    "outcomeNote" TEXT,
    "createdByUserId" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expert_reviews_companyId_idx" ON "expert_reviews"("companyId");
CREATE INDEX "expert_reviews_traceId_idx" ON "expert_reviews"("traceId");
CREATE INDEX "expert_reviews_entityType_entityId_idx" ON "expert_reviews"("entityType", "entityId");
CREATE INDEX "expert_reviews_status_idx" ON "expert_reviews"("status");

ALTER TABLE "expert_reviews"
ADD CONSTRAINT "expert_reviews_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
