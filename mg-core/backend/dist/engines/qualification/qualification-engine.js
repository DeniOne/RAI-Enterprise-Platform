"use strict";
/**
 * Qualification Engine - Phase 1.2
 *
 * Детерминированная оценка квалификационного состояния.
 *
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. ОЦЕНКА ≠ РЕШЕНИЕ: Engine предлагает, человек решает
 * 2. ДЕТЕРМИНИЗМ: evaluated_at передаётся извне
 * 3. EVIDENCE: каждое состояние объяснимо фактами
 *
 * Принцип: Одни Events + KPI → один Qualification State.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualificationEngine = exports.QualificationValidationError = void 0;
const rules_1 = require("./rules");
// =============================================================================
// VALIDATION ERRORS
// =============================================================================
class QualificationValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QualificationValidationError';
    }
}
exports.QualificationValidationError = QualificationValidationError;
// =============================================================================
// HELPER FUNCTIONS (PURE)
// =============================================================================
/**
 * Подсчитать дни между двумя датами
 */
function daysBetween(date1, date2) {
    const ms = date2.getTime() - date1.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}
// =============================================================================
// QUALIFICATION ENGINE
// =============================================================================
/**
 * Qualification Engine - детерминированная оценка квалификации
 *
 * ОТВЕТСТВЕННОСТЬ:
 * - Сбор evidence из Events и KPI
 * - Применение правил
 * - Формирование результата оценки
 *
 * НЕ ОТВЕТСТВЕНЕН ЗА:
 * - Принятие решений
 * - Автоматическое изменение квалификации
 * - Запись в БД
 */
class QualificationEngine {
    /**
     * Оценить квалификационное состояние
     *
     * ДЕТЕРМИНИРОВАННЫЙ: одни Events + KPI → один результат
     *
     * @param input - Все данные для оценки
     * @returns Результат оценки (ФАКТ, не решение)
     */
    static evaluate(input) {
        // 1. Валидация входных данных
        this.validateInput(input);
        // 2. Определить состояние
        const { state, evidence } = this.determineState(input);
        // 3. Подсчитать дни на уровне
        const daysAtCurrentLevel = daysBetween(input.level_achieved_at, input.evaluated_at);
        // 4. Сформировать результат
        return {
            user_id: input.user_id,
            role_id: input.role_id,
            current_level: input.current_level,
            state,
            evidence,
            days_at_current_level: daysAtCurrentLevel,
            evaluated_at: input.evaluated_at, // Передан извне, НЕ влияет на оценку
        };
    }
    /**
     * Определить состояние на основе правил
     *
     * Логика:
     * 1. Если eligibleForUpgrade → 'eligible_for_upgrade'
     * 2. Если riskOfDowngrade → 'risk_of_downgrade'
     * 3. Иначе → 'stable'
     */
    static determineState(input) {
        // Собираем evidence от всех правил
        const allEvidence = [];
        // Проверяем upgrade
        const isEligibleForUpgrade = rules_1.eligibleForUpgradeRule.check(input);
        const upgradeEvidence = rules_1.eligibleForUpgradeRule.collectEvidence(input);
        allEvidence.push(...upgradeEvidence);
        if (isEligibleForUpgrade) {
            return {
                state: 'eligible_for_upgrade',
                evidence: allEvidence,
            };
        }
        // Проверяем downgrade
        const isRiskOfDowngrade = rules_1.riskOfDowngradeRule.check(input);
        const downgradeEvidence = rules_1.riskOfDowngradeRule.collectEvidence(input);
        // Добавляем только уникальные evidence (по description)
        for (const ev of downgradeEvidence) {
            if (!allEvidence.some(e => e.description === ev.description)) {
                allEvidence.push(ev);
            }
        }
        if (isRiskOfDowngrade) {
            return {
                state: 'risk_of_downgrade',
                evidence: allEvidence,
            };
        }
        // Stable
        return {
            state: 'stable',
            evidence: allEvidence,
        };
    }
    /**
     * Валидация входных данных
     *
     * @throws QualificationValidationError если данные невалидны
     */
    static validateInput(input) {
        if (!input) {
            throw new QualificationValidationError('Input is required');
        }
        if (!input.user_id) {
            throw new QualificationValidationError('user_id is required');
        }
        if (!input.role_id) {
            throw new QualificationValidationError('role_id is required');
        }
        if (typeof input.current_level !== 'number' || input.current_level < 1 || input.current_level > 5) {
            throw new QualificationValidationError('current_level must be between 1 and 5');
        }
        if (!input.level_achieved_at) {
            throw new QualificationValidationError('level_achieved_at is required');
        }
        if (!input.requirements) {
            throw new QualificationValidationError('requirements is required');
        }
        if (!input.evaluated_at) {
            throw new QualificationValidationError('evaluated_at is required');
        }
    }
}
exports.QualificationEngine = QualificationEngine;
