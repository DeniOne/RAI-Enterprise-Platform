import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@rai/prisma-client';
import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';

/**
 * DivergenceTrackerService — Транзакционная запись расхождений AI/Human.
 *
 * ИНВАРИАНТ I31: Append-Only. БД-триггер запрещает UPDATE/DELETE.
 * ИНВАРИАНТ I32: explanation обязательно (NOT NULL в schema).
 * ИНВАРИАНТ I30: simulationHash + idempotencyKey гарантируют reproducibility.
 *
 * Идемпотентность: SHA256(RFC8785(canonical({draftId, draftVersion, humanAction, disVersion})))
 */

export interface RecordDivergenceInput {
    companyId: string;
    draftId: string;
    draftVersion: number;
    disVersion: string;
    weightsSnapshot: Record<string, number>;
    disScore: number;
    simulationHash: string;
    deltaRisk: number;
    conflictVector: Record<string, unknown>;
    humanAction: Record<string, unknown>;
    explanation: string;
    simulationMode: 'DETERMINISTIC' | 'MONTE_CARLO';
    policyVersion?: string;
}

@Injectable()
export class DivergenceTrackerService {
    private readonly logger = new Logger(DivergenceTrackerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly canonicalSorter: CanonicalSorter,
        private readonly stableHasher: StableHasher,
    ) { }

    /**
     * Записывает расхождение в иммутабельный лог.
     * Идемпотентная операция: при повторном вызове с теми же данными возвращает id существующей записи.
     *
     * @returns id записи DivergenceRecord
     */
    async recordDivergence(input: RecordDivergenceInput): Promise<string> {
        // 1. Проверяем обязательность explanation (I32)
        if (!input.explanation || input.explanation.trim().length === 0) {
            throw new Error(
                '[I32] explanation обязателен. Пустое объяснение запрещено.',
            );
        }

        // 2. Вычисляем idempotency key
        const idempotencyKey = this.computeIdempotencyKey(input);

        // 3. Проверяем идемпотентность — уже существует?
        const existing = await this.prisma.divergenceRecord.findUnique({
            where: { idempotencyKey },
            select: { id: true },
        });

        if (existing) {
            this.logger.log(
                `[IDEMPOTENT] DivergenceRecord уже существует: id=${existing.id}, key=${idempotencyKey.substring(0, 16)}...`,
            );
            return existing.id;
        }

        // 4. Валидация диапазонов
        this.assertBounds(input);

        // 5. Транзакционная запись
        try {
            const record = await this.prisma.$transaction(async (tx) => {
                // Проверяем FK: GovernanceConfig.versionId существует
                const config = await tx.governanceConfig.findUnique({
                    where: { versionId: input.disVersion },
                    select: { id: true },
                });

                if (!config) {
                    throw new Error(
                        `[I31] GovernanceConfig с versionId="${input.disVersion}" не найден.`,
                    );
                }

                return tx.divergenceRecord.create({
                    data: {
                        companyId: input.companyId,
                        draftId: input.draftId,
                        draftVersion: input.draftVersion,
                        disVersion: input.disVersion,
                        weightsSnapshot: input.weightsSnapshot,
                        disScore: input.disScore,
                        simulationHash: input.simulationHash,
                        deltaRisk: input.deltaRisk,
                        conflictVector: input.conflictVector,
                        humanAction: input.humanAction,
                        explanation: input.explanation,
                        simulationMode: input.simulationMode,
                        idempotencyKey,
                        policyVersion: input.policyVersion ?? null,
                    },
                });
            });

            this.logger.log(
                `[I31] DivergenceRecord создан: id=${record.id}, ` +
                `draftId=${input.draftId}, disScore=${input.disScore}, ` +
                `ΔRisk=${input.deltaRisk}`,
            );

            return record.id;
        } catch (error) {
            // Prisma P2002 = unique constraint violation → идемпотентный ответ
            if (
                error instanceof Error &&
                'code' in (error as any) &&
                (error as any).code === 'P2002'
            ) {
                const existing = await this.prisma.divergenceRecord.findUnique({
                    where: { idempotencyKey },
                    select: { id: true },
                });
                if (existing) {
                    this.logger.warn(
                        `[IDEMPOTENT-RACE] DivergenceRecord race detected, returning existing: ${existing.id}`,
                    );
                    return existing.id;
                }
            }
            throw error;
        }
    }

    /**
     * Получить DivergenceRecord по ID.
     */
    async findById(id: string) {
        return this.prisma.divergenceRecord.findUnique({
            where: { id },
            include: { governanceConfig: true },
        });
    }

    /**
     * Получить все DivergenceRecord по draftId (история расхождений).
     */
    async findByDraftId(draftId: string) {
        return this.prisma.divergenceRecord.findMany({
            where: { draftId },
            orderBy: { createdAt: 'desc' },
            include: { governanceConfig: true },
        });
    }

    /**
     * Вычисляет идемпотентный ключ: SHA256(RFC8785(canonical({draftId, draftVersion, humanAction, disVersion})))
     */
    private computeIdempotencyKey(input: RecordDivergenceInput): string {
        const canonicalInput = {
            draftId: input.draftId,
            draftVersion: input.draftVersion,
            humanAction: input.humanAction,
            disVersion: input.disVersion,
        };

        const canonicalized = this.canonicalSorter.canonicalize(canonicalInput);
        return this.stableHasher.hash(canonicalized);
    }

    /**
     * Проверяет граничные условия инвариантов.
     */
    private assertBounds(input: RecordDivergenceInput): void {
        // DIS ∈ [0, 1]
        if (input.disScore < 0 || input.disScore > 1) {
            throw new Error(
                `[I29] disScore=${input.disScore} вне диапазона [0, 1].`,
            );
        }

        // ΔRisk ∈ [-1, 1]
        if (input.deltaRisk < -1 || input.deltaRisk > 1) {
            throw new Error(
                `[I29] deltaRisk=${input.deltaRisk} вне диапазона [-1, 1].`,
            );
        }

        // simulationHash — ровно 64 hex chars (SHA256)
        if (!/^[a-f0-9]{64}$/.test(input.simulationHash)) {
            throw new Error(
                `[I30] simulationHash не является валидным SHA256: len=${input.simulationHash.length}`,
            );
        }

        // simulationMode — строго enum
        if (!['DETERMINISTIC', 'MONTE_CARLO'].includes(input.simulationMode)) {
            throw new Error(
                `[I30] simulationMode="${input.simulationMode}" не поддерживается.`,
            );
        }
    }
}
