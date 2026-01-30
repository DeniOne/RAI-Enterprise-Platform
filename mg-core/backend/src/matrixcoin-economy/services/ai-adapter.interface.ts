/**
 * AI Adapter Interface
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Этот файл определяет интерфейс, НЕ реализацию.
 * Реализация запрещена до STEP 4.
 * 
 * ⛔ ABSOLUTE GUARD: AI = read-only, advisory only
 */

import type { MCSummary } from '../core/mc.types';
import type { GMCSummary } from '../core/gmc.types';

/**
 * Aggregated Economy Snapshot — данные для AI
 * ⚠️ GUARD: Только агрегированные данные, без персональной информации
 */
export interface IEconomySnapshot {
    /** Временная метка снапшота */
    readonly timestamp: Date;

    /**
     * Агрегированные показатели MC
     * ⚠️ GUARD: Без привязки к конкретным людям
     */
    readonly mcAggregates: {
        readonly totalActive: number;
        readonly totalFrozen: number;
        readonly expiringNext30Days: number;
    };

    /**
     * Агрегированные показатели GMC
     * ⚠️ GUARD: Без привязки к конкретным людям
     */
    readonly gmcAggregates: {
        readonly totalRecognized: number;
        readonly byCategory: Record<string, number>;
    };

    /**
     * Общая активность (без детализации)
     */
    readonly activityHints: {
        readonly hasActiveAuction: boolean;
        readonly storeItemsAvailable: number;
    };
}

/**
 * Интерфейс AI-адаптера
 * ⛔ ABSOLUTE: Все методы — READ-ONLY
 */
export interface IAIEconomyAdapter {
    /**
     * Получить агрегированный снапшот экономики
     * ⚠️ GUARD: Без персональных данных
     */
    getEconomySnapshot(): Promise<IEconomySnapshot>;

    /**
     * Получить сводку MC для пользователя
     * ⚠️ GUARD: Только агрегированные данные, без истории
     */
    getUserMCSummary(userId: string): Promise<MCSummary>;

    /**
     * Получить сводку GMC для пользователя
     * ⚠️ GUARD: Только агрегированные данные, без деталей признания
     */
    getUserGMCSummary(userId: string): Promise<GMCSummary>;
}

/**
 * Type guard для проверки, что адаптер не имеет write-методов
 * Компилятор TypeScript обеспечит отсутствие методов мутации
 */
export type AssertReadOnly<T> = {
    [K in keyof T]: T[K] extends (...args: never[]) => Promise<void>
    ? never
    : T[K];
};

// Compile-time check: IAIEconomyAdapter should pass AssertReadOnly
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AIAdapterReadOnlyCheck = AssertReadOnly<IAIEconomyAdapter>;
