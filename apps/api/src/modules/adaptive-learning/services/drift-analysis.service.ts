import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface DriftAnalysisConfig {
    maeThreshold: number;
    rmseThreshold: number;
    psiThreshold: number;
    minSampleSize: number;
}

@Injectable()
export class DriftAnalysisService {
    private readonly logger = new Logger(DriftAnalysisService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Анализирует дрейф на основе входящих метрик.
     * Использует упрощенную логику SPRT.
     */
    async analyzeDrift(companyId: string, modelVersionId: string, metrics: any, config: DriftAnalysisConfig) {
        this.logger.log(`📊 Analyzing drift for module ${modelVersionId}`);

        const mae = metrics.mae || 0;
        const rmse = metrics.rmse || 0;

        let status = 'NORMAL';
        if (mae > config.maeThreshold || rmse > config.rmseThreshold) {
            status = 'CRITICAL';
        } else if (mae > config.maeThreshold * 0.8) {
            status = 'WARNING';
        }

        // Сохранение отчета
        return await this.prisma.driftReport.create({
            data: {
                modelVersionId,
                psiScore: metrics.psi || 0,
                status: status as any,
                payload: metrics,
                companyId,
            },
        });
    }

    /**
     * SPRT (Sequential Probability Ratio Test) Logic
     * Решает, достаточно ли у нас данных для подтверждения дрейфа.
     */
    isStatisticallySignificant(currentMae: number, baselineMae: number, sampleSize: number): boolean {
        // В промышленной реализации здесь сложная формула SPRT
        // Для Phase A используем упрощенный порог по размеру выборки и отклонению.
        if (sampleSize < 100) return false;
        return Math.abs(currentMae - baselineMae) / baselineMae > 0.15;
    }
}
