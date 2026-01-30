/**
 * MC Service Interface
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Этот файл определяет интерфейс, НЕ реализацию.
 * Реализация запрещена до STEP 2.
 * 
 * ⚠️ GUARD: Все методы требуют человеческого действия, нет auto-методов
 */

import type { MCState, MCSummary, MCSourceType } from '../core/mc.types';

/**
 * Интерфейс сервиса MC
 */
export interface IMCService {
    /**
     * Получить все MC-записи пользователя
     * READ-ONLY операция
     */
    getMCState(userId: string): Promise<MCState[]>;

    /**
     * Получить агрегированную сводку MC
     * READ-ONLY операция (можно использовать для AI)
     */
    getMCSummary(userId: string): Promise<MCSummary>;

    /**
     * Ручное начисление MC
     * ⚠️ GUARD: Требует grantedBy (человек), sourceType не может быть AUTO
     * 
     * @param userId - Получатель
     * @param amount - Количество
     * @param grantedBy - Кто начислил (ОБЯЗАТЕЛЬНО человек)
     * @param sourceType - Источник (ЗАПРЕЩЕНЫ: AUTO, CRON, AI, SYSTEM)
     * @param sourceId - ID источника для аудита
     * @param expiresAt - Дата истечения (ОБЯЗАТЕЛЬНО)
     */
    grantMC(
        userId: string,
        amount: number,
        grantedBy: string,
        sourceType: MCSourceType,
        sourceId: string,
        expiresAt: Date
    ): Promise<MCState>;

    /**
     * Заморозить MC в Safe
     * Осознанный выбор пользователя
     */
    freezeToSafe(userId: string, mcIds: string[]): Promise<void>;

    /**
     * Разморозить MC из Safe
     */
    unfreezeFromSafe(userId: string, mcIds: string[]): Promise<void>;

    /**
     * Передать MC другому пользователю
     * ⚠️ GUARD: Требует явного действия пользователя
     */
    transferMC(
        fromUserId: string,
        toUserId: string,
        mcIds: string[],
        reason: string
    ): Promise<void>;

    /**
     * Потратить MC (Store/Auction)
     * ⚠️ GUARD: Вызывается только через Store/Auction сервисы
     */
    spendMC(
        userId: string,
        mcIds: string[],
        spentBy: string,
        context: 'STORE' | 'AUCTION',
        contextId: string
    ): Promise<void>;
}
