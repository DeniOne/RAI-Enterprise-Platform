-- Level B: Generative Engine Schema
-- Decision-ID: LEVEL-B-GEN-001
-- Invariants: I15 (Draft Isolation), I16 (Provenance), I18 (Strategy Immutability), I28 (Record Immutability)

-- 1. Add GENERATED_DRAFT to TechMapStatus enum
ALTER TYPE "TechMapStatus" ADD VALUE IF NOT EXISTS 'GENERATED_DRAFT' BEFORE 'DRAFT';

-- 2. Create StrategyStatus enum
DO $$ BEGIN
  CREATE TYPE "StrategyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create AgronomicStrategy table
CREATE TABLE IF NOT EXISTS "agronomic_strategies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "cropId" TEXT NOT NULL,
  "regionId" TEXT,
  "operations" JSONB NOT NULL,
  "constraints" JSONB NOT NULL,
  "status" "StrategyStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "hash" TEXT,
  "publishedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "explainability" JSONB,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "agronomic_strategies_pkey" PRIMARY KEY ("id")
);

-- 4. Create GenerationRecord table (Immutable — I28)
CREATE TABLE IF NOT EXISTS "generation_records" (
  "id" TEXT NOT NULL,
  "inputParams" JSONB NOT NULL,
  "canonicalizedPayload" JSONB NOT NULL,
  "modelId" TEXT NOT NULL DEFAULT 'generative-engine-v1',
  "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
  "seed" INTEGER NOT NULL,
  "hash" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "errorDetails" JSONB,
  "explainability" JSONB,
  "limitationsDisclosed" BOOLEAN NOT NULL DEFAULT true,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "generation_records_pkey" PRIMARY KEY ("id")
);

-- 5. Add generation fields to TechMap
ALTER TABLE "tech_maps" ADD COLUMN IF NOT EXISTS "generationMetadata" JSONB;
ALTER TABLE "tech_maps" ADD COLUMN IF NOT EXISTS "generationRecordId" TEXT;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS "agronomic_strategies_companyId_idx" ON "agronomic_strategies"("companyId");
CREATE INDEX IF NOT EXISTS "agronomic_strategies_cropId_idx" ON "agronomic_strategies"("cropId");
CREATE UNIQUE INDEX IF NOT EXISTS "agronomic_strategies_name_companyId_version_key" ON "agronomic_strategies"("name", "companyId", "version");

CREATE INDEX IF NOT EXISTS "generation_records_companyId_idx" ON "generation_records"("companyId");
CREATE INDEX IF NOT EXISTS "generation_records_hash_idx" ON "generation_records"("hash");
CREATE INDEX IF NOT EXISTS "generation_records_createdAt_idx" ON "generation_records"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "tech_maps_generationRecordId_key" ON "tech_maps"("generationRecordId");

-- 7. Foreign Keys
ALTER TABLE "agronomic_strategies"
  ADD CONSTRAINT "agronomic_strategies_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "generation_records"
  ADD CONSTRAINT "generation_records_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tech_maps"
  ADD CONSTRAINT "tech_maps_generationRecordId_fkey"
  FOREIGN KEY ("generationRecordId") REFERENCES "generation_records"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 8. IMMUTABILITY TRIGGERS
-- ============================================================

-- I28: GenerationRecord is IMMUTABLE after creation
CREATE OR REPLACE FUNCTION prevent_generation_record_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '[I28] GenerationRecord is immutable after creation. UPDATE/DELETE forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generation_record_immutable ON generation_records;
CREATE TRIGGER trg_generation_record_immutable
BEFORE UPDATE OR DELETE ON generation_records
FOR EACH ROW EXECUTE FUNCTION prevent_generation_record_mutation();

-- I18: Published AgronomicStrategy is IMMUTABLE (soft-archive allowed)
CREATE OR REPLACE FUNCTION prevent_published_strategy_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION '[I18] Strategy deletion forbidden. Use soft-archive (status -> ARCHIVED).';
  END IF;

  -- Block if currently PUBLISHED
  IF OLD.status = 'PUBLISHED' THEN
    -- Allow ONLY status transition PUBLISHED -> ARCHIVED (soft-archive)
    IF NEW.status = 'ARCHIVED' AND NEW."archivedAt" IS NOT NULL
       AND NEW.name = OLD.name
       AND NEW.operations::text = OLD.operations::text
       AND NEW.constraints::text = OLD.constraints::text
       AND NEW.hash = OLD.hash
       AND NEW.version = OLD.version THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION '[I18] Published strategy is immutable. Only soft-archive (PUBLISHED -> ARCHIVED) is allowed.';
  END IF;

  -- Block if ARCHIVED
  IF OLD.status = 'ARCHIVED' THEN
    RAISE EXCEPTION '[I18] Archived strategy cannot be modified.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strategy_immutable ON agronomic_strategies;
CREATE TRIGGER trg_strategy_immutable
BEFORE UPDATE OR DELETE ON agronomic_strategies
FOR EACH ROW EXECUTE FUNCTION prevent_published_strategy_mutation();
