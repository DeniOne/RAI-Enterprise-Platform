import { Injectable, Logger } from "@nestjs/common";
import {
  RiskMetricCalculator,
  RiskInput,
  RiskOutput,
} from "./risk-metric-calculator";
import { CanonicalSorter } from "../deterministic/canonical-sorter";
import { StableHasher } from "../deterministic/stable-hasher";
import { roundHalfToEven } from "../deterministic/round-half-to-even";

/**
 * OverrideRiskAnalyzer — Расчёт ΔRisk при Human Override (I29).
 *
 * Формула: ΔRisk = Risk(A_Human) - Risk(A_AI)
 * Результат нормализуется в [-1, 1]:
 *   > 0 → override увеличивает риск
 *   < 0 → override снижает риск
 *   = 0 → нейтральный override
 *
 * Defensive Fallback: если расчёт политики > 200ms → IS_SYSTEM_FALLBACK.
 * policyVersion включается в simulationHash ДО симуляции (Hash Pipeline §2).
 */

export interface OverrideAnalysisInput {
  aiDraft: RiskInput;
  humanOverride: RiskInput;
  policyVersion: string;
  simulationMode: "DETERMINISTIC" | "MONTE_CARLO";
}

export interface OverrideAnalysisResult {
  deltaRisk: number; // [-1, 1]
  aiRisk: RiskOutput;
  humanRisk: RiskOutput;
  simulationHash: string; // SHA256, 64 hex chars
  isSystemFallback: boolean;
  policyVersion: string;
}

@Injectable()
export class OverrideRiskAnalyzer {
  private readonly logger = new Logger(OverrideRiskAnalyzer.name);
  private static readonly POLICY_TIMEOUT_MS = 200;

  constructor(
    private readonly riskCalc: RiskMetricCalculator,
    private readonly canonicalSorter: CanonicalSorter,
    private readonly stableHasher: StableHasher,
  ) {}

  /**
   * Анализирует Override и рассчитывает ΔRisk.
   *
   * Hash Pipeline — СТРОГИЙ ПОРЯДОК:
   * 1. Сбор canonical input (aiDraft, humanOverride)
   * 2. Включение policyVersion + simulationMode (ДО симуляции)
   * 3. Выполнение симуляции (расчёт рисков)
   * 4. roundHalfToEven(result, 8)
   * 5. RFC8785(canonicalJSON)
   * 6. SHA256 → simulationHash
   */
  analyze(input: OverrideAnalysisInput): OverrideAnalysisResult {
    const startTime = Date.now();
    let isSystemFallback = false;

    // --- STEP 1-2: Canonical Input (включая policyVersion ДО симуляции) ---
    const canonicalInput = {
      aiDraft: input.aiDraft,
      humanOverride: input.humanOverride,
      policyVersion: input.policyVersion,
      simulationMode: input.simulationMode,
    };

    // --- STEP 3: Выполнение симуляции ---
    let aiRisk: RiskOutput;
    let humanRisk: RiskOutput;

    try {
      aiRisk = this.riskCalc.calculate(input.aiDraft);
      humanRisk = this.riskCalc.calculate(input.humanOverride);

      // Defensive timeout check
      const elapsed = Date.now() - startTime;
      if (elapsed > OverrideRiskAnalyzer.POLICY_TIMEOUT_MS) {
        this.logger.warn(
          `[IS_SYSTEM_FALLBACK] Policy calculation exceeded ${OverrideRiskAnalyzer.POLICY_TIMEOUT_MS}ms: ` +
            `${elapsed}ms. Используем fallback.`,
        );
        isSystemFallback = true;
      }
    } catch (error) {
      this.logger.error(
        `[IS_SYSTEM_FALLBACK] Risk calculation failed: ${(error as Error).message}`,
      );
      isSystemFallback = true;
      // Fallback: нулевые риски
      aiRisk = {
        yieldRisk: 0,
        financialRisk: 0,
        complianceRisk: 0,
        aggregated: 0,
      };
      humanRisk = {
        yieldRisk: 0,
        financialRisk: 0,
        complianceRisk: 0,
        aggregated: 0,
      };
    }

    // ΔRisk = Risk(Human) - Risk(AI), normalized to [-1, 1]
    const rawDelta = humanRisk.aggregated - aiRisk.aggregated;
    const deltaRisk = Math.min(Math.max(rawDelta, -1), 1);

    // --- STEP 4: roundHalfToEven(8) ---
    const roundedResult = {
      input: canonicalInput,
      aiRisk: {
        yieldRisk: roundHalfToEven(aiRisk.yieldRisk),
        financialRisk: roundHalfToEven(aiRisk.financialRisk),
        complianceRisk: roundHalfToEven(aiRisk.complianceRisk),
        aggregated: roundHalfToEven(aiRisk.aggregated),
      },
      humanRisk: {
        yieldRisk: roundHalfToEven(humanRisk.yieldRisk),
        financialRisk: roundHalfToEven(humanRisk.financialRisk),
        complianceRisk: roundHalfToEven(humanRisk.complianceRisk),
        aggregated: roundHalfToEven(humanRisk.aggregated),
      },
      deltaRisk: roundHalfToEven(deltaRisk),
    };

    // --- STEP 5: RFC8785(canonicalJSON) ---
    const canonicalized = this.canonicalSorter.canonicalize(roundedResult);

    // --- STEP 6: SHA256 ---
    const simulationHash = this.stableHasher.hash(canonicalized);

    this.logger.log(
      `[I29] ΔRisk=${roundHalfToEven(deltaRisk)}, ` +
        `AI_aggregated=${roundHalfToEven(aiRisk.aggregated)}, ` +
        `Human_aggregated=${roundHalfToEven(humanRisk.aggregated)}, ` +
        `hash=${simulationHash.substring(0, 16)}...`,
    );

    return {
      deltaRisk: roundHalfToEven(deltaRisk),
      aiRisk,
      humanRisk,
      simulationHash,
      isSystemFallback,
      policyVersion: input.policyVersion,
    };
  }
}
