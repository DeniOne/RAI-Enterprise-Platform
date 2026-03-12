CREATE TABLE "strategy_forecast_scenarios" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeLevel" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "horizonDays" INTEGER NOT NULL,
    "farmId" TEXT,
    "fieldId" TEXT,
    "crop" TEXT,
    "domainsJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "leverValuesJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_forecast_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "strategy_forecast_scenarios_companyId_idx" ON "strategy_forecast_scenarios"("companyId");
CREATE INDEX "strategy_forecast_scenarios_companyId_seasonId_idx" ON "strategy_forecast_scenarios"("companyId", "seasonId");
CREATE INDEX "strategy_forecast_scenarios_createdAt_idx" ON "strategy_forecast_scenarios"("createdAt");

ALTER TABLE "strategy_forecast_scenarios"
ADD CONSTRAINT "strategy_forecast_scenarios_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "strategy_forecast_scenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "strategy_forecast_scenarios" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "strategy_forecast_scenarios";
CREATE POLICY tenant_isolation_policy ON "strategy_forecast_scenarios"
    FOR ALL
    USING ("companyId" = current_setting('app.current_company_id', true))
    WITH CHECK ("companyId" = current_setting('app.current_company_id', true));
