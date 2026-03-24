import { TechMapWorkflowOrchestratorService } from "./tech-map-workflow-orchestrator.service";

describe("TechMapWorkflowOrchestratorService", () => {
  const service = new TechMapWorkflowOrchestratorService();

  it("builds a clarify-blocked workflow trace with branch schedule and audit refs", () => {
    const trace = service.buildWorkflowTrace({
      workflow_id: "tech-map:tm-1",
      draft_id: "tm-1",
      lead_owner_agent: "agronomist",
      readiness: "S1_SCOPED",
      publication_state: "WORKING_DRAFT",
      workflow_verdict: "PARTIAL",
      clarify_items: [
        {
          slot_key: "soil_profile",
          label: "Soil profile",
          group_key: "soil",
          priority: 1,
          severity: "REQUIRED_BLOCKING",
          resolution_target: "USER_RESOLVABLE",
          reason: "missing",
          blocks_phases: ["branch_execution", "composition"],
          acceptable_sources: ["soil_profile", "field_history"],
          can_be_assumed: false,
        },
      ],
      missing_must: ["soil_profile"],
      has_budget_policy: true,
      has_execution_history: true,
      has_past_outcomes: false,
      has_allowed_input_catalog_version: true,
      has_target_kpi_policy: true,
      has_weather_normals: true,
      resume_requested: true,
    });

    expect(trace.phase_engine).toEqual([
      "INTAKE",
      "TRIAGE",
      "BRANCHING",
      "TRUST",
      "COMPOSITION",
    ]);
    expect(trace.current_phase).toBe("TRIAGE");
    expect(trace.next_phase).toBeNull();
    expect(trace.branch_schedule).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branch_type: "agronomic",
          execution_mode: "blocking",
          status: "blocked",
        }),
        expect.objectContaining({
          branch_type: "finance",
          execution_mode: "parallel",
        }),
      ]),
    );
    expect(trace.policy_decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gate: "handoff", decision: "block" }),
        expect.objectContaining({ gate: "composition", decision: "block" }),
      ]),
    );
    expect(trace.audit_refs[0]).toContain("workflow:tech-map:tm-1");
    expect(trace.summary).toContain("Clarify open: yes");
  });

  it("allows composition when trust is satisfied and clarify is closed", () => {
    const trace = service.buildWorkflowTrace({
      workflow_id: "tech-map:tm-2",
      draft_id: "tm-2",
      lead_owner_agent: "agronomist",
      readiness: "S4_REVIEW_READY",
      publication_state: "REVIEW_REQUIRED",
      workflow_verdict: "VERIFIED",
      clarify_items: [],
      missing_must: [],
      has_budget_policy: true,
      has_execution_history: false,
      has_past_outcomes: true,
      has_allowed_input_catalog_version: true,
      has_target_kpi_policy: false,
      has_weather_normals: false,
      branch_trust_assessments: [
        {
          branch_id: "branch-1",
          source_agent: "techmap-runtime-adoption",
          verdict: "VERIFIED",
          score: 0.98,
          reasons: ["source_resolution"],
          checks: [],
          requires_cross_check: false,
        },
      ],
    });

    expect(trace.current_phase).toBe("TRUST");
    expect(trace.next_phase).toBe("COMPOSITION");
    expect(trace.composition_gate.can_compose).toBe(true);
    expect(trace.policy_decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gate: "trust", decision: "allow" }),
        expect.objectContaining({ gate: "composition", decision: "allow" }),
      ]),
    );
    expect(trace.summary).toContain("Trust satisfied: yes");
  });
});
