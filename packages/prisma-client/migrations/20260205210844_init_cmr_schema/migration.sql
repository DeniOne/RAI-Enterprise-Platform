/*
  Warnings:

  - You are about to drop the column `firstName` on the `employee_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `employee_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inn]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `employee_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `employee_profiles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `companyId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('FARMER', 'DEALER', 'HOLDING', 'PARTNER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'QUALIFICATION', 'OFFER', 'CONTRACT', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "TechMapStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('AGRONOMIC', 'CLIMATE', 'OPERATIONAL', 'REGULATORY', 'MARKET');

-- CreateEnum
CREATE TYPE "Controllability" AS ENUM ('CONSULTANT', 'CLIENT', 'SHARED', 'FORCE_MAJEURE');

-- CreateEnum
CREATE TYPE "LiabilityMode" AS ENUM ('CONSULTANT_ONLY', 'CLIENT_ONLY', 'SHARED', 'INSURABLE', 'LIABILITY_SUSPENDED');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('YIELD_LOSS', 'WEATHER_INDEX', 'REGULATORY');

-- CreateEnum
CREATE TYPE "ResponsibilityMode" AS ENUM ('SHARED', 'CLIENT_ONLY', 'CONSULTANT_ONLY', 'LIABILITY_SUSPENDED');

-- CreateEnum
CREATE TYPE "ClientResponseStatus" AS ENUM ('PENDING', 'AGREED', 'DISAGREED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "EconomicEventType" AS ENUM ('COST_INCURRED', 'REVENUE_RECOGNIZED', 'OBLIGATION_CREATED', 'OBLIGATION_SETTLED', 'RESERVE_ALLOCATED', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'ACTIVE', 'EXHAUSTED', 'BLOCKED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "inn" TEXT,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "type" "ClientType" NOT NULL DEFAULT 'FARMER';

-- AlterTable
ALTER TABLE "employee_profiles" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "orgUnitId" TEXT,
ADD COLUMN     "requiredRoleCompetencyRef" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "seasonId" TEXT NOT NULL,
    "operationId" TEXT,
    "fieldId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "plannedDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_resource_actuals" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_resource_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_onboarding_plans" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "stages" JSONB NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_onboarding_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_support_cases" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "hr_support_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'LEAD',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedDate" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_scorecards" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "financialHealth" DOUBLE PRECISION,
    "agroPotential" DOUBLE PRECISION,
    "reliability" DOUBLE PRECISION,
    "ltvPrediction" DOUBLE PRECISION,
    "companyId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contracts" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "clientId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_maps" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "soilType" "SoilType",
    "moisture" DOUBLE PRECISION,
    "precursor" TEXT,
    "status" "TechMapStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_map_stages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "techMapId" TEXT NOT NULL,
    "aplStageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_map_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_map_operations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mapStageId" TEXT NOT NULL,
    "plannedStartTime" TIMESTAMP(3),
    "plannedEndTime" TIMESTAMP(3),
    "durationHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_map_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_map_resources" (
    "id" TEXT NOT NULL,
    "mapOperationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "costPerUnit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tech_map_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmr_deviation_reviews" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "stageId" TEXT,
    "deviationSummary" TEXT NOT NULL,
    "aiImpactAssessment" TEXT NOT NULL,
    "techConclusion" TEXT,
    "proposedActions" TEXT,
    "clientResponseStatus" "ClientResponseStatus" NOT NULL DEFAULT 'PENDING',
    "clientComment" TEXT,
    "clientRespondedAt" TIMESTAMP(3),
    "responsibilityMode" "ResponsibilityMode" NOT NULL DEFAULT 'SHARED',
    "slaExpiration" TIMESTAMP(3),
    "liabilityShiftStatus" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cmr_deviation_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmr_decisions" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "confidenceLevel" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "alternatives" JSONB,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "cmr_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmr_risks" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "type" "RiskType" NOT NULL,
    "description" TEXT NOT NULL,
    "probability" "RiskLevel" NOT NULL,
    "impact" "RiskLevel" NOT NULL,
    "controllability" "Controllability" NOT NULL,
    "liabilityMode" "LiabilityMode" NOT NULL,
    "mitigationPlan" TEXT,
    "deviationReviewId" TEXT,
    "status" TEXT NOT NULL,
    "insuranceId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cmr_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmr_insurance_coverages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "type" "InsuranceType" NOT NULL,
    "status" TEXT NOT NULL,
    "insuredAmount" DOUBLE PRECISION NOT NULL,
    "deductible" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cmr_insurance_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_okr_cycles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "companyId" TEXT NOT NULL,

    CONSTRAINT "hr_okr_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_objectives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "ownerId" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_key_results" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "metricSource" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_key_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_kpi_indicators" (
    "id" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "hr_kpi_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_recognition_events" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_recognition_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_reward_events" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_reward_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_pulse_surveys" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_pulse_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_survey_responses" (
    "id" TEXT NOT NULL,
    "pulseSurveyId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_human_assessment_snapshots" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "burnoutRisk" "RiskLevel" NOT NULL,
    "engagementLevel" DOUBLE PRECISION NOT NULL,
    "ethicalAlignment" DOUBLE PRECISION NOT NULL,
    "controllability" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_human_assessment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_competency_states" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_competency_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_development_plans" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_development_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_development_actions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_development_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_events" (
    "id" TEXT NOT NULL,
    "type" "EconomicEventType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "metadata" JSONB,
    "fieldId" TEXT,
    "seasonId" TEXT,
    "employeeId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "economicEventId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isImmutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "consumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "consumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_seasonId_idx" ON "tasks"("seasonId");

-- CreateIndex
CREATE INDEX "tasks_companyId_idx" ON "tasks"("companyId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "tasks_fieldId_idx" ON "tasks"("fieldId");

-- CreateIndex
CREATE INDEX "task_resource_actuals_taskId_idx" ON "task_resource_actuals"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_onboarding_plans_employeeId_key" ON "hr_onboarding_plans"("employeeId");

-- CreateIndex
CREATE INDEX "crm_deals_companyId_idx" ON "crm_deals"("companyId");

-- CreateIndex
CREATE INDEX "crm_deals_clientId_idx" ON "crm_deals"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "crm_scorecards_clientId_key" ON "crm_scorecards"("clientId");

-- CreateIndex
CREATE INDEX "crm_scorecards_companyId_idx" ON "crm_scorecards"("companyId");

-- CreateIndex
CREATE INDEX "crm_contracts_companyId_idx" ON "crm_contracts"("companyId");

-- CreateIndex
CREATE INDEX "crm_contracts_clientId_idx" ON "crm_contracts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "tech_maps_seasonId_key" ON "tech_maps"("seasonId");

-- CreateIndex
CREATE INDEX "tech_maps_companyId_idx" ON "tech_maps"("companyId");

-- CreateIndex
CREATE INDEX "tech_map_stages_techMapId_idx" ON "tech_map_stages"("techMapId");

-- CreateIndex
CREATE INDEX "tech_map_operations_mapStageId_idx" ON "tech_map_operations"("mapStageId");

-- CreateIndex
CREATE INDEX "tech_map_resources_mapOperationId_idx" ON "tech_map_resources"("mapOperationId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_seasonId_idx" ON "cmr_deviation_reviews"("seasonId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_companyId_idx" ON "cmr_deviation_reviews"("companyId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_status_idx" ON "cmr_deviation_reviews"("status");

-- CreateIndex
CREATE INDEX "cmr_decisions_seasonId_idx" ON "cmr_decisions"("seasonId");

-- CreateIndex
CREATE INDEX "cmr_decisions_userId_idx" ON "cmr_decisions"("userId");

-- CreateIndex
CREATE INDEX "cmr_risks_seasonId_idx" ON "cmr_risks"("seasonId");

-- CreateIndex
CREATE INDEX "cmr_risks_type_idx" ON "cmr_risks"("type");

-- CreateIndex
CREATE INDEX "cmr_insurance_coverages_companyId_idx" ON "cmr_insurance_coverages"("companyId");

-- CreateIndex
CREATE INDEX "hr_survey_responses_pulseSurveyId_idx" ON "hr_survey_responses"("pulseSurveyId");

-- CreateIndex
CREATE INDEX "hr_human_assessment_snapshots_employeeId_idx" ON "hr_human_assessment_snapshots"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_development_plans_employeeId_key" ON "hr_development_plans"("employeeId");

-- CreateIndex
CREATE INDEX "economic_events_companyId_idx" ON "economic_events"("companyId");

-- CreateIndex
CREATE INDEX "economic_events_type_idx" ON "economic_events"("type");

-- CreateIndex
CREATE INDEX "economic_events_seasonId_idx" ON "economic_events"("seasonId");

-- CreateIndex
CREATE INDEX "ledger_entries_companyId_idx" ON "ledger_entries"("companyId");

-- CreateIndex
CREATE INDEX "ledger_entries_accountCode_idx" ON "ledger_entries"("accountCode");

-- CreateIndex
CREATE INDEX "cash_accounts_companyId_idx" ON "cash_accounts"("companyId");

-- CreateIndex
CREATE INDEX "budgets_companyId_idx" ON "budgets"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_inn_key" ON "clients"("inn");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_externalId_key" ON "employee_profiles"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_userId_key" ON "employee_profiles"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "technology_card_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_resource_actuals" ADD CONSTRAINT "task_resource_actuals_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_onboarding_plans" ADD CONSTRAINT "hr_onboarding_plans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_support_cases" ADD CONSTRAINT "hr_support_cases_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_scorecards" ADD CONSTRAINT "crm_scorecards_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_scorecards" ADD CONSTRAINT "crm_scorecards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_map_stages" ADD CONSTRAINT "tech_map_stages_techMapId_fkey" FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_map_operations" ADD CONSTRAINT "tech_map_operations_mapStageId_fkey" FOREIGN KEY ("mapStageId") REFERENCES "tech_map_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_map_resources" ADD CONSTRAINT "tech_map_resources_mapOperationId_fkey" FOREIGN KEY ("mapOperationId") REFERENCES "tech_map_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_decisions" ADD CONSTRAINT "cmr_decisions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_decisions" ADD CONSTRAINT "cmr_decisions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_decisions" ADD CONSTRAINT "cmr_decisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_deviationReviewId_fkey" FOREIGN KEY ("deviationReviewId") REFERENCES "cmr_deviation_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "cmr_insurance_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_insurance_coverages" ADD CONSTRAINT "cmr_insurance_coverages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_okr_cycles" ADD CONSTRAINT "hr_okr_cycles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_objectives" ADD CONSTRAINT "hr_objectives_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "hr_okr_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_objectives" ADD CONSTRAINT "hr_objectives_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_key_results" ADD CONSTRAINT "hr_key_results_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "hr_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kpi_indicators" ADD CONSTRAINT "hr_kpi_indicators_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_recognition_events" ADD CONSTRAINT "hr_recognition_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_reward_events" ADD CONSTRAINT "hr_reward_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_pulse_surveys" ADD CONSTRAINT "hr_pulse_surveys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_survey_responses" ADD CONSTRAINT "hr_survey_responses_pulseSurveyId_fkey" FOREIGN KEY ("pulseSurveyId") REFERENCES "hr_pulse_surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_survey_responses" ADD CONSTRAINT "hr_survey_responses_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_human_assessment_snapshots" ADD CONSTRAINT "hr_human_assessment_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_human_assessment_snapshots" ADD CONSTRAINT "hr_human_assessment_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_competency_states" ADD CONSTRAINT "hr_competency_states_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_development_plans" ADD CONSTRAINT "hr_development_plans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_development_actions" ADD CONSTRAINT "hr_development_actions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "hr_development_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economic_events" ADD CONSTRAINT "economic_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_economicEventId_fkey" FOREIGN KEY ("economicEventId") REFERENCES "economic_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_accounts" ADD CONSTRAINT "cash_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
