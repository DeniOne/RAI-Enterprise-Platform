/**
 * Common enums for MatrixGin v2.0 API
 * Based on OpenAPI specification
 */

/**
 * User roles in the system
 */
export enum UserRole {
    /** Администратор системы */
    ADMIN = 'ADMIN',
    /** HR менеджер */
    HR_MANAGER = 'HR_MANAGER',
    /** Руководитель департамента */
    DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
    /** Управляющий филиалом */
    BRANCH_MANAGER = 'BRANCH_MANAGER',
    /** Менеджер (общий) */
    MANAGER = 'MANAGER',
    /** Менеджер производства */
    PRODUCTION_MANAGER = 'PRODUCTION_MANAGER',
    /** Сотрудник */
    EMPLOYEE = 'EMPLOYEE',
}

/**
 * User account status
 */
export enum UserStatus {
    /** Активный */
    ACTIVE = 'ACTIVE',
    /** Неактивный */
    INACTIVE = 'INACTIVE',
    /** Приостановлен */
    SUSPENDED = 'SUSPENDED',
}

/**
 * Employee status (primary hierarchy)
 */
export enum EmployeeStatus {
    /** Высший статус (основатели) */
    UNIVERSE = 'UNIVERSE',
    /** Топ-менеджмент */
    STAR = 'Звезда',
    /** Опытные сотрудники (1+ год) */
    FLINT_CARBON = 'Кремень/Углерод',
    /** Прошедшие испытательный срок */
    TOPCHIK = 'Топчик',
    /** Новички */
    PHOTON = 'Фотон',
}

/**
 * Employee rank (based on GMC)
 */
export enum EmployeeRank {
    /** 1-9 GMC */
    COLLECTOR = 'Коллекционер',
    /** 10-99 GMC */
    INVESTOR = 'Инвестор',
    /** 100+ GMC */
    MAGNATE = 'Магнат',
}

/**
 * Task status
 */
export enum TaskStatus {
    /** К выполнению */
    TODO = 'TODO',
    /** В процессе */
    IN_PROGRESS = 'IN_PROGRESS',
    /** На проверке */
    REVIEW = 'REVIEW',
    /** Завершена */
    DONE = 'DONE',
    /** В архиве */
    ARCHIVED = 'ARCHIVED',
}

/**
 * Task priority
 */
export enum TaskPriority {
    /** Низкий */
    LOW = 'LOW',
    /** Средний */
    MEDIUM = 'MEDIUM',
    /** Высокий */
    HIGH = 'HIGH',
    /** Срочный */
    URGENT = 'URGENT',
}

/**
 * Currency types
 */
export enum Currency {
    /** MatrixCoin (сгораемые) */
    MC = 'MC',
    /** Golden MatrixCoin (вечные) */
    GMC = 'GMC',
    /** Российский рубль */
    RUB = 'RUB',
}

/**
 * Transaction types
 */
export enum TransactionType {
    /** Заработок */
    EARN = 'earn',
    /** Трата */
    SPEND = 'spend',
    /** Перевод */
    TRANSFER = 'transfer',
    /** Награда */
    REWARD = 'reward',
    /** Штраф */
    PENALTY = 'penalty',
    /** Ставка на аукционе */
    AUCTION_BID = 'auction_bid',
    /** Выигрыш на аукционе */
    AUCTION_WIN = 'auction_win',
    /** Покупка в магазине */
    STORE_PURCHASE = 'store_purchase',
    /** Активация сейфа */
    SAFE_ACTIVATION = 'safe_activation',
}

/**
 * MatrixGin interaction levels with employee
 */
export enum InteractionLevel {
    /** Минимальный (опытные) */
    MINIMAL = 'minimal',
    /** Умеренный (стандарт) */
    MODERATE = 'moderate',
    /** Активный (новички) */
    ACTIVE = 'active',
    /** Интенсивный (проблемные ситуации) */
    INTENSIVE = 'intensive',
}

/**
 * API error codes
 */
export enum ErrorCode {
    /** Ошибка валидации */
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    /** Не авторизован */
    UNAUTHORIZED = 'UNAUTHORIZED',
    /** Доступ запрещен */
    FORBIDDEN = 'FORBIDDEN',
    /** Не найдено */
    NOT_FOUND = 'NOT_FOUND',
    /** Конфликт */
    CONFLICT = 'CONFLICT',
    /** Внутренняя ошибка */
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    /** Неверный запрос */
    BAD_REQUEST = 'BAD_REQUEST',
    /** Токен истек */
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    /** Недостаточно прав */
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

/**
 * Auction status
 */
export enum AuctionStatus {
    /** Предстоящий */
    UPCOMING = 'upcoming',
    /** Активный */
    ACTIVE = 'active',
    /** Завершен */
    ENDED = 'ended',
}

/**
 * KPI period types
 */
export enum KPIPeriod {
    /** Ежедневно */
    DAILY = 'daily',
    /** Еженедельно */
    WEEKLY = 'weekly',
    /** Ежемесячно */
    MONTHLY = 'monthly',
    /** Ежеквартально */
    QUARTERLY = 'quarterly',
    /** Ежегодно */
    YEARLY = 'yearly',
}
