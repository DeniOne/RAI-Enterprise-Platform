/*
  Warnings:

  - A unique constraint covering the columns `[activeBudgetPlanId]` on the table `harvest_plans` will be added. If there are existing duplicate values, this will fail.
  - Made the column `harvestPlanId` on table `cmr_deviation_reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `crop` on table `tech_maps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fieldId` on table `tech_maps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `harvestPlanId` on table `tech_maps` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DeviationType" AS ENUM ('AGRONOMIC', 'FINANCIAL', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('SEEDS', 'FERTILIZER', 'FUEL', 'LABOR', 'MACHINERY', 'OTHER');

-- AlterEnum
ALTER TYPE "BudgetStatus" ADD VALUE 'LOCKED';

-- AlterTable
ALTER TABLE "cmr_deviation_reviews" ADD COLUMN     "budgetPlanId" TEXT,
ADD COLUMN     "type" "DeviationType" NOT NULL DEFAULT 'AGRONOMIC',
ALTER COLUMN "harvestPlanId" SET NOT NULL;

-- AlterTable
ALTER TABLE "cmr_risks" ADD COLUMN     "budgetPlanId" TEXT;

-- AlterTable
ALTER TABLE "field_observations" ADD COLUMN     "budgetPlanId" TEXT;

-- AlterTable
ALTER TABLE "harvest_plans" ADD COLUMN     "activeBudgetPlanId" TEXT;

-- AlterTable
ALTER TABLE "tech_maps" ALTER COLUMN "crop" SET NOT NULL,
ALTER COLUMN "fieldId" SET NOT NULL,
ALTER COLUMN "harvestPlanId" SET NOT NULL;

-- CreateTable
CREATE TABLE "consulting_budget_plans" (
    "id" TEXT NOT NULL,
    "harvestPlanId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "totalPlannedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalActualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "techMapSnapshotId" TEXT,
    "companyId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_budget_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_budget_items" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "plannedAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consulting_budget_plans_companyId_idx" ON "consulting_budget_plans"("companyId");

-- CreateIndex
CREATE INDEX "consulting_budget_plans_harvestPlanId_idx" ON "consulting_budget_plans"("harvestPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "consulting_budget_plans_harvestPlanId_version_key" ON "consulting_budget_plans"("harvestPlanId", "version");

-- CreateIndex
CREATE INDEX "consulting_budget_items_budgetPlanId_idx" ON "consulting_budget_items"("budgetPlanId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_budgetPlanId_idx" ON "cmr_deviation_reviews"("budgetPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "harvest_plans_activeBudgetPlanId_key" ON "harvest_plans"("activeBudgetPlanId");

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_activeBudgetPlanId_fkey" FOREIGN KEY ("activeBudgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_budget_plans" ADD CONSTRAINT "consulting_budget_plans_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_budget_plans" ADD CONSTRAINT "consulting_budget_plans_techMapSnapshotId_fkey" FOREIGN KEY ("techMapSnapshotId") REFERENCES "tech_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_budget_plans" ADD CONSTRAINT "consulting_budget_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_budget_plans" ADD CONSTRAINT "consulting_budget_plans_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_budget_items" ADD CONSTRAINT "consulting_budget_items_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
