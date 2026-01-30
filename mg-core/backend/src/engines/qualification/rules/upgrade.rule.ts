/**
 * Upgrade Rule - Phase 1.2
 * 
 * Проверяет условия для eligible_for_upgrade.
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
// HELPER FUNCTIONS (PURE)
// =============================================================================

/**
 * Подсчитать дни между двумя датами
 */
function daysBetween(date1: Date, date2: Date): number {
    const ms = date2.getTime() - date1.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Проверить, есть ли KPI >= target
 */
function checkKPIAboveTarget(
    kpiName: string,
    target: number,
    input: IQualificationInput
): { passed: boolean; value: number | null } {
    const kpiResult = input.kpi_results.find(k => k.kpi_name === kpiName);
    if (!kpiResult) {
        return { passed: false, value: null };
    }
    return { passed: kpiResult.value >= target, value: kpiResult.value };
}

/**
 * Подсчитать завершённые курсы
 */
function countCompletedCourses(input: IQualificationInput): number {
    return input.events.filter(e => e.type === 'COURSE_COMPLETED').length;
}

// =============================================================================
// UPGRADE RULE
// =============================================================================

/**
 * Eligible for Upgrade Rule
 * 
 * ФАКТ: Если ВСЕ условия выполнены → eligible_for_upgrade
 * 
 * Условия:
 * 1. Минимальное время на текущем уровне
 * 2. Все KPI >= target
 * 3. Есть завершённые курсы (если требуется)
 */
export const eligibleForUpgradeRule: IQualificationRule = {
    name: 'eligible_for_upgrade',
    description: 'Проверяет готовность к повышению квалификации',
    target_state: 'eligible_for_upgrade',

    /**
     * Проверка условия
     */
    check: (input: IQualificationInput): boolean => {
        // 1. Минимальное время на текущем уровне
        const daysAtLevel = daysBetween(input.level_achieved_at, input.evaluated_at);
        if (daysAtLevel < input.requirements.min_days_at_level) {
            return false;
        }

        // 2. Все KPI >= target
        for (const [kpiName, target] of Object.entries(input.requirements.kpi_targets)) {
            const result = checkKPIAboveTarget(kpiName, target, input);
            if (!result.passed) {
                return false;
            }
        }

        // 3. Завершённые курсы
        const completedCourses = countCompletedCourses(input);
        if (completedCourses < input.requirements.required_courses) {
            return false;
        }

        // Все условия выполнены
        return true;
    },

    /**
     * Сбор evidence
     */
    collectEvidence: (input: IQualificationInput): IQualificationEvidence[] => {
        const evidence: IQualificationEvidence[] = [];

        // Evidence: время на уровне
        const daysAtLevel = daysBetween(input.level_achieved_at, input.evaluated_at);
        evidence.push({
            type: 'time',
            description: `Дней на уровне ${input.current_level}`,
            value: daysAtLevel,
            polarity: daysAtLevel >= input.requirements.min_days_at_level ? 'positive' : 'negative',
        });

        // Evidence: KPI
        for (const [kpiName, target] of Object.entries(input.requirements.kpi_targets)) {
            const result = checkKPIAboveTarget(kpiName, target, input);
            const kpiResult = input.kpi_results.find(k => k.kpi_name === kpiName);

            evidence.push({
                type: 'kpi',
                description: `${kpiName}: ${result.value ?? 'N/A'} / target: ${target}`,
                value: result.value ?? 0,
                polarity: result.passed ? 'positive' : 'negative',
                source_event_id: kpiResult?.source_event_ids[0],
            });
        }

        // Evidence: курсы
        const completedCourses = countCompletedCourses(input);
        evidence.push({
            type: 'training',
            description: `Завершённых курсов: ${completedCourses} / требуется: ${input.requirements.required_courses}`,
            value: completedCourses,
            polarity: completedCourses >= input.requirements.required_courses ? 'positive' : 'negative',
        });

        return evidence;
    },
};
