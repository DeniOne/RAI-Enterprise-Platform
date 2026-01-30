-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SHIFT_STARTED', 'SHIFT_COMPLETED', 'KPI_RECORDED', 'FEEDBACK_SUBMITTED', 'COURSE_COMPLETED', 'TEST_PASSED', 'MENTORING_COMPLETED', 'QUALIFICATION_PROPOSED', 'QUALIFICATION_CHANGED', 'REWARD_GRANTED', 'TASK_CREATED', 'TASK_COMPLETED', 'TRANSACTION_CREATED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "qualification_level_id" TEXT,
ADD COLUMN     "role_id" TEXT;

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_contracts" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "value_product" TEXT NOT NULL,
    "responsibility_zones" JSONB NOT NULL,
    "kpi_definitions" JSONB NOT NULL,
    "permissions" JSONB NOT NULL,
    "growth_paths" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualification_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "requirements" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qualification_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "source" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "source_events" JSONB NOT NULL,
    "calculation_period" TEXT NOT NULL,
    "unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_records" (
    "id" TEXT NOT NULL,
    "kpi_id" TEXT NOT NULL,
    "user_id" TEXT,
    "department_id" TEXT,
    "value" DECIMAL(15,4) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_event_ids" JSONB NOT NULL,

    CONSTRAINT "kpi_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" JSONB NOT NULL,
    "condition" JSONB NOT NULL,
    "reward" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_contracts_role_id_version_key" ON "role_contracts"("role_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "qualification_levels_name_key" ON "qualification_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "qualification_levels_level_key" ON "qualification_levels"("level");

-- CreateIndex
CREATE INDEX "events_type_timestamp_idx" ON "events"("type", "timestamp");

-- CreateIndex
CREATE INDEX "events_subject_id_subject_type_idx" ON "events"("subject_id", "subject_type");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_name_key" ON "kpis"("name");

-- CreateIndex
CREATE INDEX "kpi_records_kpi_id_period_start_period_end_idx" ON "kpi_records"("kpi_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "reward_rules_name_key" ON "reward_rules"("name");

-- AddForeignKey
ALTER TABLE "role_contracts" ADD CONSTRAINT "role_contracts_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_records" ADD CONSTRAINT "kpi_records_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "kpis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_qualification_level_id_fkey" FOREIGN KEY ("qualification_level_id") REFERENCES "qualification_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
