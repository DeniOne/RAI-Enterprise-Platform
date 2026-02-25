import { Injectable, Logger } from "@nestjs/common";
import type { GenerationMetadata } from "./draft-factory";
import { StableHasher } from "../deterministic/stable-hasher";

/**
 * MetadataBuilder — Построитель метаданных генерации.
 *
 * ИНВАРИАНТ I16 (Generation Provenance):
 * Каждая генерация записывает: modelId, modelVersion, generatedAt, seed, hash.
 *
 * Контракт Фазы 0.5:
 * - §2: seed = SHA-256(canonical(params)) → uint32 → String
 * - §3: hash = SHA-256(canonicalizedPayload + '|' + modelVersion + '|' + seed)
 *
 * Делегирует хеширование в StableHasher для single source of truth.
 */

const MODEL_ID = "generative-engine-v1";
const MODEL_VERSION = "1.0.0";

@Injectable()
export class MetadataBuilder {
  private readonly logger = new Logger(MetadataBuilder.name);

  constructor(private readonly stableHasher: StableHasher) {}

  /**
   * Строит метаданные генерации (I16).
   *
   * @param canonicalizedPayload - каноническая форма inputParams
   * @param seed - String seed (от SeedManager)
   * @param fixedTimestamp - фиксированный timestamp (от EntropyController)
   * @returns GenerationMetadata
   */
  buildMetadata(
    canonicalizedPayload: string,
    seed: string,
    fixedTimestamp: string,
  ): GenerationMetadata {
    const hash = this.stableHasher.hashGeneration(
      canonicalizedPayload,
      MODEL_VERSION,
      seed,
    );

    const metadata: GenerationMetadata = {
      modelId: MODEL_ID,
      modelVersion: MODEL_VERSION,
      generatedAt: fixedTimestamp,
      seed,
      hash,
    };

    this.logger.log(
      `[I16] Метаданные генерации: modelId=${MODEL_ID}, ` +
        `version=${MODEL_VERSION}, seed=${seed}, hash=${hash.substring(0, 16)}...`,
    );

    return metadata;
  }

  getModelId(): string {
    return MODEL_ID;
  }

  getModelVersion(): string {
    return MODEL_VERSION;
  }
}
