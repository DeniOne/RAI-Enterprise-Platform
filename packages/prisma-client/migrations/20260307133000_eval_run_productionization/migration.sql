ALTER TABLE "agent_config_change_requests"
ADD COLUMN "evalRunId" TEXT;

CREATE UNIQUE INDEX "agent_config_change_requests_evalRunId_key"
ON "agent_config_change_requests"("evalRunId");

CREATE TABLE "eval_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "changeRequestId" TEXT,
    "role" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "candidateConfig" JSONB NOT NULL,
    "corpusSummary" JSONB NOT NULL,
    "caseResults" JSONB NOT NULL,
    "verdict" TEXT NOT NULL,
    "verdictBasis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eval_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "eval_runs_companyId_role_createdAt_idx"
ON "eval_runs"("companyId", "role", "createdAt");

CREATE INDEX "eval_runs_changeRequestId_idx"
ON "eval_runs"("changeRequestId");

ALTER TABLE "eval_runs"
ADD CONSTRAINT "eval_runs_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eval_runs"
ADD CONSTRAINT "eval_runs_changeRequestId_fkey"
FOREIGN KEY ("changeRequestId") REFERENCES "agent_config_change_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_config_change_requests"
ADD CONSTRAINT "agent_config_change_requests_evalRunId_fkey"
FOREIGN KEY ("evalRunId") REFERENCES "eval_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
