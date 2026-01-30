/**
 * Downgrade Rule - Phase 1.2
 * 
 * Проверяет условия для risk_of_downgrade.
 * 
 * ЧИСТАЯ ФУНКЦИЯ:
 * - Не имеет побочных эффектов
 * - Не читает БД
 * - Проверяет только ФАКТЫ
 */

import {
    IQualificationInput,
    IQualificationEvidence,
    IQualificationRule,
} from '../../../types/core/qualification.types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Количество периодов подряд с низким KPI для риска понижения
 */
const CONSECUTIVE_LOW_KPI_PERIODS = 3;

/**
 * Минимальный процент от target для "критически низкого" KPI
 */
const CRITICAL_KPI_THRESHOLD_PERCENT = 0.6; // 60% от target

// =============================================================================
// HELPER FUNCTIONS (PURE)
// =============================================================================

/**
 * Проверить, есть ли KPI критически ниже target
 */
function checkKPICriticallyLow(
    kpiName: string,
    target: number,
    input: IQualificationInput
): { critical: boolean; value: number | null } {
    const kpiResult = input.kpi_results.find(k => k.kpi_name === kpiName);
    if (!kpiResult) {
        return { critical: false, value: null };
    }
    const criticalThreshold = target * CRITICAL_KPI_THRESHOLD_PERCENT;
    return { critical: kpiResult.value < criticalThreshold, value: kpiResult.value };
}

/**
 * Проверить активность в обучении за последние 30 дней
 */
function hasRecentTrainingActivity(input: IQualificationInput): boolean {
    const thirtyDaysAgo = new Date(input.evaluated_at.getTime() - 30 * 24 * 60 * 60 * 1000);

    return input.events.some(e =>
        (e.type === 'COURSE_COMPLETED' || e.type === 'TEST_PASSED') &&
        e.timestamp >= thirtyDaysAgo
    );
}

// =============================================================================
// DOWNGRADE RULE
// =============================================================================

/**
 * Risk of Downgrade Rule
 * 
 * ФАКТ: Если условия выполнены → risk_of_downgrade
 * 
 * Условия (любое из):
 * 1. KPI критически ниже target
 * 2. Нет активности в обучении за последние 30 дней (при низких KPI)
 */
export const riskOfDowngradeRule: IQualificationRule = {
    name: 'risk_of_downgrade',
    description: 'Проверяет риск понижения квалификации',
    target_state: 'risk_of_downgrade',

    /**
     * Проверка условия
     */
    check: (input: IQualificationInput): boolean => {
        // Проверяем критически низкие KPI
        let hasCriticallyLowKPI = false;

        for (const [kpiName, target] of Object.entries(input.requirements.kpi_targets)) {
            const result = checkKPICriticallyLow(kpiName, target, input);
            if (result.critical) {
                hasCriticallyLowKPI = true;
                break;
            }
        }

        // Если есть критически низкий KPI — риск понижения
        if (hasCriticallyLowKPI) {
            return true;
        }

        // Если нет активности в обучении и KPI ниже target — риск
        const hasTraining = hasRecentTrainingActivity(input);
        if (!hasTraining) {
            for (const [kpiName, target] of Object.entries(input.requirements.kpi_targets)) {
                const kpiResult = input.kpi_results.find(k => k.kpi_name === kpiName);
                if (kpiResult && kpiResult.value < target) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Сбор evidence
     */
    collectEvidence: (input: IQualificationInput): IQualificationEvidence[] => {
        const evidence: IQualificationEvidence[] = [];

        // Evidence: KPI
        for (const [kpiName, target] of Object.entries(input.requirements.kpi_targets)) {
            const result = checkKPICriticallyLow(kpiName, target, input);
            const kpiResult = input.kpi_results.find(k => k.kpi_name === kpiName);

            if (kpiResult) {
                const criticalThreshold = target * CRITICAL_KPI_THRESHOLD_PERCENT;
                let polarity: 'positive' | 'negative' | 'neutral' = 'positive';

                if (kpiResult.value < criticalThreshold) {
                    polarity = 'negative';
                } else if (kpiResult.value < target) {
                    polarity = 'neutral';
                }

                evidence.push({
                    type: 'kpi',
                    description: `${kpiName}: ${result.value} / target: ${target} (critical: ${criticalThreshold.toFixed(0)})`,
                    value: result.value ?? 0,
                    polarity,
                    source_event_id: kpiResult.source_event_ids[0],
                });
            }
        }

        // Evidence: активность в обучении
        const hasTraining = hasRecentTrainingActivity(input);
        evidence.push({
            type: 'training',
            description: `Активность в обучении (30 дней): ${hasTraining ? 'Есть' : 'Нет'}`,
            value: hasTraining ? 1 : 0,
            polarity: hasTraining ? 'positive' : 'negative',
        });

        return evidence;
    },
};
