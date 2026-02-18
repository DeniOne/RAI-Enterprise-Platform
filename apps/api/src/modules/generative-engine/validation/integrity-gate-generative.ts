import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { GenerationParams } from '../domain/draft-factory';
import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';

/**
 * IntegrityGateGenerative — Validation Gate для Generative Engine.
 * 
 * Pre-generation и post-generation валидация.
 * Post-generation ПЕРЕСЧИТЫВАЕТ hash и сверяет с заявленным (I19).
 * Проверяет immutability violations, подмену payload/seed/hash.
 */
@Injectable()
export class IntegrityGateGenerative {
    private readonly logger = new Logger(IntegrityGateGenerative.name);

    constructor(
        private readonly canonicalSorter: CanonicalSorter,
        private readonly stableHasher: StableHasher,
    ) { }

    /**
     * Pre-generation validation.
     * Проверяет валидность входных параметров перед генерацией.
     */
    validateGenerationInput(params: GenerationParams): void {
        const errors: string[] = [];

        if (!params.strategyId) {
            errors.push('strategyId обязателен');
        }
        if (!params.cropId) {
            errors.push('cropId обязателен');
        }
        if (!params.seasonId) {
            errors.push('seasonId обязателен');
        }
        if (!params.fieldId) {
            errors.push('fieldId обязателен');
        }
        if (!params.companyId) {
            errors.push('companyId обязателен');
        }
        if (!params.harvestPlanId) {
            errors.push('harvestPlanId обязателен');
        }
        if (params.strategyVersion !== undefined && params.strategyVersion < 1) {
            errors.push('strategyVersion должен быть >= 1');
        }
        if (params.explicitSeed !== undefined) {
            if (!Number.isInteger(params.explicitSeed) || params.explicitSeed < 0 || params.explicitSeed > 0xFFFFFFFF) {
                errors.push('explicitSeed должен быть uint32 [0, 2^32)');
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(
                `[VALIDATION] Ошибки входных параметров генерации:\n${errors.join('\n')}`,
            );
        }

        this.logger.log('[VALIDATION] Pre-generation input: OK');
    }

    /**
     * Post-generation validation (I19 Determinism Proof).
     * 
     * КРИТИЧНО: Пересчитывает canonicalHash и сверяет с заявленным.
     * Если hash не совпадает — генерация невалидна.
     * 
     * Проверяет:
     * 1. Структуру черновика (status, stages, metadata)
     * 2. Пересчёт canonicalHash (hash = SHA-256(canonical + modelVersion + seed))
     * 3. Idempotency каноникализации (canonical(canonical(x)) === canonical(x))
     */
    validateGeneratedDraft(
        draft: {
            status: string;
            stages: unknown[];
            generationMetadata: {
                seed: string;
                hash: string;
                modelId: string;
                modelVersion: string;
            };
            companyId: string;
        },
        canonicalizedPayload: string,
    ): void {
        const errors: string[] = [];

        // --- Structural Validation ---
        if (draft.status !== 'GENERATED_DRAFT') {
            errors.push(`status должен быть GENERATED_DRAFT, получен: ${draft.status}`);
        }
        if (!draft.stages || draft.stages.length === 0) {
            errors.push('Черновик должен содержать хотя бы одну стадию');
        }
        if (!draft.generationMetadata) {
            errors.push('generationMetadata обязательна (I16)');
        }
        if (!draft.generationMetadata?.hash) {
            errors.push('hash обязателен в metadata (I16)');
        }
        if (!draft.generationMetadata?.seed) {
            errors.push('seed обязателен в metadata (I16)');
        }
        if (!draft.companyId) {
            errors.push('companyId обязателен (tenant isolation)');
        }

        // --- I19: Hash Recomputation Proof ---
        if (draft.generationMetadata?.hash && canonicalizedPayload) {
            const recomputedHash = this.stableHasher.hashGeneration(
                canonicalizedPayload,
                draft.generationMetadata.modelVersion,
                draft.generationMetadata.seed,
            );

            if (recomputedHash !== draft.generationMetadata.hash) {
                errors.push(
                    `[I19] CRITICAL: canonicalHash mismatch! ` +
                    `declared=${draft.generationMetadata.hash.substring(0, 16)}..., ` +
                    `recomputed=${recomputedHash.substring(0, 16)}... ` +
                    `Подмена payload/seed/hash detected.`,
                );
            }

            this.logger.log(
                `[I19] Hash recomputation: ${recomputedHash === draft.generationMetadata.hash ? 'MATCH ✅' : 'MISMATCH ❌'}`,
            );
        }

        // --- Canonicalization Idempotency ---
        if (canonicalizedPayload) {
            try {
                const parsed = JSON.parse(canonicalizedPayload);
                const recanonical = this.canonicalSorter.canonicalize(parsed);
                if (recanonical !== canonicalizedPayload) {
                    errors.push(
                        `[I19] Canonicalization NOT idempotent! ` +
                        `canonical(canonical(x)) !== canonical(x). Determinism broken.`,
                    );
                }
            } catch {
                errors.push('[I19] canonicalizedPayload не является валидным JSON');
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(
                `[VALIDATION] Post-generation validation failed:\n${errors.join('\n')}`,
            );
        }

        this.logger.log('[VALIDATION] Post-generation draft: OK (hash verified)');
    }

    /**
     * Validates replay integrity: проверяет, что stored record hash
     * соответствует пересчитанному из stored payload + seed.
     * 
     * Защита от replay attack.
     */
    validateRecordIntegrity(record: {
        canonicalizedPayload: unknown;
        modelVersion: string;
        seed: string;
        canonicalHash: string;
    }): boolean {
        const canonical = this.canonicalSorter.canonicalize(record.canonicalizedPayload);
        const recomputed = this.stableHasher.hashGeneration(
            canonical,
            record.modelVersion,
            record.seed,
        );

        const isValid = recomputed === record.canonicalHash;

        if (!isValid) {
            this.logger.error(
                `[I19] Record integrity VIOLATED: stored_hash=${record.canonicalHash.substring(0, 16)}..., ` +
                `recomputed=${recomputed.substring(0, 16)}...`,
            );
        }

        return isValid;
    }
}
