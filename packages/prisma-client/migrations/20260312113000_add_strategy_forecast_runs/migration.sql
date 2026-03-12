CREATE TABLE "strategy_forecast_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "scopeLevel" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "horizonDays" INTEGER NOT NULL,
    "farmId" TEXT,
    "fieldId" TEXT,
    "crop" TEXT,
    "domainsJson" JSONB NOT NULL DEFAULT '[]',
    "requestJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "degraded" BOOLEAN NOT NULL DEFAULT false,
    "riskTier" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_forecast_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "strategy_forecast_runs_companyId_idx" ON "strategy_forecast_runs"("companyId");
CREATE INDEX "strategy_forecast_runs_companyId_seasonId_idx" ON "strategy_forecast_runs"("companyId", "seasonId");
CREATE INDEX "strategy_forecast_runs_companyId_createdAt_idx" ON "strategy_forecast_runs"("companyId", "createdAt");
CREATE INDEX "strategy_forecast_runs_traceId_idx" ON "strategy_forecast_runs"("traceId");

ALTER TABLE "strategy_forecast_runs"
    ADD CONSTRAINT "strategy_forecast_runs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "strategy_forecast_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "strategy_forecast_runs" FORCE ROW LEVEL SECURITY;

CREATE POLICY "strategy_forecast_runs_company_isolation" ON "strategy_forecast_runs"
    USING ("companyId" = current_setting('app.current_company_id', true))
    WITH CHECK ("companyId" = current_setting('app.current_company_id', true));
