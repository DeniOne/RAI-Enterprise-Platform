/**
 * GMC (Golden Matrix Coin) Type Definitions
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ GUARD: GMC НЕ является:
 * - наградой
 * - бонусом
 * - призом
 * 
 * GMC не зарабатывается, а ПРИЗНАЁТСЯ.
 * GMC не сгорает, не фармится, не автоматизируется.
 */

/**
 * GMC State — стратегический статусный актив признания
 * ⚠️ GUARD: GMC фиксируется при создании и не меняется
 */
export interface GMCState {
    /** Уникальный идентификатор GMC-записи */
    readonly id: string;

    /** ID пользователя-владельца */
    readonly userId: string;

    /** Количество GMC (фиксировано после признания) */
    readonly amount: number;

    /** Дата признания GMC */
    readonly recognizedAt: Date;

    /**
     * Кто признал GMC
     * ⛔ ABSOLUTE GUARD: AI НИКОГДА не может быть recognizedBy
     */
    readonly recognizedBy: string;

    /**
     * Категория признания
     * ⚠️ GUARD: Категория фиксируется при создании, не меняется
     */
    readonly category: GMCRecognitionCategory;

    /**
     * Обоснование признания (для аудита)
     * ⚠️ GUARD: Не используется для аналитики
     */
    readonly justification: string;
}

/**
 * Категории признания GMC
 * Не иерархия, а типология вклада
 */
export type GMCRecognitionCategory =
    | 'SYSTEMIC_CONTRIBUTION'  // Системный вклад
    | 'CRISIS_RESOLUTION'      // Кризисное решение
    | 'MENTORSHIP'             // Наставничество
    | 'CULTURAL_IMPACT';       // Культурное влияние

/**
 * GMC Summary — агрегированное состояние для пользователя
 */
export interface GMCSummary {
    /** Общее количество GMC */
    readonly totalBalance: number;

    /** Распределение по категориям признания */
    readonly byCategory: Record<GMCRecognitionCategory, number>;

    /** Дата последнего признания */
    readonly lastRecognizedAt: Date | null;
}

/**
 * GMC Recognition Request — запрос на признание GMC
 * ⚠️ GUARD: Не может быть инициирован AI или автоматически
 */
export interface GMCRecognitionRequest {
    /** ID пользователя, которому признаётся GMC */
    readonly userId: string;

    /** Количество GMC */
    readonly amount: number;

    /** Категория признания */
    readonly category: GMCRecognitionCategory;

    /** 
     * Обоснование признания (обязательно)
     * ⚠️ GUARD: Минимум 50 символов
     */
    readonly justification: string;

    /**
     * Кто признаёт GMC
     * ⛔ ABSOLUTE GUARD: Должен быть человек с соответствующими полномочиями
     */
    readonly recognizedBy: string;
}
