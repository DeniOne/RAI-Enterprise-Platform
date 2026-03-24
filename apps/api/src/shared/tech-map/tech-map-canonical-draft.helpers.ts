import { Prisma, TechMapStatus } from "@rai/prisma-client";
import type {
  TechMapApprovalPacket,
  TechMapCanonicalDraft,
  TechMapEvidenceBundle,
  TechMapFinancialSummary,
  TechMapInputPlan,
  TechMapRiskRegisterItem,
  TechMapVariant,
} from "./tech-map-governed-artifact.types";
import {
  assessTechMapGovernedDraftContext,
  type TechMapGovernedDraftRuntimeContext,
} from "./tech-map-governed-draft.helpers";
import type {
  TechMapApprovalStatus,
  TechMapContextReadiness,
  TechMapPersistenceStatus,
  TechMapPublicationState,
  TechMapReviewStatus,
  TechMapWorkflowVerdict,
} from "./tech-map-governed-state.types";
import { TECH_MAP_CANONICAL_DRAFT_INCLUDE } from "./tech-map-prisma-includes";
import type { TechMapGovernedDraftAssessmentResult } from "./tech-map-governed-draft.helpers";
import type { TechMapWorkflowVerdictAggregationInput } from "./tech-map-governed-branch.types";
import { aggregateTechMapWorkflowVerdict } from "./tech-map-governed-verdict.helpers";

export type TechMapCanonicalDraftSource = Prisma.TechMapGetPayload<{
  include: typeof TECH_MAP_CANONICAL_DRAFT_INCLUDE;
}>;

type TechMapCanonicalOperationSource =
  TechMapCanonicalDraftSource["stages"][number]["operations"][number];

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => Boolean(value)))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") {
      return [item];
    }

    if (!isRecord(item)) {
      return [];
    }

    const candidate =
      item.operationId ??
      item.operation_id ??
      item.id ??
      item.ref ??
      item.reference;

    return typeof candidate === "string" ? [candidate] : [];
  });
}

function normalizeMethodologyProfileId(
  generationMetadata: Prisma.JsonValue | null | undefined,
  techMapId: string,
  crop: string,
  version: number,
): string {
  if (isRecord(generationMetadata)) {
    const source =
      typeof generationMetadata.source === "string"
        ? generationMetadata.source
        : null;
    const blueprintVersion =
      typeof generationMetadata.blueprintVersion === "string"
        ? generationMetadata.blueprintVersion
        : null;
    const explicitMethodologyProfileId =
      typeof generationMetadata.methodologyProfileId === "string"
        ? generationMetadata.methodologyProfileId
        : null;

    if (explicitMethodologyProfileId) {
      return explicitMethodologyProfileId;
    }

    if (source && blueprintVersion) {
      return `${source}:${blueprintVersion}`;
    }

    if (source) {
      return source;
    }
  }

  return `techmap:${techMapId}:methodology:${crop}:${version}`;
}

function normalizeBaselineContextHash(
  map: TechMapCanonicalDraftSource,
  methodologyProfileId: string,
): string {
  if (isRecord(map.generationMetadata)) {
    const hash =
      typeof map.generationMetadata.hash === "string"
        ? map.generationMetadata.hash
        : null;
    if (hash) {
      return hash;
    }
  }

  if (typeof map.basePlanHash === "string" && map.basePlanHash.trim()) {
    return map.basePlanHash;
  }

  return [
    map.id,
    map.companyId,
    map.harvestPlanId,
    map.seasonId ?? "",
    map.crop,
    String(map.version),
    methodologyProfileId,
  ].join("|");
}

function resolveSourceWorkflowMode(
  map: TechMapCanonicalDraftSource,
): "new_draft" | "rebuild" | "comparison" {
  if (map.status === TechMapStatus.OVERRIDE_ANALYSIS) {
    return "comparison";
  }

  if (map.version > 1 || Boolean(map.generationRecordId)) {
    return "rebuild";
  }

  return "new_draft";
}

function resolvePublicationState(
  map: TechMapCanonicalDraftSource,
  assessment: TechMapGovernedDraftAssessmentResult,
): TechMapPublicationState {
  if (map.status === TechMapStatus.ACTIVE) {
    return "PUBLISHED";
  }

  if (map.status === TechMapStatus.APPROVED) {
    return "PUBLISHABLE";
  }

  if (map.status === TechMapStatus.REVIEW) {
    return assessment.workflowVerdict === "BLOCKED"
      ? "REVIEW_REQUIRED"
      : "APPROVAL_REQUIRED";
  }

  if (map.status === TechMapStatus.ARCHIVED) {
    return "SUPERSEDED";
  }

  return "GOVERNED_DRAFT";
}

function resolveReviewStatus(
  map: TechMapCanonicalDraftSource,
  assessment: TechMapGovernedDraftAssessmentResult,
): TechMapReviewStatus {
  if (map.status === TechMapStatus.ACTIVE) {
    return "REVIEW_PASSED";
  }

  if (map.status === TechMapStatus.APPROVED) {
    return "REVIEW_PASSED";
  }

  if (map.status === TechMapStatus.REVIEW) {
    return assessment.workflowVerdict === "BLOCKED"
      ? "REVISION_REQUIRED"
      : "IN_REVIEW";
  }

  if (assessment.readiness === "S5_PUBLISHABLE") {
    return "REVIEW_PASSED";
  }

  if (assessment.readiness === "S4_REVIEW_READY") {
    return "QUEUED";
  }

  return "NOT_SUBMITTED";
}

function resolveApprovalStatus(
  map: TechMapCanonicalDraftSource,
): TechMapApprovalStatus {
  if (
    map.status === TechMapStatus.APPROVED ||
    map.status === TechMapStatus.ACTIVE
  ) {
    return "APPROVED";
  }

  if (map.status === TechMapStatus.REVIEW) {
    return "PENDING_APPROVAL";
  }

  return "NOT_REQUESTED";
}

function resolvePersistenceStatus(
  map: TechMapCanonicalDraftSource,
): TechMapPersistenceStatus {
  if (map.status === TechMapStatus.ARCHIVED) {
    return "ARCHIVED";
  }

  if (map.status === TechMapStatus.ACTIVE) {
    return "PUBLICATION_SNAPSHOT_PERSISTED";
  }

  if (map.status === TechMapStatus.APPROVED) {
    return "APPROVAL_SNAPSHOT_PERSISTED";
  }

  if (map.status === TechMapStatus.REVIEW) {
    return "REVIEW_PACKET_PERSISTED";
  }

  return "DRAFT_PERSISTED";
}

function resolveFieldIds(map: TechMapCanonicalDraftSource): string[] {
  return uniqueStrings([
    map.fieldId ?? "",
    map.field?.id ?? "",
    map.cropZone.fieldId ?? "",
    map.cropZone.field?.id ?? "",
  ]);
}

function resolveFarmId(map: TechMapCanonicalDraftSource): string {
  return (
    map.harvestPlan.accountId ||
    map.season?.farmId ||
    map.cropZone.field.clientId ||
    map.companyId
  );
}

function buildTechMapGovernedDraftRuntimeContext(
  map: TechMapCanonicalDraftSource,
  methodologyProfileId: string,
): TechMapGovernedDraftRuntimeContext {
  const operations = map.stages.flatMap((stage) => stage.operations);
  const resources = operations.flatMap((operation) => operation.resources);

  return {
    legalEntityId: map.companyId,
    farmId: resolveFarmId(map),
    fieldIds: resolveFieldIds(map),
    seasonId: map.seasonId ?? map.cropZone.seasonId,
    cropCode: map.crop,
    predecessorCrop: map.precursor ?? map.cropZone.predecessorCrop ?? null,
    soilProfileSampleDate: map.updatedAt,
    targetYieldProfile:
      map.cropZone.targetYieldTHa ??
      map.season?.expectedYield ??
      map.harvestPlan.optValue ??
      map.harvestPlan.baselineValue ??
      null,
    hasFieldHistory: map.version > 1,
    seedOrHybrid:
      map.cropZone.varietyHybrid ??
      map.cropZone.cropVarietyId ??
      map.season?.cropVarietyId ??
      null,
    hasMachineryProfile: operations.some((operation) =>
      Boolean(operation.requiredMachineryType),
    ),
    hasLaborOrContractorProfile: resources.some((resource) =>
      /service|contract|labor/i.test(resource.type),
    ),
    hasInputAvailability: resources.some((resource) =>
      Boolean(resource.inputCatalogId),
    ),
    hasBudgetPolicy:
      map.budgetCapRubHa !== null ||
      map.budgetCapRubHa !== undefined ||
      map.harvestPlan.minValue !== null ||
      map.harvestPlan.minValue !== undefined ||
      map.harvestPlan.optValue !== null ||
      map.harvestPlan.optValue !== undefined ||
      map.harvestPlan.maxValue !== null ||
      map.harvestPlan.maxValue !== undefined ||
      map.harvestPlan.baselineValue !== null ||
      map.harvestPlan.baselineValue !== undefined,
    hasPriceBookVersion: resources.some((resource) =>
      Boolean(resource.costPerUnit),
    ),
    hasCurrencyTaxMode: Boolean(map.harvestPlan.performanceContract?.modelType),
    hasWeatherNormals: operations.some((operation) =>
      Boolean(operation.weatherConstraints),
    ),
    hasForecastWindow: operations.some(
      (operation) =>
        Boolean(
          operation.dateWindowStart ||
            operation.dateWindowEnd ||
            operation.plannedStartTime ||
            operation.plannedEndTime,
        ),
    ),
    hasIrrigationOrWaterConstraints: Boolean(
      map.cropZone.constraints ?? map.field?.protectedZoneFlags,
    ),
    hasPreviousTechMap: map.version > 1,
    hasExecutionHistory: Boolean(
      map.approvedAt || map.operationsSnapshot || map.resourceNormsSnapshot,
    ),
    hasPastOutcomes: Boolean(map.season?.actualYield),
    methodologyProfileId,
    hasAllowedInputCatalogVersion: resources.some((resource) =>
      Boolean(resource.inputCatalogId),
    ),
    contractMode: map.harvestPlan.performanceContract?.modelType ?? null,
    hasTargetKpiPolicy: Boolean(
      map.harvestPlan.targetMetric ?? map.harvestPlan.period,
    ),
  };
}

function buildOperationCode(
  operation: TechMapCanonicalOperationSource,
): string {
  return (
    (typeof operation.operationType === "string" && operation.operationType) ||
    operation.name
  );
}

function buildInputCategory(
  type: string,
): TechMapInputPlan["category"] {
  const normalized = type.toLowerCase();

  if (normalized.includes("seed")) {
    return "seed";
  }

  if (normalized.includes("fert")) {
    return "fertilizer";
  }

  if (
    normalized.includes("crop") ||
    normalized.includes("pest") ||
    normalized.includes("herb") ||
    normalized.includes("fung") ||
    normalized.includes("chem")
  ) {
    return "crop_protection";
  }

  if (normalized.includes("fuel")) {
    return "fuel";
  }

  if (normalized.includes("service") || normalized.includes("contract")) {
    return "service";
  }

  return "other";
}

function buildInputPlans(
  map: TechMapCanonicalDraftSource,
  operations: TechMapCanonicalOperationSource[],
): TechMapInputPlan[] {
  return operations.flatMap((operation) =>
    operation.resources.map((resource) => ({
      input_plan_id: resource.id,
      input_code: resource.inputCatalogId ?? `${resource.type}:${resource.id}`,
      category: buildInputCategory(resource.type),
    rate_per_ha:
      resource.minRate ?? resource.maxRate ?? undefined,
      total_quantity: resource.amount,
      unit: resource.plannedRateUnit ?? resource.unit,
      operation_ref: operation.id,
      allowed_by_catalog: Boolean(resource.inputCatalogId),
      evidence_refs: uniqueStrings([
        `techmap:${map.id}:resource:${resource.id}`,
        ...(resource.inputCatalogId ? [`input:${resource.inputCatalogId}`] : []),
        ...(typeof resource.costPerUnit === "number"
          ? [`cost:${map.id}:${resource.id}`]
          : []),
      ]),
    })),
  );
}

function buildFinancialSummary(
  map: TechMapCanonicalDraftSource,
  operations: TechMapCanonicalOperationSource[],
): TechMapFinancialSummary {
  const resources = operations.flatMap((operation) => operation.resources);
  const directCostTotal = resources.reduce((sum, resource) => {
    const unitCost =
      typeof resource.costPerUnit === "number" ? resource.costPerUnit : 0;
    return sum + unitCost * resource.amount;
  }, 0);
  const areaHa = map.field?.area ?? map.cropZone.field.area ?? 0;
  const totalCost = directCostTotal;
  const costPerHa = areaHa > 0 ? totalCost / areaHa : totalCost;
  const targetYield =
    map.cropZone.targetYieldTHa ??
    map.season?.expectedYield ??
    map.harvestPlan.optValue ??
    map.harvestPlan.baselineValue ??
    0;
  const budgetCap = map.budgetCapRubHa ?? map.harvestPlan.maxValue ?? null;

  const budgetFit: TechMapFinancialSummary["budget_fit"] =
    budgetCap === null
      ? "WITHIN_POLICY"
      : costPerHa <= budgetCap
        ? "WITHIN_POLICY"
        : costPerHa <= budgetCap * 1.1
          ? "OVERRIDE_REQUIRED"
          : "OUT_OF_POLICY";

  return {
    currency: "RUB",
    area_ha: areaHa,
    direct_cost_total: directCostTotal,
    indirect_cost_total: undefined,
    total_cost: totalCost,
    cost_per_ha: costPerHa,
    target_yield: targetYield,
    break_even_yield: undefined,
    expected_revenue: undefined,
    expected_margin: undefined,
    roi_pct: undefined,
    budget_fit: budgetFit,
  };
}

function buildRiskRegister(
  map: TechMapCanonicalDraftSource,
  assessment: TechMapGovernedDraftAssessmentResult,
): TechMapRiskRegisterItem[] {
  return assessment.gaps.map((gap, index) => ({
    risk_id: `risk:${gap.gap_id}:${index}`,
    title: gap.disclosure,
    category:
      gap.kind === "policy_block"
        ? "compliance"
        : gap.kind === "conflict"
          ? "execution"
        : gap.kind === "stale_input"
          ? "weather"
          : gap.kind === "missing_input"
              ? "execution"
              : "financial",
    severity:
      gap.severity === "blocking"
        ? "critical"
        : gap.severity === "review"
          ? "medium"
          : "low",
    probability: gap.severity === "blocking" ? "high" : "medium",
    mitigation: [
      `Закрыть gap ${gap.gap_id}`,
      `Пересобрать canonical draft для ${map.id}`,
    ],
    evidence_refs: uniqueStrings(
      gap.slot_key ? [`slot:${gap.slot_key}`] : [`gap:${gap.gap_id}`],
    ),
  }));
}

function buildEvidenceBundle(
  map: TechMapCanonicalDraftSource,
  operations: TechMapCanonicalOperationSource[],
): TechMapEvidenceBundle {
  const resources = operations.flatMap((operation) => operation.resources);
  const sourceRefs = uniqueStrings([
    `techmap:${map.id}`,
    `harvest-plan:${map.harvestPlanId}`,
    `crop-zone:${map.cropZoneId}`,
    ...(map.seasonId ? [`season:${map.seasonId}`] : []),
    ...(map.generationRecordId
      ? [`generation-record:${map.generationRecordId}`]
      : []),
    ...(map.operationsSnapshot ? [`operations-snapshot:${map.id}`] : []),
    ...(map.resourceNormsSnapshot ? [`resource-norms:${map.id}`] : []),
    ...operations.map((operation) => `operation:${operation.id}`),
    ...resources.map((resource) => `resource:${resource.id}`),
    ...operations.flatMap((operation) =>
      operation.evidence.map((evidence) => `evidence:${evidence.id}`),
    ),
  ]);

  const operationsWithEvidence = operations.filter(
    (operation) =>
      operation.evidence.length > 0 ||
      operation.resources.length > 0 ||
      Boolean(operation.executionRecord),
  );
  const criticalOperations = operations.filter((operation) =>
    Boolean(operation.isCritical),
  );
  const criticalOperationsWithEvidence = criticalOperations.filter(
    (operation) =>
      operation.evidence.length > 0 ||
      operation.resources.length > 0 ||
      Boolean(operation.executionRecord),
  );

  const coveragePct =
    operations.length === 0
      ? 0
      : Math.min(
          100,
          Math.round((operationsWithEvidence.length / operations.length) * 100),
        );
  const publicationCriticalCoveragePct =
    criticalOperations.length === 0
      ? 100
      : Math.min(
          100,
          Math.round(
            (criticalOperationsWithEvidence.length / criticalOperations.length) *
              100,
          ),
        );

  return {
    bundle_id: `evidence:${map.id}:v${map.version}`,
    source_refs: sourceRefs,
    coverage_pct: coveragePct,
    publication_critical_coverage_pct: publicationCriticalCoveragePct,
    unresolved_refs: [],
    freshness_summary: [
      {
        source_ref: `generation-metadata:${map.id}`,
        status: map.generationMetadata ? "fresh" : "unknown",
      },
      {
        source_ref: `operations-snapshot:${map.id}`,
        status: map.operationsSnapshot ? "fresh" : "unknown",
      },
      {
        source_ref: `resource-norms:${map.id}`,
        status: map.resourceNormsSnapshot ? "fresh" : "unknown",
      },
    ],
  };
}

function buildApprovalPacket(
  map: TechMapCanonicalDraftSource,
  auditRefs: string[],
  reviewStatus: TechMapReviewStatus,
  approvalStatus: TechMapApprovalStatus,
  publicationState: TechMapPublicationState,
): TechMapApprovalPacket {
  const baseReviewStatus =
    reviewStatus === "REVIEW_PASSED" ? "approved" : "pending";
  const baseApprovalStatus =
    approvalStatus === "APPROVED" ? "approved" : "pending";

  return {
    packet_id: `approval-packet:${map.id}:v${map.version}`,
    draft_version_id: `${map.id}:v${map.version}`,
    immutable_snapshot_ref: `snapshot:${map.id}:v${map.version}`,
    required_reviews:
      publicationState === "PUBLISHED"
        ? []
        : [
            {
              role: "agronomist",
              status: baseReviewStatus,
            },
            {
              role: "chief_agronomist",
              status:
                reviewStatus === "REVIEW_PASSED" &&
                publicationState !== "REVIEW_REQUIRED"
                  ? "approved"
                  : "pending",
            },
          ],
    required_signoffs:
      publicationState === "PUBLISHED"
        ? []
        : [
            {
              role: "finance",
              mandatory: Boolean(map.harvestPlan.performanceContract),
              status: baseApprovalStatus,
            },
            {
              role: "compliance",
              mandatory: true,
              status:
                publicationState === "PUBLISHABLE" ? "approved" : "pending",
            },
          ],
    locked_fields:
      map.status === TechMapStatus.ACTIVE || map.status === TechMapStatus.ARCHIVED
        ? ["stages", "operationsSnapshot", "resourceNormsSnapshot"]
        : [],
    publication_basis_refs: auditRefs,
  };
}

function buildTechMapVariant(
  map: TechMapCanonicalDraftSource,
  assessment: TechMapGovernedDraftAssessmentResult,
): TechMapVariant {
  const operations = map.stages.flatMap((stage) =>
    stage.operations.map((operation, operationIndex) => ({
      stage,
      operation,
      operationIndex,
    })),
  );
  const flattenedOperations = operations.map(({ stage, operation, operationIndex }) => {
    const operationId = `techmap:${map.id}:operation:${operation.id}`;
    const resourceRefs = operation.resources.map(
      (resource) => `techmap:${map.id}:input:${resource.id}`,
    );
    const evidenceRefs = uniqueStrings([
      `techmap:${map.id}:operation:${operation.id}`,
      ...operation.evidence.map((evidence) => `evidence:${evidence.id}`),
      ...resourceRefs,
    ]);

    return {
      operation_id: operationId,
      stage_code: stage.aplStageId ?? `stage-${stage.sequence}`,
      operation_code: buildOperationCode(operation),
      title: operation.name,
      sequence_no: stage.sequence * 100 + operationIndex + 1,
      planned_window: {
        start_date:
          operation.plannedStartTime?.toISOString() ??
          operation.dateWindowStart?.toISOString(),
        end_date:
          operation.plannedEndTime?.toISOString() ??
          operation.dateWindowEnd?.toISOString(),
        agronomic_trigger:
          operation.bbchWindowFrom || operation.bbchWindowTo
            ? [operation.bbchWindowFrom, operation.bbchWindowTo]
                .filter((value) => Boolean(value))
                .join(" - ")
            : undefined,
      },
      dependencies: toStringArray(operation.dependencies),
      input_plan_refs: resourceRefs,
      machinery_requirement_refs: operation.requiredMachineryType
        ? [`machinery:${operation.requiredMachineryType}`]
        : [],
      basis_statement_refs: evidenceRefs,
      publication_critical: Boolean(operation.isCritical),
    };
  });

  const inputPlans = buildInputPlans(map, operations.map(({ operation }) => operation));
  const financialSummary = buildFinancialSummary(
    map,
    operations.map(({ operation }) => operation),
  );
  const riskRegister = buildRiskRegister(map, assessment);
  const evidenceBundle = buildEvidenceBundle(
    map,
    operations.map(({ operation }) => operation),
  );

  return {
    variant_id: `techmap:${map.id}:variant:primary`,
    label: "Основной канонический вариант",
    objective: "base",
    overrides: {},
    operations: flattenedOperations,
    input_plan: inputPlans,
    financial_summary: financialSummary,
    risk_register: riskRegister,
    evidence_bundle: evidenceBundle,
    overall_verdict: assessment.workflowVerdict,
  };
}

function resolveWorkflowVerdict(
  map: TechMapCanonicalDraftSource,
  assessment: TechMapGovernedDraftAssessmentResult,
): TechMapWorkflowVerdict {
  if (map.status === TechMapStatus.ACTIVE) {
    return assessment.workflowVerdict === "BLOCKED"
      ? "PARTIAL"
      : "VERIFIED";
  }

  if (map.status === TechMapStatus.APPROVED) {
    return assessment.workflowVerdict === "BLOCKED"
      ? "PARTIAL"
      : "PARTIAL";
  }

  return aggregateTechMapWorkflowVerdict({
    requested_artifact: "workflow_draft",
    selected_variant_verdict: assessment.workflowVerdict,
    publication_critical_branch_verdicts: [assessment.workflowVerdict],
    primary_artifact_branch_verdict: assessment.workflowVerdict,
    advisory_branch_verdicts: [],
    expert_review_verdict: "SKIPPED",
    unresolved_blocking_gaps: assessment.gaps.filter(
      (gap) => gap.severity === "blocking",
    ).length,
    unresolved_hard_blocks: assessment.missingMust.length,
  } satisfies TechMapWorkflowVerdictAggregationInput);
}

export function assertTechMapCanonicalDraftInvariants(
  draft: TechMapCanonicalDraft,
): void {
  if (!draft.header.workflow_id) {
    throw new Error("TechMap canonical draft missing workflow_id");
  }

  if (!draft.header.legal_entity_id) {
    throw new Error("TechMap canonical draft missing legal_entity_id");
  }

  if (draft.header.field_ids.length === 0) {
    throw new Error("TechMap canonical draft missing field_ids");
  }

  if (draft.variants.length === 0) {
    throw new Error("TechMap canonical draft must contain at least one variant");
  }

  if (!draft.selected_variant_id) {
    throw new Error("TechMap canonical draft missing selected_variant_id");
  }

  if (
    !draft.variants.some(
      (variant) => variant.variant_id === draft.selected_variant_id,
    )
  ) {
    throw new Error(
      "TechMap canonical draft selected_variant_id must point to an existing variant",
    );
  }
}

export function buildTechMapCanonicalDraftFromTechMap(
  map: TechMapCanonicalDraftSource,
): TechMapCanonicalDraft {
  const methodologyProfileId = normalizeMethodologyProfileId(
    map.generationMetadata,
    map.id,
    map.crop,
    map.version,
  );
  const assessment = assessTechMapGovernedDraftContext(
    buildTechMapGovernedDraftRuntimeContext(map, methodologyProfileId),
  );
  const publicationState = resolvePublicationState(map, assessment);
  const reviewStatus = resolveReviewStatus(map, assessment);
  const approvalStatus = resolveApprovalStatus(map);
  const persistenceStatus = resolvePersistenceStatus(map);
  const workflowVerdict = resolveWorkflowVerdict(map, assessment);
  const variant = buildTechMapVariant(map, assessment);
  const auditRefs = uniqueStrings([
    `techmap:${map.id}`,
    `techmap:${map.id}:v${map.version}`,
    `techmap:${map.id}:season:${map.seasonId ?? map.cropZone.seasonId}`,
    `techmap:${map.id}:crop-zone:${map.cropZoneId}`,
    ...(map.generationRecordId
      ? [`generation-record:${map.generationRecordId}`]
      : []),
    ...(map.approvedAt ? [`approved-at:${map.approvedAt.toISOString()}`] : []),
  ]);

  const draft: TechMapCanonicalDraft = {
    header: {
      workflow_id: `techmap:${map.id}:v${map.version}`,
      tech_map_id: map.id,
      version_id: `${map.id}:v${map.version}`,
      legal_entity_id: map.companyId,
      farm_id: resolveFarmId(map),
      field_ids: resolveFieldIds(map),
      season_id: map.seasonId ?? map.cropZone.seasonId,
      crop_code: map.crop,
      methodology_profile_id: methodologyProfileId,
      baseline_context_hash: normalizeBaselineContextHash(
        map,
        methodologyProfileId,
      ),
      source_workflow_mode: resolveSourceWorkflowMode(map),
    },
    readiness: assessment.readiness as TechMapContextReadiness,
    workflow_verdict: workflowVerdict,
    publication_state: publicationState,
    review_status: reviewStatus,
    approval_status: approvalStatus,
    persistence_status: persistenceStatus,
    slot_ledger_ref: `slot-ledger:${map.id}:v${map.version}`,
    assumptions: assessment.assumptions,
    gaps: assessment.gaps,
    conflicts: [],
    variants: [variant],
    selected_variant_id: variant.variant_id,
    approval_packet: buildApprovalPacket(
      map,
      auditRefs,
      reviewStatus,
      approvalStatus,
      publicationState,
    ),
    audit_refs: auditRefs,
  };

  assertTechMapCanonicalDraftInvariants(draft);

  return draft;
}
