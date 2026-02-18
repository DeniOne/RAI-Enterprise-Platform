import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { TechMapStatus, UserRole } from '@rai/prisma-client';

/**
 * DraftFactory — Фабрика генеративных черновиков.
 * 
 * ИНВАРИАНТ I15 (Draft Isolation):
 * Все сгенерированные TechMap создаются со статусом GENERATED_DRAFT.
 * Черновики изолированы от production-состояний FSM.
 * Переход в DRAFT только через HUMAN_APPROVE (I17).
 * 
 * ИНВАРИАНТ I17 (Human Override):
 * AI/SYSTEM не может утвердить черновик. Только HUMAN.
 */

/**
 * Параметры генерации TechMap.
 */
export interface GenerationParams {
    strategyId: string;
    strategyVersion: number;
    cropId: string;
    regionId?: string;
    seasonId: string;
    fieldId: string;
    soilType?: string;
    moisture?: number;
    precursor?: string;
    companyId: string;
    harvestPlanId: string;
    explicitSeed?: number;
}

/**
 * Шаблон операции из стратегии.
 */
export interface OperationTemplate {
    name: string;
    description?: string;
    sequence: number;
    stageName: string;
    stageSequence: number;
    durationHours?: number;
    resources: ResourceTemplate[];
    requiredMachineryType?: string;
}

/**
 * Шаблон ресурса из стратегии.
 */
export interface ResourceTemplate {
    type: string;
    name: string;
    amount: number;
    unit: string;
    costPerUnit?: number;
}

/**
 * Ограничение из стратегии (I21).
 */
export interface StrategyConstraint {
    type: string;     // 'TIMING' | 'RESOURCE' | 'SOIL' | 'TEMPERATURE' | 'MOISTURE'
    field: string;     // Поле ограничения
    operator: string;  // 'EQ' | 'LT' | 'GT' | 'LTE' | 'GTE' | 'IN' | 'NOT_IN'
    value: unknown;    // Значение ограничения
    message: string;   // Человекочитаемое описание
}

/**
 * Структура сгенерированного черновика (in-memory, до персистенции).
 */
export interface GeneratedDraft {
    seasonId: string;
    harvestPlanId: string;
    companyId: string;
    fieldId: string;
    crop: string;
    soilType?: string;
    moisture?: number;
    precursor?: string;
    status: TechMapStatus;
    version: number;
    generationMetadata: GenerationMetadata;
    stages: GeneratedStage[];
    propagatedConstraints: StrategyConstraint[];
}

export interface GeneratedStage {
    name: string;
    sequence: number;
    aplStageId?: string;
    operations: GeneratedOperation[];
}

export interface GeneratedOperation {
    name: string;
    description?: string;
    sequence: number;
    durationHours?: number;
    requiredMachineryType?: string;
    resources: GeneratedResource[];
}

export interface GeneratedResource {
    type: string;
    name: string;
    amount: number;
    unit: string;
    costPerUnit?: number;
}

export interface GenerationMetadata {
    modelId: string;
    modelVersion: string;
    generatedAt: string;
    seed: string;        // String seed для determinism proof и DB storage
    hash: string;        // canonicalHash = SHA-256(canonical + modelVersion + seed)
}

@Injectable()
export class DraftFactory {
    private readonly logger = new Logger(DraftFactory.name);

    /**
     * Создаёт генеративный черновик TechMap из стратегии (I15).
     * 
     * @param params - параметры генерации
     * @param operationTemplates - шаблоны операций из выбранной стратегии
     * @param metadata - метаданные генерации (I16)
     * @param version - версия TechMap
     * @returns GeneratedDraft со статусом GENERATED_DRAFT
     */
    createDraft(
        params: GenerationParams,
        operationTemplates: OperationTemplate[],
        metadata: GenerationMetadata,
        version: number,
    ): GeneratedDraft {
        this.logger.log(
            `[I15] Создание генеративного черновика: field=${params.fieldId}, ` +
            `crop=${params.cropId}, seed=${metadata.seed}`,
        );

        // Группировка операций по стадиям (детерминированно — по sequence)
        const stageMap = new Map<string, OperationTemplate[]>();
        for (const op of operationTemplates) {
            const key = `${op.stageSequence}::${op.stageName}`;
            if (!stageMap.has(key)) {
                stageMap.set(key, []);
            }
            stageMap.get(key)!.push(op);
        }

        // Детерминированная сортировка стадий (по stageSequence)
        const sortedStageKeys = Array.from(stageMap.keys()).sort((a, b) => {
            const seqA = parseInt(a.split('::')[0], 10);
            const seqB = parseInt(b.split('::')[0], 10);
            return seqA - seqB;
        });

        const stages: GeneratedStage[] = sortedStageKeys.map((key, idx) => {
            const [seqStr, stageName] = key.split('::');
            const ops = stageMap.get(key)!;

            return {
                name: stageName,
                sequence: idx + 1,
                operations: ops
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((op) => ({
                        name: op.name,
                        description: op.description,
                        sequence: op.sequence,
                        durationHours: op.durationHours,
                        requiredMachineryType: op.requiredMachineryType,
                        resources: op.resources.map((r) => ({
                            type: r.type,
                            name: r.name,
                            amount: r.amount,
                            unit: r.unit,
                            costPerUnit: r.costPerUnit,
                        })),
                    })),
            };
        });

        const draft: GeneratedDraft = {
            seasonId: params.seasonId,
            harvestPlanId: params.harvestPlanId,
            companyId: params.companyId,
            fieldId: params.fieldId,
            crop: params.cropId,
            soilType: params.soilType,
            moisture: params.moisture,
            precursor: params.precursor,
            status: TechMapStatus.GENERATED_DRAFT,
            version,
            generationMetadata: metadata,
            stages,
            propagatedConstraints: [], // Заполняется ConstraintPropagator
        };

        this.logger.log(
            `[I15] Черновик создан: ${stages.length} стадий, ` +
            `${stages.reduce((acc, s) => acc + s.operations.length, 0)} операций, ` +
            `status=GENERATED_DRAFT`,
        );

        return draft;
    }

    /**
     * Проверяет, может ли актор утвердить черновик (I17).
     * Только роли HUMAN (не SYSTEM/AI) могут утверждать.
     * 
     * @param userRole - роль пользователя
     * @returns true если утверждение разрешено
     * @throws ForbiddenException если роль не позволяет утверждение
     */
    assertHumanApproval(userRole: UserRole): void {
        const allowedRoles: UserRole[] = [
            UserRole.ADMIN,
            UserRole.CEO,
            UserRole.MANAGER,
            UserRole.AGRONOMIST,
        ];

        if (!allowedRoles.includes(userRole)) {
            throw new ForbiddenException(
                `[I17] Human Override: роль ${userRole} не может утвердить ` +
                `генеративный черновик. Допустимые роли: ${allowedRoles.join(', ')}`,
            );
        }
    }
}
