-- CreateEnum
CREATE TYPE "AgentConfigChangeScope" AS ENUM ('GLOBAL', 'TENANT');

-- CreateEnum
CREATE TYPE "AgentConfigChangeStatus" AS ENUM (
    'EVAL_FAILED',
    'READY_FOR_CANARY',
    'CANARY_ACTIVE',
    'APPROVED_FOR_PRODUCTION',
    'PROMOTED',
    'ROLLED_BACK'
);

-- CreateEnum
CREATE TYPE "AgentCanaryStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'PASSED', 'DEGRADED');

-- CreateEnum
CREATE TYPE "AgentRollbackStatus" AS ENUM ('NOT_REQUIRED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "AgentProductionDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ROLLED_BACK');

-- CreateTable
CREATE TABLE IF NOT EXISTS "agent_config_change_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scope" "AgentConfigChangeScope" NOT NULL,
    "targetVersion" TEXT NOT NULL,
    "requestedConfig" JSONB NOT NULL,
    "previousConfig" JSONB,
    "status" "AgentConfigChangeStatus" NOT NULL,
    "evalVerdict" TEXT,
    "evalSummary" JSONB,
    "canaryStatus" "AgentCanaryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "canarySummary" JSONB,
    "rollbackStatus" "AgentRollbackStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "rollbackSummary" JSONB,
    "productionDecision" "AgentProductionDecision" NOT NULL DEFAULT 'PENDING',
    "productionConfigId" TEXT,
    "promotedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_config_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "agent_config_change_company_role_version_unique"
ON "agent_config_change_requests"("companyId", "role", "targetVersion");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "agent_config_change_requests_companyId_role_idx"
ON "agent_config_change_requests"("companyId", "role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "agent_config_change_requests_companyId_status_idx"
ON "agent_config_change_requests"("companyId", "status");

-- AddForeignKey
ALTER TABLE "agent_config_change_requests"
ADD CONSTRAINT "agent_config_change_requests_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
