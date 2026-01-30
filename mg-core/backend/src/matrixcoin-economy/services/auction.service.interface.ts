/**
 * Auction Service Interface
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Этот файл определяет интерфейс, НЕ реализацию.
 * Реализация запрещена до STEP 3.
 * 
 * ⚠️ GUARD: Auction — событие, не сервис
 * Аукцион не работает в постоянном режиме
 */

import { AuctionEventStatus } from '../core/economy.enums';

/**
 * Auction Event — событие аукциона
 * ⚠️ GUARD: Это событие, не постоянный механизм
 */
export interface IAuctionEvent {
    readonly id: string;
    readonly title: string;
    readonly description: string;

    /** Статус события */
    readonly status: AuctionEventStatus;

    /** Количество GMC в пуле */
    readonly gmcPool: number;

    /** Минимальная ставка MC */
    readonly minimumBid: number;

    /** Когда начинается */
    readonly startsAt: Date;

    /** Когда заканчивается */
    readonly endsAt: Date;

    /** 
     * ⚠️ GUARD: Аукцион не гарантирует результат
     * Победитель определяется событийно, не алгоритмически
     */
    readonly winnerId: string | null;
}

/**
 * Интерфейс Auction-сервиса
 * ⚠️ GUARD: Это НЕ постоянный API, а обработчик событий
 */
export interface IAuctionService {
    /**
     * Получить активные события аукциона
     * READ-ONLY операция
     * ⚠️ GUARD: Обычно список пуст — аукционы редки
     */
    getActiveEvents(): Promise<IAuctionEvent[]>;

    /**
     * Получить событие по ID
     * READ-ONLY операция
     */
    getEvent(eventId: string): Promise<IAuctionEvent | null>;

    /**
     * Сделать ставку
     * ⚠️ GUARD: Только активные события, только человек
     * 
     * @param eventId - ID события аукциона
     * @param userId - Кто делает ставку
     * @param mcAmount - Количество MC
     * @param initiatedBy - Кто инициировал (должен быть человек)
     */
    placeBid(
        eventId: string,
        userId: string,
        mcAmount: number,
        initiatedBy: string
    ): Promise<void>;

    /**
     * Завершить событие аукциона
     * ⚠️ GUARD: Только администратор, не автоматически
     * 
     * @param eventId - ID события
     * @param completedBy - Кто завершил (администратор)
     */
    completeEvent(
        eventId: string,
        completedBy: string
    ): Promise<void>;
}
