"use strict";
/**
 * Domain Enums for BusinessCoin-Economy
 * Module 08
 *
 * ⚠️ GUARD: Все enum-значения — смысловые, не финансовые
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreEligibilityStatus = exports.StoreAccessDeniedReason = exports.MCLifecycleState = exports.MCOperationType = exports.StoreItemCategory = exports.GovernanceViolationReason = exports.GovernanceReviewLevel = exports.GovernanceRestriction = exports.GovernanceStatus = exports.GMCRecognitionTrigger = exports.GMCRecognitionDeniedReason = exports.GMCRecognitionStatus = exports.AuctionDeniedReason = exports.AuctionParticipationOutcome = exports.AuctionEventStatus = exports.EconomyCurrency = void 0;
/**
 * Типы валют в системе
 * ⚠️ GUARD: Нет RUB/USD — экономика НЕ финансовая
 */
var EconomyCurrency;
(function (EconomyCurrency) {
    EconomyCurrency["MC"] = "MC";
    EconomyCurrency["GMC"] = "GMC"; // Golden Business Coin
})(EconomyCurrency || (exports.EconomyCurrency = EconomyCurrency = {}));
/**
 * Статус аукциона
 * Аукцион — событие, не сервис
 */
var AuctionEventStatus;
(function (AuctionEventStatus) {
    AuctionEventStatus["SCHEDULED"] = "SCHEDULED";
    AuctionEventStatus["ACTIVE"] = "ACTIVE";
    AuctionEventStatus["COMPLETED"] = "COMPLETED";
    AuctionEventStatus["CANCELLED"] = "CANCELLED"; // Отменён
})(AuctionEventStatus || (exports.AuctionEventStatus = AuctionEventStatus = {}));
/**
 * Результат участия в аукционе
 * Выигрыш или Проигрыш (шанс)
 */
var AuctionParticipationOutcome;
(function (AuctionParticipationOutcome) {
    AuctionParticipationOutcome["WON"] = "WON";
    AuctionParticipationOutcome["LOST"] = "LOST"; // Проиграл (MC сгорели)
})(AuctionParticipationOutcome || (exports.AuctionParticipationOutcome = AuctionParticipationOutcome = {}));
/**
 * Причина отказа в участии в аукционе
 */
var AuctionDeniedReason;
(function (AuctionDeniedReason) {
    AuctionDeniedReason["AUCTION_CLOSED"] = "AUCTION_CLOSED";
    AuctionDeniedReason["AUCTION_NOT_STARTED"] = "AUCTION_NOT_STARTED";
    AuctionDeniedReason["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    AuctionDeniedReason["ACCESS_DENIED"] = "ACCESS_DENIED";
    AuctionDeniedReason["INVALID_CONTEXT"] = "INVALID_CONTEXT";
    AuctionDeniedReason["ALREADY_PARTICIPATED"] = "ALREADY_PARTICIPATED"; // Уже участвовал (один раз на ивент)
})(AuctionDeniedReason || (exports.AuctionDeniedReason = AuctionDeniedReason = {}));
/**
 * Статус оценки признания GMC
 */
var GMCRecognitionStatus;
(function (GMCRecognitionStatus) {
    GMCRecognitionStatus["ELIGIBLE"] = "ELIGIBLE";
    GMCRecognitionStatus["NOT_ELIGIBLE"] = "NOT_ELIGIBLE";
    GMCRecognitionStatus["DENIED"] = "DENIED"; // Отказано (нарушение условий)
})(GMCRecognitionStatus || (exports.GMCRecognitionStatus = GMCRecognitionStatus = {}));
/**
 * Причина отказа в признании GMC
 */
var GMCRecognitionDeniedReason;
(function (GMCRecognitionDeniedReason) {
    GMCRecognitionDeniedReason["AUCTION_NOT_CLOSED"] = "AUCTION_NOT_CLOSED";
    GMCRecognitionDeniedReason["NO_PARTICIPANTS"] = "NO_PARTICIPANTS";
    GMCRecognitionDeniedReason["INVALID_CONTEXT"] = "INVALID_CONTEXT";
    GMCRecognitionDeniedReason["BELOW_THRESHOLD"] = "BELOW_THRESHOLD";
    GMCRecognitionDeniedReason["MISSING_SNAPSHOT"] = "MISSING_SNAPSHOT"; // Нет снапшота MC
})(GMCRecognitionDeniedReason || (exports.GMCRecognitionDeniedReason = GMCRecognitionDeniedReason = {}));
/**
 * Триггер признания GMC
 */
var GMCRecognitionTrigger;
(function (GMCRecognitionTrigger) {
    GMCRecognitionTrigger["PROBABILISTIC_CHECK"] = "PROBABILISTIC_CHECK";
    GMCRecognitionTrigger["MANUAL_SIGNAL"] = "MANUAL_SIGNAL"; // Ручной сигнал (редкость)
})(GMCRecognitionTrigger || (exports.GMCRecognitionTrigger = GMCRecognitionTrigger = {}));
/**
 * Статус Governance-решения
 */
var GovernanceStatus;
(function (GovernanceStatus) {
    GovernanceStatus["ALLOWED"] = "ALLOWED";
    GovernanceStatus["ALLOWED_WITH_REVIEW"] = "ALLOWED_WITH_REVIEW";
    GovernanceStatus["DISALLOWED"] = "DISALLOWED"; // Запрещено правилами
})(GovernanceStatus || (exports.GovernanceStatus = GovernanceStatus = {}));
/**
 * Тип ограничения Governance
 */
var GovernanceRestriction;
(function (GovernanceRestriction) {
    GovernanceRestriction["NONE"] = "NONE";
    GovernanceRestriction["FLAG_FOR_AUDIT"] = "FLAG_FOR_AUDIT";
    GovernanceRestriction["BLOCK_OPERATION"] = "BLOCK_OPERATION"; // Блокировать операцию
})(GovernanceRestriction || (exports.GovernanceRestriction = GovernanceRestriction = {}));
/**
 * Уровень ревью
 */
var GovernanceReviewLevel;
(function (GovernanceReviewLevel) {
    GovernanceReviewLevel["NONE"] = "NONE";
    GovernanceReviewLevel["ROUTINE"] = "ROUTINE";
    GovernanceReviewLevel["ELEVATED"] = "ELEVATED";
    GovernanceReviewLevel["CRITICAL"] = "CRITICAL"; // Критическая тревога
})(GovernanceReviewLevel || (exports.GovernanceReviewLevel = GovernanceReviewLevel = {}));
/**
 * Причина нарушения Governance
 */
var GovernanceViolationReason;
(function (GovernanceViolationReason) {
    GovernanceViolationReason["ANOMALOUS_VOLUME"] = "ANOMALOUS_VOLUME";
    GovernanceViolationReason["SUSPICIOUS_FREQUENCY"] = "SUSPICIOUS_FREQUENCY";
    GovernanceViolationReason["RESTRICTED_DOMAIN"] = "RESTRICTED_DOMAIN";
    GovernanceViolationReason["SYSTEM_INVARIANT_BREACH"] = "SYSTEM_INVARIANT_BREACH";
    GovernanceViolationReason["DATA_INTEGRITY_ISSUE"] = "DATA_INTEGRITY_ISSUE"; // Проблема целостности данных
})(GovernanceViolationReason || (exports.GovernanceViolationReason = GovernanceViolationReason = {}));
/**
 * Типы объектов в Store
 * ⚠️ GUARD: Нет финансовых категорий
 */
var StoreItemCategory;
(function (StoreItemCategory) {
    StoreItemCategory["SYMBOLIC"] = "SYMBOLIC";
    StoreItemCategory["EXPERIENCE"] = "EXPERIENCE";
    StoreItemCategory["PRIVILEGE"] = "PRIVILEGE"; // Привилегии (не деньги)
})(StoreItemCategory || (exports.StoreItemCategory = StoreItemCategory = {}));
/**
 * Типы операций с MC
 * ⚠️ GUARD: Нет автоматических операций
 */
var MCOperationType;
(function (MCOperationType) {
    MCOperationType["GRANT"] = "GRANT";
    MCOperationType["TRANSFER"] = "TRANSFER";
    MCOperationType["SPEND"] = "SPEND";
    MCOperationType["EXPIRE"] = "EXPIRE";
    MCOperationType["FREEZE"] = "FREEZE";
    MCOperationType["UNFREEZE"] = "UNFREEZE"; // Разморозка (Safe)
})(MCOperationType || (exports.MCOperationType = MCOperationType = {}));
/**
 * Состояние жизненного цикла MC
 * Ref: STEP-2-STATE-LIFECYCLE.md Section 1.1
 *
 * ⚠️ GUARD:
 * - EXPIRED и SPENT — терминальные состояния (MC-INV-010)
 * - Угасание — не наказание, а естественный процесс
 */
var MCLifecycleState;
(function (MCLifecycleState) {
    MCLifecycleState["ACTIVE"] = "ACTIVE";
    MCLifecycleState["FROZEN"] = "FROZEN";
    MCLifecycleState["EXPIRED"] = "EXPIRED";
    MCLifecycleState["SPENT"] = "SPENT"; // MC использован (терминальное)
})(MCLifecycleState || (exports.MCLifecycleState = MCLifecycleState = {}));
/**
 * Причина отказа в доступе к Store
 * Ref: STEP-3-STORE-AUCTION.md
 */
var StoreAccessDeniedReason;
(function (StoreAccessDeniedReason) {
    StoreAccessDeniedReason["NO_ACTIVE_MC"] = "NO_ACTIVE_MC";
    StoreAccessDeniedReason["ALL_MC_FROZEN"] = "ALL_MC_FROZEN";
    StoreAccessDeniedReason["USER_RESTRICTED"] = "USER_RESTRICTED";
    StoreAccessDeniedReason["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
    StoreAccessDeniedReason["INVALID_CONTEXT"] = "INVALID_CONTEXT"; // Неверный контекст вызова
})(StoreAccessDeniedReason || (exports.StoreAccessDeniedReason = StoreAccessDeniedReason = {}));
/**
 * Статус элиджибилити (права на участие)
 */
var StoreEligibilityStatus;
(function (StoreEligibilityStatus) {
    StoreEligibilityStatus["ELIGIBLE"] = "ELIGIBLE";
    StoreEligibilityStatus["INELIGIBLE"] = "INELIGIBLE"; // Не может участвовать
})(StoreEligibilityStatus || (exports.StoreEligibilityStatus = StoreEligibilityStatus = {}));
