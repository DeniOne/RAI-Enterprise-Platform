import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { ConsultingService } from "../consulting/consulting.service";
import { RegistryAgentService } from "./registry-agent.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
    FieldObservation,
    ObservationType,
    ObservationIntent,
    IntegrityStatus,
    RiskType,
    RiskLevel,
    Controllability,
    LiabilityMode,
    TaskStatus,
    AssetStatus
} from "@rai/prisma-client";

@Injectable()
export class IntegrityGateService {
    private readonly logger = new Logger(IntegrityGateService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly deviationService: DeviationService,
        private readonly consultingService: ConsultingService,
        private readonly registryAgent: RegistryAgentService,
    ) { }

    /**
     * Единственная точка входа (Admission Gate) для влияния Фронт-офиса на Бэк-офис.
     * Применяет Архитектурный Закон BETA_INTEGRITY_LAYER.
     */
    async processObservation(observation: FieldObservation) {
        this.logger.log(`[INTEGRITY-GATE] Applying Law to observation ${observation.id} (Intent: ${observation.intent})`);

        // [SENSORY-BRAIN] Pre-processing: Intent Classification for Dumb Transport (Text)
        if (observation.intent === ObservationIntent.MONITORING && observation.content) {
            const lowerContent = observation.content.toLowerCase().trim();
            const confirmationKeywords = ['ок', 'ok', '+', 'да', 'yes', 'подтверждаю', 'confirm', 'y', 'ага'];
            if (confirmationKeywords.some(keyword => lowerContent.includes(keyword))) {
                this.logger.log(`[INTEGRITY-GATE] Re-classifying text "${observation.content}" as CONFIRMATION`);
                observation.intent = ObservationIntent.CONFIRMATION;
            }
        }

        try {
            // 0. Recognition Path (AI-Driven Asset Ingestion)
            // Если наблюдение не привязано к задаче, пробуем распознать активы
            if (!observation.taskId) {
                await this.registryAgent.processObservation(observation);
            }

            // 1. Применение Обязательных Причинно-Следственных Связей (Mandatory Causal Loops)
            switch (observation.intent) {
                case ObservationIntent.INCIDENT:
                case ObservationIntent.CALL:
                    await this.handleIncidentLoop(observation);
                    break;
                case ObservationIntent.CONFIRMATION:
                    await this.handleEconomicLoop(observation);
                    break;
                case ObservationIntent.DELAY:
                    await this.handleStrategicLoop(observation);
                    break;
                case ObservationIntent.MONITORING:
                    this.logger.log(`[INTEGRITY-GATE] Passive monitoring for ${observation.id}`);
                    break;
                default:
                    this.logger.warn(`[INTEGRITY-GATE] Unknown intent: ${observation.intent}`);
            }

            // 2. Обработка Негативного Контура (Evidence Strength)
            if (observation.integrityStatus === IntegrityStatus.WEAK_EVIDENCE || observation.integrityStatus === IntegrityStatus.NO_EVIDENCE) {
                await this.handleWeakEvidence(observation);
            }
        } catch (error) {
            this.logger.error(`[INTEGRITY-GATE] Failed to enforce Policy for ${observation.id}: ${error.message}`);
            throw error;
        }
    }

    private async handleIncidentLoop(observation: FieldObservation) {
        this.logger.warn(`[LAW] Mandatory Loop: INCIDENT -> CMR DeviationReview`);

        const review = await this.deviationService.createReview({
            companyId: observation.companyId,
            // fieldId: observation.fieldId, // [FIX] DeviationReview does not have fieldId in schema
            seasonId: observation.seasonId,
            deviationSummary: `[LAW-ENFORCED] Автоматический инцидент из поля. Намерение: ${observation.intent}. Тип пруфа: ${observation.type}.`,
            aiImpactAssessment: observation.integrityStatus === IntegrityStatus.STRONG_EVIDENCE
                ? "Высокая достоверность (Strong Evidence)"
                : "ТРЕБУЕТСЯ ПРОВЕРКА (Weak/No Evidence)",
        });

        await this.prisma.fieldObservation.update({
            where: { id: observation.id },
            data: { deviationReviewId: review.id },
        });

        await this.consultingService.openConsultationThread(review.id);
    }

    private async handleWeakEvidence(observation: FieldObservation) {
        this.logger.warn(`[LAW] Negative Contour: WEAK_EVIDENCE detected for observation ${observation.id}`);

        // Получаем задачу для трассировки
        const task = observation.taskId ? await this.prisma.task.findUnique({ where: { id: observation.taskId } }) : null;

        // Создаем запись о риске с полной трассировкой (Requirement 2.2)
        await this.prisma.cmrRisk.create({
            data: {
                companyId: observation.companyId,
                seasonId: observation.seasonId,
                type: RiskType.OPERATIONAL,
                description: `[LAW-ENFORCED] Низкая достоверность доказательств по задаче. ObservationId: ${observation.id}`,
                probability: RiskLevel.MEDIUM,
                impact: RiskLevel.MEDIUM,
                controllability: Controllability.CONSULTANT,
                liabilityMode: LiabilityMode.CONSULTANT_ONLY,
                status: "OPEN",
                // Трассировка (Law Traceability)
                taskId: observation.taskId,
                observationId: observation.id,
                responsibleId: (task as any)?.responsibleId || observation.authorId,
            }
        });
    }

    /**
     * Silence Path Monitoring (Requirement 3.B)
     * Проверяет задачи с истекшим SLA на предмет отсутствия наблюдений.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async checkTaskSilence() {
        this.logger.log(`[INTEGRITY-GATE] Running Silence Path Audit...`);

        const overdueTasks = await this.prisma.task.findMany({
            where: {
                status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
                slaExpiration: { lt: new Date() },
                // Проверяем, что по задаче нет ни одного наблюдения
                fieldObservations: { none: {} }
            },
            include: {
                season: true
            }
        });

        for (const task of overdueTasks) {
            this.logger.error(`[LAW-VIOLATION] Silence detected for Task ${task.id}. SLA Expired.`);

            // Создаем риск нарушения регламента (Compliance/Silence Risk)
            await this.prisma.cmrRisk.create({
                data: {
                    companyId: task.companyId,
                    seasonId: task.seasonId,
                    type: RiskType.REGULATORY,
                    description: `[SILENCE-PATH] Нарушение регламента: отсутствие отчета по задаче "${task.name}" в рамках SLA.`,
                    probability: RiskLevel.HIGH,
                    impact: RiskLevel.HIGH,
                    controllability: Controllability.CONSULTANT,
                    liabilityMode: LiabilityMode.CONSULTANT_ONLY,
                    status: "OPEN",
                    // Трассировка
                    taskId: task.id,
                    responsibleId: (task as any).responsibleId || (task as any).assigneeId,
                }
            });

            // Опционально: переводим задачу в состояние ошибки или эскалации
            // await this.prisma.task.update({ where: { id: task.id }, data: { status: 'ESCALATED' } });
        }
    }

    private async handleEconomicLoop(observation: FieldObservation) {
        this.logger.log(`[LAW] Mandatory Loop: CONFIRMATION -> Asset Activation`);

        // Окно валидности: 24 часа (Tech Lead Requirement)
        const validityWindow = new Date();
        validityWindow.setHours(validityWindow.getHours() - 24);

        // Поиск кандидатов (Machinery & Stock)
        const pendingMachinery = await this.prisma.machinery.findFirst({
            where: {
                companyId: observation.companyId,
                status: AssetStatus.PENDING_CONFIRMATION,
                createdAt: { gte: validityWindow },
            },
            orderBy: { createdAt: 'desc' }
        });

        const pendingStock = await this.prisma.stockItem.findFirst({
            where: {
                companyId: observation.companyId,
                status: AssetStatus.PENDING_CONFIRMATION,
                createdAt: { gte: validityWindow },
            },
            orderBy: { createdAt: 'desc' }
        });

        // Выбор самого свежего кандидата
        let targetAsset: { type: 'MACHINERY' | 'STOCK', id: string, name: string, createdAt: Date } | null = null;

        if (pendingMachinery && pendingStock) {
            targetAsset = pendingMachinery.createdAt > pendingStock.createdAt
                ? { type: 'MACHINERY', id: pendingMachinery.id, name: pendingMachinery.name, createdAt: pendingMachinery.createdAt }
                : { type: 'STOCK', id: pendingStock.id, name: pendingStock.name, createdAt: pendingStock.createdAt };
        } else if (pendingMachinery) {
            targetAsset = { type: 'MACHINERY', id: pendingMachinery.id, name: pendingMachinery.name, createdAt: pendingMachinery.createdAt };
        } else if (pendingStock) {
            targetAsset = { type: 'STOCK', id: pendingStock.id, name: pendingStock.name, createdAt: pendingStock.createdAt };
        }

        if (!targetAsset) {
            this.logger.warn(`[INTEGRITY-GATE] CONFIRMATION received but no PENDING assets found in last 24h.`);
            // TODO: Notify user "Nothing to confirm"
            return;
        }

        // Активация
        if (targetAsset.type === 'MACHINERY') {
            await this.prisma.machinery.update({
                where: { id: targetAsset.id },
                data: {
                    status: AssetStatus.ACTIVE,
                    confirmedByUserId: observation.authorId,
                    confirmedAt: new Date()
                }
            });
        } else {
            await this.prisma.stockItem.update({
                where: { id: targetAsset.id },
                data: {
                    status: AssetStatus.ACTIVE,
                    confirmedByUserId: observation.authorId,
                    confirmedAt: new Date()
                }
            });
        }

        this.logger.log(`[INTEGRITY-GATE] Asset CONFIRMED: ${targetAsset.type} ${targetAsset.name} (${targetAsset.id})`);

        // TODO: Send async notification via TelegramNotificationService that asset is ACTIVE
    }

    private async handleStrategicLoop(observation: FieldObservation) {
        this.logger.log(`[LAW] Mandatory Loop: DELAY -> DecisionRecord -> TechMap (Placeholder)`);
    }

    /**
     * Валидация допуска техкарты (Admission Gate).
     * Проверяет готовность техники и наличие ТМЦ.
     */
    async validateTechMapAdmission(techMapId: string) {
        this.logger.log(`[INTEGRITY-GATE] Validating Admission for TechMap ${techMapId}`);

        const map = await this.prisma.techMap.findUnique({
            where: { id: techMapId },
            include: {
                stages: {
                    include: {
                        operations: {
                            include: {
                                resources: true
                            }
                        }
                    }
                }
            }
        });

        if (!map) throw new Error("TechMap not found");

        const issues: Array<{ type: string; message: string; severity: 'ERROR' | 'WARNING' }> = [];

        // 1. Проверка Техники (Machinery Readiness)
        const allOperations = map.stages.flatMap(s => s.operations);
        const requiredMachineryTypes = [...new Set(allOperations.map(o => o.requiredMachineryType).filter(Boolean))];

        for (const mType of requiredMachineryTypes) {
            const activeMachinery = await this.prisma.machinery.count({
                where: {
                    companyId: map.companyId,
                    type: mType!,
                    status: 'ACTIVE'
                }
            });

            if (activeMachinery === 0) {
                issues.push({
                    type: 'MACHINERY_MISSING',
                    message: `Для активации требуется техника типа ${mType}, но нет ни одной активной единицы в реестре.`,
                    severity: 'ERROR'
                });

                // Law Enforcement: Создаем риск блокировки производства
                await this.prisma.cmrRisk.create({
                    data: {
                        companyId: map.companyId,
                        seasonId: map.seasonId,
                        type: RiskType.OPERATIONAL,
                        description: `[ADMISSION-BLOCK] Отсутствует активная техника типа ${mType} для техкарты ${map.id}`,
                        probability: RiskLevel.CRITICAL,
                        impact: RiskLevel.CRITICAL,
                        controllability: Controllability.CLIENT,
                        liabilityMode: LiabilityMode.CLIENT_ONLY,
                        status: "OPEN"
                    }
                });
            }
        }

        // 2. Проверка ТМЦ (Stock Sufficiency)
        const allPlannedResources = allOperations.flatMap(o => o.resources);
        // Группируем по типу и имени для сверки с остатками
        const resourceDemands = allPlannedResources.reduce((acc, res) => {
            const key = `${res.type}:${res.name}`;
            acc[key] = (acc[key] || 0) + res.amount;
            return acc;
        }, {} as Record<string, number>);

        for (const [resKey, plannedAmount] of Object.entries(resourceDemands)) {
            const [resType, resName] = resKey.split(':');

            const stockItems = await this.prisma.stockItem.findMany({
                where: {
                    companyId: map.companyId,
                    type: resType as any,
                    name: { contains: resName, mode: 'insensitive' },
                    status: 'ACTIVE'
                }
            });

            const actualTotal = stockItems.reduce((sum, item) => sum + item.quantity, 0);
            const ratio = plannedAmount > 0 ? actualTotal / plannedAmount : 1;

            if (ratio < 0.5) {
                issues.push({
                    type: 'STOCK_CRITICAL_SHORTAGE',
                    message: `Критическая нехватка ${resName}: затребовано ${plannedAmount}, в наличии ${actualTotal} (${(ratio * 100).toFixed(1)}%)`,
                    severity: 'ERROR'
                });

                await this.prisma.cmrRisk.create({
                    data: {
                        companyId: map.companyId,
                        seasonId: map.seasonId,
                        type: RiskType.OPERATIONAL,
                        description: `[ADMISSION-BLOCK] Критическая нехватка ТМЦ: ${resName} (${(ratio * 100).toFixed(1)}%)`,
                        probability: RiskLevel.HIGH,
                        impact: RiskLevel.CRITICAL,
                        controllability: Controllability.CLIENT,
                        liabilityMode: LiabilityMode.CLIENT_ONLY,
                        status: "OPEN"
                    }
                });
            } else if (ratio < 0.9) {
                issues.push({
                    type: 'STOCK_WARNING',
                    message: `Недостаточно ${resName}: в наличии ${(ratio * 100).toFixed(1)}% от плана.`,
                    severity: 'WARNING'
                });

                await this.prisma.cmrRisk.create({
                    data: {
                        companyId: map.companyId,
                        seasonId: map.seasonId,
                        type: RiskType.REGULATORY,
                        description: `[ADMISSION-WARNING] Дефицит ТМЦ: ${resName} (${(ratio * 100).toFixed(1)}%)`,
                        probability: RiskLevel.MEDIUM,
                        impact: RiskLevel.MEDIUM,
                        controllability: Controllability.CLIENT,
                        liabilityMode: LiabilityMode.CLIENT_ONLY,
                        status: "OPEN"
                    }
                });
            }
        }

        const hasErrors = issues.some(i => i.severity === 'ERROR');
        return {
            success: !hasErrors,
            issues
        };
    }

    /**
     * Knowledge Graph Ingestion Gate (Sprint 2)
     * Только структурная валидация: типы, связи, диапазон confidence.
     */
    validateKnowledgeGraphInput(input: {
        nodes: Array<{ id: string; type: string; label: string; source: string }>;
        edges: Array<{ fromNodeId: string; toNodeId: string; relation: string; confidence: number; source: string }>;
    }) {
        const errors: string[] = [];

        const allowedNodeTypes = ["CONCEPT", "ENTITY", "METRIC", "DOCUMENT"];
        const allowedSources = ["MANUAL", "INGESTION", "AI"];
        const allowedRelations = ["IMPLEMENTS", "DEPENDS_ON", "MEASURED_BY", "MEASURES", "REFERENCES"];

        const nodeIds = new Set<string>();
        for (const node of input.nodes || []) {
            if (!node.id) errors.push("node.id is required");
            if (!allowedNodeTypes.includes(node.type)) errors.push(`node.type invalid: ${node.type}`);
            if (!node.label) errors.push("node.label is required");
            if (!allowedSources.includes(node.source)) errors.push(`node.source invalid: ${node.source}`);
            if (node.id) nodeIds.add(node.id);
        }

        for (const edge of input.edges || []) {
            if (!edge.fromNodeId || !edge.toNodeId) errors.push("edge.fromNodeId and edge.toNodeId are required");
            if (!allowedRelations.includes(edge.relation)) errors.push(`edge.relation invalid: ${edge.relation}`);
            if (!allowedSources.includes(edge.source)) errors.push(`edge.source invalid: ${edge.source}`);
            if (typeof edge.confidence !== "number" || edge.confidence < 0 || edge.confidence > 1) {
                errors.push("edge.confidence must be between 0 and 1");
            }
            if (edge.fromNodeId && !nodeIds.has(edge.fromNodeId)) {
                errors.push(`edge.fromNodeId not found: ${edge.fromNodeId}`);
            }
            if (edge.toNodeId && !nodeIds.has(edge.toNodeId)) {
                errors.push(`edge.toNodeId not found: ${edge.toNodeId}`);
            }
        }

        return { ok: errors.length === 0, errors };
    }

    /**
     * Vision AI Baseline Admission Gate (Sprint 2)
     * Структурная валидация наблюдения без интерпретаций.
     */
    validateVisionObservation(input: {
        id: string;
        source: string;
        assetId: string;
        timestamp: string;
        modality: string;
        rawFeatures?: { ndvi?: number; ndre?: number; texture?: Record<string, number> };
        metadata?: { sensor?: string; resolution?: string; cloudCover?: number };
        confidence: number;
    }) {
        const errors: string[] = [];

        const allowedSources = ["SATELLITE", "DRONE", "PHOTO"];
        const allowedModalities = ["RGB", "MULTISPECTRAL"];

        if (!input.id) errors.push("id is required");
        if (!input.assetId) errors.push("assetId is required");
        if (!input.timestamp) errors.push("timestamp is required");
        if (!input.source || !allowedSources.includes(input.source)) {
            errors.push(`source invalid: ${input.source}`);
        }
        if (!input.modality || !allowedModalities.includes(input.modality)) {
            errors.push(`modality invalid: ${input.modality}`);
        }

        if (input.timestamp) {
            const parsed = new Date(input.timestamp);
            if (Number.isNaN(parsed.getTime())) {
                errors.push("timestamp must be valid ISO-8601");
            }
        }

        if (typeof input.confidence !== "number" || input.confidence < 0 || input.confidence > 1) {
            errors.push("confidence must be between 0 and 1");
        }

        const allowedBySource: Record<string, string[]> = {
            SATELLITE: ["RGB", "MULTISPECTRAL"],
            DRONE: ["RGB", "MULTISPECTRAL"],
            PHOTO: ["RGB"],
        };
        if (input.source && input.modality) {
            const allowed = allowedBySource[input.source] || [];
            if (!allowed.includes(input.modality)) {
                errors.push(`modality ${input.modality} not allowed for source ${input.source}`);
            }
        }

        if (input.rawFeatures) {
            const { ndvi, ndre, texture } = input.rawFeatures;
            if (ndvi !== undefined && typeof ndvi !== "number") errors.push("rawFeatures.ndvi must be number");
            if (ndre !== undefined && typeof ndre !== "number") errors.push("rawFeatures.ndre must be number");
            if (texture !== undefined) {
                if (typeof texture !== "object" || Array.isArray(texture)) {
                    errors.push("rawFeatures.texture must be object");
                } else {
                    for (const [key, value] of Object.entries(texture)) {
                        if (typeof value !== "number") {
                            errors.push(`rawFeatures.texture.${key} must be number`);
                        }
                    }
                }
            }
        }

        if (input.metadata) {
            const { sensor, resolution, cloudCover } = input.metadata;
            if (sensor !== undefined && typeof sensor !== "string") errors.push("metadata.sensor must be string");
            if (resolution !== undefined && typeof resolution !== "string") errors.push("metadata.resolution must be string");
            if (cloudCover !== undefined && typeof cloudCover !== "number") errors.push("metadata.cloudCover must be number");
        }

        return { ok: errors.length === 0, errors };
    }

    /**
     * Satellite Ingestion Admission Gate (Sprint 2)
     * Валидация сигналов NDVI/NDRE без интерпретаций.
     */
    validateSatelliteObservation(input: {
        id: string;
        assetId: string;
        companyId: string;
        timestamp: string;
        indexType: string;
        value: number;
        source: string;
        resolution: number;
        cloudCoverage: number;
        tileId?: string;
        confidence: number;
    }) {
        const errors: string[] = [];

        const allowedIndexTypes = ["NDVI", "NDRE"];
        const allowedSources = ["SENTINEL2", "LANDSAT8", "LANDSAT9"];

        if (!input.id) errors.push("id is required");
        if (!input.assetId) errors.push("assetId is required");
        if (!input.companyId) errors.push("companyId is required");
        if (!input.timestamp) errors.push("timestamp is required");

        if (!input.indexType || !allowedIndexTypes.includes(input.indexType)) {
            errors.push(`indexType invalid: ${input.indexType}`);
        }
        if (!input.source || !allowedSources.includes(input.source)) {
            errors.push(`source invalid: ${input.source}`);
        }

        if (input.timestamp) {
            const parsed = new Date(input.timestamp);
            if (Number.isNaN(parsed.getTime())) {
                errors.push("timestamp must be valid ISO-8601");
            }
        }

        if (typeof input.value !== "number" || input.value < 0 || input.value > 1) {
            errors.push("value must be between 0 and 1");
        }
        if (typeof input.cloudCoverage !== "number" || input.cloudCoverage < 0 || input.cloudCoverage > 1) {
            errors.push("cloudCoverage must be between 0 and 1");
        }
        if (typeof input.confidence !== "number" || input.confidence < 0 || input.confidence > 1) {
            errors.push("confidence must be between 0 and 1");
        }
        if (typeof input.resolution !== "number" || input.resolution <= 0) {
            errors.push("resolution must be > 0");
        }

        const allowedBySource: Record<string, string[]> = {
            SENTINEL2: ["NDVI", "NDRE"],
            LANDSAT8: ["NDVI", "NDRE"],
            LANDSAT9: ["NDVI", "NDRE"],
        };
        if (input.source && input.indexType) {
            const allowed = allowedBySource[input.source] || [];
            if (!allowed.includes(input.indexType)) {
                errors.push(`indexType ${input.indexType} not allowed for source ${input.source}`);
            }
        }

        return { ok: errors.length === 0, errors };
    }
}
