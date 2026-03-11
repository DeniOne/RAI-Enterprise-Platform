import { Injectable, Logger } from '@nestjs/common';
import { FeatureStoreService, FeatureVector } from './feature-store.service';

/**
 * ModelRegistryService — Phase 5.4.2 + 5.4.3
 *
 * Model Training Pipeline + A/B Testing Framework.
 *
 * Workflow:
 *   1. Train model on historical features → store in registry
 *   2. Serve predictions via predict()
 *   3. A/B test new models vs existing (canary rollout)
 *   4. Automatic rollback on accuracy degradation
 */

export interface ModelDefinition {
    modelId: string;
    modelType: 'YIELD_PREDICTION' | 'DISEASE_RISK' | 'COST_OPTIMIZATION';
    version: string;
    status: 'TRAINING' | 'CANDIDATE' | 'ACTIVE' | 'RETIRED' | 'ROLLED_BACK';
    createdAt: string;
    metrics: {
        accuracy?: number;
        mae?: number;
        rmse?: number;
        brierScore?: number;
        sampleSize: number;
    };
    parameters: Record<string, unknown>;
}

export interface PredictionResult {
    modelId: string;
    modelVersion: string;
    prediction: number;
    confidence: number;
    features: Record<string, number | string | null>;
}

export interface ABTestConfig {
    testId: string;
    controlModelId: string;
    candidateModelId: string;
    trafficSplitPct: number; // % трафика на candidate
    minSampleSize: number;
    startedAt: string;
    status: 'RUNNING' | 'COMPLETED' | 'ROLLED_BACK';
    results?: {
        controlAccuracy: number;
        candidateAccuracy: number;
        pValue: number;
        winner: 'CONTROL' | 'CANDIDATE' | 'INCONCLUSIVE';
    };
}

@Injectable()
export class ModelRegistryService {
    private readonly logger = new Logger(ModelRegistryService.name);

    /** In-memory registry (production → Prisma table) */
    private models: Map<string, ModelDefinition> = new Map();
    private abTests: Map<string, ABTestConfig> = new Map();
    private predictions: Map<string, { predicted: number; actual?: number }[]> = new Map();

    constructor(private readonly featureStore: FeatureStoreService) { }

    // ========================================================================
    // DS-5.4.2: Model Training
    // ========================================================================

    /**
     * Тренирует модель прогноза урожайности (rule-based, LightGBM-inspired).
     *
     * Алгоритм v1: Historical Mean + Trend + Engram Correction
     * Алгоритм v2 (future): LightGBM on feature vectors
     */
    async trainYieldModel(
        companyId: string,
        seasonIds: string[],
    ): Promise<ModelDefinition> {
        const modelId = `yield_${companyId}_${Date.now()}`;
        const startedAt = Date.now();

        // Collect training features
        const trainingData: Array<{ features: FeatureVector['features']; target: number }> = [];

        for (const seasonId of seasonIds) {
            const fields = await this.featureStore.extractBatch(companyId, seasonId);
            this.logger.debug(`train_collect season=${seasonId} fields=${fields.extracted}`);
        }

        // Collect features with known yields
        for (const [, vector] of (this.featureStore as any).store ?? new Map()) {
            const f = (vector as FeatureVector).features;
            if (f.avgYield != null && (vector as FeatureVector).companyId === companyId) {
                trainingData.push({ features: f, target: f.avgYield });
            }
        }

        // Calculate model accuracy (leave-one-out cross validation)
        let totalError = 0;
        let totalSamples = 0;

        for (let i = 0; i < trainingData.length; i++) {
            const others = trainingData.filter((_, j) => j !== i);
            if (others.length === 0) continue;

            const avgPrediction = others.reduce((s, d) => s + d.target, 0) / others.length;
            totalError += Math.abs(avgPrediction - trainingData[i].target);
            totalSamples++;
        }

        const mae = totalSamples > 0 ? totalError / totalSamples : 999;
        const accuracy = trainingData.length > 0
            ? Math.max(0, 1 - mae / (trainingData[0]?.target ?? 30))
            : 0;

        const model: ModelDefinition = {
            modelId,
            modelType: 'YIELD_PREDICTION',
            version: '1.0',
            status: 'CANDIDATE',
            createdAt: new Date().toISOString(),
            metrics: {
                accuracy,
                mae,
                sampleSize: totalSamples,
            },
            parameters: {
                algorithm: 'historical_mean_trend',
                trainingSamples: trainingData.length,
                seasonIds,
                trainingDurationMs: Date.now() - startedAt,
            },
        };

        this.models.set(modelId, model);
        this.logger.log(
            `model_trained id=${modelId} type=${model.modelType} accuracy=${accuracy.toFixed(3)} mae=${mae.toFixed(2)} samples=${totalSamples}`,
        );

        return model;
    }

    /**
     * Генерирует prediction используя активную модель.
     */
    async predict(
        modelId: string,
        features: FeatureVector,
    ): Promise<PredictionResult> {
        const model = this.models.get(modelId);
        if (!model || model.status === 'RETIRED' || model.status === 'ROLLED_BACK') {
            throw new Error(`Model ${modelId} not available (status=${model?.status ?? 'NOT_FOUND'})`);
        }

        // Rule-based prediction
        const f = features.features;
        let prediction = f.avgYield ?? 30;

        // Apply trend
        if (f.yieldTrend && Math.abs(f.yieldTrend) > 0.1) {
            prediction += f.yieldTrend;
        }

        // Engram correction
        if (f.avgEngramSuccessRate != null && f.avgEngramSuccessRate > 0.8) {
            prediction *= 1.03;
        } else if (f.avgEngramSuccessRate != null && f.avgEngramSuccessRate < 0.4) {
            prediction *= 0.95;
        }

        const confidence = Math.min(
            0.3 + (f.historicalYields?.length ?? 0) * 0.05 + (f.engramCount ?? 0) * 0.01,
            0.9,
        );

        // Track prediction
        if (!this.predictions.has(modelId)) this.predictions.set(modelId, []);
        this.predictions.get(modelId)!.push({ predicted: prediction });

        return {
            modelId,
            modelVersion: model.version,
            prediction: Math.round(prediction * 10) / 10,
            confidence,
            features: {
                avgYield: f.avgYield ?? null,
                yieldTrend: f.yieldTrend ?? null,
                engramCount: f.engramCount ?? null,
                soilQuality: f.soilQualityIndex ?? null,
            },
        };
    }

    /**
     * Промоут модель в ACTIVE.
     */
    promoteModel(modelId: string): void {
        const model = this.models.get(modelId);
        if (!model) throw new Error(`Model ${modelId} not found`);

        // Retire current active model of same type
        for (const [, m] of this.models) {
            if (m.modelType === model.modelType && m.status === 'ACTIVE') {
                m.status = 'RETIRED';
            }
        }

        model.status = 'ACTIVE';
        this.logger.log(`model_promoted id=${modelId} type=${model.modelType}`);
    }

    /**
     * Получает активную модель по типу.
     */
    getActiveModel(modelType: ModelDefinition['modelType']): ModelDefinition | null {
        for (const [, model] of this.models) {
            if (model.modelType === modelType && model.status === 'ACTIVE') {
                return model;
            }
        }
        return null;
    }

    /**
     * Список всех моделей.
     */
    listModels(): ModelDefinition[] {
        return Array.from(this.models.values());
    }

    // ========================================================================
    // DS-5.4.3: A/B Testing Framework
    // ========================================================================

    /**
     * Создаёт A/B тест: control vs candidate.
     */
    createABTest(
        controlModelId: string,
        candidateModelId: string,
        trafficSplitPct: number = 20,
        minSampleSize: number = 50,
    ): ABTestConfig {
        const control = this.models.get(controlModelId);
        const candidate = this.models.get(candidateModelId);

        if (!control) throw new Error(`Control model ${controlModelId} not found`);
        if (!candidate) throw new Error(`Candidate model ${candidateModelId} not found`);

        const testId = `ab_${Date.now()}`;
        const config: ABTestConfig = {
            testId,
            controlModelId,
            candidateModelId,
            trafficSplitPct,
            minSampleSize,
            startedAt: new Date().toISOString(),
            status: 'RUNNING',
        };

        this.abTests.set(testId, config);
        this.logger.log(
            `ab_test_created id=${testId} control=${controlModelId} candidate=${candidateModelId} split=${trafficSplitPct}%`,
        );

        return config;
    }

    /**
     * Маршрутизация: какую модель использовать (control или candidate).
     */
    routeABTest(testId: string): string {
        const test = this.abTests.get(testId);
        if (!test || test.status !== 'RUNNING') {
            return test?.controlModelId ?? '';
        }

        // Random routing based on traffic split
        return Math.random() * 100 < test.trafficSplitPct
            ? test.candidateModelId
            : test.controlModelId;
    }

    /**
     * Записывает actual outcome для prediction.
     */
    recordActual(modelId: string, index: number, actual: number): void {
        const preds = this.predictions.get(modelId);
        if (preds && preds[index]) {
            preds[index].actual = actual;
        }
    }

    /**
     * Оценивает результаты A/B теста.
     */
    evaluateABTest(testId: string): ABTestConfig {
        const test = this.abTests.get(testId);
        if (!test) throw new Error(`Test ${testId} not found`);

        const controlPreds = this.predictions.get(test.controlModelId) ?? [];
        const candidatePreds = this.predictions.get(test.candidateModelId) ?? [];

        const controlActual = controlPreds.filter((p) => p.actual != null);
        const candidateActual = candidatePreds.filter((p) => p.actual != null);

        if (controlActual.length < test.minSampleSize || candidateActual.length < test.minSampleSize) {
            this.logger.debug(
                `ab_test_evaluate id=${testId} status=INSUFFICIENT control=${controlActual.length} candidate=${candidateActual.length} needed=${test.minSampleSize}`,
            );
            return test;
        }

        const controlMAE = controlActual.reduce((s, p) => s + Math.abs(p.predicted - p.actual!), 0) / controlActual.length;
        const candidateMAE = candidateActual.reduce((s, p) => s + Math.abs(p.predicted - p.actual!), 0) / candidateActual.length;

        const controlAccuracy = Math.max(0, 1 - controlMAE / 30);
        const candidateAccuracy = Math.max(0, 1 - candidateMAE / 30);

        // Simplified p-value estimation (Z-test approximation)
        const diff = candidateAccuracy - controlAccuracy;
        const pooledStdErr = 0.05; // Simplified
        const zScore = diff / pooledStdErr;
        const pValue = Math.max(0.001, Math.min(1, Math.exp(-Math.abs(zScore))));

        const winner: 'CONTROL' | 'CANDIDATE' | 'INCONCLUSIVE' =
            pValue < 0.05 && candidateAccuracy > controlAccuracy
                ? 'CANDIDATE'
                : pValue < 0.05 && controlAccuracy > candidateAccuracy
                    ? 'CONTROL'
                    : 'INCONCLUSIVE';

        test.status = 'COMPLETED';
        test.results = { controlAccuracy, candidateAccuracy, pValue, winner };

        // Auto-promote or rollback
        if (winner === 'CANDIDATE') {
            this.promoteModel(test.candidateModelId);
            this.logger.log(`ab_test_winner CANDIDATE id=${testId} → promoted ${test.candidateModelId}`);
        } else if (winner === 'CONTROL') {
            const candidate = this.models.get(test.candidateModelId);
            if (candidate) {
                candidate.status = 'ROLLED_BACK';
                this.logger.log(`ab_test_winner CONTROL id=${testId} → rolled back ${test.candidateModelId}`);
            }
        }

        return test;
    }

    /**
     * Список активных A/B тестов.
     */
    listABTests(): ABTestConfig[] {
        return Array.from(this.abTests.values());
    }
}
