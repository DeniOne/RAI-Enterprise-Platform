/**
 * MC Semantic Guard
 * Module 08 — MatrixCoin-Economy
 * 
 * Защищает семантическую целостность MC.
 * НЕ содержит бизнес-логики — только валидация границ.
 * 
 * ⚠️ GUARD: Этот файл — граница допустимого, не алгоритм
 */

import { MC_CONSTRAINTS } from '../core/economy.constants';
import type { MCState, MCSourceType } from '../core/mc.types';

/**
 * Проверяет, что MC имеет обязательную дату истечения
 * ⚠️ VIOLATION: MC без expiration = архитектурная ошибка
 */
export function assertMCHasExpiration(mc: Pick<MCState, 'expiresAt'>): void {
    if (!MC_CONSTRAINTS.REQUIRES_EXPIRATION) return;

    if (!mc.expiresAt) {
        throw new MCGuardViolationError('MC must have expiration date');
    }
}

/**
 * Проверяет, что TTL в допустимых пределах
 */
export function assertMCTTLValid(issuedAt: Date, expiresAt: Date): void {
    const ttlDays = Math.ceil((expiresAt.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (ttlDays < MC_CONSTRAINTS.MIN_TTL_DAYS) {
        throw new MCGuardViolationError(`MC TTL too short: ${ttlDays} days (min: ${MC_CONSTRAINTS.MIN_TTL_DAYS})`);
    }

    if (ttlDays > MC_CONSTRAINTS.MAX_TTL_DAYS) {
        throw new MCGuardViolationError(`MC TTL too long: ${ttlDays} days (max: ${MC_CONSTRAINTS.MAX_TTL_DAYS})`);
    }
}

/**
 * Запрещённые источники MC
 * ⛔ ABSOLUTE: Эти источники НИКОГДА не допускаются
 */
const FORBIDDEN_MC_SOURCES = ['AUTO', 'CRON', 'AI', 'SYSTEM', 'ALGORITHM'] as const;

/**
 * Проверяет допустимость источника MC
 * ⚠️ GUARD: Нет автоматических источников
 */
export function assertValidMCSource(sourceType: MCSourceType): void {
    for (const forbidden of FORBIDDEN_MC_SOURCES) {
        if (sourceType.toUpperCase().includes(forbidden)) {
            throw new MCGuardViolationError(`Forbidden MC source type: ${sourceType}`);
        }
    }
}

/**
 * Проверяет, что MC не связан с KPI
 * ⚠️ GUARD: MC не может быть привязан к показателям эффективности
 */
export function assertMCNotLinkedToKPI(metadata?: Record<string, unknown>): void {
    if (MC_CONSTRAINTS.LINKED_TO_KPI) return; // Guard disabled

    if (metadata && ('kpiId' in metadata || 'performanceId' in metadata || 'okrId' in metadata)) {
        throw new MCGuardViolationError('MC cannot be linked to KPI/OKR/Performance metrics');
    }
}

/**
 * MC Guard Violation Error
 */
export class MCGuardViolationError extends Error {
    readonly code = 'MC_GUARD_VIOLATION';

    constructor(message: string) {
        super(`MC_GUARD_VIOLATION: ${message}`);
        this.name = 'MCGuardViolationError';
    }
}
