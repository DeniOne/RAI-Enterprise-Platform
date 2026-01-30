/**
 * Automation Guard
 * Module 08 — MatrixCoin-Economy
 * 
 * Предотвращает автоматические начисления и триггеры.
 * 
 * ⚠️ GUARD: Все изменения требуют человеческого действия
 */

import { AUTOMATION_CONSTRAINTS } from '../core/economy.constants';

/**
 * Проверяет, что операция не является cron-начислением
 */
export function assertNoCronAccrual(isCronContext: boolean): void {
    if (!AUTOMATION_CONSTRAINTS.ALLOW_CRON_ACCRUAL && isCronContext) {
        throw new AutomationGuardViolationError('Cron-based accrual is forbidden');
    }
}

/**
 * Проверяет, что операция не является автоматическим триггером
 */
export function assertNoAutoTrigger(isAutoTriggered: boolean): void {
    if (!AUTOMATION_CONSTRAINTS.ALLOW_AUTO_TRIGGERS && isAutoTriggered) {
        throw new AutomationGuardViolationError('Auto-triggered operations are forbidden');
    }
}

/**
 * Проверяет наличие человеческого действия
 */
export function assertHumanActionPresent(initiatedBy: string | null | undefined): void {
    if (!AUTOMATION_CONSTRAINTS.REQUIRES_HUMAN_ACTION) return;

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
export function assertNoSelfLoop(sourceId: string, targetId: string): void {
    if (!AUTOMATION_CONSTRAINTS.ALLOW_SELF_LOOP && sourceId === targetId) {
        throw new AutomationGuardViolationError('Self-loop operations are forbidden');
    }
}

/**
 * Automation Guard Violation Error
 */
export class AutomationGuardViolationError extends Error {
    readonly code = 'AUTOMATION_GUARD_VIOLATION';

    constructor(message: string) {
        super(`AUTOMATION_GUARD_VIOLATION: ${message}`);
        this.name = 'AutomationGuardViolationError';
    }
}
