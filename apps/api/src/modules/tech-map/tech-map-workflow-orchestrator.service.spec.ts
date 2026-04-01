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
          group_key: "agronomic_basis",
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

  it("блокирует только ветки с незакрытыми slot families и уважает trust specialization gate", () => {
    const trace = service.buildWorkflowTrace({
      workflow_id: "tech-map:tm-3",
      draft_id: "tm-3",
      lead_owner_agent: "agronomist",
      readiness: "S3_DRAFT_READY",
      publication_state: "REVIEW_REQUIRED",
      workflow_verdict: "PARTIAL",
      clarify_items: [
        {
          slot_key: "price_book_version",
          label: "Price book version",
          group_key: "economic_basis",
          priority: 70,
          severity: "REQUIRED_REVIEW",
          resolution_target: "MACHINE_RESOLVABLE",
          reason: "missing",
          blocks_phases: ["composition"],
          acceptable_sources: ["price_book"],
          can_be_assumed: false,
        },
      ],
      missing_must: ["price_book_version"],
      has_budget_policy: true,
      has_execution_history: true,
      has_past_outcomes: true,
      has_allowed_input_catalog_version: true,
      has_target_kpi_policy: true,
      has_weather_normals: true,
      trust_specialization: {
        workflow_id: "tech-map:tm-3",
        variant_id: "variant:primary",
        publication_state: "REVIEW_REQUIRED",
        overall_verdict: "PARTIAL",
        publication_critical_branches: [],
        advisory_branches: [],
        allowed_branch_ids: ["agronomic:primary", "risk:scenario"],
        blocked_branch_ids: ["finance:policy"],
        blocked_disclosure: ["finance_scope_missing"],
        composition_gate: {
          can_compose: false,
          reason: "trust_gate_pending",
          disclosure: ["trust_gate_pending"],
        },
        variant_comparison_report: {
          selected_variant_id: "variant:primary",
          selected_variant_verdict: "PARTIAL",
          rows: [],
          comparison_available: false,
          disclosure: [],
        },
      },
    });

    const financeBranch = trace.branch_schedule.find(
      (item) => item.branch_id === "finance:policy",
    );
    const riskBranch = trace.branch_schedule.find(
      (item) => item.branch_id === "risk:scenario",
    );

    expect(financeBranch?.status).toBe("blocked");
    expect(financeBranch?.summary).toContain("economic_basis");
    expect(riskBranch?.status).toBe("planned");
    expect(trace.composition_gate.can_compose).toBe(false);
    expect(trace.composition_gate.reason).toBe("clarify_block_open");
    expect(trace.policy_decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate: "trust",
          decision: "block",
          reason: "Trust specialization gate trust_gate_pending.",
        }),
      ]),
    );
  });
});
