import { TechMapStatus } from "@rai/prisma-client";
import {
  buildTechMapPersistenceBoundary,
  buildTechMapPersistenceBoundaryFromStatus,
  isHeadDraftWritablePersistedTechMapStatus,
  isImmutablePersistedTechMapSnapshotStatus,
} from "./tech-map-governed-persistence.helpers";

describe("tech-map-governed-persistence.helpers", () => {
  it("определяет editable head draft и immutable snapshot статусы", () => {
    expect(isHeadDraftWritablePersistedTechMapStatus(TechMapStatus.DRAFT)).toBe(
      true,
    );
    expect(
      isHeadDraftWritablePersistedTechMapStatus(TechMapStatus.REVIEW),
    ).toBe(false);
    expect(
      isImmutablePersistedTechMapSnapshotStatus(TechMapStatus.REVIEW),
    ).toBe(true);
    expect(
      isImmutablePersistedTechMapSnapshotStatus(TechMapStatus.DRAFT),
    ).toBe(false);
  });

  it("собирает immutable persistence boundary для review snapshot", () => {
    const boundary = buildTechMapPersistenceBoundaryFromStatus({
      workflow_id: "techmap:1:v1",
      tech_map_id: "techmap-1",
      version_id: "techmap-1:v1",
      current_status: TechMapStatus.REVIEW,
      publication_state: "REVIEW_REQUIRED",
      review_status: "IN_REVIEW",
      approval_status: "PENDING_APPROVAL",
      persistence_status: "REVIEW_PACKET_PERSISTED",
    });

    expect(boundary.can_patch_in_place).toBe(false);
    expect(boundary.write_mode).toBe("IMMUTABLE_REVIEW_SNAPSHOT");
    expect(boundary.next_action).toBe("create_new_version");
    expect(boundary.review_snapshot_ref).toContain("review-snapshot");
    expect(boundary.immutable_snapshot_ref).toContain("snapshot:review");
  });

  it("собирает publication boundary для canonical draft", () => {
    const boundary = buildTechMapPersistenceBoundary(
      {
        header: {
          workflow_id: "techmap:2:v3",
          tech_map_id: "techmap-2",
          version_id: "techmap-2:v3",
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
        publication_state: "PUBLISHABLE",
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
      } as any,
      TechMapStatus.REVIEW,
    );

    expect(boundary.workflow_id).toBe("techmap:2:v3");
    expect(boundary.write_mode).toBe("IMMUTABLE_REVIEW_SNAPSHOT");
  });
});
