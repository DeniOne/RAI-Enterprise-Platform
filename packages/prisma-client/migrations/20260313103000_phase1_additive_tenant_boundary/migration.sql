-- Phase 1: additive tenancy boundary for control-plane/runtime contour.
-- Non-destructive strategy:
--   1) Add platform-level Tenant + TenantCompanyBinding.
--   2) Add nullable tenantId on selected control-plane/runtime models.
--   3) Keep companyId compatibility path untouched.

CREATE TYPE "TenantLifecycleStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "displayName" TEXT,
  "status" "TenantLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_key_key" ON "tenants"("key");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

CREATE TABLE "tenant_company_bindings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unboundAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tenant_company_bindings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_company_binding_unique"
  ON "tenant_company_bindings"("tenantId", "companyId");
CREATE INDEX "tenant_company_bindings_tenantId_isActive_idx"
  ON "tenant_company_bindings"("tenantId", "isActive");
CREATE INDEX "tenant_company_bindings_companyId_isActive_idx"
  ON "tenant_company_bindings"("companyId", "isActive");

ALTER TABLE "tenant_company_bindings"
  ADD CONSTRAINT "tenant_company_bindings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_company_bindings"
  ADD CONSTRAINT "tenant_company_bindings_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_states" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "tenant_states_tenantId_idx" ON "tenant_states"("tenantId");

ALTER TABLE "agent_configurations" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "agent_configurations_tenantId_idx" ON "agent_configurations"("tenantId");

ALTER TABLE "agent_capability_bindings" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "agent_capability_bindings_tenantId_role_idx"
  ON "agent_capability_bindings"("tenantId", "role");

ALTER TABLE "agent_tool_bindings" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "agent_tool_bindings_tenantId_role_idx"
  ON "agent_tool_bindings"("tenantId", "role");

ALTER TABLE "agent_connector_bindings" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "agent_connector_bindings_tenantId_role_idx"
  ON "agent_connector_bindings"("tenantId", "role");

ALTER TABLE "agent_config_change_requests" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "agent_config_change_requests_tenantId_role_idx"
  ON "agent_config_change_requests"("tenantId", "role");
CREATE INDEX "agent_config_change_requests_tenantId_status_idx"
  ON "agent_config_change_requests"("tenantId", "status");

ALTER TABLE "runtime_governance_events" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "runtime_governance_events_tenantId_idx"
  ON "runtime_governance_events"("tenantId");
CREATE INDEX "runtime_governance_events_tenantId_eventType_createdAt_idx"
  ON "runtime_governance_events"("tenantId", "eventType", "createdAt");
CREATE INDEX "runtime_governance_events_tenantId_agentRole_createdAt_idx"
  ON "runtime_governance_events"("tenantId", "agentRole", "createdAt");

ALTER TABLE "system_incidents" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "system_incidents_tenantId_idx" ON "system_incidents"("tenantId");
CREATE INDEX "system_incidents_tenantId_status_idx"
  ON "system_incidents"("tenantId", "status");

ALTER TABLE "incident_runbook_executions" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "incident_runbook_executions_tenantId_createdAt_idx"
  ON "incident_runbook_executions"("tenantId", "createdAt");

ALTER TABLE "pending_actions" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "pending_actions_tenantId_idx" ON "pending_actions"("tenantId");
CREATE INDEX "pending_actions_tenantId_status_createdAt_idx"
  ON "pending_actions"("tenantId", "status", "createdAt");

ALTER TABLE "performance_metrics" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "performance_metrics_tenantId_idx"
  ON "performance_metrics"("tenantId");
CREATE INDEX "performance_metrics_tenantId_metricType_timestamp_idx"
  ON "performance_metrics"("tenantId", "metricType", "timestamp");

ALTER TABLE "eval_runs" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "eval_runs_tenantId_role_createdAt_idx"
  ON "eval_runs"("tenantId", "role", "createdAt");

ALTER TABLE "event_consumptions" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "event_consumptions_tenantId_processedAt_idx"
  ON "event_consumptions"("tenantId", "processedAt");

ALTER TABLE "memory_interactions" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "memory_interactions_tenantId_idx"
  ON "memory_interactions"("tenantId");

ALTER TABLE "memory_episodes" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "memory_episodes_tenantId_idx"
  ON "memory_episodes"("tenantId");

ALTER TABLE "memory_profiles" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "memory_profiles_tenantId_idx"
  ON "memory_profiles"("tenantId");
