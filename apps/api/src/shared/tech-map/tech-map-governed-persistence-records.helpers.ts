import type { TechMapCanonicalDraft } from "./tech-map-governed-artifact.types";
import type {
  TechMapPersistenceBoundary,
  TechMapPersistenceBoundaryInput,
} from "./tech-map-governed-persistence.helpers";

export interface TechMapReviewSnapshotRecord {
  tech_map_id: string;
  version: number;
  workflow_id: string;
  review_status: string;
  publication_state: string;
  persistence_boundary: TechMapPersistenceBoundary;
  snapshot_data: Record<string, unknown>;
  is_immutable: true;
  created_by: string;
  company_id: string;
}

export interface TechMapApprovalSnapshotRecord {
  tech_map_id: string;
  version: number;
  workflow_id: string;
  approval_status: string;
  publication_state: string;
  persistence_boundary: TechMapPersistenceBoundary;
  snapshot_data: Record<string, unknown>;
  is_immutable: true;
  approved_by: string;
  approved_at: string;
  company_id: string;
}

export interface TechMapPublicationLockRecord {
  tech_map_id: string;
  version: number;
  workflow_id: string;
  publication_state: string;
  supersedes_tech_map_id: string | null;
  supersedes_version: number | null;
  lock_reason: string | null;
  persistence_boundary: TechMapPersistenceBoundary;
  snapshot_data: Record<string, unknown>;
  is_locked: true;
  locked_by: string;
  locked_at: string;
  company_id: string;
}

function buildSnapshotData(
  draft: TechMapCanonicalDraft,
  boundary: TechMapPersistenceBoundary,
): Record<string, unknown> {
  return {
    header: draft.header,
    readiness: draft.readiness,
    workflow_verdict: draft.workflow_verdict,
    publication_state: draft.publication_state,
    review_status: draft.review_status,
    approval_status: draft.approval_status,
    persistence_status: draft.persistence_status,
    slot_ledger_ref: draft.slot_ledger_ref,
    selected_variant_id: draft.selected_variant_id,
    boundary,
  };
}

export function buildTechMapReviewSnapshotRecord(params: {
  draft: TechMapCanonicalDraft;
  boundary: TechMapPersistenceBoundary;
  createdBy: string;
  companyId: string;
}): TechMapReviewSnapshotRecord {
  return {
    tech_map_id: params.draft.header.tech_map_id ?? params.draft.header.workflow_id,
    version: Number(params.draft.header.version_id?.split(":v").pop() ?? 1),
    workflow_id: params.draft.header.workflow_id,
    review_status: params.draft.review_status,
    publication_state: params.draft.publication_state,
    persistence_boundary: params.boundary,
    snapshot_data: buildSnapshotData(params.draft, params.boundary),
    is_immutable: true,
    created_by: params.createdBy,
    company_id: params.companyId,
  };
}

export function buildTechMapApprovalSnapshotRecord(params: {
  draft: TechMapCanonicalDraft;
  boundary: TechMapPersistenceBoundary;
  approvedBy: string;
  approvedAt: Date;
  companyId: string;
}): TechMapApprovalSnapshotRecord {
  return {
    tech_map_id: params.draft.header.tech_map_id ?? params.draft.header.workflow_id,
    version: Number(params.draft.header.version_id?.split(":v").pop() ?? 1),
    workflow_id: params.draft.header.workflow_id,
    approval_status: params.draft.approval_status,
    publication_state: params.draft.publication_state,
    persistence_boundary: params.boundary,
    snapshot_data: buildSnapshotData(params.draft, params.boundary),
    is_immutable: true,
    approved_by: params.approvedBy,
    approved_at: params.approvedAt.toISOString(),
    company_id: params.companyId,
  };
}

export function buildTechMapPublicationLockRecord(params: {
  draft: TechMapCanonicalDraft;
  boundary: TechMapPersistenceBoundary;
  lockedBy: string;
  lockedAt: Date;
  companyId: string;
  supersedesTechMapId?: string | null;
  supersedesVersion?: number | null;
  lockReason?: string | null;
}): TechMapPublicationLockRecord {
  return {
    tech_map_id: params.draft.header.tech_map_id ?? params.draft.header.workflow_id,
    version: Number(params.draft.header.version_id?.split(":v").pop() ?? 1),
    workflow_id: params.draft.header.workflow_id,
    publication_state: params.draft.publication_state,
    supersedes_tech_map_id: params.supersedesTechMapId ?? null,
    supersedes_version: params.supersedesVersion ?? null,
    lock_reason: params.lockReason ?? null,
    persistence_boundary: params.boundary,
    snapshot_data: buildSnapshotData(params.draft, params.boundary),
    is_locked: true,
    locked_by: params.lockedBy,
    locked_at: params.lockedAt.toISOString(),
    company_id: params.companyId,
  };
}

export function buildTechMapPersistenceBoundaryInputFromDraft(
  draft: TechMapCanonicalDraft,
  currentStatus: TechMapPersistenceBoundaryInput["current_status"],
): TechMapPersistenceBoundaryInput {
  return {
    workflow_id: draft.header.workflow_id,
    tech_map_id: draft.header.tech_map_id ?? draft.header.workflow_id,
    version_id: draft.header.version_id ?? draft.header.workflow_id,
    current_status: currentStatus,
    publication_state: draft.publication_state,
    review_status: draft.review_status,
    approval_status: draft.approval_status,
    persistence_status: draft.persistence_status,
  };
}
