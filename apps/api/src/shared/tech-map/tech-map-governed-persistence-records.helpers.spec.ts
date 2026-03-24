import { TechMapStatus } from "@rai/prisma-client";
import {
  buildTechMapApprovalSnapshotRecord,
  buildTechMapPersistenceBoundaryInputFromDraft,
  buildTechMapPublicationLockRecord,
  buildTechMapReviewSnapshotRecord,
} from "./tech-map-governed-persistence-records.helpers";
import { buildTechMapPersistenceBoundaryFromStatus } from "./tech-map-governed-persistence.helpers";

describe("tech-map-governed-persistence-records.helpers", () => {
  const draft = {
    header: {
      workflow_id: "techmap:1:v2",
      tech_map_id: "techmap-1",
      version_id: "techmap-1:v2",
      legal_entity_id: "company-1",
      farm_id: "farm-1",
      field_ids: ["field-1"],
      season_id: "season-1",
      crop_code: "rapeseed",
      methodology_profile_id: "methodology:1",
      baseline_context_hash: "hash-1",
      source_workflow_mode: "new_draft",
    },
    readiness: "S4_REVIEW_READY",
    workflow_verdict: "PARTIAL",
    publication_state: "REVIEW_REQUIRED",
    review_status: "IN_REVIEW",
    approval_status: "PENDING_APPROVAL",
    persistence_status: "REVIEW_PACKET_PERSISTED",
    slot_ledger_ref: "slot-ledger:1",
    assumptions: [],
    gaps: [],
    conflicts: [],
    variants: [],
    selected_variant_id: "variant-1",
    audit_refs: [],
  } as any;

  const boundary = buildTechMapPersistenceBoundaryFromStatus({
    workflow_id: draft.header.workflow_id,
    tech_map_id: draft.header.tech_map_id,
    version_id: draft.header.version_id,
    current_status: TechMapStatus.REVIEW,
    publication_state: draft.publication_state,
    review_status: draft.review_status,
    approval_status: draft.approval_status,
    persistence_status: draft.persistence_status,
  });

  it("строит canonical boundary input из draft", () => {
    expect(buildTechMapPersistenceBoundaryInputFromDraft(draft, TechMapStatus.REVIEW))
      .toEqual(
        expect.objectContaining({
          workflow_id: draft.header.workflow_id,
          tech_map_id: draft.header.tech_map_id,
          version_id: draft.header.version_id,
          current_status: TechMapStatus.REVIEW,
        }),
      );
  });

  it("строит review snapshot record", () => {
    const record = buildTechMapReviewSnapshotRecord({
      draft,
      boundary,
      createdBy: "system:tech-map",
      companyId: "company-1",
    });

    expect(record.tech_map_id).toBe("techmap-1");
    expect(record.is_immutable).toBe(true);
    expect(record.snapshot_data).toHaveProperty("boundary");
  });

  it("строит approval snapshot record", () => {
    const record = buildTechMapApprovalSnapshotRecord({
      draft,
      boundary,
      approvedBy: "system:tech-map",
      approvedAt: new Date("2026-03-24T00:00:00.000Z"),
      companyId: "company-1",
    });

    expect(record.approved_by).toBe("system:tech-map");
    expect(record.is_immutable).toBe(true);
    expect(record.snapshot_data).toHaveProperty("workflow_verdict");
  });

  it("строит publication lock record", () => {
    const record = buildTechMapPublicationLockRecord({
      draft,
      boundary,
      lockedBy: "system:tech-map",
      lockedAt: new Date("2026-03-24T00:00:00.000Z"),
      companyId: "company-1",
      supersedesTechMapId: "techmap-1",
      supersedesVersion: 2,
      lockReason: "current_active_baseline",
    });

    expect(record.is_locked).toBe(true);
    expect(record.supersedes_tech_map_id).toBe("techmap-1");
    expect(record.lock_reason).toBe("current_active_baseline");
  });
});
