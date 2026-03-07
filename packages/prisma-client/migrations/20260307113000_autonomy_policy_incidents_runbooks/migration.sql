-- CreateEnum
CREATE TYPE "SystemIncidentStatus" AS ENUM ('OPEN', 'RESOLVED', 'RUNBOOK_EXECUTED');

-- CreateEnum
CREATE TYPE "IncidentRunbookAction" AS ENUM ('REQUIRE_HUMAN_REVIEW', 'ROLLBACK_CHANGE_REQUEST');

-- CreateEnum
CREATE TYPE "IncidentRunbookExecutionStatus" AS ENUM ('EXECUTED', 'FAILED');

-- AlterEnum
ALTER TYPE "SystemIncidentType" ADD VALUE IF NOT EXISTS 'AUTONOMY_QUARANTINE';
ALTER TYPE "SystemIncidentType" ADD VALUE IF NOT EXISTS 'AUTONOMY_TOOL_FIRST';
ALTER TYPE "SystemIncidentType" ADD VALUE IF NOT EXISTS 'POLICY_BLOCKED_CRITICAL_ACTION';
ALTER TYPE "SystemIncidentType" ADD VALUE IF NOT EXISTS 'PROMPT_CHANGE_ROLLBACK';

-- AlterTable
ALTER TABLE "system_incidents"
ADD COLUMN IF NOT EXISTS "status" "SystemIncidentStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE IF NOT EXISTS "incident_runbook_executions" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "action" "IncidentRunbookAction" NOT NULL,
    "status" "IncidentRunbookExecutionStatus" NOT NULL,
    "comment" TEXT,
    "result" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_runbook_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_incidents_companyId_status_idx" ON "system_incidents"("companyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "incident_runbook_executions_incidentId_idx" ON "incident_runbook_executions"("incidentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "incident_runbook_executions_companyId_createdAt_idx" ON "incident_runbook_executions"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "incident_runbook_executions"
ADD CONSTRAINT "incident_runbook_executions_incidentId_fkey"
FOREIGN KEY ("incidentId") REFERENCES "system_incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_runbook_executions"
ADD CONSTRAINT "incident_runbook_executions_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
