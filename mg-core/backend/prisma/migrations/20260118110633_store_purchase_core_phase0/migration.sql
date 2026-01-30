/*
  Warnings:

  - You are about to drop the column `created_at` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the column `price_paid` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `purchases` table. All the data in the column will be lost.
  - The `status` column on the `purchases` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,idempotencyKey]` on the table `purchases` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceMC` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `purchases` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('COMPLETED', 'PENDING_APPROVAL', 'REJECTED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QualityCheckType" AS ENUM ('VISUAL', 'MEASUREMENT', 'FUNCTIONAL');

-- CreateEnum
CREATE TYPE "QualityResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CanonType" AS ENUM ('MC', 'GMC');

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_product_id_fkey";

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_user_id_fkey";

-- AlterTable
ALTER TABLE "purchases" DROP COLUMN "created_at",
DROP COLUMN "price_paid",
DROP COLUMN "product_id",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "itemId" TEXT NOT NULL,
ADD COLUMN     "priceMC" INTEGER NOT NULL,
ADD COLUMN     "transactionId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMC" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER,
    "purchaseLimit" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_production_orders" (
    "id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_ref_id" TEXT,
    "product_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mes_production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_work_orders" (
    "id" TEXT NOT NULL,
    "production_order_id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "sequence_order" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "assigned_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mes_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_quality_checks" (
    "id" TEXT NOT NULL,
    "production_order_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "check_type" "QualityCheckType" NOT NULL,
    "result" "QualityResult" NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,

    CONSTRAINT "mes_quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_defects" (
    "id" TEXT NOT NULL,
    "production_order_id" TEXT NOT NULL,
    "quality_check_id" TEXT,
    "defect_type" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "root_cause" TEXT,
    "requires_rework" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "registered_by_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mes_defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_violations" (
    "id" TEXT NOT NULL,
    "canon" "CanonType" NOT NULL,
    "violation" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economy_audit_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "user_id" TEXT,
    "usage_context_id" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economy_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrixcoin_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_amount" DECIMAL(20,8) NOT NULL,
    "mc_state_json" JSONB NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matrixcoin_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_event_states" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "state_payload" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_event_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economy_governance_flags" (
    "id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "review_level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "flagged_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economy_governance_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mes_production_orders_status_idx" ON "mes_production_orders"("status");

-- CreateIndex
CREATE INDEX "mes_production_orders_source_ref_id_idx" ON "mes_production_orders"("source_ref_id");

-- CreateIndex
CREATE INDEX "mes_work_orders_production_order_id_idx" ON "mes_work_orders"("production_order_id");

-- CreateIndex
CREATE INDEX "mes_work_orders_status_idx" ON "mes_work_orders"("status");

-- CreateIndex
CREATE INDEX "mes_quality_checks_production_order_id_idx" ON "mes_quality_checks"("production_order_id");

-- CreateIndex
CREATE INDEX "mes_defects_production_order_id_idx" ON "mes_defects"("production_order_id");

-- CreateIndex
CREATE INDEX "mes_defects_resolved_idx" ON "mes_defects"("resolved");

-- CreateIndex
CREATE INDEX "canonical_violations_canon_created_at_idx" ON "canonical_violations"("canon", "created_at");

-- CreateIndex
CREATE INDEX "canonical_violations_violation_idx" ON "canonical_violations"("violation");

-- CreateIndex
CREATE UNIQUE INDEX "economy_audit_logs_event_id_key" ON "economy_audit_logs"("event_id");

-- CreateIndex
CREATE INDEX "economy_audit_logs_user_id_idx" ON "economy_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "economy_audit_logs_event_type_idx" ON "economy_audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "economy_audit_logs_usage_context_id_idx" ON "economy_audit_logs"("usage_context_id");

-- CreateIndex
CREATE UNIQUE INDEX "matrixcoin_snapshots_snapshot_id_key" ON "matrixcoin_snapshots"("snapshot_id");

-- CreateIndex
CREATE INDEX "matrixcoin_snapshots_user_id_captured_at_idx" ON "matrixcoin_snapshots"("user_id", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "auction_event_states_event_id_key" ON "auction_event_states"("event_id");

-- CreateIndex
CREATE INDEX "auction_event_states_status_idx" ON "auction_event_states"("status");

-- CreateIndex
CREATE UNIQUE INDEX "economy_governance_flags_flag_id_key" ON "economy_governance_flags"("flag_id");

-- CreateIndex
CREATE INDEX "economy_governance_flags_status_idx" ON "economy_governance_flags"("status");

-- CreateIndex
CREATE INDEX "economy_governance_flags_review_level_idx" ON "economy_governance_flags"("review_level");

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "purchases"("userId");

-- CreateIndex
CREATE INDEX "purchases_itemId_idx" ON "purchases"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_userId_idempotencyKey_key" ON "purchases"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_production_orders" ADD CONSTRAINT "mes_production_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_work_orders" ADD CONSTRAINT "mes_work_orders_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "mes_production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_work_orders" ADD CONSTRAINT "mes_work_orders_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_quality_checks" ADD CONSTRAINT "mes_quality_checks_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "mes_production_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_quality_checks" ADD CONSTRAINT "mes_quality_checks_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "mes_work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_quality_checks" ADD CONSTRAINT "mes_quality_checks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_defects" ADD CONSTRAINT "mes_defects_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "mes_production_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_defects" ADD CONSTRAINT "mes_defects_quality_check_id_fkey" FOREIGN KEY ("quality_check_id") REFERENCES "mes_quality_checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_defects" ADD CONSTRAINT "mes_defects_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
