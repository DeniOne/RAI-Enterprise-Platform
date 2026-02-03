/*
  Warnings:

  - You are about to drop the `crops` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `companyId` to the `fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `seasons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rapeseedId` to the `seasons` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RapeseedType" AS ENUM ('WINTER', 'SPRING');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'TERMINATED');

-- AlterEnum
ALTER TYPE "SeasonStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "seasons" DROP CONSTRAINT "seasons_cropId_fkey";

-- DropIndex
DROP INDEX "seasons_cropId_idx";

-- DropIndex
DROP INDEX "seasons_fieldId_idx";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "holdingId" TEXT;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "actualYield" DOUBLE PRECISION,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "currentStageId" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "expectedYield" DOUBLE PRECISION,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "rapeseedId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "cropId" DROP NOT NULL;

-- DropTable
DROP TABLE "crops";

-- DropEnum
DROP TYPE "CropType";

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapeseeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "reproduction" TEXT,
    "type" "RapeseedType" NOT NULL,
    "oilContent" DOUBLE PRECISION,
    "erucicAcid" DOUBLE PRECISION,
    "glucosinolates" DOUBLE PRECISION,
    "vegetationPeriod" INTEGER NOT NULL,
    "sowingNormMin" DOUBLE PRECISION,
    "sowingNormMax" DOUBLE PRECISION,
    "sowingDepthMin" DOUBLE PRECISION,
    "sowingDepthMax" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapeseeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapeseed_history" (
    "id" TEXT NOT NULL,
    "rapeseedId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapeseed_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_snapshots" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "SeasonStatus" NOT NULL,
    "fieldId" TEXT NOT NULL,
    "rapeseedId" TEXT NOT NULL,
    "expectedYield" DOUBLE PRECISION,
    "actualYield" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "snapshotData" JSONB NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_failures" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_stage_progress" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "season_stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_history" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "params" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'ERROR',
    "companyId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "holdingId" TEXT,
    "clientId" TEXT,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rapeseeds_companyId_idx" ON "rapeseeds"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "rapeseeds_name_companyId_version_key" ON "rapeseeds"("name", "companyId", "version");

-- CreateIndex
CREATE INDEX "rapeseed_history_rapeseedId_version_idx" ON "rapeseed_history"("rapeseedId", "version");

-- CreateIndex
CREATE INDEX "season_snapshots_seasonId_idx" ON "season_snapshots"("seasonId");

-- CreateIndex
CREATE INDEX "season_snapshots_companyId_idx" ON "season_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "season_snapshots_createdAt_idx" ON "season_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "season_snapshots_seasonId_createdAt_idx" ON "season_snapshots"("seasonId", "createdAt");

-- CreateIndex
CREATE INDEX "season_snapshots_companyId_year_idx" ON "season_snapshots"("companyId", "year");

-- CreateIndex
CREATE INDEX "season_snapshots_rapeseedId_year_idx" ON "season_snapshots"("rapeseedId", "year");

-- CreateIndex
CREATE INDEX "season_stage_progress_seasonId_idx" ON "season_stage_progress"("seasonId");

-- CreateIndex
CREATE INDEX "season_stage_progress_stageId_idx" ON "season_stage_progress"("stageId");

-- CreateIndex
CREATE INDEX "season_history_seasonId_idx" ON "season_history"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "business_rules_code_companyId_version_key" ON "business_rules"("code", "companyId", "version");

-- CreateIndex
CREATE INDEX "employee_profiles_companyId_idx" ON "employee_profiles"("companyId");

-- CreateIndex
CREATE INDEX "employee_profiles_roleId_idx" ON "employee_profiles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_definitions_name_companyId_key" ON "role_definitions"("name", "companyId");

-- CreateIndex
CREATE INDEX "fields_companyId_idx" ON "fields"("companyId");

-- CreateIndex
CREATE INDEX "seasons_id_companyId_idx" ON "seasons"("id", "companyId");

-- CreateIndex
CREATE INDEX "seasons_fieldId_year_idx" ON "seasons"("fieldId", "year");

-- CreateIndex
CREATE INDEX "seasons_companyId_year_idx" ON "seasons"("companyId", "year");

-- CreateIndex
CREATE INDEX "seasons_companyId_status_idx" ON "seasons"("companyId", "status");

-- CreateIndex
CREATE INDEX "seasons_status_companyId_idx" ON "seasons"("status", "companyId");

-- CreateIndex
CREATE INDEX "seasons_rapeseedId_companyId_idx" ON "seasons"("rapeseedId", "companyId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "holdings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapeseed_history" ADD CONSTRAINT "rapeseed_history_rapeseedId_fkey" FOREIGN KEY ("rapeseedId") REFERENCES "rapeseeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_rapeseedId_fkey" FOREIGN KEY ("rapeseedId") REFERENCES "rapeseeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_snapshots" ADD CONSTRAINT "season_snapshots_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_stage_progress" ADD CONSTRAINT "season_stage_progress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_history" ADD CONSTRAINT "season_history_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_definitions" ADD CONSTRAINT "role_definitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
