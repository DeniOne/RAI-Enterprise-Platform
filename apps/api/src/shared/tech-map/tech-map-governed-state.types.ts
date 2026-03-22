import { TechMapStatus } from "@rai/prisma-client";

export const TECH_MAP_WORKFLOW_PHASES = [
  "INTAKE",
  "SEMANTIC_NORMALIZATION",
  "CONTEXT_ASSEMBLY",
  "MISSING_CONTEXT_TRIAGE",
  "OWNER_HANDOFF",
  "BRANCH_EXECUTION",
  "TRUST_GATE",
  "CONFLICT_RESOLUTION",
  "COMPOSITION",
  "PERSIST_DRAFT",
  "EXPERT_REVIEW",
  "REVIEW_SUBMISSION",
  "HUMAN_REVIEW",
  "APPROVAL",
  "PUBLICATION",
] as const;

export type TechMapWorkflowPhase = (typeof TECH_MAP_WORKFLOW_PHASES)[number];

export const TECH_MAP_WORKFLOW_VERDICTS = [
  "VERIFIED",
  "PARTIAL",
  "UNVERIFIED",
  "BLOCKED",
] as const;

export type TechMapWorkflowVerdict =
  (typeof TECH_MAP_WORKFLOW_VERDICTS)[number];

export const TECH_MAP_CONTEXT_READINESS_LEVELS = [
  "S0_UNSCOPED",
  "S1_SCOPED",
  "S2_MINIMUM_COMPUTABLE",
  "S3_DRAFT_READY",
  "S4_REVIEW_READY",
  "S5_PUBLISHABLE",
] as const;

export type TechMapContextReadiness =
  (typeof TECH_MAP_CONTEXT_READINESS_LEVELS)[number];

export const TECH_MAP_REVIEW_STATUSES = [
  "NOT_SUBMITTED",
  "QUEUED",
  "IN_REVIEW",
  "REVISION_REQUIRED",
  "REVIEW_PASSED",
  "REVIEW_REJECTED",
] as const;

export type TechMapReviewStatus = (typeof TECH_MAP_REVIEW_STATUSES)[number];

export const TECH_MAP_APPROVAL_STATUSES = [
  "NOT_REQUESTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
] as const;

export type TechMapApprovalStatus =
  (typeof TECH_MAP_APPROVAL_STATUSES)[number];

export const TECH_MAP_PUBLICATION_STATES = [
  "WORKING_DRAFT",
  "GOVERNED_DRAFT",
  "REVIEW_REQUIRED",
  "APPROVAL_REQUIRED",
  "PUBLISHABLE",
  "PUBLISHED",
  "SUPERSEDED",
] as const;

export type TechMapPublicationState =
  (typeof TECH_MAP_PUBLICATION_STATES)[number];

export const TECH_MAP_PERSISTENCE_STATUSES = [
  "EPHEMERAL",
  "WORKFLOW_RECORDED",
  "DRAFT_PERSISTED",
  "REVIEW_PACKET_PERSISTED",
  "APPROVAL_SNAPSHOT_PERSISTED",
  "PUBLICATION_SNAPSHOT_PERSISTED",
  "ARCHIVED",
] as const;

export type TechMapPersistenceStatus =
  (typeof TECH_MAP_PERSISTENCE_STATUSES)[number];

export const TECH_MAP_PERSISTED_STATUS_TRANSITIONS: Record<
  TechMapStatus,
  readonly TechMapStatus[]
> = {
  [TechMapStatus.GENERATED_DRAFT]: [TechMapStatus.DRAFT],
  [TechMapStatus.DRAFT]: [TechMapStatus.REVIEW],
  [TechMapStatus.REVIEW]: [TechMapStatus.DRAFT, TechMapStatus.APPROVED],
  [TechMapStatus.APPROVED]: [TechMapStatus.DRAFT, TechMapStatus.ACTIVE],
  [TechMapStatus.ACTIVE]: [TechMapStatus.ARCHIVED],
  [TechMapStatus.ARCHIVED]: [],
  [TechMapStatus.OVERRIDE_ANALYSIS]: [TechMapStatus.DRAFT],
};

export const TECH_MAP_EDITABLE_PERSISTED_STATUSES = [
  TechMapStatus.DRAFT,
  TechMapStatus.REVIEW,
] as const;

export const TECH_MAP_PERSISTED_STATUS_BY_PUBLICATION_STATE: Record<
  TechMapPublicationState,
  TechMapStatus | null
> = {
  WORKING_DRAFT: null,
  GOVERNED_DRAFT: TechMapStatus.DRAFT,
  REVIEW_REQUIRED: TechMapStatus.REVIEW,
  APPROVAL_REQUIRED: TechMapStatus.REVIEW,
  PUBLISHABLE: TechMapStatus.APPROVED,
  PUBLISHED: TechMapStatus.ACTIVE,
  SUPERSEDED: TechMapStatus.ARCHIVED,
};
