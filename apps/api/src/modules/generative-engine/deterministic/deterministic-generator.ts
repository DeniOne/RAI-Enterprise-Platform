import { Injectable, Logger } from "@nestjs/common";
import { EntropyController } from "../domain/entropy-controller";
import {
  DraftFactory,
  type GenerationParams,
  type OperationTemplate,
  type StrategyConstraint,
  type GeneratedDraft,
} from "../domain/draft-factory";
import { MetadataBuilder } from "../domain/metadata-builder";
import { ConstraintPropagator } from "../domain/constraint-propagator";
import { SeedManager } from "./seed-manager";
import { CanonicalSorter } from "./canonical-sorter";
import { IntegrityGateGenerative } from "../validation/integrity-gate-generative";

/**
 * DeterministicGenerator — Ядро детерминированной генерации.
 *
 * ИНВАРИАНТ I19 (Deterministic Generation, B1 Strict):
 * generate(P, seed)₀ ≡ generate(P, seed)ₙ (побайтовая идентичность)
 *
 * Pipeline:
 * 1. Canonicalize(params) + assertIdempotent
 * 2. ResolveSeed(canonical, explicitSeed) — NO RANDOM FALLBACK
 * 3. ComputeFixedTimestamp(seed)
 * 4. WrapDeterministicContext {
 *      5. BuildMetadata(canonical, seed, timestamp)
 *      6. CreateDraft(params, templates, metadata, version)
 *      7. PropagateConstraints(draft, constraints)
 *    }
 * 8. Post-generation validation (hash recompute)
 * 9. Return GeneratedDraft
 */
@Injectable()
export class DeterministicGenerator {
  private readonly logger = new Logger(DeterministicGenerator.name);

  constructor(
    private readonly entropyController: EntropyController,
    private readonly draftFactory: DraftFactory,
    private readonly metadataBuilder: MetadataBuilder,
    private readonly constraintPropagator: ConstraintPropagator,
    private readonly seedManager: SeedManager,
    private readonly canonicalSorter: CanonicalSorter,
    private readonly integrityGate: IntegrityGateGenerative,
  ) {}

  /**
   * Детерминированная генерация TechMap (I19).
   *
   * @param params - параметры генерации
   * @param operationTemplates - шаблоны операций из стратегии
   * @param constraints - ограничения из стратегии
   * @param version - версия TechMap
   * @returns GeneratedDraft — побайтово воспроизводимый
   */
  async generate(
    params: GenerationParams,
    operationTemplates: OperationTemplate[],
    constraints: StrategyConstraint[],
    version: number,
  ): Promise<GeneratedDraft> {
    this.logger.log(`[I19] Запуск детерминированной генерации`);

    // 1. Каноникализация входных параметров + idempotency proof
    const canonicalParams = this.canonicalizeParams(params);
    this.canonicalSorter.assertIdempotent(canonicalParams);

    // 2. Resolve seed (NO RANDOM FALLBACK)
    const seed = this.seedManager.resolveSeed(
      canonicalParams,
      params.explicitSeed,
    );

    // 3. Фиксированный timestamp
    const fixedTimestamp = this.entropyController.computeFixedTimestamp(seed);

    // 4. Оборачиваем в детерминированный контекст
    const draft = await this.entropyController.wrapDeterministicContext(() => {
      // 5. Build metadata (I16) — seed is String
      const metadata = this.metadataBuilder.buildMetadata(
        canonicalParams,
        seed,
        fixedTimestamp,
      );

      // 6. Create draft (I15)
      const rawDraft = this.draftFactory.createDraft(
        params,
        operationTemplates,
        metadata,
        version,
      );

      // 7. Propagate constraints (I21)
      const constrainedDraft = this.constraintPropagator.propagate(
        rawDraft,
        constraints,
      );

      return constrainedDraft;
    }, fixedTimestamp);

    // 8. Post-generation validation: hash recompute (I19 proof)
    this.integrityGate.validateGeneratedDraft(draft, canonicalParams);

    this.logger.log(
      `[I19] Генерация завершена: seed=${seed}, hash=${draft.generationMetadata.hash.substring(0, 16)}...`,
    );

    return draft;
  }

  /**
   * Каноникализирует параметры генерации.
   * Извлекает только seed-relevant поля (по контракту §2).
   */
  private canonicalizeParams(params: GenerationParams): string {
    const seedRelevantParams = {
      strategyId: params.strategyId,
      strategyVersion: params.strategyVersion,
      cropId: params.cropId,
      regionId: params.regionId ?? null, // Handle optional
      seasonId: params.seasonId,
      fieldId: params.fieldId,
      soilType: params.soilType ?? null, // Handle optional
      companyId: params.companyId,
    };

    return this.canonicalSorter.canonicalize(seedRelevantParams);
  }
}
