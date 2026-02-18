import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { ModelRegistryService } from './model-registry.service';
import { DriftAnalysisService, DriftAnalysisConfig } from './drift-analysis.service';
import { CooldownManager } from './cooldown-manager';
import { K8sJobService } from './k8s-job.service';

@Injectable()
export class RetrainingOrchestrator {
    private readonly logger = new Logger(RetrainingOrchestrator.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly modelRegistry: ModelRegistryService,
        private readonly driftAnalysis: DriftAnalysisService,
        private readonly cooldown: CooldownManager,
        private readonly k8sJob: K8sJobService,
    ) { }

    /**
     * Главный цикл принятия решения о переобучении.
     */
    async handleIncomingMetrics(companyId: string, featureId: string, metrics: any) {
        this.logger.log(`🧬 RetrainingOrchestrator: Processing metrics for ${featureId} (${companyId})`);

        // 1. Распределенная блокировка (Distributed Mutex)
        // Предотвращает одновременный запуск анализа для одной и той же фичи
        const lockKey = `rai:lock:orch:${companyId}:${featureId}`;
        const acquired = await this.redis.setNX(lockKey, 'BUSY', 600); // Блокировка на 10 минут
        if (!acquired) {
            this.logger.warn(`⏳ Orchestration already in progress for ${featureId}. Skipping.`);
            return;
        }

        try {
            // 2. Проверка задержки (Cooldown)
            if (await this.cooldown.isUnderCooldown(companyId, featureId)) {
                this.logger.warn(`🧊 Feature ${featureId} is under cooldown. Skipping retraining.`);
                return;
            }

            // 3. Анализ дрейфа (Shadow Mode baseline)
            const latestModel = await this.modelRegistry.getLatestActiveModel(companyId, featureId);
            if (!latestModel) {
                this.logger.warn(`⚠️ No active model found for ${featureId}. Manual initialization required.`);
                return;
            }

            const driftConfig: DriftAnalysisConfig = {
                maeThreshold: 0.1, // В реальности берется из метаданных фичи
                rmseThreshold: 0.15,
                psiThreshold: 0.2,
                minSampleSize: 100,
            };

            const driftReport = await this.driftAnalysis.analyzeDrift(companyId, latestModel.id, metrics, driftConfig);

            // 4. Логика запуска переобучения
            if (driftReport.status === 'CRITICAL') {
                this.logger.error(`🚨 CRITICAL DRIFT detected for ${featureId}. Initiating SHADOW retraining pipeline.`);
                await this.startShadowTraining(companyId, featureId, latestModel.artifactPath);
            }

        } catch (error) {
            this.logger.error(`❌ Orchestration failed: ${error.message}`, error.stack);
        } finally {
            // Снимаем блокировку
            await this.redis.del(lockKey);
        }
    }

    private async startShadowTraining(companyId: string, featureId: string, baseArtifact: string) {
        const run = await this.prisma.trainingRun.create({
            data: {
                featureId,
                companyId,
                status: 'PENDING',
                config: { mode: 'shadow', triggeredBy: 'drift_alert' },
            },
        });

        try {
            // Реальный запуск K8s Job
            await this.k8sJob.createTrainingJob(companyId, run.id, 'rai/ml-trainer:latest', {
                S3_ENDPOINT: process.env.MINIO_ENDPOINT || 'http://minio:9000',
                TRAINING_RUN_ID: run.id,
                COMPANY_ID: companyId,
                BASE_MODEL_PATH: baseArtifact,
            });

            await this.prisma.trainingRun.update({
                where: { id: run.id },
                data: { status: 'RUNNING' },
            });

            this.logger.log(`🏗️ K8s Job started for TrainingRun: ${run.id}`);

            // Устанавливаем защитный cooldown
            await this.cooldown.setCooldown(companyId, featureId, 86400); // 24 часа

        } catch (e) {
            this.logger.error(`❌ Failed to start K8s Job for ${run.id}: ${e.message}`);
            await this.prisma.trainingRun.update({
                where: { id: run.id },
                data: { status: 'FAILED' },
            });
        }
    }
}
