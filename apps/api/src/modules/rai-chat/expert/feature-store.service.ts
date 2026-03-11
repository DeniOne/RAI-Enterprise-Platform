import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * FeatureStoreService — Phase 5.4.1
 *
 * Централизованное хранение features для ML-моделей.
 * Источники: HarvestResults, Weather, Soil, Operations.
 *
 * Каждый feature vector привязан к (companyId, fieldId, seasonId)
 * и содержит нормализованные предикторы для yield prediction / risk models.
 */

export interface FeatureVector {
    id: string;
    companyId: string;
    fieldId: string;
    seasonId: string;
    createdAt: string;
    ttlDays: number;
    version: string;

    features: {
        // Урожайность и результаты
        historicalYields?: number[];
        avgYield?: number;
        yieldTrend?: number;
        yieldVariance?: number;

        // Погода
        gddCumulative?: number;
        precipitationMm30d?: number;
        precipitationMm7d?: number;
        avgTempC30d?: number;
        frostDays?: number;

        // Почва
        soilNitrogen?: number;
        soilPhosphorus?: number;
        soilPotassium?: number;
        soilPH?: number;
        humusPct?: number;

        // Операции
        totalOperations?: number;
        fertApplications?: number;
        fungicideApplications?: number;
        herbicideApplications?: number;
        sowingDepthMm?: number;
        sowingRateKgHa?: number;

        // Культура
        cropType?: string;
        hybridName?: string;
        predecessorCrop?: string;
        rotationYears?: number;

        // Энграмм-based
        engramCount?: number;
        avgEngramSuccessRate?: number;
        avgEngramWeight?: number;

        // Derived
        soilQualityIndex?: number;
        operationalIntensity?: number;
        riskScore?: number;
    };
}

export interface FeatureExtractionResult {
    extracted: number;
    failed: number;
    version: string;
}

@Injectable()
export class FeatureStoreService {
    private readonly logger = new Logger(FeatureStoreService.name);
    private readonly FEATURE_VERSION = 'v1.0';
    private readonly DEFAULT_TTL_DAYS = 365;

    /** In-memory store (в production → Prisma table или Redis) */
    private store: Map<string, FeatureVector> = new Map();

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Извлекает features для конкретного поля + сезона.
     */
    async extractFeatures(
        companyId: string,
        fieldId: string,
        seasonId: string,
    ): Promise<FeatureVector> {
        const key = `${companyId}:${fieldId}:${seasonId}`;

        // Check cache
        const cached = this.store.get(key);
        if (cached && cached.version === this.FEATURE_VERSION) {
            return cached;
        }

        const features: FeatureVector['features'] = {};

        // Historical yields
        try {
            const harvests = await (this.prisma as any).harvestResult?.findMany?.({
                where: { companyId, fieldId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }) ?? [];

            const yieldValues = (harvests as any[])
                .map((h: any) => (h.attrs as any)?.actualYield ?? h.yieldPerHa)
                .filter((v: any): v is number => typeof v === 'number' && v > 0);

            features.historicalYields = yieldValues;
            features.avgYield = yieldValues.length > 0
                ? yieldValues.reduce((a, b) => a + b, 0) / yieldValues.length
                : undefined;
            features.yieldTrend = yieldValues.length >= 2
                ? (yieldValues[0] - yieldValues[yieldValues.length - 1]) / yieldValues.length
                : undefined;
            features.yieldVariance = yieldValues.length >= 2
                ? Math.sqrt(
                    yieldValues.reduce((s, v) => s + Math.pow(v - (features.avgYield ?? 0), 2), 0) / yieldValues.length,
                )
                : undefined;
        } catch {
            this.logger.debug('feature_extract_yield skip');
        }

        // Operations from TechMaps
        try {
            const techMaps = await this.prisma.techMap.findMany({
                where: { companyId, fieldId, seasonId },
                include: { stages: { include: { operations: true } } },
            });

            const allOps = techMaps.flatMap((tm) =>
                (tm.stages ?? []).flatMap((s: any) => s.operations ?? []),
            );

            features.totalOperations = allOps.length;
            features.fertApplications = allOps.filter((o: any) =>
                (o.type ?? '').toLowerCase().includes('удобр') || (o.type ?? '').toLowerCase().includes('fert'),
            ).length;
            features.fungicideApplications = allOps.filter((o: any) =>
                (o.type ?? '').toLowerCase().includes('фунгицид'),
            ).length;
            features.herbicideApplications = allOps.filter((o: any) =>
                (o.type ?? '').toLowerCase().includes('гербицид'),
            ).length;
        } catch {
            this.logger.debug('feature_extract_ops skip');
        }

        // Engram-based features
        try {
            const engrams = await this.prisma.engram.findMany({
                where: { companyId, isActive: true },
                select: { successRate: true, synapticWeight: true },
            });

            features.engramCount = engrams.length;
            features.avgEngramSuccessRate = engrams.length > 0
                ? engrams.reduce((s, e) => s + e.successRate, 0) / engrams.length
                : undefined;
            features.avgEngramWeight = engrams.length > 0
                ? engrams.reduce((s, e) => s + e.synapticWeight, 0) / engrams.length
                : undefined;
        } catch {
            this.logger.debug('feature_extract_engram skip');
        }

        // Derived features
        features.soilQualityIndex = this.calculateSoilQualityIndex(features);
        features.operationalIntensity = features.totalOperations
            ? features.totalOperations / 10
            : undefined;

        const vector: FeatureVector = {
            id: key,
            companyId,
            fieldId,
            seasonId,
            createdAt: new Date().toISOString(),
            ttlDays: this.DEFAULT_TTL_DAYS,
            version: this.FEATURE_VERSION,
            features,
        };

        this.store.set(key, vector);
        return vector;
    }

    /**
     * Batch extraction для всех полей компании.
     */
    async extractBatch(
        companyId: string,
        seasonId: string,
    ): Promise<FeatureExtractionResult> {
        const fields = await this.prisma.field.findMany({
            where: { companyId },
            select: { id: true },
        });

        let extracted = 0;
        let failed = 0;

        for (const field of fields) {
            try {
                await this.extractFeatures(companyId, field.id, seasonId);
                extracted++;
            } catch {
                failed++;
            }
        }

        this.logger.log(
            `feature_batch companyId=${companyId} season=${seasonId} extracted=${extracted} failed=${failed}`,
        );

        return { extracted, failed, version: this.FEATURE_VERSION };
    }

    /**
     * Получает feature vector (из кеша или extracts).
     */
    async getFeatures(
        companyId: string,
        fieldId: string,
        seasonId: string,
    ): Promise<FeatureVector | null> {
        const key = `${companyId}:${fieldId}:${seasonId}`;
        return this.store.get(key) ?? null;
    }

    /**
     * Индекс качества почвы (0-1).
     */
    private calculateSoilQualityIndex(
        features: FeatureVector['features'],
    ): number | undefined {
        const components: number[] = [];

        if (features.soilPH != null) {
            // Optimal pH for rapeseed: 6.0-7.5
            const phScore = features.soilPH >= 6 && features.soilPH <= 7.5
                ? 1
                : Math.max(0, 1 - Math.abs(features.soilPH - 6.75) * 0.3);
            components.push(phScore);
        }

        if (features.humusPct != null) {
            const humusScore = Math.min(features.humusPct / 4, 1);
            components.push(humusScore);
        }

        return components.length > 0
            ? components.reduce((a, b) => a + b, 0) / components.length
            : undefined;
    }

    /** Очистка просроченных vectors */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;
        for (const [key, vector] of this.store.entries()) {
            const expiresAt = new Date(vector.createdAt).getTime() + vector.ttlDays * 86_400_000;
            if (now > expiresAt) {
                this.store.delete(key);
                removed++;
            }
        }
        return removed;
    }
}
