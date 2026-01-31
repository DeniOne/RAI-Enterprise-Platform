"use strict";
/**
 * Common enums for BusinessCore v2.0 API
 * Based on OpenAPI specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KPIPeriod = exports.AuctionStatus = exports.ErrorCode = exports.InteractionLevel = exports.TransactionType = exports.Currency = exports.TaskPriority = exports.TaskStatus = exports.EmployeeRank = exports.EmployeeStatus = exports.UserStatus = exports.UserRole = void 0;
/**
 * User roles in the system
 */
var UserRole;
(function (UserRole) {
    /** Администратор системы */
    UserRole["ADMIN"] = "ADMIN";
    /** HR менеджер */
    UserRole["HR_MANAGER"] = "HR_MANAGER";
    /** Руководитель департамента */
    UserRole["DEPARTMENT_HEAD"] = "DEPARTMENT_HEAD";
    /** Управляющий филиалом */
    UserRole["BRANCH_MANAGER"] = "BRANCH_MANAGER";
    /** Менеджер (общий) */
    UserRole["MANAGER"] = "MANAGER";
    /** Менеджер производства */
    UserRole["PRODUCTION_MANAGER"] = "PRODUCTION_MANAGER";
    /** Сотрудник */
    UserRole["EMPLOYEE"] = "EMPLOYEE";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * User account status
 */
var UserStatus;
(function (UserStatus) {
    /** Активный */
    UserStatus["ACTIVE"] = "ACTIVE";
    /** Неактивный */
    UserStatus["INACTIVE"] = "INACTIVE";
    /** Приостановлен */
    UserStatus["SUSPENDED"] = "SUSPENDED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
/**
 * Employee status (primary hierarchy)
 */
var EmployeeStatus;
(function (EmployeeStatus) {
    /** Высший статус (основатели) */
    EmployeeStatus["UNIVERSE"] = "UNIVERSE";
    /** Топ-менеджмент */
    EmployeeStatus["STAR"] = "\u0417\u0432\u0435\u0437\u0434\u0430";
    /** Опытные сотрудники (1+ год) */
    EmployeeStatus["FLINT_CARBON"] = "\u041A\u0440\u0435\u043C\u0435\u043D\u044C/\u0423\u0433\u043B\u0435\u0440\u043E\u0434";
    /** Прошедшие испытательный срок */
    EmployeeStatus["TOPCHIK"] = "\u0422\u043E\u043F\u0447\u0438\u043A";
    /** Новички */
    EmployeeStatus["PHOTON"] = "\u0424\u043E\u0442\u043E\u043D";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
/**
 * Employee rank (based on GMC)
 */
var EmployeeRank;
(function (EmployeeRank) {
    /** 1-9 GMC */
    EmployeeRank["COLLECTOR"] = "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u0435\u0440";
    /** 10-99 GMC */
    EmployeeRank["INVESTOR"] = "\u0418\u043D\u0432\u0435\u0441\u0442\u043E\u0440";
    /** 100+ GMC */
    EmployeeRank["MAGNATE"] = "\u041C\u0430\u0433\u043D\u0430\u0442";
})(EmployeeRank || (exports.EmployeeRank = EmployeeRank = {}));
/**
 * Task status
 */
var TaskStatus;
(function (TaskStatus) {
    /** К выполнению */
    TaskStatus["TODO"] = "TODO";
    /** В процессе */
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    /** На проверке */
    TaskStatus["REVIEW"] = "REVIEW";
    /** Завершена */
    TaskStatus["DONE"] = "DONE";
    /** В архиве */
    TaskStatus["ARCHIVED"] = "ARCHIVED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
/**
 * Task priority
 */
var TaskPriority;
(function (TaskPriority) {
    /** Низкий */
    TaskPriority["LOW"] = "LOW";
    /** Средний */
    TaskPriority["MEDIUM"] = "MEDIUM";
    /** Высокий */
    TaskPriority["HIGH"] = "HIGH";
    /** Срочный */
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
/**
 * Currency types
 */
var Currency;
(function (Currency) {
    /** BusinessCoin (сгораемые) */
    Currency["MC"] = "MC";
    /** Golden BusinessCoin (вечные) */
    Currency["GMC"] = "GMC";
    /** Российский рубль */
    Currency["RUB"] = "RUB";
})(Currency || (exports.Currency = Currency = {}));
/**
 * Transaction types
 */
var TransactionType;
(function (TransactionType) {
    /** Заработок */
    TransactionType["EARN"] = "earn";
    /** Трата */
    TransactionType["SPEND"] = "spend";
    /** Перевод */
    TransactionType["TRANSFER"] = "transfer";
    /** Награда */
    TransactionType["REWARD"] = "reward";
    /** Штраф */
    TransactionType["PENALTY"] = "penalty";
    /** Ставка на аукционе */
    TransactionType["AUCTION_BID"] = "auction_bid";
    /** Выигрыш на аукционе */
    TransactionType["AUCTION_WIN"] = "auction_win";
    /** Покупка в магазине */
    TransactionType["STORE_PURCHASE"] = "store_purchase";
    /** Активация сейфа */
    TransactionType["SAFE_ACTIVATION"] = "safe_activation";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
/**
 * BusinessCore interaction levels with employee
 */
var InteractionLevel;
(function (InteractionLevel) {
    /** Минимальный (опытные) */
    InteractionLevel["MINIMAL"] = "minimal";
    /** Умеренный (стандарт) */
    InteractionLevel["MODERATE"] = "moderate";
    /** Активный (новички) */
    InteractionLevel["ACTIVE"] = "active";
    /** Интенсивный (проблемные ситуации) */
    InteractionLevel["INTENSIVE"] = "intensive";
})(InteractionLevel || (exports.InteractionLevel = InteractionLevel = {}));
/**
 * API error codes
 */
var ErrorCode;
(function (ErrorCode) {
    /** Ошибка валидации */
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    /** Не авторизован */
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    /** Доступ запрещен */
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    /** Не найдено */
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    /** Конфликт */
    ErrorCode["CONFLICT"] = "CONFLICT";
    /** Внутренняя ошибка */
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    /** Неверный запрос */
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    /** Токен истек */
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    /** Недостаточно прав */
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Auction status
 */
var AuctionStatus;
(function (AuctionStatus) {
    /** Предстоящий */
    AuctionStatus["UPCOMING"] = "upcoming";
    /** Активный */
    AuctionStatus["ACTIVE"] = "active";
    /** Завершен */
    AuctionStatus["ENDED"] = "ended";
})(AuctionStatus || (exports.AuctionStatus = AuctionStatus = {}));
/**
 * KPI period types
 */
var KPIPeriod;
(function (KPIPeriod) {
    /** Ежедневно */
    KPIPeriod["DAILY"] = "daily";
    /** Еженедельно */
    KPIPeriod["WEEKLY"] = "weekly";
    /** Ежемесячно */
    KPIPeriod["MONTHLY"] = "monthly";
    /** Ежеквартально */
    KPIPeriod["QUARTERLY"] = "quarterly";
    /** Ежегодно */
    KPIPeriod["YEARLY"] = "yearly";
})(KPIPeriod || (exports.KPIPeriod = KPIPeriod = {}));
