-- CreateEnum
CREATE TYPE "RegulatorType" AS ENUM ('FISCAL', 'SUPERVISORY', 'EXECUTIVE', 'LEGISLATIVE', 'ASSOCIATION');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('STATUTORY_LAW', 'REGULATION', 'TECHNICAL_NORM', 'CONTRACT', 'JUDICIAL_ACT');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('MANDATORY', 'RESTRICTIVE', 'PERMISSIVE', 'PROHIBITIVE');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'AT_RISK', 'VIOLATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ImpactTargetType" AS ENUM ('CONTRACT', 'SEASON', 'TRANSACTION', 'EMPLOYEE', 'LAND_PARCEL', 'RND_EXPERIMENT', 'RND_PROTOCOL');

-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('PENALTY', 'FINE', 'LICENSE_REVOCATION', 'SUSPENSION', 'REPUTATIONAL');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('MEETING', 'INSPECTION', 'LETTER', 'WORKING_GROUP');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExperimentState" AS ENUM ('IDEA', 'HYPOTHESIS_DEFINED', 'PROTOCOL_DRAFT', 'SCIENTIFIC_REVIEW', 'LEGAL_APPROVAL', 'EXPERIMENT_APPROVED', 'RUNNING', 'DATA_COLLECTION', 'ANALYSIS', 'PEER_REVIEW', 'CONCLUSION_ISSUED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ExperimentType" AS ENUM ('DRUG', 'TECH', 'METHOD', 'COMPARATIVE', 'FIELD', 'METRIC');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('SENSOR', 'MANUAL', 'LAB');

-- CreateTable
CREATE TABLE "regulatory_bodies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RegulatorType" NOT NULL,
    "scope" TEXT,
    "powers" TEXT,
    "sanctions" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_bodies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "externalId" TEXT,
    "type" "DocumentType" NOT NULL,
    "sourceUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0',
    "regulatorId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_norms" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "paragraph" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_norms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_requirements" (
    "id" TEXT NOT NULL,
    "normId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "type" "RequirementType" NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "targetType" "ImpactTargetType" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_obligations" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "status" "ObligationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_sanctions" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "type" "SanctionType" NOT NULL,
    "amount" DECIMAL(18,2),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "observation" TEXT,
    "confidenceLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "checkedAgainstVersion" TEXT,
    "companyId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gr_interactions" (
    "id" TEXT NOT NULL,
    "regulatorId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gr_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_signals" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactLevel" "ImpactLevel" NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_legal_feeds" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalRef" TEXT,
    "rawContent" JSONB NOT NULL,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_legal_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_programs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "hypothesis" TEXT,
    "status" "ProgramStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "research_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExperimentType" NOT NULL,
    "state" "ExperimentState" NOT NULL,
    "activeProtocolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_protocols" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "methodology" JSONB NOT NULL,
    "variables" JSONB NOT NULL,
    "successCriteria" JSONB NOT NULL,
    "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_trials" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "location" TEXT,
    "conditions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "deviations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_measurements" (
    "id" TEXT NOT NULL,
    "trialId" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "research_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_results" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "significance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_conclusions" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "applicability" JSONB NOT NULL,
    "limitations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_conclusions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regulatory_bodies_companyId_idx" ON "regulatory_bodies"("companyId");

-- CreateIndex
CREATE INDEX "legal_documents_companyId_idx" ON "legal_documents"("companyId");

-- CreateIndex
CREATE INDEX "legal_documents_externalId_idx" ON "legal_documents"("externalId");

-- CreateIndex
CREATE INDEX "legal_norms_documentId_idx" ON "legal_norms"("documentId");

-- CreateIndex
CREATE INDEX "legal_requirements_companyId_idx" ON "legal_requirements"("companyId");

-- CreateIndex
CREATE INDEX "legal_requirements_status_idx" ON "legal_requirements"("status");

-- CreateIndex
CREATE INDEX "legal_obligations_requirementId_idx" ON "legal_obligations"("requirementId");

-- CreateIndex
CREATE INDEX "compliance_checks_companyId_idx" ON "compliance_checks"("companyId");

-- CreateIndex
CREATE INDEX "compliance_checks_requirementId_idx" ON "compliance_checks"("requirementId");

-- CreateIndex
CREATE INDEX "gr_interactions_companyId_idx" ON "gr_interactions"("companyId");

-- CreateIndex
CREATE INDEX "policy_signals_companyId_idx" ON "policy_signals"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_activeProtocolId_key" ON "experiments"("activeProtocolId");

-- CreateIndex
CREATE UNIQUE INDEX "research_protocols_experimentId_version_key" ON "research_protocols"("experimentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "research_results_experimentId_key" ON "research_results"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "research_conclusions_experimentId_key" ON "research_conclusions"("experimentId");

-- AddForeignKey
ALTER TABLE "regulatory_bodies" ADD CONSTRAINT "regulatory_bodies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_regulatorId_fkey" FOREIGN KEY ("regulatorId") REFERENCES "regulatory_bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_norms" ADD CONSTRAINT "legal_norms_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "legal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_requirements" ADD CONSTRAINT "legal_requirements_normId_fkey" FOREIGN KEY ("normId") REFERENCES "legal_norms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_requirements" ADD CONSTRAINT "legal_requirements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_obligations" ADD CONSTRAINT "legal_obligations_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "legal_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_sanctions" ADD CONSTRAINT "legal_sanctions_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "legal_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "legal_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_interactions" ADD CONSTRAINT "gr_interactions_regulatorId_fkey" FOREIGN KEY ("regulatorId") REFERENCES "regulatory_bodies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_interactions" ADD CONSTRAINT "gr_interactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_signals" ADD CONSTRAINT "policy_signals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_legal_feeds" ADD CONSTRAINT "external_legal_feeds_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "legal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_programs" ADD CONSTRAINT "research_programs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "research_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_activeProtocolId_fkey" FOREIGN KEY ("activeProtocolId") REFERENCES "research_protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_protocols" ADD CONSTRAINT "research_protocols_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_trials" ADD CONSTRAINT "research_trials_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_measurements" ADD CONSTRAINT "research_measurements_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "research_trials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_results" ADD CONSTRAINT "research_results_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_conclusions" ADD CONSTRAINT "research_conclusions_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
