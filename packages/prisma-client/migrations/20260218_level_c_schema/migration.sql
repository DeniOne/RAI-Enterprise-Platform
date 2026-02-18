-- Level C: Contradiction-Resilient Intelligence (I29–I33)
-- Decision-ID: LEVEL-C-GEN-001

-- =============================================
-- 1. GovernanceConfig — Append-Only конфиг весов DIS
-- =============================================
CREATE TABLE "governance_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "governance_configs_versionId_key" ON "governance_configs"("versionId");
CREATE INDEX "governance_configs_companyId_idx" ON "governance_configs"("companyId");

-- FK: company
ALTER TABLE "governance_configs"
    ADD CONSTRAINT "governance_configs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================
-- 2. DivergenceRecord — Иммутабельный лог расхождений
-- =============================================
CREATE TABLE "divergence_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "draftVersion" INTEGER NOT NULL,
    "disVersion" TEXT NOT NULL,
    "weightsSnapshot" JSONB NOT NULL,
    "disScore" DOUBLE PRECISION NOT NULL,
    "simulationHash" TEXT NOT NULL,
    "deltaRisk" DOUBLE PRECISION NOT NULL,
    "conflictVector" JSONB NOT NULL,
    "humanAction" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "simulationMode" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "policyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "divergence_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "divergence_records_idempotencyKey_key" ON "divergence_records"("idempotencyKey");
CREATE UNIQUE INDEX "divergence_records_draftId_draftVersion_key" ON "divergence_records"("draftId", "draftVersion");
CREATE INDEX "divergence_records_companyId_idx" ON "divergence_records"("companyId");
CREATE INDEX "divergence_records_createdAt_idx" ON "divergence_records"("createdAt");

-- FK: company
ALTER TABLE "divergence_records"
    ADD CONSTRAINT "divergence_records_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK: governanceConfig (через versionId)
ALTER TABLE "divergence_records"
    ADD CONSTRAINT "divergence_records_disVersion_fkey"
    FOREIGN KEY ("disVersion") REFERENCES "governance_configs"("versionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================
-- 3. Append-Only Triggers (I31)
-- =============================================

-- Триггер: запрет UPDATE/DELETE для governance_configs
CREATE OR REPLACE FUNCTION trg_governance_config_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '[I31] governance_configs is append-only. UPDATE/DELETE запрещён. versionId=%', OLD."versionId";
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_governance_config_no_mutate
    BEFORE UPDATE OR DELETE ON "governance_configs"
    FOR EACH ROW EXECUTE FUNCTION trg_governance_config_immutable();

-- Триггер: запрет UPDATE/DELETE для divergence_records
CREATE OR REPLACE FUNCTION trg_divergence_record_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '[I31] divergence_records is append-only. UPDATE/DELETE запрещён. id=%', OLD."id";
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_divergence_record_no_mutate
    BEFORE UPDATE OR DELETE ON "divergence_records"
    FOR EACH ROW EXECUTE FUNCTION trg_divergence_record_immutable();
