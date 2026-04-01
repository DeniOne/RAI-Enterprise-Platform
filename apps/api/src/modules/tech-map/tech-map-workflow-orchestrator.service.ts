import { Injectable } from "@nestjs/common";
import type { BranchTrustAssessment } from "../../shared/rai-chat/branch-trust.types";
import type {
  TechMapContextReadiness,
  TechMapPublicationState,
  TechMapWorkflowVerdict,
} from "../../shared/tech-map/tech-map-governed-state.types";
import type { TechMapBranchType } from "../../shared/tech-map/tech-map-governed-branch.types";
import type {
  TechMapWorkflowOrchestrationPhase,
  TechMapWorkflowPhaseTrace,
  TechMapWorkflowBranchScheduleItem,
  TechMapWorkflowOrchestrationInput,
  TechMapWorkflowOrchestrationTrace,
  TechMapWorkflowPolicyDecisionRecord,
} from "../../shared/tech-map/tech-map-workflow-orchestrator.types";
import type { TechMapExpertReviewResult } from "../../shared/tech-map/tech-map-governed-branch.types";
import type { TechMapSlotGroup } from "../../shared/tech-map/tech-map-slot-registry";
import type { TechMapGovernedTrustSpecialization } from "../../shared/tech-map/tech-map-governed-trust.helpers";

const BLOCKING_CLARIFY_SEVERITIES = new Set([
  "REQUIRED_BLOCKING",
  "REQUIRED_REVIEW",
]);

@Injectable()
export class TechMapWorkflowOrchestratorService {
  buildWorkflowTrace(
    input: TechMapWorkflowOrchestrationInput,
  ): TechMapWorkflowOrchestrationTrace {
    const phaseEngine: TechMapWorkflowOrchestrationPhase[] = [
      "INTAKE",
      "TRIAGE",
      "BRANCHING",
      "TRUST",
      "COMPOSITION",
    ];

    const hasOpenClarify = input.missing_must.length > 0;
    const blockedSlotGroups = new Set<TechMapSlotGroup>(
      input.clarify_items
        .filter((item) => BLOCKING_CLARIFY_SEVERITIES.has(item.severity))
        .map((item) => item.group_key as TechMapSlotGroup),
    );
    const trustSpecialization = input.trust_specialization ?? null;
    const trustSatisfied = this.isTrustSatisfied(
      input.branch_trust_assessments ?? [],
      trustSpecialization,
    );
    const branchSchedule = this.buildBranchSchedule({
      blockedSlotGroups,
      trustSpecialization,
      hasBudgetPolicy: input.has_budget_policy,
      hasExecutionHistory: input.has_execution_history,
      hasPastOutcomes: input.has_past_outcomes,
      hasAllowedInputCatalogVersion: input.has_allowed_input_catalog_version,
      hasTargetKpiPolicy: input.has_target_kpi_policy,
      hasWeatherNormals: input.has_weather_normals,
    });
    const phaseTrace = this.buildPhaseTrace({
      hasOpenClarify,
      trustSatisfied,
      branchSchedule,
      resumeRequested: input.resume_requested ?? false,
      branchTrustAssessments: input.branch_trust_assessments ?? [],
      trustSpecialization,
    });
    const policyDecisions = this.buildPolicyDecisions({
      hasOpenClarify,
      trustSatisfied,
      branchTrustAssessments: input.branch_trust_assessments ?? [],
      trustSpecialization,
      expertReview: input.expert_review ?? null,
    });
    const currentPhase = hasOpenClarify
      ? "TRIAGE"
      : trustSatisfied
        ? "TRUST"
        : branchSchedule.length > 0
          ? "BRANCHING"
          : "INTAKE";
    const nextPhase = this.resolveNextPhase(
      currentPhase,
      hasOpenClarify,
      trustSatisfied,
    );
    const expertReviewApproved =
      !input.expert_review ||
      input.expert_review.verdict === "APPROVE_WITH_NOTES";
    const trustGateComposeAllowed =
      trustSpecialization?.composition_gate.can_compose ?? trustSatisfied;
    const canCompose =
      !hasOpenClarify && trustGateComposeAllowed && expertReviewApproved;
    const compositionReason = canCompose
      ? trustSpecialization?.composition_gate.reason ?? "trust_gate_passed"
      : hasOpenClarify
        ? "clarify_block_open"
        : input.expert_review &&
            input.expert_review.verdict !== "APPROVE_WITH_NOTES"
          ? `expert_review_${input.expert_review.verdict.toLowerCase()}`
          : trustSpecialization?.composition_gate.reason ?? "trust_gate_pending";

    return {
      workflow_id: input.workflow_id,
      draft_id: input.draft_id,
      lead_owner_agent: input.lead_owner_agent,
      readiness: input.readiness,
      publication_state: input.publication_state,
      workflow_verdict: input.workflow_verdict,
      current_phase: currentPhase,
      next_phase: nextPhase,
      phase_engine: phaseEngine,
      phase_trace: phaseTrace,
      branch_schedule: branchSchedule,
      policy_decisions: policyDecisions,
      expert_review: input.expert_review ?? null,
      trust_gate_required: true,
      composition_gate: {
        can_compose: canCompose,
        reason: compositionReason,
      },
      audit_refs: this.buildAuditRefs(input.workflow_id, phaseTrace, branchSchedule),
      summary: this.buildSummary({
        currentPhase,
        nextPhase,
        branchSchedule,
        trustSatisfied,
        hasOpenClarify,
        trustSpecialization,
        expertReview: input.expert_review ?? null,
      }),
    };
  }

  private buildBranchSchedule(params: {
    blockedSlotGroups: Set<TechMapSlotGroup>;
    trustSpecialization: TechMapGovernedTrustSpecialization | null;
    hasBudgetPolicy: boolean;
    hasExecutionHistory: boolean;
    hasPastOutcomes: boolean;
    hasAllowedInputCatalogVersion: boolean;
    hasTargetKpiPolicy: boolean;
    hasWeatherNormals: boolean;
  }): TechMapWorkflowBranchScheduleItem[] {
    const items: TechMapWorkflowBranchScheduleItem[] = [];
    const primaryBranch = this.resolveBranchSchedulingState({
      branchId: "agronomic:primary",
      branchType: "agronomic",
      blockedSlotGroups: params.blockedSlotGroups,
      trustSpecialization: params.trustSpecialization,
      defaultStatus: "ready",
    });
    items.push({
      branch_id: "agronomic:primary",
      branch_type: "agronomic",
      agent_role: "agronomist",
      execution_mode: "blocking",
      status: primaryBranch.status,
      depends_on: [],
      publication_critical: true,
      summary: `Primary agronomic branch ${primaryBranch.summary}`,
    });

    if (params.hasBudgetPolicy || params.hasTargetKpiPolicy) {
      const financeBranch = this.resolveBranchSchedulingState({
        branchId: "finance:policy",
        branchType: "finance",
        blockedSlotGroups: params.blockedSlotGroups,
        trustSpecialization: params.trustSpecialization,
        defaultStatus: "planned",
      });
      items.push({
        branch_id: "finance:policy",
        branch_type: "finance",
        agent_role: "economist",
        execution_mode: "parallel",
        status: financeBranch.status,
        depends_on: ["agronomic:primary"],
        publication_critical: true,
        summary: `Finance branch ${financeBranch.summary}`,
      });
    }

    if (params.hasExecutionHistory || params.hasPastOutcomes) {
      const evidenceBranch = this.resolveBranchSchedulingState({
        branchId: "evidence:history",
        branchType: "evidence_reference",
        blockedSlotGroups: params.blockedSlotGroups,
        trustSpecialization: params.trustSpecialization,
        defaultStatus: "planned",
      });
      items.push({
        branch_id: "evidence:history",
        branch_type: "evidence_reference",
        agent_role: "knowledge",
        execution_mode: "parallel",
        status: evidenceBranch.status,
        depends_on: ["agronomic:primary"],
        publication_critical: false,
        summary: `Evidence branch ${evidenceBranch.summary}`,
      });
    }

    if (params.hasWeatherNormals) {
      const riskBranch = this.resolveBranchSchedulingState({
        branchId: "risk:scenario",
        branchType: "risk_scenario",
        blockedSlotGroups: params.blockedSlotGroups,
        trustSpecialization: params.trustSpecialization,
        defaultStatus: "planned",
      });
      items.push({
        branch_id: "risk:scenario",
        branch_type: "risk_scenario",
        agent_role: "monitoring",
        execution_mode: "parallel",
        status: riskBranch.status,
        depends_on: ["agronomic:primary"],
        publication_critical: false,
        summary: `Risk branch ${riskBranch.summary}`,
      });
    }

    if (params.hasAllowedInputCatalogVersion) {
      const complianceBranch = this.resolveBranchSchedulingState({
        branchId: "compliance:methodology",
        branchType: "compliance_methodology",
        blockedSlotGroups: params.blockedSlotGroups,
        trustSpecialization: params.trustSpecialization,
        defaultStatus: "planned",
      });
      items.push({
        branch_id: "compliance:methodology",
        branch_type: "compliance_methodology",
        agent_role: "chief_agronomist",
        execution_mode: "sequential",
        status: complianceBranch.status,
        depends_on: ["agronomic:primary"],
        publication_critical: true,
        summary: `Compliance branch ${complianceBranch.summary}`,
      });
    }

    return items;
  }

  private buildPhaseTrace(params: {
    hasOpenClarify: boolean;
    trustSatisfied: boolean;
    branchSchedule: TechMapWorkflowBranchScheduleItem[];
    resumeRequested: boolean;
    branchTrustAssessments: BranchTrustAssessment[];
    trustSpecialization: TechMapGovernedTrustSpecialization | null;
  }) {
    const branchScheduled = params.branchSchedule.length > 0;
    const blockedBranchCount = params.branchSchedule.filter(
      (branch) => branch.status === "blocked",
    ).length;
    const readyOrPlannedCount = params.branchSchedule.filter(
      (branch) => branch.status === "ready" || branch.status === "planned",
    ).length;
    const phaseTrace: TechMapWorkflowPhaseTrace[] = [
      {
        phase: "INTAKE" as const,
        status: "completed" as const,
        owner_role: "agronomist",
        depends_on: [] as TechMapWorkflowOrchestrationPhase[],
        summary: params.resumeRequested
          ? "Workflow resumed from a clarify-aware intake."
          : "Workflow intake normalized into a governed draft context.",
      },
      {
        phase: "TRIAGE" as const,
        status: "completed" as const,
        owner_role: "agronomist",
        depends_on: ["INTAKE" as TechMapWorkflowOrchestrationPhase],
        summary: params.hasOpenClarify
          ? "Clarify batch opened and triaged as a controlled intake loop."
          : "No blocking clarify gaps remain after intake.",
      },
      {
        phase: "BRANCHING" as const,
        status: branchScheduled
          ? blockedBranchCount > 0 && readyOrPlannedCount === 0
            ? ("blocked" as const)
            : ("planned" as const)
          : ("skipped" as const),
        owner_role: "agronomist",
        depends_on: ["TRIAGE" as TechMapWorkflowOrchestrationPhase],
        summary:
          blockedBranchCount > 0
            ? `Branch scheduling detected ${blockedBranchCount} blocked branch(es) by slot or trust gates.`
            : branchScheduled
              ? "Domain branches are scheduled under owner-led control."
              : "No domain branches were required for this workflow slice.",
      },
      {
        phase: "TRUST" as const,
        status: params.trustSpecialization
          ? params.trustSpecialization.composition_gate.can_compose
            ? ("completed" as const)
            : ("blocked" as const)
          : params.branchTrustAssessments.length > 0 && params.trustSatisfied
          ? ("completed" as const)
          : params.branchTrustAssessments.length > 0
            ? ("blocked" as const)
            : ("planned" as const),
        owner_role: "knowledge",
        depends_on: ["BRANCHING" as TechMapWorkflowOrchestrationPhase],
        summary: params.trustSpecialization
          ? `Trust specialization ${params.trustSpecialization.composition_gate.can_compose ? "allows" : "blocks"} composition (${params.trustSpecialization.composition_gate.reason}).`
          : params.branchTrustAssessments.length > 0
          ? "Branch trust has been assessed and can gate composition."
          : "Trust gate waits for branch results before composition.",
      },
      {
        phase: "COMPOSITION" as const,
        status:
          !params.hasOpenClarify && params.trustSatisfied
            ? ("planned" as const)
            : ("blocked" as const),
        owner_role: "supervisor",
        depends_on: ["TRUST" as TechMapWorkflowOrchestrationPhase],
        summary:
          !params.hasOpenClarify && params.trustSatisfied
            ? "Composition may proceed once branch payloads are complete."
            : "Composition remains blocked until trust and clarify gates clear.",
      },
    ];
    return phaseTrace;
  }

  private buildPolicyDecisions(params: {
    hasOpenClarify: boolean;
    trustSatisfied: boolean;
    branchTrustAssessments: BranchTrustAssessment[];
    trustSpecialization: TechMapGovernedTrustSpecialization | null;
    expertReview: TechMapExpertReviewResult | null;
  }): TechMapWorkflowPolicyDecisionRecord[] {
    const trustDecision = params.trustSpecialization
      ? params.trustSpecialization.composition_gate.can_compose
        ? "allow"
        : "block"
      : params.branchTrustAssessments.length === 0
        ? "defer"
        : params.trustSatisfied
          ? "allow"
          : "block";
    const trustReason = params.trustSpecialization
      ? `Trust specialization gate ${params.trustSpecialization.composition_gate.reason}.`
      : params.branchTrustAssessments.length === 0
        ? "No branch trust results are available yet."
        : params.trustSatisfied
          ? "Branch trust is sufficient for composition gating."
          : "Branch trust is not sufficient yet.";
    return [
      {
        gate: "handoff",
        decision: params.hasOpenClarify ? "block" : "allow",
        reason: params.hasOpenClarify
          ? "Clarify batch is open, so owner handoff stays blocked."
          : "Owner handoff is allowed after intake.",
      },
      {
        gate: "branching",
        decision: params.hasOpenClarify ? "block" : "allow",
        reason: params.hasOpenClarify
          ? "Branching must wait for clarify closure."
          : "Branching can be scheduled from the governed draft.",
      },
      {
        gate: "trust",
        decision: trustDecision,
        reason: trustReason,
      },
      {
        gate: "expert_review",
        decision: params.expertReview
          ? params.expertReview.verdict === "APPROVE_WITH_NOTES"
            ? "allow"
            : "block"
          : "defer",
        reason: params.expertReview
          ? `Expert review verdict ${params.expertReview.verdict} (${params.expertReview.trigger}).`
          : "Expert review is not required for this draft.",
      },
      {
        gate: "composition",
        decision:
          !params.hasOpenClarify &&
          params.trustSatisfied &&
          (!params.expertReview ||
            params.expertReview.verdict === "APPROVE_WITH_NOTES")
            ? "allow"
            : "block",
        reason:
          !params.hasOpenClarify &&
          params.trustSatisfied &&
          (!params.expertReview ||
            params.expertReview.verdict === "APPROVE_WITH_NOTES")
            ? params.expertReview
              ? "Composition can proceed after expert review and trust clearance."
              : "Composition can proceed after trust clearance."
            : "Composition must remain blocked until trust, clarify and expert review gates clear.",
      },
    ];
  }

  private buildAuditRefs(
    workflowId: string,
    phaseTrace: Array<{ phase: string; status: string }>,
    branchSchedule: Array<{ branch_id: string; status: string }>,
  ): string[] {
    return [
      `workflow:${workflowId}:phase:${phaseTrace[0]?.phase ?? "INTAKE"}`,
      ...phaseTrace.map((phase) => `workflow:${workflowId}:phase:${phase.phase}:${phase.status}`),
      ...branchSchedule.map(
        (branch) => `workflow:${workflowId}:branch:${branch.branch_id}:${branch.status}`,
      ),
    ];
  }

  private buildSummary(params: {
    currentPhase: TechMapWorkflowOrchestrationPhase;
    nextPhase: TechMapWorkflowOrchestrationPhase | null;
    branchSchedule: TechMapWorkflowBranchScheduleItem[];
    trustSatisfied: boolean;
    hasOpenClarify: boolean;
    trustSpecialization: TechMapGovernedTrustSpecialization | null;
    expertReview: TechMapExpertReviewResult | null;
  }): string {
    const branchCount = params.branchSchedule.length;
    const blockedBranchCount = params.branchSchedule.filter(
      (branch) => branch.status === "blocked",
    ).length;
    const nextPhase = params.nextPhase ?? (params.hasOpenClarify ? "paused" : "COMPOSITION");
    const expertSuffix = params.expertReview
      ? ` Expert review ${params.expertReview.verdict} via ${params.expertReview.trigger}. Publication packet ${params.expertReview.publication_packet_ref}. Human agronomy ${params.expertReview.human_authority_chain.find((step) => step.role === "human_agronomist")?.status ?? "pending"}.`
      : "";
    const trustSuffix = params.trustSpecialization
      ? ` Trust gate ${params.trustSpecialization.composition_gate.can_compose ? "passed" : "blocked"} (${params.trustSpecialization.composition_gate.reason}). Blocked disclosure: ${params.trustSpecialization.blocked_disclosure.length}.`
      : "";
    return `Workflow spine ${params.currentPhase} -> ${nextPhase}. Branches scheduled: ${branchCount}. Branches blocked: ${blockedBranchCount}. Clarify open: ${params.hasOpenClarify ? "yes" : "no"}. Trust satisfied: ${params.trustSatisfied ? "yes" : "no"}.${trustSuffix}${expertSuffix}`;
  }

  private isTrustSatisfied(
    assessments: BranchTrustAssessment[],
    trustSpecialization: TechMapGovernedTrustSpecialization | null,
  ): boolean {
    if (trustSpecialization) {
      return trustSpecialization.composition_gate.can_compose;
    }
    if (assessments.length === 0) {
      return false;
    }

    return assessments.every(
      (assessment) =>
        assessment.verdict === "VERIFIED" || assessment.verdict === "PARTIAL",
    );
  }

  private resolveNextPhase(
    currentPhase: TechMapWorkflowOrchestrationPhase,
    hasOpenClarify: boolean,
    trustSatisfied: boolean,
  ): TechMapWorkflowOrchestrationPhase | null {
    if (currentPhase === "INTAKE") {
      return "TRIAGE";
    }
    if (currentPhase === "TRIAGE") {
      return hasOpenClarify ? null : "BRANCHING";
    }
    if (currentPhase === "BRANCHING") {
      return trustSatisfied ? "COMPOSITION" : "TRUST";
    }
    if (currentPhase === "TRUST") {
      return "COMPOSITION";
    }
    return null;
  }

  private resolveBranchSchedulingState(params: {
    branchId: string;
    branchType: TechMapBranchType;
    blockedSlotGroups: Set<TechMapSlotGroup>;
    trustSpecialization: TechMapGovernedTrustSpecialization | null;
    defaultStatus: TechMapWorkflowBranchScheduleItem["status"];
  }): {
    status: TechMapWorkflowBranchScheduleItem["status"];
    summary: string;
  } {
    const requiredGroups = this.resolveRequiredSlotGroupsForBranch(
      params.branchType,
    );
    const blockedGroups = requiredGroups.filter((group) =>
      params.blockedSlotGroups.has(group),
    );
    if (blockedGroups.length > 0) {
      return {
        status: "blocked",
        summary: `is blocked by missing slot families: ${blockedGroups.join(", ")}.`,
      };
    }
    if (
      params.trustSpecialization &&
      params.trustSpecialization.blocked_branch_ids.includes(params.branchId)
    ) {
      return {
        status: "blocked",
        summary: `is blocked by trust specialization (${params.trustSpecialization.composition_gate.reason}).`,
      };
    }
    return {
      status: params.defaultStatus,
      summary:
        params.defaultStatus === "ready"
          ? "can start immediately."
          : "is scheduled after primary intake.",
    };
  }

  private resolveRequiredSlotGroupsForBranch(
    branchType: TechMapBranchType,
  ): TechMapSlotGroup[] {
    switch (branchType) {
      case "agronomic":
        return ["identity_scope", "agronomic_basis", "methodology_and_governance"];
      case "finance":
        return ["identity_scope", "economic_basis", "methodology_and_governance"];
      case "evidence_reference":
        return ["identity_scope", "history_and_evidence"];
      case "risk_scenario":
        return ["identity_scope", "external_basis"];
      case "compliance_methodology":
        return ["identity_scope", "methodology_and_governance"];
      default:
        return ["identity_scope"];
    }
  }
}
