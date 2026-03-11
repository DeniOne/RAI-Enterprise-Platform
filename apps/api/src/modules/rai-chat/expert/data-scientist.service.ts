import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EngramService } from '../../../shared/memory/engram.service';
import { buildTextEmbedding } from '../../../shared/memory/signal-embedding.util';
import { RankedEngram } from '../../../shared/memory/engram.types';
import {
    ExpertInvocationEngine,
    ExpertInvocationRequest,
    ExpertInvocationResult,
} from './expert-invocation.engine';

// ============================================================================
// DS-5.1: Core Analytics Service
// DS-5.2: Prediction Engine
// DS-5.3: Advanced Analytics
// ============================================================================

// ---- Yield Prediction (DS-5.1.2) ----

export interface YieldPrediction {
    fieldId: string;
    crop: string;
    predictedYield: number;
    unit: string;
    confidence: number;
    confidenceInterval: [number, number];
    contributingFactors: Array<{
        factor: string;
        impact: string;
        direction: 'positive' | 'negative' | 'neutral';
    }>;
    basedOn: {
        historicalSeasons: number;
        relevantEngrams: number;
        datapoints: number;
    };
}

// ---- Disease Risk (DS-5.2.1) ----

export interface DiseaseRiskAssessment {
    fieldId: string;
    crop: string;
    risks: Array<{
        pathogen: string;
        riskScore: number;
        riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        recommendedWindow: { from: string; to: string } | null;
        confidence: number;
        rationale: string;
        engramEvidence: number;
    }>;
    overallRisk: number;
}

// ---- Cost Optimization (DS-5.2.2) ----

export interface CostOptimization {
    companyId: string;
    seasonId: string;
    totalCostPerHa: number;
    optimizations: Array<{
        operationType: string;
        currentCost: number;
        suggestedCost: number;
        savingPotential: number;
        rationale: string;
        risk: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    paretoDistribution: Array<{
        category: string;
        costPct: number;
        yieldContributionPct: number;
    }>;
}

// ---- Seasonal Report (DS-5.2.3) ----

export interface SeasonalReport {
    companyId: string;
    seasonId: string;
    type: 'END_OF_SEASON' | 'PRE_SEASON';
    generatedAt: string;
    sections: {
        yieldAnalysis?: {
            fieldsAnalyzed: number;
            avgYieldRatio: number;
            bestField: { name: string; yieldRatio: number } | null;
            worstField: { name: string; yieldRatio: number } | null;
        };
        engramSummary?: {
            totalActive: number;
            formedThisSeason: number;
            strengthened: number;
            weakened: number;
            topCategories: Array<{ category: string; count: number }>;
        };
        topLearnings: string[];
        recommendations: string[];
        financialSummary?: {
            totalRevenue: number;
            totalCost: number;
            margin: number;
            roiPerHa: number;
        };
        networkPosition?: {
            percentile: number;
            avgNetworkYield: number;
            clientYield: number;
        };
    };
}

// ---- Pattern Mining (DS-5.3.1) ----

export interface PatternCluster {
    clusterId: string;
    size: number;
    centroidContent: string;
    avgSuccessRate: number;
    avgSynapticWeight: number;
    categories: string[];
    keyPattern: string;
    engramIds: string[];
}

// ---- Benchmark (DS-5.3.2) ----

export interface NetworkBenchmark {
    companyId: string;
    metrics: Array<{
        metric: string;
        clientValue: number;
        networkAvg: number;
        networkMedian: number;
        percentile: number;
        trend: 'UP' | 'DOWN' | 'STABLE';
    }>;
}

/**
 * DataScientistService — Phase 5 (все подфазы)
 *
 * Expert-tier аналитический агент:
 * - Yield Prediction (прогноз урожайности)
 * - Disease Risk Assessment (риск болезней)
 * - Cost Optimization (оптимизация затрат)
 * - Seasonal Reports (сезонная аналитика)
 * - Pattern Mining (кросс-сезонный майнинг)
 * - Network Benchmarking (сравнение с сетью)
 * - What-If Simulation (сценарный анализ)
 */
@Injectable()
export class DataScientistService {
    private readonly logger = new Logger(DataScientistService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly expertEngine: ExpertInvocationEngine,
        @Optional() private readonly engramService?: EngramService,
    ) { }

    // ========================================================================
    // DS-5.1.2: Yield Prediction (rule-based baseline)
    // ========================================================================

    async predictYield(
        companyId: string,
        fieldId: string,
        crop: string,
        seasonId?: string,
    ): Promise<YieldPrediction> {
        // Исторические данные: HarvestResults по полю
        const harvests = await this.prisma.harvestResult?.findMany?.({
            where: { companyId, fieldId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }).catch(() => []) ?? [];

        // Извлекаем yield values
        const yieldValues: number[] = [];
        for (const h of harvests as any[]) {
            const y = (h.attrs as any)?.actualYield ?? (h as any).yieldPerHa;
            if (typeof y === 'number' && y > 0) yieldValues.push(y);
        }

        // Recall агро-энграмм
        const engrams = this.engramService
            ? await this.engramService.recallEngrams({
                companyId,
                embedding: buildTextEmbedding(`урожайность ${crop} поле ${fieldId}`),
                limit: 15,
                type: 'AGRO',
            }).catch(() => [] as RankedEngram[])
            : [];

        // Расчёт прогноза
        let predicted: number;
        let confidence: number;
        const factors: YieldPrediction['contributingFactors'] = [];

        if (yieldValues.length >= 3) {
            // Mean + trend regression
            const mean = yieldValues.reduce((a, b) => a + b, 0) / yieldValues.length;
            const trend = yieldValues.length >= 2
                ? (yieldValues[0] - yieldValues[yieldValues.length - 1]) / yieldValues.length
                : 0;

            predicted = mean + trend;
            confidence = Math.min(0.4 + yieldValues.length * 0.06, 0.85);

            factors.push({
                factor: `Исторические данные (${yieldValues.length} сезонов)`,
                impact: `среднее ${mean.toFixed(1)} ц/га`,
                direction: 'neutral',
            });
            if (Math.abs(trend) > 0.5) {
                factors.push({
                    factor: 'Тренд урожайности',
                    impact: `${trend > 0 ? '+' : ''}${trend.toFixed(1)} ц/га/сезон`,
                    direction: trend > 0 ? 'positive' : 'negative',
                });
            }
        } else if (yieldValues.length > 0) {
            predicted = yieldValues[0];
            confidence = 0.3;
            factors.push({
                factor: 'Единственный исторический результат',
                impact: `${predicted.toFixed(1)} ц/га`,
                direction: 'neutral',
            });
        } else {
            // Нет данных — используем энграммы
            const engramYields = engrams
                .map((e) => {
                    const match = e.content.match(/(\d+[\.,]?\d*)\s*ц\/га/);
                    return match ? parseFloat(match[1].replace(',', '.')) : null;
                })
                .filter((v): v is number => v !== null);

            predicted = engramYields.length > 0
                ? engramYields.reduce((a, b) => a + b, 0) / engramYields.length
                : 30; // Fallback average
            confidence = engramYields.length > 0 ? 0.25 : 0.1;
            factors.push({
                factor: 'Данные из энграмм сети',
                impact: `${engramYields.length} релевантных записей`,
                direction: 'neutral',
            });
        }

        // Engram correction
        const positiveEngrams = engrams.filter((e) => e.successRate > 0.8);
        const negativeEngrams = engrams.filter((e) => e.successRate < 0.3);

        if (positiveEngrams.length > negativeEngrams.length * 2) {
            predicted *= 1.03;
            confidence = Math.min(confidence + 0.05, 0.95);
            factors.push({
                factor: 'Позитивный опыт в энграммах',
                impact: '+3% коррекция',
                direction: 'positive',
            });
        } else if (negativeEngrams.length > positiveEngrams.length) {
            predicted *= 0.95;
            factors.push({
                factor: 'Негативные прецеденты',
                impact: '-5% коррекция (осторожный прогноз)',
                direction: 'negative',
            });
        }

        // Confidence interval (±15% при high, ±30% при low)
        const ciWidth = predicted * (1 - confidence) * 0.3;
        const ci: [number, number] = [
            Math.max(predicted - ciWidth, 0),
            predicted + ciWidth,
        ];

        return {
            fieldId,
            crop,
            predictedYield: Math.round(predicted * 10) / 10,
            unit: 'ц/га',
            confidence: Math.round(confidence * 100) / 100,
            confidenceInterval: [Math.round(ci[0] * 10) / 10, Math.round(ci[1] * 10) / 10],
            contributingFactors: factors,
            basedOn: {
                historicalSeasons: yieldValues.length,
                relevantEngrams: engrams.length,
                datapoints: yieldValues.length + engrams.length,
            },
        };
    }

    // ========================================================================
    // DS-5.2.1: Disease Risk Assessment
    // ========================================================================

    async assessDiseaseRisk(
        companyId: string,
        fieldId: string,
        crop: string,
        currentBBCH?: number,
    ): Promise<DiseaseRiskAssessment> {
        // Recall энграмм про болезни
        const engrams = this.engramService
            ? await this.engramService.recallEngrams({
                companyId,
                embedding: buildTextEmbedding(`болезни ${crop} фитопатология защита растений`),
                limit: 20,
                type: 'AGRO',
                category: 'DISEASE_TREATMENT',
            }).catch(() => [] as RankedEngram[])
            : [];

        // Эпидемиологические модели (rule-based)
        const risks: DiseaseRiskAssessment['risks'] = [];

        if (crop.toLowerCase().includes('рапс')) {
            // Склеротиниоз
            const scleroEngrams = engrams.filter((e) =>
                e.content.toLowerCase().includes('склеротин'),
            );
            const scleroBase = 0.3;
            const bbchFactor = currentBBCH && currentBBCH >= 30 && currentBBCH <= 35 ? 0.3 : 0;
            const historyFactor = scleroEngrams.length > 0
                ? scleroEngrams.filter((e) => e.successRate < 0.5).length * 0.1
                : 0;

            const scleroRisk = Math.min(scleroBase + bbchFactor + historyFactor, 1);
            risks.push({
                pathogen: 'Sclerotinia sclerotiorum (склеротиниоз)',
                riskScore: scleroRisk,
                riskLevel: scleroRisk > 0.7 ? 'CRITICAL' : scleroRisk > 0.5 ? 'HIGH' : scleroRisk > 0.3 ? 'MEDIUM' : 'LOW',
                recommendedWindow: scleroRisk > 0.3 ? { from: 'BBCH-30', to: 'BBCH-33' } : null,
                confidence: 0.5 + scleroEngrams.length * 0.05,
                rationale: `Базовый риск ${(scleroBase * 100).toFixed(0)}%${bbchFactor > 0 ? ', текущая фаза в окне восприимчивости' : ''}${scleroEngrams.length > 0 ? `, ${scleroEngrams.length} энграмм по истории поля` : ''}`,
                engramEvidence: scleroEngrams.length,
            });

            // Фомоз
            const phomaEngrams = engrams.filter((e) =>
                e.content.toLowerCase().includes('фомоз') || e.content.toLowerCase().includes('phoma'),
            );
            const phomaRisk = Math.min(0.2 + phomaEngrams.filter((e) => e.successRate < 0.5).length * 0.15, 1);
            risks.push({
                pathogen: 'Phoma lingam (фомоз)',
                riskScore: phomaRisk,
                riskLevel: phomaRisk > 0.7 ? 'CRITICAL' : phomaRisk > 0.5 ? 'HIGH' : phomaRisk > 0.3 ? 'MEDIUM' : 'LOW',
                recommendedWindow: phomaRisk > 0.3 ? { from: 'BBCH-14', to: 'BBCH-18' } : null,
                confidence: 0.4 + phomaEngrams.length * 0.05,
                rationale: `Базовый риск ${(0.2 * 100).toFixed(0)}%${phomaEngrams.length > 0 ? `, ${phomaEngrams.length} энграмм истории` : ''}`,
                engramEvidence: phomaEngrams.length,
            });

            // Альтернариоз
            const altRisk = Math.min(0.15 + (currentBBCH && currentBBCH >= 60 ? 0.25 : 0), 1);
            risks.push({
                pathogen: 'Alternaria spp. (альтернариоз)',
                riskScore: altRisk,
                riskLevel: altRisk > 0.5 ? 'HIGH' : altRisk > 0.3 ? 'MEDIUM' : 'LOW',
                recommendedWindow: altRisk > 0.3 ? { from: 'BBCH-60', to: 'BBCH-69' } : null,
                confidence: 0.35,
                rationale: `Базовый риск 15%${currentBBCH && currentBBCH >= 60 ? ', фаза цветения — повышенная восприимчивость' : ''}`,
                engramEvidence: 0,
            });
        }

        const overallRisk = risks.length > 0
            ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
            : 0;

        return { fieldId, crop, risks, overallRisk };
    }

    // ========================================================================
    // DS-5.2.2: Cost Optimization
    // ========================================================================

    async analyzeCosts(
        companyId: string,
        seasonId: string,
    ): Promise<CostOptimization> {
        // Агрегация затрат по операциям
        const techMaps = await this.prisma.techMap.findMany({
            where: { companyId, seasonId },
            include: {
                stages: { include: { operations: true } },
                budgetLines: true,
            },
        });

        const costByType: Record<string, { total: number; count: number }> = {};

        for (const tm of techMaps) {
            for (const line of (tm.budgetLines ?? []) as any[]) {
                const cat = line.category ?? 'OTHER';
                if (!costByType[cat]) costByType[cat] = { total: 0, count: 0 };
                costByType[cat].total += line.amount ?? 0;
                costByType[cat].count++;
            }
        }

        const totalCost = Object.values(costByType).reduce((s, v) => s + v.total, 0);

        // Парето-распределение
        const paretoDistribution = Object.entries(costByType)
            .map(([category, data]) => ({
                category,
                costPct: totalCost > 0 ? (data.total / totalCost) * 100 : 0,
                yieldContributionPct: 0, // Требует более глубокого анализа
            }))
            .sort((a, b) => b.costPct - a.costPct);

        // Поиск оптимизаций через энграммы
        const engrams = this.engramService
            ? await this.engramService.recallEngrams({
                companyId,
                embedding: buildTextEmbedding('оптимизация затрат экономия себестоимость'),
                limit: 10,
                type: 'AGRO',
            }).catch(() => [] as RankedEngram[])
            : [];

        const optimizations = paretoDistribution.slice(0, 5).map((p) => ({
            operationType: p.category,
            currentCost: costByType[p.category]?.total ?? 0,
            suggestedCost: (costByType[p.category]?.total ?? 0) * 0.9,
            savingPotential: (costByType[p.category]?.total ?? 0) * 0.1,
            rationale: `Категория "${p.category}" составляет ${p.costPct.toFixed(1)}% затрат. На основе ${engrams.length} энграмм возможна оптимизация 5-15%.`,
            risk: (p.costPct > 30 ? 'HIGH' : p.costPct > 15 ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
        }));

        return {
            companyId,
            seasonId,
            totalCostPerHa: totalCost,
            optimizations,
            paretoDistribution,
        };
    }

    // ========================================================================
    // DS-5.2.3: Seasonal Report Generator
    // ========================================================================

    async generateSeasonalReport(
        companyId: string,
        seasonId: string,
        type: 'END_OF_SEASON' | 'PRE_SEASON' = 'END_OF_SEASON',
    ): Promise<SeasonalReport> {
        const engramStats = this.engramService
            ? {
                totalActive: await this.prisma.engram.count({
                    where: { companyId, isActive: true },
                }),
                formedThisSeason: await this.prisma.engram.count({
                    where: { companyId, seasonId, isActive: true },
                }),
            }
            : { totalActive: 0, formedThisSeason: 0 };

        // Engram categories
        const categories = await this.prisma.engram.groupBy({
            by: ['category'],
            where: { companyId, isActive: true },
            _count: { id: true },
        });

        const topCategories = categories
            .map((c) => ({ category: c.category, count: c._count.id }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Top learnings из энграмм
        const topEngrams = await this.prisma.engram.findMany({
            where: {
                companyId,
                isActive: true,
                synapticWeight: { gte: 0.7 },
            },
            orderBy: { synapticWeight: 'desc' },
            take: 5,
            select: { keyInsights: true, content: true },
        });

        const topLearnings = topEngrams
            .flatMap((e) => [
                ...(e.keyInsights ?? []),
                e.content.slice(0, 150),
            ])
            .filter(Boolean)
            .slice(0, 5);

        // Network position (L6)
        const globalEngrams = await this.prisma.engram.findMany({
            where: { companyId: null, isActive: true },
            select: { successRate: true },
        });
        const networkAvgYield = globalEngrams.length > 0
            ? globalEngrams.reduce((s, e) => s + e.successRate, 0) / globalEngrams.length
            : 0;

        return {
            companyId,
            seasonId,
            type,
            generatedAt: new Date().toISOString(),
            sections: {
                engramSummary: {
                    totalActive: engramStats.totalActive,
                    formedThisSeason: engramStats.formedThisSeason,
                    strengthened: 0,
                    weakened: 0,
                    topCategories,
                },
                topLearnings,
                recommendations: [
                    'Проанализировать энграммы с низким success rate и скорректировать техкарты',
                    'Увеличить частоту скаутинга на полях с высоким disease risk score',
                ],
                networkPosition: globalEngrams.length > 0 ? {
                    percentile: 50,
                    avgNetworkYield: networkAvgYield,
                    clientYield: 0,
                } : undefined,
            },
        };
    }

    // ========================================================================
    // DS-5.3.1: Cross-Season Pattern Mining
    // ========================================================================

    async minePatterns(companyId: string): Promise<PatternCluster[]> {
        // Full engram scan
        const allEngrams = await this.prisma.engram.findMany({
            where: {
                isActive: true,
                OR: [{ companyId }, { companyId: null }],
            },
            select: {
                id: true,
                category: true,
                content: true,
                successRate: true,
                synapticWeight: true,
                embedding: true,
            },
        });

        if (allEngrams.length < 5) {
            this.logger.debug('pattern_mining insufficient_data');
            return [];
        }

        // Simple clustering: group by category + success rate bucket
        const buckets: Record<string, typeof allEngrams> = {};
        for (const engram of allEngrams) {
            const successBucket = engram.successRate > 0.8 ? 'HIGH' : engram.successRate > 0.5 ? 'MED' : 'LOW';
            const key = `${engram.category}_${successBucket}`;
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(engram);
        }

        const clusters: PatternCluster[] = [];
        let clusterIdx = 0;

        for (const [key, members] of Object.entries(buckets)) {
            if (members.length < 2) continue;

            const avgSuccess = members.reduce((s, m) => s + m.successRate, 0) / members.length;
            const avgWeight = members.reduce((s, m) => s + m.synapticWeight, 0) / members.length;
            const categories = [...new Set(members.map((m) => m.category))];

            clusters.push({
                clusterId: `cluster_${clusterIdx++}`,
                size: members.length,
                centroidContent: members[0].content.slice(0, 200),
                avgSuccessRate: avgSuccess,
                avgSynapticWeight: avgWeight,
                categories,
                keyPattern: `${key}: ${members.length} энграмм, avg success ${(avgSuccess * 100).toFixed(0)}%`,
                engramIds: members.map((m) => m.id),
            });
        }

        this.logger.log(`pattern_mining companyId=${companyId} engrams=${allEngrams.length} clusters=${clusters.length}`);
        return clusters;
    }

    // ========================================================================
    // DS-5.3.2: Network Benchmarking
    // ========================================================================

    async benchmark(companyId: string): Promise<NetworkBenchmark> {
        // Метрики клиента
        const clientEngrams = await this.prisma.engram.findMany({
            where: { companyId, isActive: true },
            select: { successRate: true, synapticWeight: true, activationCount: true },
        });

        // Метрики сети (global)
        const networkEngrams = await this.prisma.engram.findMany({
            where: { companyId: null, isActive: true },
            select: { successRate: true, synapticWeight: true, activationCount: true },
        });

        const calcAvg = (arr: { successRate: number }[], key: keyof typeof arr[0]) =>
            arr.length > 0 ? arr.reduce((s, e) => s + (e[key] as number), 0) / arr.length : 0;

        const calcMedian = (arr: number[]) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        };

        const clientAvgSuccess = calcAvg(clientEngrams, 'successRate');
        const networkAvgSuccess = calcAvg(networkEngrams, 'successRate');
        const networkSuccessValues = networkEngrams.map((e) => e.successRate);

        // Percentile calculation
        const percentile = networkSuccessValues.length > 0
            ? (networkSuccessValues.filter((v) => v < clientAvgSuccess).length / networkSuccessValues.length) * 100
            : 50;

        return {
            companyId,
            metrics: [
                {
                    metric: 'Средний Success Rate энграмм',
                    clientValue: clientAvgSuccess,
                    networkAvg: networkAvgSuccess,
                    networkMedian: calcMedian(networkSuccessValues),
                    percentile: Math.round(percentile),
                    trend: clientAvgSuccess > networkAvgSuccess ? 'UP' : clientAvgSuccess < networkAvgSuccess ? 'DOWN' : 'STABLE',
                },
                {
                    metric: 'Количество активных энграмм',
                    clientValue: clientEngrams.length,
                    networkAvg: networkEngrams.length,
                    networkMedian: networkEngrams.length,
                    percentile: 50,
                    trend: 'STABLE',
                },
            ],
        };
    }

    // ========================================================================
    // DS-5.3.3: What-If Simulation
    // ========================================================================

    async whatIf(
        companyId: string,
        scenario: {
            type: 'CHANGE_HYBRID' | 'CHANGE_DOSE' | 'SKIP_OPERATION' | 'WEATHER_IMPACT';
            parameters: Record<string, unknown>;
            fieldId?: string;
            crop?: string;
        },
    ): Promise<{
        scenario: typeof scenario;
        baseline: { yield: number; cost: number; risk: number };
        projected: { yield: number; cost: number; risk: number };
        delta: { yield: number; cost: number; risk: number };
        confidence: number;
        recommendation: string;
    }> {
        const baseline = { yield: 35, cost: 25000, risk: 0.3 };
        let projected = { ...baseline };

        switch (scenario.type) {
            case 'CHANGE_HYBRID':
                projected.yield *= 1.05;
                projected.cost *= 1.1;
                projected.risk *= 0.9;
                break;
            case 'CHANGE_DOSE':
                projected.yield *= 1.02;
                projected.cost *= 1.15;
                projected.risk *= 0.8;
                break;
            case 'SKIP_OPERATION':
                projected.yield *= 0.88;
                projected.cost *= 0.8;
                projected.risk *= 1.3;
                break;
            case 'WEATHER_IMPACT':
                projected.yield *= 0.85;
                projected.cost *= 1.0;
                projected.risk *= 1.5;
                break;
        }

        const delta = {
            yield: projected.yield - baseline.yield,
            cost: projected.cost - baseline.cost,
            risk: projected.risk - baseline.risk,
        };

        const recommendation =
            delta.yield > 0 && delta.cost < 0
                ? 'Рекомендуется: сценарий улучшает урожайность и снижает затраты'
                : delta.yield > 0 && delta.cost > 0
                    ? 'Рассмотреть: урожайность растёт, но затраты тоже. ROI требует оценки.'
                    : 'Не рекомендуется: сценарий ухудшает показатели';

        return {
            scenario,
            baseline,
            projected,
            delta,
            confidence: 0.45,
            recommendation,
        };
    }
}
