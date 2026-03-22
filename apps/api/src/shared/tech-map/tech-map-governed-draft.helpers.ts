import type {
  TechMapAssumption,
  TechMapClarifyItem,
  TechMapGap,
} from "./tech-map-governed-clarify.types";
import {
  TECH_MAP_CONTEXT_READINESS_LEVELS,
  type TechMapContextReadiness,
  type TechMapPublicationState,
  type TechMapWorkflowVerdict,
} from "./tech-map-governed-state.types";
import type { TechMapWorkflowVerdictAggregationInput } from "./tech-map-governed-branch.types";
import { aggregateTechMapWorkflowVerdict } from "./tech-map-governed-verdict.helpers";
import {
  TECH_MAP_SLOT_REGISTRY,
  type TechMapSlotRegistryEntry,
} from "./tech-map-slot-registry";

export interface TechMapGovernedDraftRuntimeContext {
  legalEntityId?: string | null;
  farmId?: string | null;
  fieldIds: string[];
  seasonId?: string | null;
  cropCode?: string | null;
  predecessorCrop?: string | null;
  soilProfileSampleDate?: string | Date | null;
  targetYieldProfile?: number | null;
  hasFieldHistory: boolean;
  seedOrHybrid?: string | null;
  hasMachineryProfile: boolean;
  hasLaborOrContractorProfile: boolean;
  hasInputAvailability: boolean;
  hasBudgetPolicy: boolean;
  hasPriceBookVersion: boolean;
  hasCurrencyTaxMode: boolean;
  hasWeatherNormals: boolean;
  hasForecastWindow: boolean;
  hasIrrigationOrWaterConstraints: boolean;
  hasPreviousTechMap: boolean;
  hasExecutionHistory: boolean;
  hasPastOutcomes: boolean;
  methodologyProfileId?: string | null;
  hasAllowedInputCatalogVersion: boolean;
  contractMode?: string | null;
  hasTargetKpiPolicy: boolean;
}

export interface TechMapGovernedDraftAssessmentResult {
  readiness: TechMapContextReadiness;
  nextReadinessTarget?: TechMapContextReadiness;
  workflowVerdict: TechMapWorkflowVerdict;
  publicationState: TechMapPublicationState;
  missingMust: string[];
  clarifyItems: TechMapClarifyItem[];
  assumptions: TechMapAssumption[];
  gaps: TechMapGap[];
  tasks: string[];
  observedSlotKeys: string[];
}

const readinessOrder = new Map(
  TECH_MAP_CONTEXT_READINESS_LEVELS.map((level, index) => [level, index]),
);

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined && value !== "";
}

function isRequiredSlot(entry: TechMapSlotRegistryEntry): boolean {
  return (
    entry.severity === "REQUIRED_BLOCKING" ||
    entry.severity === "REQUIRED_REVIEW"
  );
}

function humanizeSlotKey(slotKey: string): string {
  return slotKey.replace(/\[\]/g, "").replace(/_/g, " ");
}

function buildResolutionTarget(
  entry: TechMapSlotRegistryEntry,
): "MACHINE_RESOLVABLE" | "USER_RESOLVABLE" | "HUMAN_REVIEW_REQUIRED" {
  if (entry.allowed_sources.includes("user_declared")) {
    return "USER_RESOLVABLE";
  }

  if (entry.impact.review_impact === "BLOCKING") {
    return "HUMAN_REVIEW_REQUIRED";
  }

  return "MACHINE_RESOLVABLE";
}

function buildBlocksPhases(
  entry: TechMapSlotRegistryEntry,
): Array<"branch_execution" | "composition" | "publication"> {
  const phases: Array<"branch_execution" | "composition" | "publication"> = [];

  if (entry.impact.blocks_branch_execution) {
    phases.push("branch_execution");
  }

  if (
    entry.severity === "REQUIRED_REVIEW" ||
    entry.impact.review_impact === "BLOCKING"
  ) {
    phases.push("composition");
  }

  if (
    entry.impact.publication_impact === "BLOCKING" ||
    entry.impact.publication_critical
  ) {
    phases.push("publication");
  }

  return phases;
}

function buildClarifyPriority(entry: TechMapSlotRegistryEntry): number {
  if (entry.severity === "REQUIRED_BLOCKING") {
    return 100;
  }

  if (entry.severity === "REQUIRED_REVIEW") {
    return 70;
  }

  return 40;
}

function buildClarifyItem(entry: TechMapSlotRegistryEntry): TechMapClarifyItem {
  return {
    slot_key: entry.slot_key,
    label: humanizeSlotKey(entry.slot_key),
    group_key: entry.group,
    priority: buildClarifyPriority(entry),
    severity: entry.severity,
    resolution_target: buildResolutionTarget(entry),
    reason: `Отсутствует обязательный контекст ${humanizeSlotKey(entry.slot_key)} для governed-перехода.`,
    blocks_phases: buildBlocksPhases(entry),
    acceptable_sources: [...entry.allowed_sources],
    can_be_assumed: entry.assumption_policy.allowed,
    assumption_kind: entry.assumption_policy.allowed_kinds.find(
      (kind) => kind === "USER_DECLARED" || kind === "METHOD_DEFAULT",
    ) as TechMapClarifyItem["assumption_kind"],
  };
}

function buildGap(entry: TechMapSlotRegistryEntry): TechMapGap {
  return {
    gap_id: `gap:${entry.slot_key}`,
    kind: "missing_input",
    severity:
      entry.severity === "REQUIRED_BLOCKING" ? "blocking" : "review",
    slot_key: entry.slot_key,
    disclosure: `Не хватает контекста ${humanizeSlotKey(entry.slot_key)}.`,
  };
}

function resolveObservedSlotKeys(
  context: TechMapGovernedDraftRuntimeContext,
): string[] {
  const observed = new Set<string>();

  if (hasValue(context.legalEntityId)) observed.add("legal_entity_id");
  if (hasValue(context.farmId)) observed.add("farm_id");
  if (hasValue(context.fieldIds)) observed.add("field_ids[]");
  if (hasValue(context.seasonId)) observed.add("season_id");
  if (hasValue(context.cropCode)) observed.add("crop_code");
  if (hasValue(context.predecessorCrop)) observed.add("predecessor_crop");
  if (hasValue(context.soilProfileSampleDate)) observed.add("soil_profile");
  if (hasValue(context.targetYieldProfile)) observed.add("target_yield_profile");
  if (context.hasFieldHistory) observed.add("field_history");
  if (hasValue(context.seedOrHybrid)) observed.add("seed_or_hybrid");
  if (context.hasMachineryProfile) observed.add("machinery_profile");
  if (context.hasLaborOrContractorProfile) {
    observed.add("labor_or_contractor_profile");
  }
  if (context.hasInputAvailability) observed.add("input_availability");
  if (context.hasBudgetPolicy) observed.add("budget_policy");
  if (context.hasPriceBookVersion) observed.add("price_book_version");
  if (context.hasCurrencyTaxMode) observed.add("currency_tax_mode");
  if (context.hasWeatherNormals) observed.add("weather_normals");
  if (context.hasForecastWindow) observed.add("forecast_window");
  if (context.hasIrrigationOrWaterConstraints) {
    observed.add("irrigation_or_water_constraints");
  }
  if (context.hasPreviousTechMap) observed.add("previous_tech_map");
  if (context.hasExecutionHistory) observed.add("execution_history");
  if (context.hasPastOutcomes) observed.add("past_outcomes");
  if (hasValue(context.methodologyProfileId)) {
    observed.add("methodology_profile_id");
  }
  if (context.hasAllowedInputCatalogVersion) {
    observed.add("allowed_input_catalog_version");
  }
  if (hasValue(context.contractMode)) observed.add("contract_mode");
  if (context.hasTargetKpiPolicy) observed.add("target_kpi_policy");

  return [...observed];
}

function isSatisfied(
  entry: TechMapSlotRegistryEntry,
  observedSlotKeys: Set<string>,
): boolean {
  return observedSlotKeys.has(entry.slot_key);
}

function resolveReadiness(
  observedSlotKeys: Set<string>,
): TechMapContextReadiness {
  let current: TechMapContextReadiness = "S0_UNSCOPED";

  for (const readiness of TECH_MAP_CONTEXT_READINESS_LEVELS.slice(1)) {
    const ready = TECH_MAP_SLOT_REGISTRY.filter(
      (entry) =>
        isRequiredSlot(entry) &&
        (readinessOrder.get(entry.stage_required_from) ?? Number.MAX_SAFE_INTEGER) <=
          (readinessOrder.get(readiness) ?? Number.MAX_SAFE_INTEGER),
    ).every((entry) => isSatisfied(entry, observedSlotKeys));

    if (!ready) {
      break;
    }

    current = readiness;
  }

  return current;
}

function resolveNextReadinessTarget(
  readiness: TechMapContextReadiness,
): TechMapContextReadiness | undefined {
  const currentIndex = readinessOrder.get(readiness) ?? 0;
  return TECH_MAP_CONTEXT_READINESS_LEVELS[currentIndex + 1];
}

function resolvePublicationState(
  readiness: TechMapContextReadiness,
): TechMapPublicationState {
  if (readiness === "S4_REVIEW_READY" || readiness === "S5_PUBLISHABLE") {
    return "REVIEW_REQUIRED";
  }

  if (readiness === "S3_DRAFT_READY") {
    return "GOVERNED_DRAFT";
  }

  return "WORKING_DRAFT";
}

export function assessTechMapGovernedDraftContext(
  context: TechMapGovernedDraftRuntimeContext,
): TechMapGovernedDraftAssessmentResult {
  const observedSlotKeys = resolveObservedSlotKeys(context);
  const observedSlotKeySet = new Set(observedSlotKeys);
  const readiness = resolveReadiness(observedSlotKeySet);
  const nextReadinessTarget = resolveNextReadinessTarget(readiness);

  const missingRequiredEntries = TECH_MAP_SLOT_REGISTRY.filter(
    (entry) => isRequiredSlot(entry) && !isSatisfied(entry, observedSlotKeySet),
  );
  const blockingMissingEntries = missingRequiredEntries.filter(
    (entry) => entry.impact.blocks_branch_execution,
  );
  const reviewMissingEntries = missingRequiredEntries.filter(
    (entry) => !entry.impact.blocks_branch_execution,
  );
  const publicationCriticalReviewEntries = reviewMissingEntries.filter(
    (entry) => entry.impact.publication_critical,
  );

  const clarifyEntries = nextReadinessTarget
    ? TECH_MAP_SLOT_REGISTRY.filter(
        (entry) =>
          isRequiredSlot(entry) &&
          entry.stage_required_from === nextReadinessTarget &&
          !isSatisfied(entry, observedSlotKeySet),
      )
    : [];

  const clarifyItems = clarifyEntries
    .map(buildClarifyItem)
    .sort((left, right) => right.priority - left.priority);
  const gaps = clarifyEntries.map(buildGap);

  const aggregationInput: TechMapWorkflowVerdictAggregationInput = {
    requested_artifact: "workflow_draft",
    selected_variant_verdict:
      reviewMissingEntries.length > 0 ? "PARTIAL" : "VERIFIED",
    publication_critical_branch_verdicts:
      blockingMissingEntries.length > 0
        ? ["BLOCKED"]
        : publicationCriticalReviewEntries.length > 0
          ? ["PARTIAL"]
          : ["VERIFIED"],
    advisory_branch_verdicts: [],
    expert_review_verdict: "SKIPPED",
    unresolved_blocking_gaps: blockingMissingEntries.length,
    unresolved_hard_blocks: 0,
  };
  const workflowVerdict = aggregateTechMapWorkflowVerdict(aggregationInput);

  const tasks: string[] = [];

  if (nextReadinessTarget && clarifyItems.length > 0) {
    tasks.push(
      `Собрать обязательный контекст для перехода к ${nextReadinessTarget}.`,
    );
  }

  if (workflowVerdict === "BLOCKED") {
    tasks.push(
      "Не передавать черновик в branch execution до controlled clarify.",
    );
  } else if (workflowVerdict === "PARTIAL") {
    tasks.push(
      "Закрыть disclosure и review-critical gaps перед публикационным контуром.",
    );
  }

  return {
    readiness,
    nextReadinessTarget,
    workflowVerdict,
    publicationState: resolvePublicationState(readiness),
    missingMust: clarifyItems.map((item) => item.slot_key),
    clarifyItems,
    assumptions: [],
    gaps,
    tasks,
    observedSlotKeys,
  };
}
