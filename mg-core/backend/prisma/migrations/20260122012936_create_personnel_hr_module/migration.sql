-- CreateEnum
CREATE TYPE "HREventType" AS ENUM ('EMPLOYEE_HIRED', 'EMPLOYEE_TRANSFERRED', 'EMPLOYEE_PROMOTED', 'EMPLOYEE_DEMOTED', 'EMPLOYEE_SUSPENDED', 'EMPLOYEE_DISMISSED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_EXPIRED', 'ORDER_CREATED', 'ORDER_SIGNED', 'ORDER_CANCELLED', 'CONTRACT_SIGNED', 'CONTRACT_AMENDED', 'CONTRACT_TERMINATED', 'FILE_ARCHIVED');

-- CreateEnum
CREATE TYPE "HRAggregateType" AS ENUM ('PERSONAL_FILE', 'PERSONNEL_ORDER', 'LABOR_CONTRACT', 'PERSONNEL_DOCUMENT');

-- CreateEnum
CREATE TYPE "HRStatus" AS ENUM ('ONBOARDING', 'PROBATION', 'EMPLOYED', 'SUSPENDED', 'LEAVE', 'TERMINATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PersonnelDocumentType" AS ENUM ('PASSPORT', 'SNILS', 'INN', 'EDUCATION_DIPLOMA', 'MILITARY_ID', 'WORK_BOOK', 'PHOTO', 'MEDICAL_BOOK', 'DRIVING_LICENSE', 'CERTIFICATE', 'REFERENCE_LETTER', 'NDA', 'PD_CONSENT', 'JOB_DESCRIPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "PersonnelOrderType" AS ENUM ('HIRING', 'TRANSFER', 'VACATION', 'VACATION_CANCEL', 'BUSINESS_TRIP', 'BONUS', 'SALARY_CHANGE', 'DISCIPLINARY', 'DISCIPLINARY_REMOVE', 'DISMISSAL', 'POSITION_CHANGE', 'SCHEDULE_CHANGE', 'LEAVE_WITHOUT_PAY', 'MATERNITY_LEAVE', 'PARENTAL_LEAVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'FIXED_TERM', 'PART_TIME', 'CIVIL', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractSalaryType" AS ENUM ('MONTHLY', 'HOURLY', 'PIECEWORK');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('LABOR_CONTRACT', 'ORDER_HIRING', 'ORDER_DISMISSAL', 'ORDER_VACATION', 'ORDER_TRANSFER', 'CERTIFICATE_WORK', 'NDA', 'PD_CONSENT');

-- CreateTable
CREATE TABLE "hr_domain_events" (
    "id" TEXT NOT NULL,
    "eventType" "HREventType" NOT NULL,
    "aggregateType" "HRAggregateType" NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "legalBasis" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_files" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "hrStatus" "HRStatus" NOT NULL DEFAULT 'ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "archiveId" TEXT,

    CONSTRAINT "personal_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_documents" (
    "id" TEXT NOT NULL,
    "personalFileId" TEXT NOT NULL,
    "documentType" "PersonnelDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "issuer" TEXT,
    "documentNumber" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libraryDocumentId" TEXT,

    CONSTRAINT "personnel_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_orders" (
    "id" TEXT NOT NULL,
    "personalFileId" TEXT NOT NULL,
    "orderType" "PersonnelOrderType" NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "basis" TEXT,
    "fileId" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retentionYears" INTEGER NOT NULL DEFAULT 75,

    CONSTRAINT "personnel_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_contracts" (
    "id" TEXT NOT NULL,
    "personalFileId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contractType" "ContractType" NOT NULL,
    "positionId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "salaryType" "ContractSalaryType" NOT NULL DEFAULT 'MONTHLY',
    "workSchedule" TEXT NOT NULL,
    "probationDays" INTEGER NOT NULL DEFAULT 0,
    "fileId" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "terminationDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_amendments" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "amendmentNumber" INTEGER NOT NULL,
    "amendmentDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "changes" JSONB NOT NULL,
    "fileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "templateType" "TemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_domain_events_aggregateId_eventType_idx" ON "hr_domain_events"("aggregateId", "eventType");

-- CreateIndex
CREATE INDEX "hr_domain_events_occurredAt_idx" ON "hr_domain_events"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "personal_files_employeeId_key" ON "personal_files"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_files_fileNumber_key" ON "personal_files"("fileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_orders_orderNumber_key" ON "personnel_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "labor_contracts_contractNumber_key" ON "labor_contracts"("contractNumber");

-- AddForeignKey
ALTER TABLE "personal_files" ADD CONSTRAINT "personal_files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_documents" ADD CONSTRAINT "personnel_documents_personalFileId_fkey" FOREIGN KEY ("personalFileId") REFERENCES "personal_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_orders" ADD CONSTRAINT "personnel_orders_personalFileId_fkey" FOREIGN KEY ("personalFileId") REFERENCES "personal_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labor_contracts" ADD CONSTRAINT "labor_contracts_personalFileId_fkey" FOREIGN KEY ("personalFileId") REFERENCES "personal_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "labor_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- CRITICAL CONSTRAINTS (Module 33 — Personnel HR Records)
-- ============================================================================

-- CONSTRAINT 1: Prevent DELETE on PersonalFile (use hrStatus lifecycle instead)
CREATE OR REPLACE FUNCTION prevent_personal_file_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE forbidden on personal_files. Use hrStatus lifecycle instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_personal_files
BEFORE DELETE ON personal_files
FOR EACH ROW EXECUTE FUNCTION prevent_personal_file_delete();

-- CONSTRAINT 2: Prevent DELETE on PersonnelOrder (use status = CANCELLED instead)
CREATE OR REPLACE FUNCTION prevent_personnel_order_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE forbidden on personnel_orders. Use status = CANCELLED instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_personnel_orders
BEFORE DELETE ON personnel_orders
FOR EACH ROW EXECUTE FUNCTION prevent_personnel_order_delete();

-- CONSTRAINT 3: Prevent DELETE on LaborContract (use status = TERMINATED instead)
CREATE OR REPLACE FUNCTION prevent_labor_contract_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE forbidden on labor_contracts. Use status = TERMINATED instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_labor_contracts
BEFORE DELETE ON labor_contracts
FOR EACH ROW EXECUTE FUNCTION prevent_labor_contract_delete();

-- CONSTRAINT 4: Prevent UPDATE/DELETE on HRDomainEvent (append-only)
CREATE OR REPLACE FUNCTION prevent_hr_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'hr_domain_events is append-only. UPDATE/DELETE forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update_hr_events
BEFORE UPDATE ON hr_domain_events
FOR EACH ROW EXECUTE FUNCTION prevent_hr_event_mutation();

CREATE TRIGGER no_delete_hr_events
BEFORE DELETE ON hr_domain_events
FOR EACH ROW EXECUTE FUNCTION prevent_hr_event_mutation();

-- CONSTRAINT 5: Enforce archiveId when hrStatus = ARCHIVED
ALTER TABLE personal_files
ADD CONSTRAINT archived_requires_archive_id
CHECK (
  ("hrStatus" != 'ARCHIVED') OR 
  ("hrStatus" = 'ARCHIVED' AND "archiveId" IS NOT NULL)
);

-- ============================================================================
-- END OF CRITICAL CONSTRAINTS
-- ============================================================================
