CREATE TYPE "CropForm" AS ENUM ('RAPESEED_WINTER', 'RAPESEED_SPRING');

ALTER TABLE "tech_maps"
  ADD COLUMN "cropForm" "CropForm",
  ADD COLUMN "canonicalBranch" TEXT;

ALTER TABLE "tech_map_stages"
  ADD COLUMN "stageGoal" TEXT,
  ADD COLUMN "bbchScope" JSONB;

ALTER TABLE "soil_profiles"
  ADD COLUMN "compactionDetected" BOOLEAN;

ALTER TABLE "region_profiles"
  ADD COLUMN "agroclimaticZone" TEXT,
  ADD COLUMN "satAvg" DOUBLE PRECISION,
  ADD COLUMN "winterType" TEXT;

ALTER TABLE "crop_zones"
  ADD COLUMN "cropForm" "CropForm";

CREATE TABLE "rule_registry_entries" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "layer" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "confidence" TEXT,
  "description" TEXT,
  "overrideAllowed" BOOLEAN NOT NULL DEFAULT false,
  "sourceVersion" TEXT,
  "companyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rule_registry_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rule_registry_entries_ruleId_key" ON "rule_registry_entries"("ruleId");
CREATE INDEX "rule_registry_entries_companyId_layer_idx" ON "rule_registry_entries"("companyId", "layer");
CREATE INDEX "rule_registry_entries_type_idx" ON "rule_registry_entries"("type");

ALTER TABLE "rule_registry_entries"
  ADD CONSTRAINT "rule_registry_entries_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "threshold_registry" (
  "id" TEXT NOT NULL,
  "thresholdId" TEXT NOT NULL,
  "parameter" TEXT NOT NULL,
  "comparator" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "cropScope" TEXT,
  "stageScope" TEXT,
  "actionOnBreach" TEXT,
  "sourceVersion" TEXT,
  "companyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "threshold_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "threshold_registry_thresholdId_key" ON "threshold_registry"("thresholdId");
CREATE INDEX "threshold_registry_companyId_parameter_idx" ON "threshold_registry"("companyId", "parameter");

ALTER TABLE "threshold_registry"
  ADD CONSTRAINT "threshold_registry_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "field_admission_results" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT,
  "cropZoneId" TEXT NOT NULL,
  "cropForm" "CropForm",
  "verdict" TEXT NOT NULL,
  "isBlocking" BOOLEAN NOT NULL DEFAULT false,
  "blockers" JSONB,
  "requirements" JSONB,
  "recommendations" JSONB,
  "rolloutPolicy" JSONB,
  "traceId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "field_admission_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "field_admission_results_techMapId_key" ON "field_admission_results"("techMapId");
CREATE UNIQUE INDEX "field_admission_results_traceId_key" ON "field_admission_results"("traceId");
CREATE INDEX "field_admission_results_companyId_cropZoneId_idx" ON "field_admission_results"("companyId", "cropZoneId");
CREATE INDEX "field_admission_results_companyId_createdAt_idx" ON "field_admission_results"("companyId", "createdAt");

ALTER TABLE "field_admission_results"
  ADD CONSTRAINT "field_admission_results_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "field_admission_results"
  ADD CONSTRAINT "field_admission_results_cropZoneId_fkey"
  FOREIGN KEY ("cropZoneId") REFERENCES "crop_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_admission_results"
  ADD CONSTRAINT "field_admission_results_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "generation_explanation_traces" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "cropForm" "CropForm",
  "canonicalBranch" TEXT,
  "generationStrategy" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "ruleRegistryVersion" TEXT NOT NULL,
  "ontologyVersion" TEXT NOT NULL,
  "generatorVersion" TEXT,
  "featureFlagSnapshot" JSONB,
  "completenessScore" DOUBLE PRECISION,
  "summary" JSONB NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "generation_explanation_traces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "generation_explanation_traces_techMapId_key" ON "generation_explanation_traces"("techMapId");
CREATE UNIQUE INDEX "generation_explanation_traces_traceId_key" ON "generation_explanation_traces"("traceId");
CREATE INDEX "generation_explanation_traces_companyId_createdAt_idx" ON "generation_explanation_traces"("companyId", "createdAt");

ALTER TABLE "generation_explanation_traces"
  ADD CONSTRAINT "generation_explanation_traces_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generation_explanation_traces"
  ADD CONSTRAINT "generation_explanation_traces_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "decision_gates" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT NOT NULL,
  "gateType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "rationale" JSONB,
  "resolutionNotes" JSONB,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "decision_gates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "decision_gates_techMapId_status_idx" ON "decision_gates"("techMapId", "status");
CREATE INDEX "decision_gates_companyId_status_idx" ON "decision_gates"("companyId", "status");

ALTER TABLE "decision_gates"
  ADD CONSTRAINT "decision_gates_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "decision_gates"
  ADD CONSTRAINT "decision_gates_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "tech_map_recommendations" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT NOT NULL,
  "decisionGateId" TEXT,
  "severity" TEXT NOT NULL,
  "code" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "rationale" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tech_map_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tech_map_recommendations_techMapId_isActive_idx" ON "tech_map_recommendations"("techMapId", "isActive");
CREATE INDEX "tech_map_recommendations_companyId_isActive_idx" ON "tech_map_recommendations"("companyId", "isActive");

ALTER TABLE "tech_map_recommendations"
  ADD CONSTRAINT "tech_map_recommendations_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tech_map_recommendations"
  ADD CONSTRAINT "tech_map_recommendations_decisionGateId_fkey"
  FOREIGN KEY ("decisionGateId") REFERENCES "decision_gates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tech_map_recommendations"
  ADD CONSTRAINT "tech_map_recommendations_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "monitoring_signals" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT NOT NULL,
  "signalType" TEXT NOT NULL,
  "source" TEXT,
  "thresholdLogic" TEXT,
  "severity" TEXT NOT NULL,
  "resultingAction" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "monitoring_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "monitoring_signals_techMapId_isActive_idx" ON "monitoring_signals"("techMapId", "isActive");
CREATE INDEX "monitoring_signals_companyId_signalType_idx" ON "monitoring_signals"("companyId", "signalType");

ALTER TABLE "monitoring_signals"
  ADD CONSTRAINT "monitoring_signals_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "monitoring_signals"
  ADD CONSTRAINT "monitoring_signals_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "tech_map_control_points" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT NOT NULL,
  "mapStageId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "bbchScope" JSONB,
  "requiredObservations" JSONB,
  "acceptanceRanges" JSONB,
  "severityOnFailure" TEXT,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tech_map_control_points_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tech_map_control_points_techMapId_mapStageId_idx" ON "tech_map_control_points"("techMapId", "mapStageId");
CREATE INDEX "tech_map_control_points_companyId_createdAt_idx" ON "tech_map_control_points"("companyId", "createdAt");

ALTER TABLE "tech_map_control_points"
  ADD CONSTRAINT "tech_map_control_points_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tech_map_control_points"
  ADD CONSTRAINT "tech_map_control_points_mapStageId_fkey"
  FOREIGN KEY ("mapStageId") REFERENCES "tech_map_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tech_map_control_points"
  ADD CONSTRAINT "tech_map_control_points_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "rule_evaluation_traces" (
  "id" TEXT NOT NULL,
  "techMapId" TEXT,
  "controlPointId" TEXT,
  "ruleRegistryEntryId" TEXT,
  "traceType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rule_evaluation_traces_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rule_evaluation_traces_techMapId_createdAt_idx" ON "rule_evaluation_traces"("techMapId", "createdAt");
CREATE INDEX "rule_evaluation_traces_controlPointId_createdAt_idx" ON "rule_evaluation_traces"("controlPointId", "createdAt");
CREATE INDEX "rule_evaluation_traces_companyId_traceType_idx" ON "rule_evaluation_traces"("companyId", "traceType");

ALTER TABLE "rule_evaluation_traces"
  ADD CONSTRAINT "rule_evaluation_traces_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rule_evaluation_traces"
  ADD CONSTRAINT "rule_evaluation_traces_controlPointId_fkey"
  FOREIGN KEY ("controlPointId") REFERENCES "tech_map_control_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rule_evaluation_traces"
  ADD CONSTRAINT "rule_evaluation_traces_ruleRegistryEntryId_fkey"
  FOREIGN KEY ("ruleRegistryEntryId") REFERENCES "rule_registry_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "rule_evaluation_traces"
  ADD CONSTRAINT "rule_evaluation_traces_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "control_point_outcome_explanations" (
  "id" TEXT NOT NULL,
  "controlPointId" TEXT NOT NULL,
  "techMapId" TEXT,
  "outcome" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "payload" JSONB,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "control_point_outcome_explanations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "control_point_outcome_explanations_controlPointId_createdAt_idx" ON "control_point_outcome_explanations"("controlPointId", "createdAt");
CREATE INDEX "control_point_outcome_explanations_techMapId_createdAt_idx" ON "control_point_outcome_explanations"("techMapId", "createdAt");
CREATE INDEX "control_point_outcome_explanations_companyId_severity_idx" ON "control_point_outcome_explanations"("companyId", "severity");

ALTER TABLE "control_point_outcome_explanations"
  ADD CONSTRAINT "control_point_outcome_explanations_controlPointId_fkey"
  FOREIGN KEY ("controlPointId") REFERENCES "tech_map_control_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "control_point_outcome_explanations"
  ADD CONSTRAINT "control_point_outcome_explanations_techMapId_fkey"
  FOREIGN KEY ("techMapId") REFERENCES "tech_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "control_point_outcome_explanations"
  ADD CONSTRAINT "control_point_outcome_explanations_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
