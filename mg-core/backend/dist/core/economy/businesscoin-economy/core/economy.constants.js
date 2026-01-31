"use strict";
/**
 * CANONICAL CONSTRAINTS — BusinessCoin-Economy
 * Module 08
 *
 * ⛔ IMMUTABLE: Эти константы не подлежат изменению без нового MPP-цикла
 *
 * Любое нарушение = BLOCKED реализация
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUCTION_CONSTRAINTS = exports.STORE_CONSTRAINTS = exports.AUTOMATION_CONSTRAINTS = exports.AI_CONSTRAINTS = exports.GMC_CONSTRAINTS = exports.MC_CONSTRAINTS = void 0;
/**
 * MC Lifecycle Constants
 */
exports.MC_CONSTRAINTS = {
    /** MC не имеет фиксированного денежного эквивалента */
    HAS_MONETARY_EQUIVALENT: false,
    /** MC обязан иметь срок жизни */
    REQUIRES_EXPIRATION: true,
    /** Максимальный TTL в днях (не бесконечность) */
    MAX_TTL_DAYS: 365,
    /** Минимальный TTL в днях */
    MIN_TTL_DAYS: 30,
    /** MC не связан с KPI */
    LINKED_TO_KPI: false,
    /** MC не является зарплатой */
    IS_SALARY: false,
};
/**
 * GMC Constraints
 */
exports.GMC_CONSTRAINTS = {
    /** GMC не сгорает */
    CAN_EXPIRE: false,
    /** GMC не фармится */
    CAN_BE_FARMED: false,
    /** GMC не автоматизируется */
    CAN_BE_AUTO_GRANTED: false,
    /** GMC не конвертируется в деньги */
    CAN_CONVERT_TO_MONEY: false,
    /** Минимальная длина обоснования признания */
    MIN_JUSTIFICATION_LENGTH: 50,
    /** GMC не является наградой */
    IS_REWARD: false,
};
/**
 * AI Integration Constraints
 * ⛔ ABSOLUTE: Любое нарушение = архитектурная ошибка
 */
exports.AI_CONSTRAINTS = {
    /** AI имеет только read-access */
    HAS_WRITE_ACCESS: false,
    /** AI не инициирует события */
    CAN_INITIATE_EVENTS: false,
    /** AI не имеет доступа к персональным данным */
    HAS_PERSONAL_DATA_ACCESS: false,
    /** AI получает только агрегированные снапшоты */
    DATA_ACCESS_TYPE: 'AGGREGATED_SNAPSHOT_ONLY',
    /** AI не участвует в Store */
    CAN_INTERACT_WITH_STORE: false,
    /** AI не участвует в Auction */
    CAN_PARTICIPATE_IN_AUCTION: false,
    /** AI не может признавать GMC */
    CAN_RECOGNIZE_GMC: false,
};
/**
 * Automation Constraints
 */
exports.AUTOMATION_CONSTRAINTS = {
    /** Нет cron-начислений */
    ALLOW_CRON_ACCRUAL: false,
    /** Нет авто-триггеров */
    ALLOW_AUTO_TRIGGERS: false,
    /** Все изменения требуют человеческого действия */
    REQUIRES_HUMAN_ACTION: true,
    /** Нет self-loop механизмов */
    ALLOW_SELF_LOOP: false,
};
/**
 * Store Constraints
 */
exports.STORE_CONSTRAINTS = {
    /** Store не интегрируется с Finance */
    INTEGRATE_WITH_FINANCE: false,
    /** Store не интегрируется с KPI */
    INTEGRATE_WITH_KPI: false,
    /** Store не участвует в аналитике поведения */
    PARTICIPATE_IN_BEHAVIOR_ANALYTICS: false,
};
/**
 * Auction Constraints
 */
exports.AUCTION_CONSTRAINTS = {
    /** Auction существует только как событие */
    IS_SERVICE: false,
    /** Auction не имеет постоянного API */
    HAS_PERMANENT_API: false,
    /** Auction не гарантирует результат */
    GUARANTEES_RESULT: false,
};
