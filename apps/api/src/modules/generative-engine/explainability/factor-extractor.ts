import { Injectable, Logger } from '@nestjs/common';

/**
 * FactorExtractor — Извлекает ключевые факторы влияния на генерацию.
 * 
 * Анализирует:
 * 1. Ограничения (почему что-то исключено)
 * 2. Приоритеты (почему выбрана эта стратегия)
 * 3. Ресурсные конфликты
 * 
 * Соответствует I24 (Explainability).
 */
@Injectable()
export class FactorExtractor {
    private readonly logger = new Logger(FactorExtractor.name);

    /**
     * Извлекает факторы из черновика.
     * @param draft - сгенерированный черновик
     */
    extractFactors(draft: any): Array<{ type: string; description: string; impact: 'HIGH' | 'MEDIUM' | 'LOW' }> {
        const factors: Array<{ type: string; description: string; impact: 'HIGH' | 'MEDIUM' | 'LOW' }> = [];

        // 1. Анализ ограничений
        if (draft.propagatedConstraints && draft.propagatedConstraints.length > 0) {
            draft.propagatedConstraints.forEach((c: any) => {
                factors.push({
                    type: 'CONSTRAINT',
                    description: `Applied constraint: ${c.type} (${c.field} ${c.operator} ${c.value}) - ${c.message}`,
                    impact: 'HIGH',
                });
            });
        }

        // 2. Анализ выбранной стратегии (basic)
        if (draft.generationMetadata?.modelId) {
            factors.push({
                type: 'MODEL_SELECTION',
                description: `Used model ${draft.generationMetadata.modelId} v${draft.generationMetadata.modelVersion}`,
                impact: 'MEDIUM',
            });
        }

        this.logger.debug(`Extracted ${factors.length} factors`);
        return factors;
    }
}
