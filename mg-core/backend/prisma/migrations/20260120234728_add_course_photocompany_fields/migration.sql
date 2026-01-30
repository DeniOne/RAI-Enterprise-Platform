/*
  Warnings:

  - Added the required column `expected_effect` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scope` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_metric` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TargetMetric" AS ENUM ('OKK', 'CK', 'CONVERSION', 'QUALITY', 'RETOUCH_TIME', 'AVG_CHECK', 'ANOMALIES');

-- CreateEnum
CREATE TYPE "CourseScope" AS ENUM ('PHOTOGRAPHER', 'SALES', 'RETOUCH', 'GENERAL');

-- Step 1: Add columns as NULLABLE first (to handle existing data)
ALTER TABLE "courses" ADD COLUMN "expected_effect" TEXT;
ALTER TABLE "courses" ADD COLUMN "scope" "CourseScope";
ALTER TABLE "courses" ADD COLUMN "target_metric" "TargetMetric";

-- Step 2: Populate existing courses with default values
-- Default strategy: GENERAL scope, OKK metric (most common), generic effect
UPDATE "courses" 
SET 
  "target_metric" = 'OKK',
  "expected_effect" = 'Улучшение общей результативности',
  "scope" = 'GENERAL'
WHERE "target_metric" IS NULL;

-- Step 3: Make columns NOT NULL (now safe because all rows have values)
ALTER TABLE "courses" ALTER COLUMN "expected_effect" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "scope" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "target_metric" SET NOT NULL;

-- CreateTable: QualificationSnapshot (immutable, append-only)
CREATE TABLE "qualification_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "previous_grade" "CourseGrade",
    "new_grade" "CourseGrade" NOT NULL,
    "photocompany_metrics" JSONB NOT NULL,
    "stability_period" INTEGER NOT NULL,
    "proposal_id" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qualification_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qualification_snapshots_user_id_idx" ON "qualification_snapshots"("user_id");

-- CreateIndex
CREATE INDEX "qualification_snapshots_new_grade_idx" ON "qualification_snapshots"("new_grade");

-- CreateIndex
CREATE INDEX "qualification_snapshots_created_at_idx" ON "qualification_snapshots"("created_at");
