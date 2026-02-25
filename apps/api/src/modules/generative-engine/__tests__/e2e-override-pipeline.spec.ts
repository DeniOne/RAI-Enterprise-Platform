import {
  DraftStateManager,
  GovernanceContext,
} from "../fsm/draft-state-manager";
import {
  CounterfactualEngine,
  CounterfactualInput,
} from "../contradiction/counterfactual-engine";
import {
  ConflictMatrixService,
  ConflictMatrixInput,
} from "../contradiction/conflict-matrix.service";
import {
  OverrideRiskAnalyzer,
  OverrideAnalysisInput,
} from "../risk/override-risk-analyzer";
import { ConflictExplainabilityBuilder } from "../contradiction/conflict-explainability-builder";
import { RiskMetricCalculator } from "../risk/risk-metric-calculator";
import { CanonicalSorter } from "../deterministic/canonical-sorter";
import { StableHasher } from "../deterministic/stable-hasher";
import { TechMapStatus, UserRole } from "@rai/prisma-client";
import { ForbiddenException } from "@nestjs/common";

/**
 * E2E Override Pipeline Test.
 *
 * Полный цикл:
 *   1. CounterfactualEngine.simulate() → hash + trajectories + regret
 *   2. OverrideRiskAnalyzer.analyze() → deltaRisk + hash
 *   3. ConflictMatrixService.calculate() → DIS + conflictVector
 *   4. ConflictExplainabilityBuilder → explanation (I32)
 *   5. FSM transition с GovernanceContext (I33)
 *   6. Hash determinism verified
 *   7. Idempotency verified
 */
describe("E2E Override Pipeline", () => {
  let fsm: DraftStateManager;
  let engine: CounterfactualEngine;
  let conflictMatrix: ConflictMatrixService;
  let riskAnalyzer: OverrideRiskAnalyzer;
  let explainability: ConflictExplainabilityBuilder;

  const WEIGHTS = { w1: 0.3, w2: 0.3, w3: 0.2, w4: 0.2 };
  const POLICY_VERSION = "v2.1.0";

  const CF_INPUT: CounterfactualInput = {
    draftSnapshot: {
      crop: "wheat",
      region: "central",
      area: 100,
      yieldTarget: 30,
      costEstimate: 45000,
      stages: [
        {
          name: "Посев",
          sequence: 1,
          operations: [
            { type: "sowing", product: "seed-01", dose: 250, unit: "kg/ha" },
          ],
        },
      ],
      constraints: [{ type: "maxBudget", value: 500000 }],
    },
    humanAction: {
      yieldTarget: 28,
      costEstimate: 48000,
      stages: [
        {
          name: "Посев",
          sequence: 1,
          operations: [
            { type: "sowing", product: "seed-01", dose: 280, unit: "kg/ha" },
            {
              type: "fertilizing",
              product: "nh4no3",
              dose: 100,
              unit: "kg/ha",
            },
          ],
        },
      ],
    },
    weights: WEIGHTS,
    policyVersion: POLICY_VERSION,
    simulationMode: "DETERMINISTIC",
  };

  const RISK_INPUT: OverrideAnalysisInput = {
    aiDraft: {
      yieldExpected: 30,
      yieldOverride: 30,
      costExpected: 45000,
      costOverride: 45000,
      complianceScore: 1.0,
    },
    humanOverride: {
      yieldExpected: 30,
      yieldOverride: 28,
      costExpected: 45000,
      costOverride: 48000,
      complianceScore: 0.9,
    },
    policyVersion: POLICY_VERSION,
    simulationMode: "DETERMINISTIC",
  };

  beforeEach(() => {
    fsm = new DraftStateManager();
    const sorter = new CanonicalSorter();
    const hasher = new StableHasher();
    engine = new CounterfactualEngine(sorter, hasher);
    conflictMatrix = new ConflictMatrixService();
    const riskCalc = new RiskMetricCalculator();
    riskAnalyzer = new OverrideRiskAnalyzer(riskCalc, sorter, hasher);
    explainability = new ConflictExplainabilityBuilder();
  });

  // ─── Full Pipeline ────────────────────────────────────────────────

  it("полный pipeline: simulation → DIS → governance → FSM transition", () => {
    // ── Step 1: Counterfactual Simulation ──
    const cfResult = engine.simulate(CF_INPUT);

    expect(cfResult.simulationHash).toBeDefined();
    expect(cfResult.simulationHash.length).toBe(64);
    expect(cfResult.regret).toBeDefined();
    expect(cfResult.aiTrajectory).toBeDefined();
    expect(cfResult.humanTrajectory).toBeDefined();

    // ── Step 2: Override Risk Analysis ──
    const riskResult = riskAnalyzer.analyze(RISK_INPUT);

    expect(riskResult.deltaRisk).toBeGreaterThanOrEqual(-1);
    expect(riskResult.deltaRisk).toBeLessThanOrEqual(1);
    expect(riskResult.simulationHash.length).toBe(64);

    // ── Step 3: Conflict Matrix (DIS) ──
    const disInput: ConflictMatrixInput = {
      aiYield: cfResult.aiTrajectory.expectedYield,
      humanYield: cfResult.humanTrajectory.expectedYield,
      aiCost: cfResult.aiTrajectory.expectedCost,
      humanCost: cfResult.humanTrajectory.expectedCost,
      deltaRisk: riskResult.deltaRisk,
      aiOperationCount: 1,
      humanOperationCount: 2,
      weights: WEIGHTS,
    };

    const disResult = conflictMatrix.calculate(disInput);

    expect(disResult.disScore).toBeGreaterThanOrEqual(0);
    expect(disResult.disScore).toBeLessThanOrEqual(1);
    expect(disResult.conflictVector).toBeDefined();

    // ── Step 4: Explainability (I32) ──
    const explanation = explainability.buildExplanation({
      disScore: disResult.disScore,
      deltaRisk: riskResult.deltaRisk,
      conflictVector: disResult.conflictVector,
      weights: WEIGHTS,
      regret: cfResult.regret,
      simulationMode: "DETERMINISTIC",
      humanAction: CF_INPUT.humanAction,
      isSystemFallback: riskResult.isSystemFallback,
    });

    expect(explanation.summary.length).toBeGreaterThan(0); // I32
    expect(["ACCEPT", "REVIEW", "REJECT"]).toContain(
      explanation.recommendation,
    );

    // ── Step 5: DivergenceRecord mock ──
    const mockDivergenceId = "clxyz_mock_divergence_e2e";

    // ── Step 6: FSM Transition с Governance Guard (I33) ──
    const governance: GovernanceContext = {
      divergenceRecordId: mockDivergenceId,
      disScore: disResult.disScore,
    };

    if (disResult.disScore > DraftStateManager.HIGH_RISK_DIS_THRESHOLD) {
      governance.justification = explanation.summary;
    }

    expect(
      fsm.canTransition(
        TechMapStatus.OVERRIDE_ANALYSIS,
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
        governance,
      ),
    ).toBe(true);

    expect(() =>
      fsm.validate(
        TechMapStatus.OVERRIDE_ANALYSIS,
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
        governance,
      ),
    ).not.toThrow();
  });

  // ── Hash Determinism ──────────────────────────────────────────────

  it("hash determinism: одинаковые inputs → одинаковый simulationHash", () => {
    const hash1 = engine.simulate(CF_INPUT).simulationHash;
    const hash2 = engine.simulate(CF_INPUT).simulationHash;
    expect(hash1).toBe(hash2);
  });

  it("hash sensitivity: разные policyVersion → разный hash", () => {
    const hash1 = engine.simulate({
      ...CF_INPUT,
      policyVersion: "v1.0.0",
    }).simulationHash;
    const hash2 = engine.simulate({
      ...CF_INPUT,
      policyVersion: "v2.0.0",
    }).simulationHash;
    expect(hash1).not.toBe(hash2);
  });

  // ── Governance Guard Block ────────────────────────────────────────

  it("pipeline БЕЗ DivergenceRecord → FSM ЗАБЛОКИРОВАН", () => {
    // Выполняем весь pipeline кроме записи DivergenceRecord
    engine.simulate(CF_INPUT);
    riskAnalyzer.analyze(RISK_INPUT);

    // FSM: без divergenceRecordId → запрещено
    expect(
      fsm.canTransition(
        TechMapStatus.OVERRIDE_ANALYSIS,
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
        { disScore: 0.5 }, // нет divergenceRecordId!
      ),
    ).toBe(false);

    expect(() =>
      fsm.validate(
        TechMapStatus.OVERRIDE_ANALYSIS,
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
        { disScore: 0.5 },
      ),
    ).toThrow(ForbiddenException);
  });

  // ── Idempotency ──────────────────────────────────────────────────

  it("idempotency: одинаковый canonical → одинаковый hash", () => {
    const r1 = engine.simulate(CF_INPUT);
    const r2 = engine.simulate(CF_INPUT);

    expect(r1.simulationHash).toBe(r2.simulationHash);
    expect(r1.regret).toBe(r2.regret);
  });

  // ── High Risk Flow ────────────────────────────────────────────────

  it("high risk: DIS > 0.7 без justification → FSM БЛОКИРУЕТ", () => {
    expect(
      fsm.canTransition(
        TechMapStatus.OVERRIDE_ANALYSIS,
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
        { divergenceRecordId: "valid", disScore: 0.85 },
      ),
    ).toBe(false);
  });

  it("high risk: DIS > 0.7 С justification → FSM РАЗРЕШАЕТ", () => {
    expect(
      fsm.canTransition(
        TechMapStatus.OVERRIDE_ANALYSIS,
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
        {
          divergenceRecordId: "valid",
          disScore: 0.85,
          justification: "Подтверждено: погодные условия требуют отклонения",
        },
      ),
    ).toBe(true);
  });
});
