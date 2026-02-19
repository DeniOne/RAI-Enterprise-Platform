-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CLIENT', 'PARTNER', 'REGULATOR', 'SUPPLIER', 'INVESTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'RISK');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "StrategicValue" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('DECISION_MAKER', 'LEGAL', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('MEETING', 'CORRESPONDENCE', 'CALL', 'DOC_SUBMISSION', 'REQUEST_RESPONSE');

-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('PENDING', 'FULFILLED', 'BREACHED');

-- CreateEnum
CREATE TYPE "MachineryType" AS ENUM ('TRACTOR', 'SPRAYER', 'HARVESTER', 'ATTACHMENT', 'TRUCK');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'REPAIR', 'OFFLINE', 'PENDING_CONFIRMATION', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StockItemType" AS ENUM ('CHEMICAL', 'FERTILIZER', 'SEED', 'FUEL');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('PROCUREMENT', 'CONSUMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CEO', 'MANAGER', 'AGRONOMIST', 'FIELD_WORKER', 'CFO', 'CLIENT_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('CHERNOZEM', 'LOAM', 'SANDY', 'CLAY', 'PODZOLIC', 'SODDY', 'GRAY_FOREST', 'CHESTNUT');

-- CreateEnum
CREATE TYPE "FieldStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'IN_PROCESSING');

-- CreateEnum
CREATE TYPE "RapeseedType" AS ENUM ('WINTER', 'SPRING');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "UserAccessLevel" AS ENUM ('DEMO', 'INVITED', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('FARMER', 'DEALER', 'HOLDING', 'PARTNER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'QUALIFICATION', 'OFFER', 'CONTRACT', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "HarvestPlanStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'DONE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TechMapStatus" AS ENUM ('GENERATED_DRAFT', 'DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'ARCHIVED', 'OVERRIDE_ANALYSIS');

-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'MISSED');

-- CreateEnum
CREATE TYPE "DeviationStatus" AS ENUM ('DETECTED', 'ANALYZING', 'DECIDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeviationType" AS ENUM ('AGRONOMIC', 'FINANCIAL', 'OPERATIONAL');

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
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('PHOTO', 'GEO_WALK', 'VOICE_NOTE', 'CALL_LOG', 'MEASUREMENT', 'SOS_SIGNAL');

-- CreateEnum
CREATE TYPE "ObservationIntent" AS ENUM ('MONITORING', 'INCIDENT', 'CONSULTATION', 'CALL', 'CONFIRMATION', 'DELAY');

-- CreateEnum
CREATE TYPE "IntegrityStatus" AS ENUM ('STRONG_EVIDENCE', 'WEAK_EVIDENCE', 'NO_EVIDENCE');

-- CreateEnum
CREATE TYPE "EconomicEventType" AS ENUM ('COST_INCURRED', 'REVENUE_RECOGNIZED', 'OBLIGATION_CREATED', 'OBLIGATION_SETTLED', 'RESERVE_ALLOCATED', 'ADJUSTMENT', 'BOOTSTRAP', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'LOCKED', 'ACTIVE', 'EXHAUSTED', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TenantMode" AS ENUM ('ACTIVE', 'READ_ONLY', 'HALTED');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('OPERATING', 'INVESTING', 'FINANCING');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('INFLOW', 'OUTFLOW');

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
CREATE TYPE "LegalObligationStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('PENALTY', 'FINE', 'LICENSE_REVOCATION', 'SUSPENSION', 'REPUTATIONAL');

-- CreateEnum
CREATE TYPE "GrInteractionType" AS ENUM ('MEETING', 'INSPECTION', 'LETTER', 'WORKING_GROUP');

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

-- CreateEnum
CREATE TYPE "KnowledgeNodeType" AS ENUM ('CONCEPT', 'ENTITY', 'METRIC', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "KnowledgeNodeSource" AS ENUM ('MANUAL', 'INGESTION', 'AI');

-- CreateEnum
CREATE TYPE "KnowledgeEdgeRelation" AS ENUM ('IMPLEMENTS', 'DEPENDS_ON', 'MEASURED_BY', 'MEASURES', 'REFERENCES');

-- CreateEnum
CREATE TYPE "KnowledgeEdgeSource" AS ENUM ('MANUAL', 'INGESTION', 'AI');

-- CreateEnum
CREATE TYPE "VisionObservationSource" AS ENUM ('SATELLITE', 'DRONE', 'PHOTO');

-- CreateEnum
CREATE TYPE "VisionObservationModality" AS ENUM ('RGB', 'MULTISPECTRAL');

-- CreateEnum
CREATE TYPE "SatelliteIndexType" AS ENUM ('NDVI', 'NDRE');

-- CreateEnum
CREATE TYPE "SatelliteSource" AS ENUM ('SENTINEL2', 'LANDSAT8', 'LANDSAT9');

-- CreateEnum
CREATE TYPE "RiskSource" AS ENUM ('LEGAL', 'RND', 'OPS', 'FINANCE');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskVerdict" AS ENUM ('ALLOWED', 'CONDITIONAL', 'RESTRICTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RiskFsmState" AS ENUM ('CLEAR', 'OBSERVED', 'ELEVATED', 'CRITICAL', 'BLOCKED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RiskTargetType" AS ENUM ('ACTION', 'TECHNOLOGY', 'CLIENT', 'SEASON');

-- CreateEnum
CREATE TYPE "RiskReferenceType" AS ENUM ('EXPERIMENT', 'REQUIREMENT', 'TASK', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('OPERATIONAL', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('SEEDS', 'FERTILIZER', 'FUEL', 'LABOR', 'MACHINERY', 'OTHER');

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

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "executionId" TEXT,
    "resourceType" TEXT,
    "resourceName" TEXT,
    "unit" TEXT,
    "costPerUnit" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "orchLogId" TEXT,
    "budgetItemId" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "phone" TEXT,
    "telegramId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiresAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "accountId" TEXT,
    "accessLevel" "UserAccessLevel" NOT NULL DEFAULT 'DEMO',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "demoExpiresAt" TIMESTAMP(3),
    "coreUserId" TEXT,
    "coreWalletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "email" TEXT,
    "telegramId" TEXT,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "role" "UserRole" NOT NULL,
    "accessLevel" "UserAccessLevel" NOT NULL DEFAULT 'INVITED',
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "activationIp" TEXT,
    "activationUserAgent" TEXT,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "cadastreNumber" TEXT NOT NULL,
    "name" TEXT,
    "area" DOUBLE PRECISION NOT NULL,
    "coordinates" JSONB NOT NULL,
    "centroid" JSONB,
    "soilType" "SoilType" NOT NULL,
    "status" "FieldStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "coreObjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'PLANNING',
    "fieldId" TEXT NOT NULL,
    "cropId" TEXT,
    "rapeseedId" TEXT NOT NULL,
    "technologyCardId" TEXT,
    "expectedYield" DOUBLE PRECISION,
    "actualYield" DOUBLE PRECISION,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "coreProcessId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentStageId" TEXT,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "technology_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technology_card_operations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "technologyCardId" TEXT NOT NULL,
    "stageId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_card_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technology_card_resources" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technology_card_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "seasonId" TEXT NOT NULL,
    "operationId" TEXT,
    "fieldId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "responsibleId" TEXT,
    "plannedDate" TIMESTAMP(3),
    "slaExpiration" TIMESTAMP(3),
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
CREATE TABLE "employee_profiles" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "userId" TEXT,
    "orgUnitId" TEXT,
    "roleId" TEXT NOT NULL,
    "requiredRoleCompetencyRef" TEXT,
    "companyId" TEXT NOT NULL,
    "holdingId" TEXT,
    "clientId" TEXT,
    "status" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "role_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_entries" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "companyId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "harvest_plans" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contextSnapshot" JSONB,
    "targetMetric" TEXT,
    "period" TEXT,
    "seasonId" TEXT,
    "minValue" DOUBLE PRECISION,
    "optValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "baselineValue" DOUBLE PRECISION,
    "status" "HarvestPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "activeTechMapId" TEXT,
    "activeBudgetPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "tech_maps" (
    "id" TEXT NOT NULL,
    "harvestPlanId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "soilType" "SoilType",
    "moisture" DOUBLE PRECISION,
    "precursor" TEXT,
    "approvedAt" TIMESTAMP(3),
    "operationsSnapshot" JSONB,
    "resourceNormsSnapshot" JSONB,
    "generationMetadata" JSONB,
    "generationRecordId" TEXT,
    "status" "TechMapStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "fieldId" TEXT NOT NULL,
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
    "requiredMachineryType" "MachineryType",
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
CREATE TABLE "agronomic_strategies" (
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

-- CreateTable
CREATE TABLE "generation_records" (
    "id" TEXT NOT NULL,
    "inputParams" JSONB NOT NULL,
    "canonicalizedPayload" JSONB NOT NULL,
    "modelId" TEXT NOT NULL DEFAULT 'generative-engine-v1',
    "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "seed" TEXT NOT NULL,
    "canonicalHash" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "errorDetails" JSONB,
    "explainability" JSONB,
    "limitationsDisclosed" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "governance_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divergence_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "draftVersion" INTEGER NOT NULL,
    "disVersion" TEXT NOT NULL,
    "weightsSnapshot" JSONB NOT NULL,
    "disScore" DOUBLE PRECISION NOT NULL,
    "simulationHash" TEXT NOT NULL,
    "deltaRisk" DOUBLE PRECISION NOT NULL,
    "conflictVector" JSONB NOT NULL,
    "humanAction" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "simulationMode" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "policyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "divergence_records_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "cmr_deviation_reviews" (
    "id" TEXT NOT NULL,
    "type" "DeviationType" NOT NULL DEFAULT 'AGRONOMIC',
    "harvestPlanId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "stageId" TEXT,
    "deviationSummary" TEXT NOT NULL,
    "aiImpactAssessment" TEXT NOT NULL,
    "techConclusion" TEXT,
    "proposedActions" TEXT,
    "telegramThreadId" TEXT,
    "clientResponseStatus" "ClientResponseStatus" NOT NULL DEFAULT 'PENDING',
    "clientComment" TEXT,
    "clientRespondedAt" TIMESTAMP(3),
    "responsibilityMode" "ResponsibilityMode" NOT NULL DEFAULT 'SHARED',
    "slaExpiration" TIMESTAMP(3),
    "liabilityShiftStatus" TEXT,
    "status" "DeviationStatus" NOT NULL DEFAULT 'DETECTED',
    "budgetItemId" TEXT,
    "reasonCategory" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "budgetPlanId" TEXT,
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
    "budgetPlanId" TEXT,
    "status" TEXT NOT NULL,
    "taskId" TEXT,
    "observationId" TEXT,
    "responsibleId" TEXT,
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
    "budgetPlanId" TEXT,
    "authorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_observations_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "tenant_states" (
    "companyId" TEXT NOT NULL,
    "mode" "TenantMode" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_states_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "economic_events" (
    "id" TEXT NOT NULL,
    "type" "EconomicEventType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "replayKey" TEXT,
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
    "sequenceNumber" INTEGER NOT NULL DEFAULT 1,
    "economicEventId" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "type" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "executionId" TEXT,
    "cashFlowType" "CashFlowType",
    "cashImpact" BOOLEAN NOT NULL DEFAULT false,
    "cashDirection" "CashDirection",
    "dueDate" TIMESTAMP(3),
    "cashAccountId" TEXT,
    "isImmutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_balances" (
    "companyId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_balances_pkey" PRIMARY KEY ("companyId","accountCode")
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
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit" DECIMAL(18,4) NOT NULL,
    "consumed" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(18,4) NOT NULL DEFAULT 0,
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
    "status" "LegalObligationStatus" NOT NULL DEFAULT 'PENDING',
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
    "type" "GrInteractionType" NOT NULL,
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

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "type" "KnowledgeNodeType" NOT NULL,
    "label" TEXT NOT NULL,
    "source" "KnowledgeNodeSource" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_edges" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "relation" "KnowledgeEdgeRelation" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" "KnowledgeEdgeSource" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vision_observations" (
    "id" TEXT NOT NULL,
    "source" "VisionObservationSource" NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "modality" "VisionObservationModality" NOT NULL,
    "rawFeatures" JSONB,
    "metadata" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satellite_observations" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "indexType" "SatelliteIndexType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "source" "SatelliteSource" NOT NULL,
    "resolution" DOUBLE PRECISION NOT NULL,
    "cloudCoverage" DOUBLE PRECISION NOT NULL,
    "tileId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satellite_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "consulting_budget_plans" (
    "id" TEXT NOT NULL,
    "harvestPlanId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "type" "BudgetType" NOT NULL DEFAULT 'OPERATIONAL',
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "totalPlannedAmount" DECIMAL(18,4) NOT NULL,
    "totalActualAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "techMapSnapshotId" TEXT,
    "derivationHash" TEXT,
    "companyId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_budget_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_messages" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateId" TEXT,
    "aggregateType" TEXT,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "deadLetterAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_consumptions" (
    "id" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT,
    "companyId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulting_budget_items" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "plannedNorm" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "plannedPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "plannedAmount" DECIMAL(18,4) NOT NULL,
    "actualAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulting_budget_items_pkey" PRIMARY KEY ("id")
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
    "baselineSRI" DOUBLE PRECISION NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "accounts_inn_key" ON "accounts"("inn");

-- CreateIndex
CREATE INDEX "crm_contacts_accountId_idx" ON "crm_contacts"("accountId");

-- CreateIndex
CREATE INDEX "crm_interactions_accountId_idx" ON "crm_interactions"("accountId");

-- CreateIndex
CREATE INDEX "crm_interactions_contactId_idx" ON "crm_interactions"("contactId");

-- CreateIndex
CREATE INDEX "crm_obligations_accountId_idx" ON "crm_obligations"("accountId");

-- CreateIndex
CREATE INDEX "crm_obligations_status_idx" ON "crm_obligations"("status");

-- CreateIndex
CREATE INDEX "machinery_companyId_idx" ON "machinery"("companyId");

-- CreateIndex
CREATE INDEX "machinery_accountId_idempotencyKey_idx" ON "machinery"("accountId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "stock_items_companyId_idx" ON "stock_items"("companyId");

-- CreateIndex
CREATE INDEX "stock_items_accountId_idempotencyKey_idx" ON "stock_items"("accountId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "stock_transactions_executionId_idx" ON "stock_transactions"("executionId");

-- CreateIndex
CREATE INDEX "stock_transactions_budgetItemId_idx" ON "stock_transactions"("budgetItemId");

-- CreateIndex
CREATE INDEX "stock_transactions_orchLogId_idx" ON "stock_transactions"("orchLogId");

-- CreateIndex
CREATE INDEX "stock_transactions_companyId_idx" ON "stock_transactions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_coreUserId_key" ON "users"("coreUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_coreWalletId_key" ON "users"("coreWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_shortCode_key" ON "invitations"("shortCode");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_shortCode_idx" ON "invitations"("shortCode");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_telegramId_idx" ON "invitations"("telegramId");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "invitations_inviterId_idx" ON "invitations"("inviterId");

-- CreateIndex
CREATE UNIQUE INDEX "fields_cadastreNumber_key" ON "fields"("cadastreNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fields_coreObjectId_key" ON "fields"("coreObjectId");

-- CreateIndex
CREATE INDEX "fields_coordinates_idx" ON "fields"("coordinates");

-- CreateIndex
CREATE INDEX "fields_clientId_idx" ON "fields"("clientId");

-- CreateIndex
CREATE INDEX "fields_companyId_idx" ON "fields"("companyId");

-- CreateIndex
CREATE INDEX "rapeseeds_companyId_idx" ON "rapeseeds"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "rapeseeds_name_companyId_version_key" ON "rapeseeds"("name", "companyId", "version");

-- CreateIndex
CREATE INDEX "rapeseed_history_rapeseedId_version_idx" ON "rapeseed_history"("rapeseedId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_coreProcessId_key" ON "seasons"("coreProcessId");

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
CREATE INDEX "technology_cards_companyId_idx" ON "technology_cards"("companyId");

-- CreateIndex
CREATE INDEX "technology_card_operations_technologyCardId_idx" ON "technology_card_operations"("technologyCardId");

-- CreateIndex
CREATE INDEX "technology_card_operations_stageId_idx" ON "technology_card_operations"("stageId");

-- CreateIndex
CREATE INDEX "technology_card_resources_operationId_idx" ON "technology_card_resources"("operationId");

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
CREATE UNIQUE INDEX "employee_profiles_externalId_key" ON "employee_profiles"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_userId_key" ON "employee_profiles"("userId");

-- CreateIndex
CREATE INDEX "employee_profiles_companyId_idx" ON "employee_profiles"("companyId");

-- CreateIndex
CREATE INDEX "employee_profiles_roleId_idx" ON "employee_profiles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_onboarding_plans_employeeId_key" ON "hr_onboarding_plans"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "role_definitions_name_companyId_key" ON "role_definitions"("name", "companyId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_userId_action_date_key" ON "api_usage"("userId", "action", "date");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_ip_action_date_key" ON "api_usage"("ip", "action", "date");

-- CreateIndex
CREATE INDEX "memory_entries_companyId_memoryType_idx" ON "memory_entries"("companyId", "memoryType");

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
CREATE UNIQUE INDEX "harvest_plans_activeTechMapId_key" ON "harvest_plans"("activeTechMapId");

-- CreateIndex
CREATE UNIQUE INDEX "harvest_plans_activeBudgetPlanId_key" ON "harvest_plans"("activeBudgetPlanId");

-- CreateIndex
CREATE INDEX "harvest_plans_companyId_idx" ON "harvest_plans"("companyId");

-- CreateIndex
CREATE INDEX "harvest_plans_accountId_idx" ON "harvest_plans"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "harvest_performance_contracts_harvestPlanId_key" ON "harvest_performance_contracts"("harvestPlanId");

-- CreateIndex
CREATE INDEX "harvest_performance_contracts_companyId_idx" ON "harvest_performance_contracts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tech_maps_generationRecordId_key" ON "tech_maps"("generationRecordId");

-- CreateIndex
CREATE INDEX "tech_maps_companyId_idx" ON "tech_maps"("companyId");

-- CreateIndex
CREATE INDEX "tech_maps_harvestPlanId_idx" ON "tech_maps"("harvestPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "tech_maps_fieldId_crop_seasonId_companyId_version_key" ON "tech_maps"("fieldId", "crop", "seasonId", "companyId", "version");

-- CreateIndex
CREATE INDEX "tech_map_stages_techMapId_idx" ON "tech_map_stages"("techMapId");

-- CreateIndex
CREATE INDEX "tech_map_operations_mapStageId_idx" ON "tech_map_operations"("mapStageId");

-- CreateIndex
CREATE INDEX "tech_map_resources_mapOperationId_idx" ON "tech_map_resources"("mapOperationId");

-- CreateIndex
CREATE INDEX "agronomic_strategies_companyId_idx" ON "agronomic_strategies"("companyId");

-- CreateIndex
CREATE INDEX "agronomic_strategies_cropId_idx" ON "agronomic_strategies"("cropId");

-- CreateIndex
CREATE UNIQUE INDEX "agronomic_strategies_name_companyId_version_key" ON "agronomic_strategies"("name", "companyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "generation_records_canonicalHash_key" ON "generation_records"("canonicalHash");

-- CreateIndex
CREATE INDEX "generation_records_companyId_idx" ON "generation_records"("companyId");

-- CreateIndex
CREATE INDEX "generation_records_canonicalHash_idx" ON "generation_records"("canonicalHash");

-- CreateIndex
CREATE INDEX "generation_records_createdAt_idx" ON "generation_records"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "governance_configs_versionId_key" ON "governance_configs"("versionId");

-- CreateIndex
CREATE INDEX "governance_configs_companyId_idx" ON "governance_configs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "divergence_records_idempotencyKey_key" ON "divergence_records"("idempotencyKey");

-- CreateIndex
CREATE INDEX "divergence_records_companyId_idx" ON "divergence_records"("companyId");

-- CreateIndex
CREATE INDEX "divergence_records_createdAt_idx" ON "divergence_records"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "divergence_records_draftId_draftVersion_key" ON "divergence_records"("draftId", "draftVersion");

-- CreateIndex
CREATE UNIQUE INDEX "consulting_execution_records_operationId_key" ON "consulting_execution_records"("operationId");

-- CreateIndex
CREATE INDEX "consulting_execution_records_companyId_idx" ON "consulting_execution_records"("companyId");

-- CreateIndex
CREATE INDEX "consulting_execution_logs_executionId_idx" ON "consulting_execution_logs"("executionId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_seasonId_idx" ON "cmr_deviation_reviews"("seasonId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_harvestPlanId_idx" ON "cmr_deviation_reviews"("harvestPlanId");

-- CreateIndex
CREATE INDEX "cmr_deviation_reviews_budgetPlanId_idx" ON "cmr_deviation_reviews"("budgetPlanId");

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
CREATE INDEX "cmr_risks_taskId_idx" ON "cmr_risks"("taskId");

-- CreateIndex
CREATE INDEX "cmr_risks_observationId_idx" ON "cmr_risks"("observationId");

-- CreateIndex
CREATE INDEX "cmr_risks_responsibleId_idx" ON "cmr_risks"("responsibleId");

-- CreateIndex
CREATE INDEX "cmr_risks_insuranceId_idx" ON "cmr_risks"("insuranceId");

-- CreateIndex
CREATE INDEX "cmr_insurance_coverages_companyId_idx" ON "cmr_insurance_coverages"("companyId");

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
CREATE INDEX "economic_events_fieldId_idx" ON "economic_events"("fieldId");

-- CreateIndex
CREATE INDEX "economic_events_employeeId_idx" ON "economic_events"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "economic_events_companyId_id_key" ON "economic_events"("companyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "economic_events_companyId_replayKey_key" ON "economic_events"("companyId", "replayKey");

-- CreateIndex
CREATE INDEX "ledger_entries_companyId_idx" ON "ledger_entries"("companyId");

-- CreateIndex
CREATE INDEX "ledger_entries_accountCode_idx" ON "ledger_entries"("accountCode");

-- CreateIndex
CREATE INDEX "ledger_entries_cashAccountId_idx" ON "ledger_entries"("cashAccountId");

-- CreateIndex
CREATE INDEX "ledger_entries_executionId_idx" ON "ledger_entries"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_economicEventId_sequenceNumber_key" ON "ledger_entries"("economicEventId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "budgets_companyId_idx" ON "budgets"("companyId");

-- CreateIndex
CREATE INDEX "regulatory_bodies_companyId_idx" ON "regulatory_bodies"("companyId");

-- CreateIndex
CREATE INDEX "legal_documents_companyId_idx" ON "legal_documents"("companyId");

-- CreateIndex
CREATE INDEX "legal_documents_externalId_idx" ON "legal_documents"("externalId");

-- CreateIndex
CREATE INDEX "legal_documents_regulatorId_idx" ON "legal_documents"("regulatorId");

-- CreateIndex
CREATE INDEX "legal_norms_documentId_idx" ON "legal_norms"("documentId");

-- CreateIndex
CREATE INDEX "legal_requirements_companyId_idx" ON "legal_requirements"("companyId");

-- CreateIndex
CREATE INDEX "legal_requirements_status_idx" ON "legal_requirements"("status");

-- CreateIndex
CREATE INDEX "legal_obligations_requirementId_idx" ON "legal_obligations"("requirementId");

-- CreateIndex
CREATE INDEX "legal_obligations_ownerId_idx" ON "legal_obligations"("ownerId");

-- CreateIndex
CREATE INDEX "compliance_checks_companyId_idx" ON "compliance_checks"("companyId");

-- CreateIndex
CREATE INDEX "compliance_checks_requirementId_idx" ON "compliance_checks"("requirementId");

-- CreateIndex
CREATE INDEX "gr_interactions_companyId_idx" ON "gr_interactions"("companyId");

-- CreateIndex
CREATE INDEX "gr_interactions_regulatorId_idx" ON "gr_interactions"("regulatorId");

-- CreateIndex
CREATE INDEX "policy_signals_companyId_idx" ON "policy_signals"("companyId");

-- CreateIndex
CREATE INDEX "research_programs_companyId_idx" ON "research_programs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_activeProtocolId_key" ON "experiments"("activeProtocolId");

-- CreateIndex
CREATE INDEX "experiments_programId_idx" ON "experiments"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "research_protocols_experimentId_version_key" ON "research_protocols"("experimentId", "version");

-- CreateIndex
CREATE INDEX "research_trials_experimentId_idx" ON "research_trials"("experimentId");

-- CreateIndex
CREATE INDEX "research_measurements_trialId_idx" ON "research_measurements"("trialId");

-- CreateIndex
CREATE UNIQUE INDEX "research_results_experimentId_key" ON "research_results"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "research_conclusions_experimentId_key" ON "research_conclusions"("experimentId");

-- CreateIndex
CREATE INDEX "knowledge_nodes_companyId_idx" ON "knowledge_nodes"("companyId");

-- CreateIndex
CREATE INDEX "knowledge_nodes_type_idx" ON "knowledge_nodes"("type");

-- CreateIndex
CREATE INDEX "knowledge_edges_companyId_idx" ON "knowledge_edges"("companyId");

-- CreateIndex
CREATE INDEX "knowledge_edges_fromNodeId_idx" ON "knowledge_edges"("fromNodeId");

-- CreateIndex
CREATE INDEX "knowledge_edges_toNodeId_idx" ON "knowledge_edges"("toNodeId");

-- CreateIndex
CREATE INDEX "vision_observations_companyId_idx" ON "vision_observations"("companyId");

-- CreateIndex
CREATE INDEX "vision_observations_assetId_idx" ON "vision_observations"("assetId");

-- CreateIndex
CREATE INDEX "vision_observations_timestamp_idx" ON "vision_observations"("timestamp");

-- CreateIndex
CREATE INDEX "vision_observations_source_idx" ON "vision_observations"("source");

-- CreateIndex
CREATE INDEX "vision_observations_modality_idx" ON "vision_observations"("modality");

-- CreateIndex
CREATE INDEX "satellite_observations_companyId_idx" ON "satellite_observations"("companyId");

-- CreateIndex
CREATE INDEX "satellite_observations_assetId_idx" ON "satellite_observations"("assetId");

-- CreateIndex
CREATE INDEX "satellite_observations_timestamp_idx" ON "satellite_observations"("timestamp");

-- CreateIndex
CREATE INDEX "satellite_observations_indexType_idx" ON "satellite_observations"("indexType");

-- CreateIndex
CREATE INDEX "satellite_observations_source_idx" ON "satellite_observations"("source");

-- CreateIndex
CREATE INDEX "risk_signals_companyId_idx" ON "risk_signals"("companyId");

-- CreateIndex
CREATE INDEX "risk_signals_source_idx" ON "risk_signals"("source");

-- CreateIndex
CREATE INDEX "risk_assessments_companyId_idx" ON "risk_assessments"("companyId");

-- CreateIndex
CREATE INDEX "risk_assessments_verdict_idx" ON "risk_assessments"("verdict");

-- CreateIndex
CREATE INDEX "risk_state_history_companyId_idx" ON "risk_state_history"("companyId");

-- CreateIndex
CREATE INDEX "risk_state_history_targetId_idx" ON "risk_state_history"("targetId");

-- CreateIndex
CREATE INDEX "decision_records_companyId_idx" ON "decision_records"("companyId");

-- CreateIndex
CREATE INDEX "decision_records_actionType_idx" ON "decision_records"("actionType");

-- CreateIndex
CREATE INDEX "decision_records_targetId_idx" ON "decision_records"("targetId");

-- CreateIndex
CREATE INDEX "consulting_budget_plans_companyId_idx" ON "consulting_budget_plans"("companyId");

-- CreateIndex
CREATE INDEX "consulting_budget_plans_harvestPlanId_idx" ON "consulting_budget_plans"("harvestPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "consulting_budget_plans_harvestPlanId_version_key" ON "consulting_budget_plans"("harvestPlanId", "version");

-- CreateIndex
CREATE INDEX "outbox_messages_status_nextRetryAt_createdAt_idx" ON "outbox_messages"("status", "nextRetryAt", "createdAt");

-- CreateIndex
CREATE INDEX "event_consumptions_consumer_eventType_processedAt_idx" ON "event_consumptions"("consumer", "eventType", "processedAt");

-- CreateIndex
CREATE INDEX "event_consumptions_companyId_processedAt_idx" ON "event_consumptions"("companyId", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_consumptions_consumer_eventId_key" ON "event_consumptions"("consumer", "eventId");

-- CreateIndex
CREATE INDEX "consulting_budget_items_budgetPlanId_idx" ON "consulting_budget_items"("budgetPlanId");

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

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "holdings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_obligations" ADD CONSTRAINT "crm_obligations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_obligations" ADD CONSTRAINT "crm_obligations_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "consulting_execution_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_orchLogId_fkey" FOREIGN KEY ("orchLogId") REFERENCES "consulting_execution_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "consulting_budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapeseed_history" ADD CONSTRAINT "rapeseed_history_rapeseedId_fkey" FOREIGN KEY ("rapeseedId") REFERENCES "rapeseeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_rapeseedId_fkey" FOREIGN KEY ("rapeseedId") REFERENCES "rapeseeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_technologyCardId_fkey" FOREIGN KEY ("technologyCardId") REFERENCES "technology_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_snapshots" ADD CONSTRAINT "season_snapshots_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_stage_progress" ADD CONSTRAINT "season_stage_progress_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_history" ADD CONSTRAINT "season_history_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_cards" ADD CONSTRAINT "technology_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_card_operations" ADD CONSTRAINT "technology_card_operations_technologyCardId_fkey" FOREIGN KEY ("technologyCardId") REFERENCES "technology_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technology_card_resources" ADD CONSTRAINT "technology_card_resources_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "technology_card_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "technology_card_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_resource_actuals" ADD CONSTRAINT "task_resource_actuals_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_onboarding_plans" ADD CONSTRAINT "hr_onboarding_plans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_support_cases" ADD CONSTRAINT "hr_support_cases_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_definitions" ADD CONSTRAINT "role_definitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_scorecards" ADD CONSTRAINT "crm_scorecards_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_scorecards" ADD CONSTRAINT "crm_scorecards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_activeTechMapId_fkey" FOREIGN KEY ("activeTechMapId") REFERENCES "tech_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_plans" ADD CONSTRAINT "harvest_plans_activeBudgetPlanId_fkey" FOREIGN KEY ("activeBudgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_performance_contracts" ADD CONSTRAINT "harvest_performance_contracts_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_performance_contracts" ADD CONSTRAINT "harvest_performance_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_generationRecordId_fkey" FOREIGN KEY ("generationRecordId") REFERENCES "generation_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_maps" ADD CONSTRAINT "tech_maps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_map_stages" ADD CONSTRAINT "tech_map_stages_techMapId_fkey" FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_map_operations" ADD CONSTRAINT "tech_map_operations_mapStageId_fkey" FOREIGN KEY ("mapStageId") REFERENCES "tech_map_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_map_resources" ADD CONSTRAINT "tech_map_resources_mapOperationId_fkey" FOREIGN KEY ("mapOperationId") REFERENCES "tech_map_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agronomic_strategies" ADD CONSTRAINT "agronomic_strategies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_records" ADD CONSTRAINT "generation_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_configs" ADD CONSTRAINT "governance_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divergence_records" ADD CONSTRAINT "divergence_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divergence_records" ADD CONSTRAINT "divergence_records_disVersion_fkey" FOREIGN KEY ("disVersion") REFERENCES "governance_configs"("versionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_records" ADD CONSTRAINT "consulting_execution_records_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "tech_map_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_records" ADD CONSTRAINT "consulting_execution_records_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_records" ADD CONSTRAINT "consulting_execution_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_execution_logs" ADD CONSTRAINT "consulting_execution_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "consulting_execution_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_harvestPlanId_fkey" FOREIGN KEY ("harvestPlanId") REFERENCES "harvest_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "consulting_budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_deviation_reviews" ADD CONSTRAINT "cmr_deviation_reviews_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "field_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "cmr_insurance_coverages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_risks" ADD CONSTRAINT "cmr_risks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cmr_insurance_coverages" ADD CONSTRAINT "cmr_insurance_coverages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_deviationReviewId_fkey" FOREIGN KEY ("deviationReviewId") REFERENCES "cmr_deviation_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "consulting_budget_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "tenant_states" ADD CONSTRAINT "tenant_states_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economic_events" ADD CONSTRAINT "economic_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_economicEventId_fkey" FOREIGN KEY ("economicEventId") REFERENCES "economic_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "consulting_execution_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "consulting_cash_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulting_cash_accounts" ADD CONSTRAINT "consulting_cash_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_edges" ADD CONSTRAINT "knowledge_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vision_observations" ADD CONSTRAINT "vision_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellite_observations" ADD CONSTRAINT "satellite_observations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_state_history" ADD CONSTRAINT "risk_state_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_records" ADD CONSTRAINT "decision_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

