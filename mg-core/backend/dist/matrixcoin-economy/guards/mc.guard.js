"use strict";
/**
 * MC Semantic Guard
 * Module 08 — MatrixCoin-Economy
 *
 * Защищает семантическую целостность MC.
 * НЕ содержит бизнес-логики — только валидация границ.
 *
 * ⚠️ GUARD: Этот файл — граница допустимого, не алгоритм
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCGuardViolationError = void 0;
exports.assertMCHasExpiration = assertMCHasExpiration;
exports.assertMCTTLValid = assertMCTTLValid;
exports.assertValidMCSource = assertValidMCSource;
exports.assertMCNotLinkedToKPI = assertMCNotLinkedToKPI;
const economy_constants_1 = require("../core/economy.constants");
/**
 * Проверяет, что MC имеет обязательную дату истечения
 * ⚠️ VIOLATION: MC без expiration = архитектурная ошибка
 */
function assertMCHasExpiration(mc) {
    if (!economy_constants_1.MC_CONSTRAINTS.REQUIRES_EXPIRATION)
        return;
    if (!mc.expiresAt) {
        throw new MCGuardViolationError('MC must have expiration date');
    }
}
/**
 * Проверяет, что TTL в допустимых пределах
 */
function assertMCTTLValid(issuedAt, expiresAt) {
    const ttlDays = Math.ceil((expiresAt.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (ttlDays < economy_constants_1.MC_CONSTRAINTS.MIN_TTL_DAYS) {
        throw new MCGuardViolationError(`MC TTL too short: ${ttlDays} days (min: ${economy_constants_1.MC_CONSTRAINTS.MIN_TTL_DAYS})`);
    }
    if (ttlDays > economy_constants_1.MC_CONSTRAINTS.MAX_TTL_DAYS) {
        throw new MCGuardViolationError(`MC TTL too long: ${ttlDays} days (max: ${economy_constants_1.MC_CONSTRAINTS.MAX_TTL_DAYS})`);
    }
}
/**
 * Запрещённые источники MC
 * ⛔ ABSOLUTE: Эти источники НИКОГДА не допускаются
 */
const FORBIDDEN_MC_SOURCES = ['AUTO', 'CRON', 'AI', 'SYSTEM', 'ALGORITHM'];
/**
 * Проверяет допустимость источника MC
 * ⚠️ GUARD: Нет автоматических источников
 */
function assertValidMCSource(sourceType) {
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
function assertMCNotLinkedToKPI(metadata) {
    if (economy_constants_1.MC_CONSTRAINTS.LINKED_TO_KPI)
        return; // Guard disabled
    if (metadata && ('kpiId' in metadata || 'performanceId' in metadata || 'okrId' in metadata)) {
        throw new MCGuardViolationError('MC cannot be linked to KPI/OKR/Performance metrics');
    }
}
/**
 * MC Guard Violation Error
 */
class MCGuardViolationError extends Error {
    code = 'MC_GUARD_VIOLATION';
    constructor(message) {
        super(`MC_GUARD_VIOLATION: ${message}`);
        this.name = 'MCGuardViolationError';
    }
}
exports.MCGuardViolationError = MCGuardViolationError;
