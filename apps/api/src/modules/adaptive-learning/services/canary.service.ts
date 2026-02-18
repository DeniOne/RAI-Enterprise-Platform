import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CanaryService {
    private readonly logger = new Logger(CanaryService.name);
    private readonly CANARY_THRESHOLD = 0.05; // 5% транзакций

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Оценка производительности Canary-модели.
     * Автоматический откат при деградации MAE > 5% и достаточном объеме выборки.
     */
    async evaluateCanaryPerformance(companyId: string, modelId: string, currentMae: number, baselineMae: number, sampleSize: number) {
        if (baselineMae === 0 || sampleSize < 100) {
            this.logger.debug(`⏳ Canary skip: sampleSize (${sampleSize}) too small or zero baseline.`);
            return { rollback: false };
        }

        const degradation = (currentMae - baselineMae) / baselineMae;

        if (degradation > 0.05) {
            this.logger.error(`📉 Canary Rollback Triggered for ${modelId}. Degradation: ${(degradation * 100).toFixed(2)}%`);

            // Откатываем модель в статус QUARANTINED (в таблице rai_model_versions)
            await (this.prisma.modelVersion.update as any)({
                where: { id: modelId },
                data: { status: 'QUARANTINED' }
            });

            return { rollback: true, reason: 'MAE_DEGRADATION_THRESHOLD_EXCEEDED' };
        }

        return { rollback: false };
    }

    /**
     * Принимает решение, должен ли текущий запрос быть направлен на Canary-модель.
     */
    shouldUseCanary(routingKey: string): boolean {
        const hash = createHash('md5').update(routingKey).digest('hex');
        const numericHash = parseInt(hash.substring(0, 8), 16);
        const normalized = numericHash / 0xffffffff;

        const isCanary = normalized < this.CANARY_THRESHOLD;
        if (isCanary) {
            this.logger.debug(`🐤 Canary traffic routed for key: ${routingKey}`);
        }
        return isCanary;
    }
}
