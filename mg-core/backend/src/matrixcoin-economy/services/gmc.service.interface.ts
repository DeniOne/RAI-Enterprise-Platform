/**
 * GMC Service Interface
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Этот файл определяет интерфейс, НЕ реализацию.
 * Реализация запрещена до STEP 2.
 * 
 * ⛔ ABSOLUTE GUARD: GMC не может быть признан AI или автоматически
 */

import type { GMCState, GMCSummary, GMCRecognitionRequest } from '../core/gmc.types';

/**
 * Интерфейс сервиса GMC
 */
export interface IGMCService {
    /**
     * Получить все GMC-записи пользователя
     * READ-ONLY операция
     */
    getGMCState(userId: string): Promise<GMCState[]>;

    /**
     * Получить агрегированную сводку GMC
     * READ-ONLY операция (можно использовать для AI)
     */
    getGMCSummary(userId: string): Promise<GMCSummary>;

    /**
     * Признать GMC
     * ⛔ ABSOLUTE GUARD: Только человек с полномочиями может признать
     * 
     * @param request - Запрос на признание с обязательным обоснованием
     */
    recognizeGMC(request: GMCRecognitionRequest): Promise<GMCState>;

    /**
     * Проверить право на признание GMC
     * ⚠️ GUARD: Возвращает false для AI-контекста
     */
    canRecognize(recognizerId: string): Promise<boolean>;
}
