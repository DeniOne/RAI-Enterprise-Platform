/**
 * Domain Enums for MatrixCoin-Economy
 * Module 08
 * 
 * ⚠️ GUARD: Все enum-значения — смысловые, не финансовые
 */

/** 
 * Типы валют в системе
 * ⚠️ GUARD: Нет RUB/USD — экономика НЕ финансовая
 */
export enum EconomyCurrency {
    MC = 'MC',   // Matrix Coin
    GMC = 'GMC'  // Golden Matrix Coin
}

/**
 * Статус аукциона
 * Аукцион — событие, не сервис
 */
export enum AuctionEventStatus {
    SCHEDULED = 'SCHEDULED',  // Запланирован
    ACTIVE = 'ACTIVE',        // Активен (редкое состояние)
    COMPLETED = 'COMPLETED',  // Завершён
    CANCELLED = 'CANCELLED'   // Отменён
}

/**
 * Результат участия в аукционе
 * Выигрыш или Проигрыш (шанс)
 */
export enum AuctionParticipationOutcome {
    WON = 'WON',       // Выиграл
    LOST = 'LOST'      // Проиграл (MC сгорели)
}

/**
 * Причина отказа в участии в аукционе
 */
export enum AuctionDeniedReason {
    AUCTION_CLOSED = 'AUCTION_CLOSED',         // Аукцион закрыт
    AUCTION_NOT_STARTED = 'AUCTION_NOT_STARTED', // Аукцион еще не начался
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',   // Недостаточно MC (после фильтрации)
    ACCESS_DENIED = 'ACCESS_DENIED',             // Отказано в доступе к Store (Store logic block)
    INVALID_CONTEXT = 'INVALID_CONTEXT',         // Неверный контекст
    ALREADY_PARTICIPATED = 'ALREADY_PARTICIPATED' // Уже участвовал (один раз на ивент)
}

/**
 * Статус оценки признания GMC
 */
export enum GMCRecognitionStatus {
    ELIGIBLE = 'ELIGIBLE',         // Подходит для признания (сигнал)
    NOT_ELIGIBLE = 'NOT_ELIGIBLE', // Не подходит (обычный результат)
    DENIED = 'DENIED'              // Отказано (нарушение условий)
}

/**
 * Причина отказа в признании GMC
 */
export enum GMCRecognitionDeniedReason {
    AUCTION_NOT_CLOSED = 'AUCTION_NOT_CLOSED',     // Аукцион не закрыт
    NO_PARTICIPANTS = 'NO_PARTICIPANTS',           // Нет участников
    INVALID_CONTEXT = 'INVALID_CONTEXT',           // Неверный контекст
    BELOW_THRESHOLD = 'BELOW_THRESHOLD',           // Не прошел порог вероятности
    MISSING_SNAPSHOT = 'MISSING_SNAPSHOT'          // Нет снапшота MC
}

/**
 * Триггер признания GMC
 */
export enum GMCRecognitionTrigger {
    PROBABILISTIC_CHECK = 'PROBABILISTIC_CHECK',   // Вероятностная проверка
    MANUAL_SIGNAL = 'MANUAL_SIGNAL'                // Ручной сигнал (редкость)
}

/**
 * Статус Governance-решения
 */
export enum GovernanceStatus {
    ALLOWED = 'ALLOWED',                 // Разрешено
    ALLOWED_WITH_REVIEW = 'ALLOWED_WITH_REVIEW', // Разрешено, но требует ревью
    DISALLOWED = 'DISALLOWED'            // Запрещено правилами
}

/**
 * Тип ограничения Governance
 */
export enum GovernanceRestriction {
    NONE = 'NONE',
    FLAG_FOR_AUDIT = 'FLAG_FOR_AUDIT',   // Пометить для аудита
    BLOCK_OPERATION = 'BLOCK_OPERATION'  // Блокировать операцию
}

/**
 * Уровень ревью
 */
export enum GovernanceReviewLevel {
    NONE = 'NONE',
    ROUTINE = 'ROUTINE',       // Обычная проверка
    ELEVATED = 'ELEVATED',     // Проверка старшим
    CRITICAL = 'CRITICAL'      // Критическая тревога
}

/**
 * Причина нарушения Governance
 */
export enum GovernanceViolationReason {
    ANOMALOUS_VOLUME = 'ANOMALOUS_VOLUME',       // Аномальный объем MC
    SUSPICIOUS_FREQUENCY = 'SUSPICIOUS_FREQUENCY', // Подозрительная частота
    RESTRICTED_DOMAIN = 'RESTRICTED_DOMAIN',     // Недопустимая область применения
    SYSTEM_INVARIANT_BREACH = 'SYSTEM_INVARIANT_BREACH', // Попытка обхода инварианта
    DATA_INTEGRITY_ISSUE = 'DATA_INTEGRITY_ISSUE' // Проблема целостности данных
}

/**
 * Типы объектов в Store
 * ⚠️ GUARD: Нет финансовых категорий
 */
export enum StoreItemCategory {
    SYMBOLIC = 'SYMBOLIC',       // Символические ценности
    EXPERIENCE = 'EXPERIENCE',   // Опыт, события
    PRIVILEGE = 'PRIVILEGE'      // Привилегии (не деньги)
}

/**
 * Типы операций с MC
 * ⚠️ GUARD: Нет автоматических операций
 */
export enum MCOperationType {
    GRANT = 'GRANT',       // Начисление (ручное)
    TRANSFER = 'TRANSFER', // Передача (между людьми)
    SPEND = 'SPEND',       // Трата (Store/Auction)
    EXPIRE = 'EXPIRE',     // Истечение (не наказание)
    FREEZE = 'FREEZE',     // Заморозка (Safe)
    UNFREEZE = 'UNFREEZE'  // Разморозка (Safe)
}

/**
 * Состояние жизненного цикла MC
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.1
 * 
 * ⚠️ GUARD: 
 * - EXPIRED и SPENT — терминальные состояния (MC-INV-010)
 * - Угасание — не наказание, а естественный процесс
 */
export enum MCLifecycleState {
    ACTIVE = 'ACTIVE',     // MC активен
    FROZEN = 'FROZEN',     // MC заморожен в Safe
    EXPIRED = 'EXPIRED',   // MC истёк (терминальное)
    SPENT = 'SPENT'        // MC использован (терминальное)
}

/**
 * Причина отказа в доступе к Store
 * Ref: STEP-3-STORE-AUCTION.md
 */
export enum StoreAccessDeniedReason {
    NO_ACTIVE_MC = 'NO_ACTIVE_MC',             // Нет активных MC
    ALL_MC_FROZEN = 'ALL_MC_FROZEN',           // Все MC заморожены
    USER_RESTRICTED = 'USER_RESTRICTED',       // Пользователь ограничен
    SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE', // Технические работы
    INVALID_CONTEXT = 'INVALID_CONTEXT'        // Неверный контекст вызова
}

/**
 * Статус элиджибилити (права на участие)
 */
export enum StoreEligibilityStatus {
    ELIGIBLE = 'ELIGIBLE',     // Может участвовать
    INELIGIBLE = 'INELIGIBLE'  // Не может участвовать
}
