import { Injectable, Logger } from '@nestjs/common';

/**
 * RationaleGenerator — Генерирует человекочитаемое объяснение (LLM-style or Template-based).
 * 
 * В Level B используем детерминированные шаблоны (template-based), 
 * чтобы не нарушать детерминизм (I19) случайной генерацией текста.
 */
@Injectable()
export class RationaleGenerator {
    private readonly logger = new Logger(RationaleGenerator.name);

    /**
     * Генерирует текстовое объяснение на основе факторов.
     */
    generateRationale(factors: Array<{ type: string; description: string; impact: string }>): string {
        if (!factors || factors.length === 0) {
            return 'Генерация выполнена успешно. Специфических факторов влияния не обнаружено.';
        }

        const highImpact = factors.filter(f => f.impact === 'HIGH');
        const mediumImpact = factors.filter(f => f.impact === 'MEDIUM');

        let rationale = 'Отчет о генерации:\n';

        if (highImpact.length > 0) {
            rationale += '\nКритические факторы:\n';
            highImpact.forEach(f => rationale += `- ${f.description}\n`);
        }

        if (mediumImpact.length > 0) {
            rationale += '\nВажные факторы:\n';
            mediumImpact.forEach(f => rationale += `- ${f.description}\n`);
        }

        return rationale;
    }
}
