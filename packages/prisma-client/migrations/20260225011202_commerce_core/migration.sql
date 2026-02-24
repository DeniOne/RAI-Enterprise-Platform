-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'MISSED');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('OPERATING', 'INVESTING', 'FINANCING');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('OPERATIONAL', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('EBITDA_TARGET', 'ROI_TARGET', 'COST_LIMIT', 'YIELD_TARGET');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DRAFT', 'SHADOW', 'CANARY', 'ACTIVE', 'ARCHIVED', 'FAILED', 'QUARANTINED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DriftStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DataSourceType" AS ENUM ('SATELLITE', 'LAB', 'SENSOR', 'USER_INPUT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "GovernanceLockReason" AS ENUM ('DEGRADATION_I34', 'BIO_PRESSURE_I36', 'FORCE_MAJEURE');

-- CreateEnum
CREATE TYPE "OverrideStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "OverrideCategory" AS ENUM ('FINANCIAL_PRESSURE', 'MODEL_DISTRUST', 'EXTREME_WEATHER');

-- CreateEnum
CREATE TYPE "CertAuditStatus" AS ENUM ('SIGNATURE_INTENT', 'SIGNATURE_COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "QuorumStatus" AS ENUM ('COLLECTING', 'MET', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PartyRelationType" AS ENUM ('OWNERSHIP', 'COMMERCIAL', 'AFFILIATION');

-- CreateEnum
CREATE TYPE "CommerceContractStatus" AS ENUM ('DRAFT', 'SIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CommerceContractPartyRoleType" AS ENUM ('SELLER', 'BUYER', 'LESSOR', 'LESSEE', 'AGENT', 'PRINCIPAL', 'PAYER', 'BENEFICIARY');

-- CreateEnum
CREATE TYPE "CommerceObligationType" AS ENUM ('DELIVER', 'PAY', 'PERFORM');

-- CreateEnum
CREATE TYPE "CommerceObligationStatus" AS ENUM ('OPEN', 'PARTIAL', 'FULFILLED');

-- CreateEnum
CREATE TYPE "CommerceEventDomain" AS ENUM ('COMMERCIAL', 'PRODUCTION', 'LOGISTICS', 'FINANCE_ADJ');

-- CreateEnum
CREATE TYPE "CommerceEventType" AS ENUM ('GOODS_SHIPMENT', 'SERVICE_ACT', 'LEASE_USAGE', 'MATERIAL_CONSUMPTION', 'HARVEST', 'INTERNAL_TRANSFER', 'WRITE_OFF');

-- CreateEnum
CREATE TYPE "InvoiceDirection" AS ENUM ('AR', 'AP');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'POSTED', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'REVERSED');

-- CreateEnum
CREATE TYPE "RegulatoryArtifactStatus" AS ENUM ('PENDING', 'ISSUED', 'REJECTED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "ArtifactSourceType" AS ENUM ('INVOICE', 'FULFILLMENT_EVENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EconomicEventType" ADD VALUE 'BOOTSTRAP';
ALTER TYPE "EconomicEventType" ADD VALUE 'OTHER';

-- AlterEnum
ALTER TYPE "RiskSource" ADD VALUE 'REGENERATIVE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CFO';

-- DropForeignKey
ALTER TABLE "cash_accounts" DROP CONSTRAINT "cash_accounts_companyId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ledger_entries_company_event_sequence_idx";

-- AlterTable
ALTER TABLE "account_balances" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "limit" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "consumed" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "remaining" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "cmr_deviation_reviews" ADD COLUMN     "budgetItemId" TEXT,
ADD COLUMN     "reasonCategory" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "consulting_budget_items" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "plannedNorm" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "plannedPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
ALTER COLUMN "plannedAmount" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "actualAmount" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "consulting_budget_plans" ADD COLUMN     "derivationHash" TEXT,
ADD COLUMN     "type" "BudgetType" NOT NULL DEFAULT 'OPERATIONAL',
ALTER COLUMN "totalPlannedAmount" DROP DEFAULT,
ALTER COLUMN "totalPlannedAmount" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "totalActualAmount" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "harvest_plans" ADD COLUMN     "seasonId" TEXT;

-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN     "cashAccountId" TEXT,
ADD COLUMN     "cashDirection" "CashDirection",
ADD COLUMN     "cashFlowType" "CashFlowType",
ADD COLUMN     "cashImpact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "executionId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "sequenceNumber" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "outbox_messages" DROP COLUMN "status",
ADD COLUMN     "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stock_transactions" ADD COLUMN     "budgetItemId" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "costPerUnit" DOUBLE PRECISION,
ADD COLUMN     "executionId" TEXT,
ADD COLUMN     "orchLogId" TEXT,
ADD COLUMN     "resourceName" TEXT,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "totalCost" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "tenant_states" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "cash_accounts";

-- DropTable
DROP TABLE "currency_precisions";

-- DropTable
DROP TABLE "fsm_allowed_transitions";

-- CreateTable
CREATE TABLE "consulting_execution_records" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "performedById" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "budgetPlanId" TEXT,
    "budgetVersion" INTEGER,
    "techMapId" TEXT,
    "techMapVersion" INTEGER,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_execution_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_execution_logs" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budgetApplied" BOOLEAN NOT NULL DEFAULT false,
    "deviationCreated" BOOLEAN NOT NULL DEFAULT false,
    "warnings" TEXT[],
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consulting_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_cash_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_management_decisions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "status" "DecisionStatus" NOT NULL DEFAULT 'DRAFT',
    "confirmedAt" TIMESTAMP(3),
    "deviationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedEffect" TEXT,
    "isActive" BOOLEAN,
    "decisionHash" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_management_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_results" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "plannedYield" DECIMAL(18,4),
    "actualYield" DECIMAL(18,4),
    "harvestedArea" DECIMAL(18,4),
    "totalOutput" DECIMAL(18,4),
    "marketPrice" DECIMAL(18,4),
    "costSnapshot" DECIMAL(18,4),
    "budgetPlanId" TEXT,
    "budgetVersion" INTEGER,
    "qualityClass" TEXT,
    "harvestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_strategic_goals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetValue" DECIMAL(18,4) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "isActive" BOOLEAN,
    "activatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_strategic_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_model_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "parentHash" TEXT,
    "signature" TEXT NOT NULL,
    "status" "ModelStatus" NOT NULL DEFAULT 'SHADOW',
    "artifactPath" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "trainingRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_training_runs" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'PENDING',
    "config" JSONB,
    "metrics" JSONB,
    "companyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_training_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_drift_reports" (
    "id" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "psiScore" DOUBLE PRECISION,
    "klDivergence" DOUBLE PRECISION,
    "ksTestStat" DOUBLE PRECISION,
    "status" "DriftStatus" NOT NULL DEFAULT 'NORMAL',
    "payload" JSONB NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rai_drift_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_learning_events" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "rai_learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_soil_metrics" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sri" DOUBLE PRECISION NOT NULL,
    "om" DOUBLE PRECISION NOT NULL,
    "ph" DOUBLE PRECISION NOT NULL,
    "source" "DataSourceType" NOT NULL,
    "signature" BYTEA,
    "publicKeyId" TEXT,
    "trustScoreSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "rai_soil_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_sustainability_baselines" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "locked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialSri" DOUBLE PRECISION NOT NULL,
    "targetSRI" DOUBLE PRECISION NOT NULL,
    "genesisHash" TEXT NOT NULL,
    "trustSnapshot" JSONB NOT NULL,

    CONSTRAINT "rai_sustainability_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_biodiversity_metrics" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bps" DOUBLE PRECISION NOT NULL,
    "shannonIndex" DOUBLE PRECISION NOT NULL,
    "monoPenalty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "rai_biodiversity_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_governance_locks" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" "GovernanceLockReason" NOT NULL,
    "recoverySeasons" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rai_governance_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_override_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "approverId" TEXT,
    "status" "OverrideStatus" NOT NULL DEFAULT 'PENDING',
    "category" "OverrideCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deltaSRI" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "transactionId" TEXT,

    CONSTRAINT "rai_override_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rai_approval_requests" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rai_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_f_cert_audit" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiatorProcess" TEXT NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "kidUsed" TEXT NOT NULL,
    "quorumReceipt" TEXT,
    "status" "CertAuditStatus" NOT NULL DEFAULT 'SIGNATURE_INTENT',
    "companyId" TEXT NOT NULL,

    CONSTRAINT "level_f_cert_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_committees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "members" JSONB NOT NULL,
    "quorumThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.66,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "governance_committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_quorum_processes" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "status" "QuorumStatus" NOT NULL DEFAULT 'COLLECTING',
    "committeeId" TEXT NOT NULL,
    "committeeVersion" INTEGER NOT NULL,
    "cmrRiskId" TEXT,
    "decisionRecordId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "governance_quorum_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_signatures" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "pubKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "quorumProcessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_jurisdictions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_regulatory_profiles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "rulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_regulatory_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_parties" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "regulatoryProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_party_relations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourcePartyId" TEXT NOT NULL,
    "targetPartyId" TEXT NOT NULL,
    "relationType" "PartyRelationType" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_party_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "CommerceContractStatus" NOT NULL DEFAULT 'DRAFT',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "jurisdictionId" TEXT NOT NULL,
    "regulatoryProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_contract_party_roles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "role" "CommerceContractPartyRoleType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_contract_party_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_obligations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" "CommerceObligationType" NOT NULL,
    "status" "CommerceObligationStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "termsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_budget_reservations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "obligationId" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "periodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_budget_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payment_schedules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "obligationId" TEXT,
    "invoiceId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "percentage" DECIMAL(8,4),
    "amount" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_fulfillment_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "eventDomain" "CommerceEventDomain" NOT NULL,
    "eventType" "CommerceEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT,
    "payloadJson" JSONB,
    "proofDocumentId" TEXT,
    "regulatoryProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_fulfillment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_stock_moves" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fulfillmentEventId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_stock_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_revenue_recognition_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fulfillmentEventId" TEXT NOT NULL,
    "recognitionPolicyId" TEXT,
    "regulatoryProfileId" TEXT,
    "recognizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_revenue_recognition_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "fulfillmentEventId" TEXT,
    "direction" "InvoiceDirection" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(18,4) NOT NULL,
    "taxTotal" DECIMAL(18,4) NOT NULL,
    "grandTotal" DECIMAL(18,4) NOT NULL,
    "taxSnapshotJson" JSONB NOT NULL,
    "ledgerTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "payerPartyId" TEXT NOT NULL,
    "payeePartyId" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "ledgerTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payment_allocations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "allocatedAmount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_regulatory_artifacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceType" "ArtifactSourceType" NOT NULL,
    "invoiceId" TEXT,
    "fulfillmentEventId" TEXT,
    "artifactType" TEXT NOT NULL,
    "payloadRef" TEXT,
    "status" "RegulatoryArtifactStatus" NOT NULL DEFAULT 'PENDING',
    "externalRefId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_regulatory_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consulting_execution_records_operationId_key" ON "consulting_execution_records"("operationId");

-- CreateIndex
CREATE INDEX "consulting_execution_records_companyId_idx" ON "consulting_execution_records"("companyId");

-- CreateIndex
CREATE INDEX "consulting_execution_logs_executionId_idx" ON "consulting_execution_logs"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "consulting_management_decisions_deviationId_version_key" ON "consulting_management_decisions"("deviationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "consulting_management_decisions_deviationId_isActive_key" ON "consulting_management_decisions"("deviationId", "isActive");

-- CreateIndex
CREATE INDEX "harvest_results_planId_seasonId_companyId_idx" ON "harvest_results"("planId", "seasonId", "companyId");

-- CreateIndex
CREATE INDEX "harvest_results_fieldId_idx" ON "harvest_results"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "consulting_strategic_goals_companyId_seasonId_goalType_isAc_key" ON "consulting_strategic_goals"("companyId", "seasonId", "goalType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rai_model_versions_hash_key" ON "rai_model_versions"("hash");

-- CreateIndex
CREATE INDEX "rai_model_versions_companyId_idx" ON "rai_model_versions"("companyId");

-- CreateIndex
CREATE INDEX "rai_model_versions_hash_idx" ON "rai_model_versions"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "rai_model_versions_companyId_name_version_key" ON "rai_model_versions"("companyId", "name", "version");

-- CreateIndex
CREATE INDEX "rai_training_runs_companyId_idx" ON "rai_training_runs"("companyId");

-- CreateIndex
CREATE INDEX "rai_training_runs_status_idx" ON "rai_training_runs"("status");

-- CreateIndex
CREATE INDEX "rai_drift_reports_companyId_idx" ON "rai_drift_reports"("companyId");

-- CreateIndex
CREATE INDEX "rai_drift_reports_modelVersionId_idx" ON "rai_drift_reports"("modelVersionId");

-- CreateIndex
CREATE INDEX "rai_learning_events_companyId_idx" ON "rai_learning_events"("companyId");

-- CreateIndex
CREATE INDEX "rai_learning_events_featureId_idx" ON "rai_learning_events"("featureId");

-- CreateIndex
CREATE INDEX "rai_soil_metrics_companyId_fieldId_timestamp_idx" ON "rai_soil_metrics"("companyId", "fieldId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "rai_sustainability_baselines_fieldId_key" ON "rai_sustainability_baselines"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "rai_sustainability_baselines_companyId_fieldId_version_key" ON "rai_sustainability_baselines"("companyId", "fieldId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "rai_biodiversity_metrics_seasonId_key" ON "rai_biodiversity_metrics"("seasonId");

-- CreateIndex
CREATE INDEX "rai_biodiversity_metrics_companyId_seasonId_idx" ON "rai_biodiversity_metrics"("companyId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "rai_governance_locks_fieldId_key" ON "rai_governance_locks"("fieldId");

-- CreateIndex
CREATE INDEX "rai_governance_locks_companyId_fieldId_idx" ON "rai_governance_locks"("companyId", "fieldId");

-- CreateIndex
CREATE INDEX "rai_override_requests_companyId_fieldId_createdAt_idx" ON "rai_override_requests"("companyId", "fieldId", "createdAt");

-- CreateIndex
CREATE INDEX "level_f_cert_audit_companyId_snapshotHash_idx" ON "level_f_cert_audit"("companyId", "snapshotHash");

-- CreateIndex
CREATE INDEX "level_f_cert_audit_timestamp_idx" ON "level_f_cert_audit"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "governance_committees_name_companyId_version_key" ON "governance_committees"("name", "companyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "governance_quorum_processes_traceId_key" ON "governance_quorum_processes"("traceId");

-- CreateIndex
CREATE INDEX "governance_quorum_processes_traceId_idx" ON "governance_quorum_processes"("traceId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_jurisdictions_companyId_id_key" ON "commerce_jurisdictions"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_jurisdictions_companyId_code_key" ON "commerce_jurisdictions"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_regulatory_profiles_companyId_id_key" ON "commerce_regulatory_profiles"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_regulatory_profiles_companyId_code_key" ON "commerce_regulatory_profiles"("companyId", "code");

-- CreateIndex
CREATE INDEX "commerce_parties_companyId_legalName_idx" ON "commerce_parties"("companyId", "legalName");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_parties_companyId_id_key" ON "commerce_parties"("companyId", "id");

-- CreateIndex
CREATE INDEX "commerce_party_relations_companyId_sourcePartyId_targetPart_idx" ON "commerce_party_relations"("companyId", "sourcePartyId", "targetPartyId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_party_relations_companyId_id_key" ON "commerce_party_relations"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_contracts_companyId_id_key" ON "commerce_contracts"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_contracts_companyId_number_key" ON "commerce_contracts"("companyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_contract_party_roles_companyId_id_key" ON "commerce_contract_party_roles"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_contract_party_roles_companyId_contractId_partyId__key" ON "commerce_contract_party_roles"("companyId", "contractId", "partyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_obligations_companyId_id_key" ON "commerce_obligations"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_budget_reservations_companyId_id_key" ON "commerce_budget_reservations"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payment_schedules_companyId_id_key" ON "commerce_payment_schedules"("companyId", "id");

-- CreateIndex
CREATE INDEX "commerce_fulfillment_events_companyId_obligationId_eventDom_idx" ON "commerce_fulfillment_events"("companyId", "obligationId", "eventDomain", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_fulfillment_events_companyId_id_key" ON "commerce_fulfillment_events"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_stock_moves_companyId_id_key" ON "commerce_stock_moves"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_revenue_recognition_events_companyId_id_key" ON "commerce_revenue_recognition_events"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_invoices_ledgerTxId_key" ON "commerce_invoices"("ledgerTxId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_invoices_companyId_id_key" ON "commerce_invoices"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payments_ledgerTxId_key" ON "commerce_payments"("ledgerTxId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payments_companyId_id_key" ON "commerce_payments"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payment_allocations_companyId_id_key" ON "commerce_payment_allocations"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_regulatory_artifacts_companyId_id_key" ON "commerce_regulatory_artifacts"("companyId", "id");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs"("companyId");

-- CreateIndex
CREATE INDEX "cmr_risks_taskId_idx" ON "cmr_risks"("taskId");

-- CreateIndex
CREATE INDEX "cmr_risks_observationId_idx" ON "cmr_risks"("observationId");

-- CreateIndex
CREATE INDEX "cmr_risks_responsibleId_idx" ON "cmr_risks"("responsibleId");

-- CreateIndex
CREATE INDEX "cmr_risks_insuranceId_idx" ON "cmr_risks"("insuranceId");

-- CreateIndex
CREATE INDEX "economic_events_fieldId_idx" ON "economic_events"("fieldId");

-- CreateIndex
CREATE INDEX "economic_events_employeeId_idx" ON "economic_events"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "economic_events_companyId_id_key" ON "economic_events"("companyId", "id");

-- CreateIndex
CREATE INDEX "experiments_programId_idx" ON "experiments"("programId");

-- CreateIndex
CREATE INDEX "field_observations_companyId_idx" ON "field_observations"("companyId");

-- CreateIndex
CREATE INDEX "field_observations_seasonId_idx" ON "field_observations"("seasonId");

-- CreateIndex
CREATE INDEX "field_observations_fieldId_idx" ON "field_observations"("fieldId");

-- CreateIndex
CREATE INDEX "field_observations_taskId_idx" ON "field_observations"("taskId");

-- CreateIndex
CREATE INDEX "field_observations_deviationReviewId_idx" ON "field_observations"("deviationReviewId");

-- CreateIndex
CREATE INDEX "field_observations_budgetPlanId_idx" ON "field_observations"("budgetPlanId");

-- CreateIndex
CREATE INDEX "field_observations_authorId_idx" ON "field_observations"("authorId");

-- CreateIndex
CREATE INDEX "field_observations_type_idx" ON "field_observations"("type");

-- CreateIndex
CREATE INDEX "field_observations_intent_idx" ON "field_observations"("intent");

-- CreateIndex
CREATE INDEX "gr_interactions_regulatorId_idx" ON "gr_interactions"("regulatorId");

-- CreateIndex
CREATE INDEX "ledger_entries_cashAccountId_idx" ON "ledger_entries"("cashAccountId");

-- CreateIndex
CREATE INDEX "ledger_entries_executionId_idx" ON "ledger_entries"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_economicEventId_sequenceNumber_key" ON "ledger_entries"("economicEventId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "legal_documents_regulatorId_idx" ON "legal_documents"("regulatorId");

-- CreateIndex
CREATE INDEX "legal_obligations_ownerId_idx" ON "legal_obligations"("ownerId");

-- CreateIndex
CREATE INDEX "outbox_messages_status_nextRetryAt_createdAt_idx" ON "outbox_messages"("status", "nextRetryAt", "createdAt");

-- CreateIndex
CREATE INDEX "research_measurements_trialId_idx" ON "research_measurements"("trialId");

-- CreateIndex
CREATE INDEX "research_programs_companyId_idx" ON "research_programs"("companyId");

-- CreateIndex
CREATE INDEX "research_trials_experimentId_idx" ON "research_trials"("experimentId");

-- CreateIndex
CREATE INDEX "stock_transactions_executionId_idx" ON "stock_transactions"("executionId");

-- CreateIndex
CREATE INDEX "stock_transactions_budgetItemId_idx" ON "stock_transactions"("budgetItemId");

-- CreateIndex
CREATE INDEX "stock_transactions_orchLogId_idx" ON "stock_transactions"("orchLogId");

-- CreateIndex
CREATE INDEX "stock_transactions_companyId_idx" ON "stock_transactions"("companyId");

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "consulting_execution_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_orchLogId_fkey" FOREIGN KEY ("orchLogId") REFERENCES "consulting_execution_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "consulting_budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_records" ADD CONSTRAINT "consulting_execution_records_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "tech_map_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_records" ADD CONSTRAINT "consulting_execution_records_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_records" ADD CONSTRAINT "consulting_execution_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_logs" ADD CONSTRAINT "consulting_execution_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "consulting_execution_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "consulting_budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_states" ADD CONSTRAINT "tenant_states_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "consulting_execution_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "consulting_cash_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_cash_accounts" ADD CONSTRAINT "consulting_cash_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_budget_items" ADD CONSTRAINT "consulting_budget_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_management_decisions" ADD CONSTRAINT "consulting_management_decisions_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "consulting_management_decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_management_decisions" ADD CONSTRAINT "consulting_management_decisions_deviationId_fkey" FOREIGN KEY ("deviationId") REFERENCES "cmr_deviation_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_management_decisions" ADD CONSTRAINT "consulting_management_decisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_results" ADD CONSTRAINT "harvest_results_planId_fkey" FOREIGN KEY ("planId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_results" ADD CONSTRAINT "harvest_results_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_results" ADD CONSTRAINT "harvest_results_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_results" ADD CONSTRAINT "harvest_results_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_strategic_goals" ADD CONSTRAINT "consulting_strategic_goals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_strategic_goals" ADD CONSTRAINT "consulting_strategic_goals_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_model_versions" ADD CONSTRAINT "rai_model_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_model_versions" ADD CONSTRAINT "rai_model_versions_trainingRunId_fkey" FOREIGN KEY ("trainingRunId") REFERENCES "rai_training_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_training_runs" ADD CONSTRAINT "rai_training_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_drift_reports" ADD CONSTRAINT "rai_drift_reports_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "rai_model_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_drift_reports" ADD CONSTRAINT "rai_drift_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_learning_events" ADD CONSTRAINT "rai_learning_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_soil_metrics" ADD CONSTRAINT "rai_soil_metrics_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_soil_metrics" ADD CONSTRAINT "rai_soil_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_soil_metrics" ADD CONSTRAINT "rai_soil_metrics_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_sustainability_baselines" ADD CONSTRAINT "rai_sustainability_baselines_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_sustainability_baselines" ADD CONSTRAINT "rai_sustainability_baselines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_biodiversity_metrics" ADD CONSTRAINT "rai_biodiversity_metrics_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_biodiversity_metrics" ADD CONSTRAINT "rai_biodiversity_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_governance_locks" ADD CONSTRAINT "rai_governance_locks_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_governance_locks" ADD CONSTRAINT "rai_governance_locks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_override_requests" ADD CONSTRAINT "rai_override_requests_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_override_requests" ADD CONSTRAINT "rai_override_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_override_requests" ADD CONSTRAINT "rai_override_requests_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_override_requests" ADD CONSTRAINT "rai_override_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rai_approval_requests" ADD CONSTRAINT "rai_approval_requests_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "rai_model_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_f_cert_audit" ADD CONSTRAINT "level_f_cert_audit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_committees" ADD CONSTRAINT "governance_committees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_quorum_processes" ADD CONSTRAINT "governance_quorum_processes_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "governance_committees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_quorum_processes" ADD CONSTRAINT "governance_quorum_processes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_signatures" ADD CONSTRAINT "governance_signatures_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_signatures" ADD CONSTRAINT "governance_signatures_quorumProcessId_fkey" FOREIGN KEY ("quorumProcessId") REFERENCES "governance_quorum_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_jurisdictions" ADD CONSTRAINT "commerce_jurisdictions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_regulatory_profiles" ADD CONSTRAINT "commerce_regulatory_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_regulatory_profiles" ADD CONSTRAINT "commerce_regulatory_profiles_companyId_jurisdictionId_fkey" FOREIGN KEY ("companyId", "jurisdictionId") REFERENCES "commerce_jurisdictions"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_parties" ADD CONSTRAINT "commerce_parties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_parties" ADD CONSTRAINT "commerce_parties_companyId_jurisdictionId_fkey" FOREIGN KEY ("companyId", "jurisdictionId") REFERENCES "commerce_jurisdictions"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_parties" ADD CONSTRAINT "commerce_parties_companyId_regulatoryProfileId_fkey" FOREIGN KEY ("companyId", "regulatoryProfileId") REFERENCES "commerce_regulatory_profiles"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_party_relations" ADD CONSTRAINT "commerce_party_relations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_party_relations" ADD CONSTRAINT "commerce_party_relations_companyId_sourcePartyId_fkey" FOREIGN KEY ("companyId", "sourcePartyId") REFERENCES "commerce_parties"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_party_relations" ADD CONSTRAINT "commerce_party_relations_companyId_targetPartyId_fkey" FOREIGN KEY ("companyId", "targetPartyId") REFERENCES "commerce_parties"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_contracts" ADD CONSTRAINT "commerce_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_contracts" ADD CONSTRAINT "commerce_contracts_companyId_jurisdictionId_fkey" FOREIGN KEY ("companyId", "jurisdictionId") REFERENCES "commerce_jurisdictions"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_contracts" ADD CONSTRAINT "commerce_contracts_companyId_regulatoryProfileId_fkey" FOREIGN KEY ("companyId", "regulatoryProfileId") REFERENCES "commerce_regulatory_profiles"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_contract_party_roles" ADD CONSTRAINT "commerce_contract_party_roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_contract_party_roles" ADD CONSTRAINT "commerce_contract_party_roles_companyId_contractId_fkey" FOREIGN KEY ("companyId", "contractId") REFERENCES "commerce_contracts"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_contract_party_roles" ADD CONSTRAINT "commerce_contract_party_roles_companyId_partyId_fkey" FOREIGN KEY ("companyId", "partyId") REFERENCES "commerce_parties"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_obligations" ADD CONSTRAINT "commerce_obligations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_obligations" ADD CONSTRAINT "commerce_obligations_companyId_contractId_fkey" FOREIGN KEY ("companyId", "contractId") REFERENCES "commerce_contracts"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_budget_reservations" ADD CONSTRAINT "commerce_budget_reservations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_budget_reservations" ADD CONSTRAINT "commerce_budget_reservations_companyId_contractId_fkey" FOREIGN KEY ("companyId", "contractId") REFERENCES "commerce_contracts"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_budget_reservations" ADD CONSTRAINT "commerce_budget_reservations_companyId_obligationId_fkey" FOREIGN KEY ("companyId", "obligationId") REFERENCES "commerce_obligations"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_schedules" ADD CONSTRAINT "commerce_payment_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_schedules" ADD CONSTRAINT "commerce_payment_schedules_companyId_contractId_fkey" FOREIGN KEY ("companyId", "contractId") REFERENCES "commerce_contracts"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_schedules" ADD CONSTRAINT "commerce_payment_schedules_companyId_obligationId_fkey" FOREIGN KEY ("companyId", "obligationId") REFERENCES "commerce_obligations"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_schedules" ADD CONSTRAINT "commerce_payment_schedules_companyId_invoiceId_fkey" FOREIGN KEY ("companyId", "invoiceId") REFERENCES "commerce_invoices"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_fulfillment_events" ADD CONSTRAINT "commerce_fulfillment_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_fulfillment_events" ADD CONSTRAINT "commerce_fulfillment_events_companyId_obligationId_fkey" FOREIGN KEY ("companyId", "obligationId") REFERENCES "commerce_obligations"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_fulfillment_events" ADD CONSTRAINT "commerce_fulfillment_events_companyId_regulatoryProfileId_fkey" FOREIGN KEY ("companyId", "regulatoryProfileId") REFERENCES "commerce_regulatory_profiles"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_stock_moves" ADD CONSTRAINT "commerce_stock_moves_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_stock_moves" ADD CONSTRAINT "commerce_stock_moves_companyId_fulfillmentEventId_fkey" FOREIGN KEY ("companyId", "fulfillmentEventId") REFERENCES "commerce_fulfillment_events"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_revenue_recognition_events" ADD CONSTRAINT "commerce_revenue_recognition_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_revenue_recognition_events" ADD CONSTRAINT "commerce_revenue_recognition_events_companyId_fulfillmentE_fkey" FOREIGN KEY ("companyId", "fulfillmentEventId") REFERENCES "commerce_fulfillment_events"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_revenue_recognition_events" ADD CONSTRAINT "commerce_revenue_recognition_events_companyId_regulatoryPr_fkey" FOREIGN KEY ("companyId", "regulatoryProfileId") REFERENCES "commerce_regulatory_profiles"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_invoices" ADD CONSTRAINT "commerce_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_invoices" ADD CONSTRAINT "commerce_invoices_companyId_contractId_fkey" FOREIGN KEY ("companyId", "contractId") REFERENCES "commerce_contracts"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_invoices" ADD CONSTRAINT "commerce_invoices_companyId_obligationId_fkey" FOREIGN KEY ("companyId", "obligationId") REFERENCES "commerce_obligations"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_invoices" ADD CONSTRAINT "commerce_invoices_companyId_fulfillmentEventId_fkey" FOREIGN KEY ("companyId", "fulfillmentEventId") REFERENCES "commerce_fulfillment_events"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payments" ADD CONSTRAINT "commerce_payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payments" ADD CONSTRAINT "commerce_payments_companyId_payerPartyId_fkey" FOREIGN KEY ("companyId", "payerPartyId") REFERENCES "commerce_parties"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payments" ADD CONSTRAINT "commerce_payments_companyId_payeePartyId_fkey" FOREIGN KEY ("companyId", "payeePartyId") REFERENCES "commerce_parties"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_allocations" ADD CONSTRAINT "commerce_payment_allocations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_allocations" ADD CONSTRAINT "commerce_payment_allocations_companyId_paymentId_fkey" FOREIGN KEY ("companyId", "paymentId") REFERENCES "commerce_payments"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_allocations" ADD CONSTRAINT "commerce_payment_allocations_companyId_invoiceId_fkey" FOREIGN KEY ("companyId", "invoiceId") REFERENCES "commerce_invoices"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_regulatory_artifacts" ADD CONSTRAINT "commerce_regulatory_artifacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_regulatory_artifacts" ADD CONSTRAINT "commerce_regulatory_artifacts_companyId_invoiceId_fkey" FOREIGN KEY ("companyId", "invoiceId") REFERENCES "commerce_invoices"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_regulatory_artifacts" ADD CONSTRAINT "commerce_regulatory_artifacts_companyId_fulfillmentEventId_fkey" FOREIGN KEY ("companyId", "fulfillmentEventId") REFERENCES "commerce_fulfillment_events"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'economic_events_company_id_replay_key_key') THEN
    ALTER INDEX "economic_events_company_id_replay_key_key" RENAME TO "economic_events_companyId_replayKey_key";
  END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_event_consumptions_company_processed') THEN
    ALTER INDEX "ix_event_consumptions_company_processed" RENAME TO "event_consumptions_companyId_processedAt_idx";
  END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_event_consumptions_consumer_event_type_processed') THEN
    ALTER INDEX "ix_event_consumptions_consumer_event_type_processed" RENAME TO "event_consumptions_consumer_eventType_processedAt_idx";
  END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'uq_event_consumptions_consumer_event') THEN
    ALTER INDEX "uq_event_consumptions_consumer_event" RENAME TO "event_consumptions_consumer_eventId_key";
  END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_outbox_status_next_retry_created') THEN
    ALTER INDEX "ix_outbox_status_next_retry_created" RENAME TO "outbox_messages_status_nextRetryAt_createdAt_idx";
  END IF;
END $$;

