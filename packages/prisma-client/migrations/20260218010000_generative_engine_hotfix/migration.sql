-- Hotfix: GenerationRecord — canonicalHash @unique, seed → String, engineVersion
-- Decision-ID: LEVEL-B-GEN-001
-- Audit Fix: USER critical review

-- 1. Rename hash → canonicalHash
ALTER TABLE "generation_records" RENAME COLUMN "hash" TO "canonicalHash";

-- 2. Add @unique constraint on canonicalHash
DROP INDEX IF EXISTS "generation_records_hash_idx";
CREATE UNIQUE INDEX "generation_records_canonicalHash_key" ON "generation_records"("canonicalHash");
CREATE INDEX "generation_records_canonicalHash_idx" ON "generation_records"("canonicalHash");

-- 3. Change seed from Int to String
ALTER TABLE "generation_records" ALTER COLUMN "seed" TYPE TEXT USING "seed"::TEXT;

-- 4. Add engineVersion column
ALTER TABLE "generation_records" ADD COLUMN IF NOT EXISTS "engineVersion" TEXT NOT NULL DEFAULT '1.0.0';
