import { TechMapStatus } from "@rai/prisma-client";
import type { TechMapCanonicalDraft } from "./tech-map-governed-artifact.types";
import type {
  TechMapApprovalStatus,
  TechMapPersistenceStatus,
  TechMapPublicationState,
  TechMapReviewStatus,
} from "./tech-map-governed-state.types";

export const TECH_MAP_PERSISTENCE_WRITE_MODES = [
  "EPHEMERAL",
  "EDITABLE_HEAD_DRAFT",
  "IMMUTABLE_REVIEW_SNAPSHOT",
  "IMMUTABLE_APPROVAL_SNAPSHOT",
  "IMMUTABLE_PUBLICATION_SNAPSHOT",
  "ARCHIVED",
] as const;

export type TechMapPersistenceWriteMode =
  (typeof TECH_MAP_PERSISTENCE_WRITE_MODES)[number];

export interface TechMapPersistenceBoundary {
  workflow_id: string;
  tech_map_id: string;
  version_id: string;
  current_status: TechMapStatus;
  publication_state: TechMapPublicationState;
  review_status: TechMapReviewStatus;
  approval_status: TechMapApprovalStatus;
  persistence_status: TechMapPersistenceStatus;
  write_mode: TechMapPersistenceWriteMode;
  can_patch_in_place: boolean;
  immutable_snapshot_ref: string;
  review_snapshot_ref: string;
  approval_snapshot_ref: string;
  publication_lock_ref: string;
  supersedes_ref: string | null;
  next_action:
    | "edit_head_draft"
    | "create_new_version"
    | "submit_review"
    | "await_approval"
    | "publish"
    | "no_writes";
  disclosure: string[];
}

export interface TechMapPersistenceBoundaryInput {
  workflow_id: string;
  tech_map_id: string;
  version_id: string;
  current_status: TechMapStatus;
  publication_state: TechMapPublicationState;
  review_status: TechMapReviewStatus;
  approval_status: TechMapApprovalStatus;
  persistence_status: TechMapPersistenceStatus;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function resolveWriteMode(
  status: TechMapStatus,
): TechMapPersistenceWriteMode {
  switch (status) {
    case TechMapStatus.DRAFT:
      return "EDITABLE_HEAD_DRAFT";
    case TechMapStatus.REVIEW:
      return "IMMUTABLE_REVIEW_SNAPSHOT";
    case TechMapStatus.APPROVED:
      return "IMMUTABLE_APPROVAL_SNAPSHOT";
    case TechMapStatus.ACTIVE:
      return "IMMUTABLE_PUBLICATION_SNAPSHOT";
    case TechMapStatus.ARCHIVED:
      return "ARCHIVED";
    default:
      return "EPHEMERAL";
  }
}

function resolveNextAction(
  writeMode: TechMapPersistenceWriteMode,
): TechMapPersistenceBoundary["next_action"] {
  switch (writeMode) {
    case "EDITABLE_HEAD_DRAFT":
      return "edit_head_draft";
    case "IMMUTABLE_REVIEW_SNAPSHOT":
      return "create_new_version";
    case "IMMUTABLE_APPROVAL_SNAPSHOT":
      return "publish";
    case "IMMUTABLE_PUBLICATION_SNAPSHOT":
      return "no_writes";
    case "ARCHIVED":
      return "no_writes";
    default:
      return "no_writes";
  }
}

export function isHeadDraftWritablePersistedTechMapStatus(
  status: TechMapStatus,
): boolean {
  return status === TechMapStatus.DRAFT;
}

export function isImmutablePersistedTechMapSnapshotStatus(
  status: TechMapStatus,
): boolean {
  switch (status) {
    case TechMapStatus.REVIEW:
    case TechMapStatus.APPROVED:
    case TechMapStatus.ACTIVE:
    case TechMapStatus.ARCHIVED:
      return true;
    default:
      return false;
  }
}

function buildTechMapPersistenceBoundaryFromInput(
  input: TechMapPersistenceBoundaryInput,
): TechMapPersistenceBoundary {
  const writeMode = resolveWriteMode(input.current_status);
  const versionId = input.version_id;
  const techMapId = input.tech_map_id;
  const immutableSnapshotRef = `techmap:${techMapId}:snapshot:${input.current_status.toLowerCase()}:v${versionId}`;
  const reviewSnapshotRef = `techmap:${techMapId}:review-snapshot:v${versionId}`;
  const approvalSnapshotRef = `techmap:${techMapId}:approval-snapshot:v${versionId}`;
  const publicationLockRef = `techmap:${techMapId}:publication-lock:v${versionId}`;
  const supersedesRef =
    input.current_status === TechMapStatus.ARCHIVED
      ? `techmap:${techMapId}:supersedes:v${versionId}`
      : null;

  return {
    workflow_id: input.workflow_id,
    tech_map_id: techMapId,
    version_id: versionId,
    current_status: input.current_status,
    publication_state: input.publication_state,
    review_status: input.review_status,
    approval_status: input.approval_status,
    persistence_status: input.persistence_status,
    write_mode: writeMode,
    can_patch_in_place: writeMode === "EDITABLE_HEAD_DRAFT",
    immutable_snapshot_ref: immutableSnapshotRef,
    review_snapshot_ref: reviewSnapshotRef,
    approval_snapshot_ref: approvalSnapshotRef,
    publication_lock_ref: publicationLockRef,
    supersedes_ref: supersedesRef,
    next_action: resolveNextAction(writeMode),
    disclosure: uniqueStrings([
      `current_status=${input.current_status}`,
      `write_mode=${writeMode}`,
      supersedesRef ? `supersedes=${supersedesRef}` : "",
    ]),
  };
}

export function buildTechMapPersistenceBoundary(
  draft: TechMapCanonicalDraft,
  currentStatus: TechMapStatus,
): TechMapPersistenceBoundary {
  return buildTechMapPersistenceBoundaryFromInput({
    workflow_id: draft.header.workflow_id,
    tech_map_id: draft.header.tech_map_id ?? draft.header.workflow_id,
    version_id: draft.header.version_id ?? draft.header.workflow_id,
    current_status: currentStatus,
    publication_state: draft.publication_state,
    review_status: draft.review_status,
    approval_status: draft.approval_status,
    persistence_status: draft.persistence_status,
  });
}

export function buildTechMapPersistenceBoundaryFromStatus(
  input: TechMapPersistenceBoundaryInput,
): TechMapPersistenceBoundary {
  return buildTechMapPersistenceBoundaryFromInput(input);
}
