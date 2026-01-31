"use strict";
/**
 * Automation Guard
 * Module 08 — MatrixCoin-Economy
 *
 * Предотвращает автоматические начисления и триггеры.
 *
 * ⚠️ GUARD: Все изменения требуют человеческого действия
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationGuardViolationError = void 0;
exports.assertNoCronAccrual = assertNoCronAccrual;
exports.assertNoAutoTrigger = assertNoAutoTrigger;
exports.assertHumanActionPresent = assertHumanActionPresent;
exports.assertNoSelfLoop = assertNoSelfLoop;
const economy_constants_1 = require("../core/economy.constants");
/**
 * Проверяет, что операция не является cron-начислением
 */
function assertNoCronAccrual(isCronContext) {
    if (!economy_constants_1.AUTOMATION_CONSTRAINTS.ALLOW_CRON_ACCRUAL && isCronContext) {
        throw new AutomationGuardViolationError('Cron-based accrual is forbidden');
    }
}
/**
 * Проверяет, что операция не является автоматическим триггером
 */
function assertNoAutoTrigger(isAutoTriggered) {
    if (!economy_constants_1.AUTOMATION_CONSTRAINTS.ALLOW_AUTO_TRIGGERS && isAutoTriggered) {
        throw new AutomationGuardViolationError('Auto-triggered operations are forbidden');
    }
}
/**
 * Проверяет наличие человеческого действия
 */
function assertHumanActionPresent(initiatedBy) {
    if (!economy_constants_1.AUTOMATION_CONSTRAINTS.REQUIRES_HUMAN_ACTION)
        return;
    if (!initiatedBy) {
        throw new AutomationGuardViolationError('Human action required for economy operations');
    }
    const SYSTEM_IDENTIFIERS = ['SYSTEM', 'CRON', 'AUTO', 'SCHEDULER', 'JOB'];
    for (const sysId of SYSTEM_IDENTIFIERS) {
        if (initiatedBy.toUpperCase().includes(sysId)) {
            throw new AutomationGuardViolationError(`Economy operation must be initiated by human, not: ${initiatedBy}`);
        }
    }
}
/**
 * Проверяет отсутствие self-loop механизмов
 */
function assertNoSelfLoop(sourceId, targetId) {
    if (!economy_constants_1.AUTOMATION_CONSTRAINTS.ALLOW_SELF_LOOP && sourceId === targetId) {
        throw new AutomationGuardViolationError('Self-loop operations are forbidden');
    }
}
/**
 * Automation Guard Violation Error
 */
class AutomationGuardViolationError extends Error {
    code = 'AUTOMATION_GUARD_VIOLATION';
    constructor(message) {
        super(`AUTOMATION_GUARD_VIOLATION: ${message}`);
        this.name = 'AutomationGuardViolationError';
    }
}
exports.AutomationGuardViolationError = AutomationGuardViolationError;
