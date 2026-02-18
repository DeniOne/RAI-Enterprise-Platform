import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';
import type { GeneratedDraft } from '../domain/draft-factory';

/**
 * GenerationRecordService — Сервис записи генерации.
 * 
 * ИНВАРИАНТ I28 (Generation Record Immutability):
 * Записи генерации НЕЛЬЗЯ изменять после создания.
 * Защита обеспечена DB-триггером trg_generation_record_immutable.
 * 
 * Этот сервис только СОЗДАЁТ записи. UPDATE и DELETE — запрещены на уровне БД.
 * 
 * ИНВАРИАНТ I19 (Determinism):
 * При создании записи пересчитывается canonicalHash и сверяется с заявленным.
 */
@Injectable()
export class GenerationRecordService {
    private readonly logger = new Logger(GenerationRecordService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly canonicalSorter: CanonicalSorter,
        private readonly stableHasher: StableHasher,
    ) { }

    /**
     * Создаёт immutable запись генерации (I28).
     * 
     * КРИТИЧНО: Проверяет hash match перед записью.
     * Если hash не совпадает — запись НЕ создаётся.
     * 
     * @param draft - сгенерированный черновик
     * @param canonicalizedPayload - каноническая форма inputParams
     * @param inputParams - оригинальные входные параметры
     * @returns id созданной записи
     * @throws Error при hash mismatch
     */
    async createRecord(
        draft: GeneratedDraft,
        canonicalizedPayload: string,
        inputParams: Record<string, unknown>,
        explainabilityReport: Record<string, unknown> | null,
    ): Promise<string> {
        const metadata = draft.generationMetadata;

        // I19: Пересчитываем hash и проверяем перед записью
        const recomputedHash = this.stableHasher.hashGeneration(
            canonicalizedPayload,
            metadata.modelVersion,
            metadata.seed,
        );

        if (recomputedHash !== metadata.hash) {
            throw new Error(
                `[I28+I19] Hash mismatch при создании GenerationRecord! ` +
                `declared=${metadata.hash.substring(0, 16)}..., ` +
                `recomputed=${recomputedHash.substring(0, 16)}... ` +
                `Запись НЕ создана. Подмена payload/seed/hash.`,
            );
        }

        // Проверка дубликата (canonicalHash @unique)
        const existing = await this.findByCanonicalHash(metadata.hash);
        if (existing) {
            this.logger.warn(
                `[I28] Дубликат генерации detected: canonicalHash=${metadata.hash.substring(0, 16)}..., ` +
                `existing_id=${existing.id}. Возвращаем existing.`,
            );
            return existing.id;
        }

        const record = await this.prisma.generationRecord.create({
            data: {
                inputParams: inputParams as any,
                canonicalizedPayload: JSON.parse(canonicalizedPayload),
                modelId: metadata.modelId,
                modelVersion: metadata.modelVersion,
                engineVersion: metadata.modelVersion,
                seed: metadata.seed,
                canonicalHash: metadata.hash,
                result: 'SUCCESS',
                explainability: explainabilityReport as any, // I24: Сохраняем сразу
                limitationsDisclosed: true,
                companyId: draft.companyId,
            },
        });

        this.logger.log(
            `[I28] GenerationRecord создан: id=${record.id}, canonicalHash=${metadata.hash.substring(0, 16)}...`,
        );

        return record.id;
    }

    /**
     * Создаёт запись о неудачной генерации.
     */
    async createFailedRecord(
        inputParams: Record<string, unknown>,
        canonicalizedPayload: string,
        seed: string,
        canonicalHash: string,
        companyId: string,
        errorDetails: Record<string, unknown>,
    ): Promise<string> {
        const record = await this.prisma.generationRecord.create({
            data: {
                inputParams: inputParams as any,
                canonicalizedPayload: JSON.parse(canonicalizedPayload),
                seed,
                canonicalHash,
                result: 'FAILED',
                errorDetails: errorDetails as any,
                limitationsDisclosed: true,
                companyId,
            },
        });

        this.logger.warn(
            `[I28] GenerationRecord (FAILED) создан: id=${record.id}`,
        );

        return record.id;
    }

    /**
     * Найти запись по canonicalHash (для replay-проверки и дубликат-детекции).
     * canonicalHash @unique → findUnique работает.
     */
    async findByCanonicalHash(canonicalHash: string) {
        return this.prisma.generationRecord.findUnique({
            where: { canonicalHash },
        });
    }

    /**
     * Найти запись по ID.
     */
    async findById(id: string) {
        return this.prisma.generationRecord.findUnique({
            where: { id },
        });
    }

    /**
     * Верификация целостности записи (replay proof).
     * Пересчитывает canonicalHash и сравнивает с сохранённым.
     */
    async verifyRecordIntegrity(recordId: string): Promise<boolean> {
        const record = await this.findById(recordId);
        if (!record) {
            throw new Error(`[I28] GenerationRecord ${recordId} не найден`);
        }

        const canonical = this.canonicalSorter.canonicalize(record.canonicalizedPayload);
        const recomputed = this.stableHasher.hashGeneration(
            canonical,
            record.modelVersion,
            record.seed,
        );

        const isValid = recomputed === record.canonicalHash;

        this.logger.log(
            `[I28] Record integrity check: id=${recordId}, ` +
            `valid=${isValid ? '✅' : '❌'}`,
        );

        return isValid;
    }
}
