import type { CropForm } from "@rai/prisma-client";

export type GenerationStrategyName =
  | "legacy_blueprint"
  | "blueprint_fallback"
  | "canonical_schema";

export type CanonicalBranchId = "winter_rapeseed" | "spring_rapeseed";

export type AdmissionSeverity =
  | "HARD_BLOCKER"
  | "HARD_REQUIREMENT"
  | "STRONG_RECOMMENDATION";

export type AdmissionEnforcementMode = "blocking" | "report_only" | "advisory";

export type ShadowParitySeverity = "P0" | "P1" | "P2";

export interface GenerationResourceDraft {
  type: string;
  name: string;
  amount: number;
  unit: string;
  costPerUnit?: number;
}

export interface GenerationOperationDraft {
  code: string;
  name: string;
  description: string;
  operationType?: string | null;
  startOffsetDays: number;
  durationHours: number;
  isCritical?: boolean;
  bbchWindowFrom?: string | null;
  bbchWindowTo?: string | null;
  resources: GenerationResourceDraft[];
}

export interface GenerationStageDraft {
  code: string;
  name: string;
  sequence: number;
  aplStageId: string;
  stageGoal?: string | null;
  bbchScope?: unknown;
  operations: GenerationOperationDraft[];
}

export interface ControlPointDraft {
  stageCode: string;
  name: string;
  bbchScope?: unknown;
  requiredObservations: string[];
  acceptanceRanges?: Record<string, unknown> | null;
  severityOnFailure: string;
}

export interface MonitoringSignalDraft {
  signalType: string;
  source?: string | null;
  thresholdLogic?: string | null;
  severity: string;
  resultingAction?: string | null;
}

export interface RuleBindingDraft {
  ruleId: string;
  layer: string;
  type: string;
  confidence?: string | null;
  appliesTo: "admission" | "stage" | "operation" | "control_point";
  ref: string;
}

export interface ThresholdBindingDraft {
  thresholdId: string;
  parameter: string;
  comparator: string;
  value: unknown;
  cropScope?: string | null;
  stageScope?: string | null;
  actionOnBreach?: string | null;
  ref: string;
}

export interface RecommendationDraft {
  severity: string;
  code?: string;
  title: string;
  message: string;
  rationale?: Record<string, unknown> | null;
}

export interface DecisionGateDraft {
  gateType: string;
  severity: string;
  title: string;
  rationale?: Record<string, unknown> | null;
}

export interface AdmissionIssue {
  ruleId: string;
  severity: AdmissionSeverity;
  enforcementMode: AdmissionEnforcementMode;
  message: string;
  blocking: boolean;
  evidenceRequired: boolean;
  payload?: Record<string, unknown>;
}

export interface FieldAdmissionEvaluation {
  traceId: string;
  verdict: "PASS" | "FAIL" | "PASS_WITH_REQUIREMENTS";
  cropForm?: CropForm | null;
  isBlocking: boolean;
  blockers: AdmissionIssue[];
  requirements: AdmissionIssue[];
  recommendations: AdmissionIssue[];
  rolloutPolicy: {
    hardBlocker: AdmissionEnforcementMode;
    hardRequirement: AdmissionEnforcementMode;
    strongRecommendation: AdmissionEnforcementMode;
  };
}

export interface CropFormResolution {
  cropForm: CropForm;
  canonicalBranch: CanonicalBranchId;
  source: "explicit" | "regional_inference" | "seasonal_inference";
  reasons: string[];
}

export interface ShadowParityDiff {
  severity: ShadowParitySeverity;
  code: string;
  message: string;
}

export interface ShadowParityReport {
  traceId: string;
  authoritativeStrategy: GenerationStrategyName;
  referenceStrategy: GenerationStrategyName;
  diffs: ShadowParityDiff[];
  hasBlockingDiffs: boolean;
  completeness: {
    generationTracePresent: boolean;
    explainabilitySummaryPresent: boolean;
    mandatoryBlocksCovered: boolean;
    controlPointsCovered: boolean;
    ruleBindingsCovered: boolean;
    thresholdBindingsCovered: boolean;
    monitoringSignalsCovered: boolean;
    resourceCoveragePresent: boolean;
  };
}

export interface CanonicalGenerationBundle {
  crop: string;
  cropForm: CropForm;
  canonicalBranch: CanonicalBranchId;
  stages: GenerationStageDraft[];
  controlPoints: ControlPointDraft[];
  monitoringSignals: MonitoringSignalDraft[];
  attachedRules: RuleBindingDraft[];
  attachedThresholds: ThresholdBindingDraft[];
  mandatoryBlocks: string[];
  recommendations: RecommendationDraft[];
  decisionGates: DecisionGateDraft[];
  generationTraceId: string;
  explainabilitySummary: Record<string, unknown>;
}

export interface GeneratedTechMapBundle {
  crop: string;
  cropForm?: CropForm | null;
  canonicalBranch?: CanonicalBranchId | null;
  generationStrategy: GenerationStrategyName;
  generatorVersion: string;
  stages: GenerationStageDraft[];
  controlPoints: ControlPointDraft[];
  monitoringSignals: MonitoringSignalDraft[];
  attachedRules: RuleBindingDraft[];
  attachedThresholds: ThresholdBindingDraft[];
  mandatoryBlocks: string[];
  fieldAdmission: FieldAdmissionEvaluation | null;
  recommendations: RecommendationDraft[];
  decisionGates: DecisionGateDraft[];
  generationMetadata: Record<string, unknown>;
  explainabilitySummary: Record<string, unknown>;
  shadowParityReport?: ShadowParityReport | null;
}
