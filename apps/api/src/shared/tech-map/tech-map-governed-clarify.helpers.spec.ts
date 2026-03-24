import {
  buildTechMapClarifyAuditTrail,
  buildTechMapClarifyBatch,
  buildTechMapWorkflowResumeState,
} from "./tech-map-governed-clarify.helpers";

describe("tech-map-governed-clarify.helpers", () => {
  const clarifyItems = [
    {
      slot_key: "soil_profile",
      label: "soil profile",
      group_key: "agronomic_basis",
      priority: 100,
      severity: "REQUIRED_BLOCKING" as const,
      resolution_target: "HUMAN_REVIEW_REQUIRED" as const,
      reason: "Need verified soil profile.",
      blocks_phases: ["branch_execution", "publication"] as const,
      acceptable_sources: ["soil_profile_lab"],
      can_be_assumed: false,
    },
    {
      slot_key: "methodology_profile_id",
      label: "methodology profile id",
      group_key: "methodology_and_governance",
      priority: 70,
      severity: "REQUIRED_REVIEW" as const,
      resolution_target: "USER_RESOLVABLE" as const,
      reason: "Need approved methodology profile.",
      blocks_phases: ["composition", "publication"] as const,
      acceptable_sources: ["methodology_registry", "user_declared"],
      can_be_assumed: false,
    },
  ];

  it("строит multi-step clarify batch с resume token и ttl", () => {
    const batch = buildTechMapClarifyBatch({
      workflow_id: "tech-map:draft-1",
      draft_id: "draft-1",
      readiness: "S1_SCOPED",
      next_readiness_target: "S2_MINIMUM_COMPUTABLE",
      clarify_items: clarifyItems as any,
      blocking_phase: "MISSING_CONTEXT_TRIAGE",
    });

    expect(batch).toEqual(
      expect.objectContaining({
        batch_id: "clarify:tech-map:draft-1:methodology_profile_id|soil_profile",
        workflow_id: "tech-map:draft-1",
        mode: "MULTI_STEP",
        status: "OPEN",
        priority: 100,
        group_key: "agronomic_basis",
        blocking_for_phase: "MISSING_CONTEXT_TRIAGE",
        resume_token: "resume:tech-map:draft-1:clarify:tech-map:draft-1:methodology_profile_id|soil_profile",
      }),
    );
    expect(typeof batch?.expires_at).toBe("string");
  });

  it("строит resume state поверх clarify batch", () => {
    const resumeState = buildTechMapWorkflowResumeState({
      workflow_id: "tech-map:draft-1",
      draft_id: "draft-1",
      readiness: "S1_SCOPED",
      next_readiness_target: "S2_MINIMUM_COMPUTABLE",
      clarify_items: clarifyItems as any,
      blocking_phase: "MISSING_CONTEXT_TRIAGE",
      baseline_context_hash: "baseline-hash",
    });

    expect(resumeState).toEqual(
      expect.objectContaining({
        workflow_id: "tech-map:draft-1",
        resume_token: "resume:tech-map:draft-1:clarify:tech-map:draft-1:methodology_profile_id|soil_profile",
        resume_from_phase: "MISSING_CONTEXT_TRIAGE",
        pending_batch_ids: [
          "clarify:tech-map:draft-1:methodology_profile_id|soil_profile",
        ],
        baseline_context_hash: "baseline-hash",
        external_recheck_required: false,
      }),
    );
    expect(typeof resumeState?.expires_at).toBe("string");
  });

  it("строит audit trail для clarify resume", () => {
    const batch = buildTechMapClarifyBatch({
      workflow_id: "tech-map:draft-1",
      draft_id: "draft-1",
      readiness: "S1_SCOPED",
      next_readiness_target: "S2_MINIMUM_COMPUTABLE",
      clarify_items: clarifyItems as any,
      blocking_phase: "MISSING_CONTEXT_TRIAGE",
    });
    const resumeState = buildTechMapWorkflowResumeState({
      workflow_id: "tech-map:draft-1",
      draft_id: "draft-1",
      readiness: "S1_SCOPED",
      next_readiness_target: "S2_MINIMUM_COMPUTABLE",
      clarify_items: clarifyItems as any,
      blocking_phase: "MISSING_CONTEXT_TRIAGE",
      baseline_context_hash: "baseline-hash",
    });

    const auditTrail = buildTechMapClarifyAuditTrail({
      workflow_id: "tech-map:draft-1",
      batch,
      resume_state: resumeState,
      resolved_slot_keys: ["soil_profile"],
      resume_requested: true,
    });

    expect(auditTrail.map((event) => event.event_type)).toEqual([
      "clarify_batch_opened",
      "workflow_resume_requested",
      "workflow_resume_ready",
    ]);
    expect(auditTrail[1]).toEqual(
      expect.objectContaining({
        message: "Resume requested after resolving 1 slot(s).",
      }),
    );
  });
});
