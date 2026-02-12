/*
  Warnings:

  - The values [INSPECTION,LETTER,WORKING_GROUP] on the enum `InteractionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETED,OVERDUE,WAIVED] on the enum `ObligationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `cmr_deviation_reviews` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `legal_obligations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `clientId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fieldId,crop,seasonId,companyId,version]` on the table `tech_maps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `harvestPlanId` to the `cmr_deviation_reviews` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `gr_interactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `crop` to the `tech_maps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fieldId` to the `tech_maps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `harvestPlanId` to the `tech_maps` table without a default value. This is not possible if the table is not empty.

*/

-- Phase 1: Clear Dependencies
-- We drop columns that use the soon-to-be-dropped types to satisfy Postgres dependency checks.
ALTER TABLE "cmr_deviation_reviews" DROP COLUMN IF EXISTS "status";
ALTER TABLE "gr_interactions" DROP COLUMN IF EXISTS "type";
ALTER TABLE "legal_obligations" DROP COLUMN IF EXISTS "status";

-- Phase 2: Drop Old Types (CASCADE handles any remaining system-level links)
DROP TYPE IF EXISTS "ReviewStatus" CASCADE;
DROP TYPE IF EXISTS "InteractionType" CASCADE;
DROP TYPE IF EXISTS "ObligationStatus" CASCADE;

-- Phase 3: Create New Types
CREATE TYPE "AccountType" AS ENUM ('CLIENT', 'PARTNER', 'REGULATOR', 'SUPPLIER', 'INVESTOR', 'OTHER');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'RISK');
CREATE TYPE "RiskCategory" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE');
CREATE TYPE "StrategicValue" AS ENUM ('A', 'B', 'C');
CREATE TYPE "ContactRole" AS ENUM ('DECISION_MAKER', 'LEGAL', 'OPERATIONAL');
CREATE TYPE "MachineryType" AS ENUM ('TRACTOR', 'SPRAYER', 'HARVESTER', 'ATTACHMENT', 'TRUCK');
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'REPAIR', 'OFFLINE', 'PENDING_CONFIRMATION', 'REJECTED', 'ARCHIVED');
CREATE TYPE "StockItemType" AS ENUM ('CHEMICAL', 'FERTILIZER', 'SEED', 'FUEL');
CREATE TYPE "StockTransactionType" AS ENUM ('PROCUREMENT', 'CONSUMPTION', 'ADJUSTMENT');
CREATE TYPE "HarvestPlanStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'DONE', 'ARCHIVE');
CREATE TYPE "DeviationStatus" AS ENUM ('DETECTED', 'ANALYZING', 'DECIDED', 'CLOSED');
CREATE TYPE "ObservationType" AS ENUM ('PHOTO', 'GEO_WALK', 'VOICE_NOTE', 'CALL_LOG', 'MEASUREMENT', 'SOS_SIGNAL');
CREATE TYPE "ObservationIntent" AS ENUM ('MONITORING', 'INCIDENT', 'CONSULTATION', 'CALL', 'CONFIRMATION', 'DELAY');
CREATE TYPE "IntegrityStatus" AS ENUM ('STRONG_EVIDENCE', 'WEAK_EVIDENCE', 'NO_EVIDENCE');
CREATE TYPE "LegalObligationStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'WAIVED');
CREATE TYPE "GrInteractionType" AS ENUM ('MEETING', 'INSPECTION', 'LETTER', 'WORKING_GROUP');
CREATE TYPE "RiskSource" AS ENUM ('LEGAL', 'RND', 'OPS', 'FINANCE');
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RiskVerdict" AS ENUM ('ALLOWED', 'CONDITIONAL', 'RESTRICTED', 'BLOCKED');
CREATE TYPE "RiskFsmState" AS ENUM ('CLEAR', 'OBSERVED', 'ELEVATED', 'CRITICAL', 'BLOCKED', 'RESOLVED');
CREATE TYPE "RiskTargetType" AS ENUM ('ACTION', 'TECHNOLOGY', 'CLIENT', 'SEASON');
CREATE TYPE "RiskReferenceType" AS ENUM ('EXPERIMENT', 'REQUIREMENT', 'TASK', 'TRANSACTION');
CREATE TYPE "InteractionType" AS ENUM ('MEETING', 'CORRESPONDENCE', 'CALL', 'DOC_SUBMISSION', 'REQUEST_RESPONSE');
CREATE TYPE "ObligationStatus" AS ENUM ('PENDING', 'FULFILLED', 'BREACHED');

-- Phase 4: Alter Existing Enums
ALTER TYPE "TechMapStatus" ADD VALUE 'REVIEW';
ALTER TYPE "TechMapStatus" ADD VALUE 'APPROVED';
ALTER TYPE "UserRole" ADD VALUE 'CEO';

-- Phase 5: Drop Old Tables and Relations
-- We drop clients last because we need to replace its usage in other tables first or simultaneously.
ALTER TABLE "crm_contracts" DROP CONSTRAINT IF EXISTS "crm_contracts_clientId_fkey";
ALTER TABLE "crm_deals" DROP CONSTRAINT IF EXISTS "crm_deals_clientId_fkey";
ALTER TABLE "crm_scorecards" DROP CONSTRAINT IF EXISTS "crm_scorecards_clientId_fkey";
ALTER TABLE "fields" DROP CONSTRAINT IF EXISTS "fields_clientId_fkey";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_clientId_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_clientId_fkey";
DROP INDEX IF EXISTS "tech_maps_seasonId_key";
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TYPE IF EXISTS "ReviewStatus" CASCADE; -- Redundant just in case

-- Phase 6: Create New Tables
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inn" TEXT,
    "type" "AccountType" NOT NULL DEFAULT 'CLIENT',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "jurisdiction" TEXT,
    "riskCategory" "RiskCategory" NOT NULL DEFAULT 'LOW',
    "strategicValue" "StrategicValue" NOT NULL DEFAULT 'C',
    "companyId" TEXT NOT NULL,
    "holdingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "role" "ContactRole" NOT NULL DEFAULT 'OPERATIONAL',
    "influenceLevel" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_interactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "type" "InteractionType" NOT NULL,
    "summary" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_obligations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "responsibleUserId" TEXT,
    "status" "ObligationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_obligations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "machinery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "serialNumber" TEXT,
    "type" "MachineryType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "idempotencyKey" TEXT,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    CONSTRAINT "machinery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StockItemType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "harvest_plans" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contextSnapshot" JSONB,
    "targetMetric" TEXT,
    "period" TEXT,
    "minValue" DOUBLE PRECISION,
    "optValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "baselineValue" DOUBLE PRECISION,
    "status" "HarvestPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "activeTechMapId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "harvest_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "harvest_performance_contracts" (
    "id" TEXT NOT NULL,
    "harvestPlanId" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "feeRules" JSONB,
    "safetyNetRules" JSONB,
    "settlementStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "harvest_performance_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_observations" (
    "id" TEXT NOT NULL,
    "type" "ObservationType" NOT NULL,
    "intent" "ObservationIntent" NOT NULL DEFAULT 'MONITORING',
    "integrityStatus" "IntegrityStatus" NOT NULL DEFAULT 'NO_EVIDENCE',
    "content" TEXT,
    "photoUrl" TEXT,
    "voiceUrl" TEXT,
    "telemetryJson" JSONB,
    "coordinates" JSONB,
    "taskId" TEXT,
    "fieldId" TEXT,
    "seasonId" TEXT NOT NULL,
    "deviationReviewId" TEXT,
    "authorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "field_observations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_signals" (
    "id" TEXT NOT NULL,
    "source" "RiskSource" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "description" TEXT,
    "referenceType" "RiskReferenceType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "targetType" "RiskTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "verdict" "RiskVerdict" NOT NULL,
    "score" INTEGER,
    "explanation" JSONB NOT NULL,
    "companyId" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_state_history" (
    "id" TEXT NOT NULL,
    "targetType" "RiskTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "fromState" "RiskFsmState" NOT NULL,
    "toState" "RiskFsmState" NOT NULL,
    "reason" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_state_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_records" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "riskVerdict" "RiskVerdict" NOT NULL,
    "riskState" "RiskFsmState" NOT NULL,
    "explanation" JSONB NOT NULL,
    "traceId" TEXT,
    "companyId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decision_records_pkey" PRIMARY KEY ("id")
);

-- Phase 7: Alter Existing Tables (Add columns back with new types)
ALTER TABLE "cmr_deviation_reviews" 
    ADD COLUMN "harvestPlanId" TEXT,
    ADD COLUMN "telegramThreadId" TEXT,
    ADD COLUMN "status" "DeviationStatus" NOT NULL DEFAULT 'DETECTED';

ALTER TABLE "cmr_risks" 
    ADD COLUMN "observationId" TEXT,
    ADD COLUMN "responsibleId" TEXT,
    ADD COLUMN "taskId" TEXT;

ALTER TABLE "gr_interactions" 
    ADD COLUMN "type" "GrInteractionType" NOT NULL;

ALTER TABLE "legal_obligations" 
    ADD COLUMN "status" "LegalObligationStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE "tasks" 
    ADD COLUMN "responsibleId" TEXT,
    ADD COLUMN "slaExpiration" TIMESTAMP(3);

ALTER TABLE "tech_map_operations" 
    ADD COLUMN "requiredMachineryType" "MachineryType";

ALTER TABLE "tech_maps" 
    ADD COLUMN "approvedAt" TIMESTAMP(3),
    ADD COLUMN "crop" TEXT,
    ADD COLUMN "fieldId" TEXT,
    ADD COLUMN "harvestPlanId" TEXT,
    ADD COLUMN "operationsSnapshot" JSONB,
    ADD COLUMN "resourceNormsSnapshot" JSONB;

-- In migrate reset there's no data, so we can NOT NULL these later if needed
-- but for now we keep them nullable if they were added without defaults in some contexts.

ALTER TABLE "users" 
    DROP COLUMN IF EXISTS "clientId",
    ADD COLUMN "accountId" TEXT;

-- Phase 8: Indexes
CREATE UNIQUE INDEX "accounts_inn_key" ON "accounts"("inn");
CREATE INDEX "crm_contacts_accountId_idx" ON "crm_contacts"("accountId");
CREATE INDEX "crm_interactions_accountId_idx" ON "crm_interactions"("accountId");
CREATE INDEX "crm_interactions_contactId_idx" ON "crm_interactions"("contactId");
CREATE INDEX "crm_obligations_accountId_idx" ON "crm_obligations"("accountId");
CREATE INDEX "crm_obligations_status_idx" ON "crm_obligations"("status");
CREATE INDEX "machinery_companyId_idx" ON "machinery"("companyId");
CREATE INDEX "machinery_accountId_idempotencyKey_idx" ON "machinery"("accountId", "idempotencyKey");
CREATE INDEX "stock_items_companyId_idx" ON "stock_items"("companyId");
CREATE INDEX "stock_items_accountId_idempotencyKey_idx" ON "stock_items"("accountId", "idempotencyKey");
CREATE UNIQUE INDEX "harvest_plans_activeTechMapId_key" ON "harvest_plans"("activeTechMapId");
CREATE INDEX "harvest_plans_companyId_idx" ON "harvest_plans"("companyId");
CREATE INDEX "harvest_plans_accountId_idx" ON "harvest_plans"("accountId");
CREATE UNIQUE INDEX "harvest_performance_contracts_harvestPlanId_key" ON "harvest_performance_contracts"("harvestPlanId");
CREATE INDEX "harvest_performance_contracts_companyId_idx" ON "harvest_performance_contracts"("companyId");
CREATE INDEX "risk_signals_companyId_idx" ON "risk_signals"("companyId");
CREATE INDEX "risk_signals_source_idx" ON "risk_signals"("source");
CREATE INDEX "risk_assessments_companyId_idx" ON "risk_assessments"("companyId");
CREATE INDEX "risk_assessments_verdict_idx" ON "risk_assessments"("verdict");
CREATE INDEX "risk_state_history_companyId_idx" ON "risk_state_history"("companyId");
CREATE INDEX "risk_state_history_targetId_idx" ON "risk_state_history"("targetId");
CREATE INDEX "decision_records_companyId_idx" ON "decision_records"("companyId");
CREATE INDEX "decision_records_actionType_idx" ON "decision_records"("actionType");
CREATE INDEX "decision_records_targetId_idx" ON "decision_records"("targetId");
CREATE INDEX "cmr_deviation_reviews_status_idx" ON "cmr_deviation_reviews"("status");
CREATE INDEX "tech_maps_harvestPlanId_idx" ON "tech_maps"("harvestPlanId");
CREATE UNIQUE INDEX "tech_maps_fieldId_crop_seasonId_companyId_version_key" ON "tech_maps"("fieldId", "crop", "seasonId", "companyId", "version");
CREATE INDEX "cmr_deviation_reviews_harvestPlanId_idx" ON "cmr_deviation_reviews"("harvestPlanId");

-- Phase 9: Foreign Keys
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "holdings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_obligations" ADD CONSTRAINT "crm_obligations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_obligations" ADD CONSTRAINT "crm_obligations_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fields" ADD CONSTRAINT "fields_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_scorecards" ADD CONSTRAINT "crm_scorecards_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_activeTechMapId_fkey" FOREIGN KEY ("activeTechMapId") REFERENCES "tech_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "harvest_performance_contracts" ADD CONSTRAINT "harvest_performance_contracts_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "harvest_performance_contracts" ADD CONSTRAINT "harvest_performance_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "field_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_deviationReviewId_fkey" FOREIGN KEY ("deviationReviewId") REFERENCES "cmr_deviation_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "risk_state_history" ADD CONSTRAINT "risk_state_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Phase 10: The Production Gate Index
CREATE UNIQUE INDEX "unique_active_techmap" ON "tech_maps" ("fieldId", "crop", "seasonId", "companyId") WHERE "status" = 'ACTIVE';