/**
 * MC (Matrix Coin) Type Definitions
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ GUARD: MC НЕ является:
 * - деньгами
 * - бонусом
 * - зарплатой
 * - эквивалентом KPI
 * 
 * MC — временный след участия, а не награда.
 */

import { MCLifecycleState } from './economy.enums';

/**
 * MC State — операционная поведенческая единица
 * MC имеет срок жизни (TTL) и может сгорать
 */
export interface MCState {
    /** Уникальный идентификатор MC-записи */
    readonly id: string;

    /** ID пользователя-владельца */
    readonly userId: string;

    /** Количество MC */
    readonly amount: number;

    /** Дата получения MC */
    readonly issuedAt: Date;

    /** 
     * Дата истечения MC (ОБЯЗАТЕЛЬНО)
     * ⚠️ GUARD: MC без expiration = архитектурная ошибка
     */
    readonly expiresAt: Date;

    /** MC заморожен в Safe? */
    readonly isFrozen: boolean;

    /** 
     * Источник MC — для аудита, НЕ для аналитики эффективности
     * ⚠️ GUARD: Не использовать для расчёта KPI
     */
    readonly sourceType: MCSourceType;

    /** ID источника для аудита */
    readonly sourceId: string;

    /** Текущее состояние жизненного цикла */
    readonly lifecycleState: MCLifecycleState;
}

/** 
 * Допустимые источники MC
 * ⚠️ GUARD: Нет автоматических источников (cron, AI, system)
 */
export type MCSourceType =
    | 'MANUAL_GRANT'        // Ручное начисление уполномоченным лицом
    | 'EVENT_PARTICIPATION' // Участие в событии
    | 'PEER_TRANSFER';      // Передача от коллеги

// MCLifecycleState импортируется из economy.enums.ts
// Ref: STEP-2-STATE-LIFECYCLE.md Section 1.1
export { MCLifecycleState } from './economy.enums';

/**
 * MC Summary — агрегированное состояние для пользователя
 * ⚠️ GUARD: Используется только для отображения, не для расчётов
 */
export interface MCSummary {
    /** Общее количество активных MC */
    readonly activeBalance: number;

    /** Количество замороженных MC (в Safe) */
    readonly frozenBalance: number;

    /** Количество MC, истекающих в ближайшие 30 дней */
    readonly expiringWithin30Days: number;

    /** Дата последнего обновления */
    readonly updatedAt: Date;
}
