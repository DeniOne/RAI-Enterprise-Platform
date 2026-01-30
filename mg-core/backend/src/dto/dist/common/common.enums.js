"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KPIPeriod = exports.AuctionStatus = exports.ErrorCode = exports.InteractionLevel = exports.TransactionType = exports.Currency = exports.TaskPriority = exports.TaskStatus = exports.EmployeeRank = exports.EmployeeStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["HR_MANAGER"] = "hr_manager";
    UserRole["DEPARTMENT_HEAD"] = "department_head";
    UserRole["BRANCH_MANAGER"] = "branch_manager";
    UserRole["EMPLOYEE"] = "employee";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["UNIVERSE"] = "UNIVERSE";
    EmployeeStatus["STAR"] = "\u0417\u0432\u0435\u0437\u0434\u0430";
    EmployeeStatus["FLINT_CARBON"] = "\u041A\u0440\u0435\u043C\u0435\u043D\u044C/\u0423\u0433\u043B\u0435\u0440\u043E\u0434";
    EmployeeStatus["TOPCHIK"] = "\u0422\u043E\u043F\u0447\u0438\u043A";
    EmployeeStatus["PHOTON"] = "\u0424\u043E\u0442\u043E\u043D";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
var EmployeeRank;
(function (EmployeeRank) {
    EmployeeRank["COLLECTOR"] = "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u0435\u0440";
    EmployeeRank["INVESTOR"] = "\u0418\u043D\u0432\u0435\u0441\u0442\u043E\u0440";
    EmployeeRank["MAGNATE"] = "\u041C\u0430\u0433\u043D\u0430\u0442";
})(EmployeeRank || (exports.EmployeeRank = EmployeeRank = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var Currency;
(function (Currency) {
    Currency["MC"] = "MC";
    Currency["GMC"] = "GMC";
    Currency["RUB"] = "RUB";
})(Currency || (exports.Currency = Currency = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["EARN"] = "earn";
    TransactionType["SPEND"] = "spend";
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["REWARD"] = "reward";
    TransactionType["PENALTY"] = "penalty";
    TransactionType["AUCTION_BID"] = "auction_bid";
    TransactionType["AUCTION_WIN"] = "auction_win";
    TransactionType["STORE_PURCHASE"] = "store_purchase";
    TransactionType["SAFE_ACTIVATION"] = "safe_activation";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var InteractionLevel;
(function (InteractionLevel) {
    InteractionLevel["MINIMAL"] = "minimal";
    InteractionLevel["MODERATE"] = "moderate";
    InteractionLevel["ACTIVE"] = "active";
    InteractionLevel["INTENSIVE"] = "intensive";
})(InteractionLevel || (exports.InteractionLevel = InteractionLevel = {}));
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
var AuctionStatus;
(function (AuctionStatus) {
    AuctionStatus["UPCOMING"] = "upcoming";
    AuctionStatus["ACTIVE"] = "active";
    AuctionStatus["ENDED"] = "ended";
})(AuctionStatus || (exports.AuctionStatus = AuctionStatus = {}));
var KPIPeriod;
(function (KPIPeriod) {
    KPIPeriod["DAILY"] = "daily";
    KPIPeriod["WEEKLY"] = "weekly";
    KPIPeriod["MONTHLY"] = "monthly";
    KPIPeriod["QUARTERLY"] = "quarterly";
    KPIPeriod["YEARLY"] = "yearly";
})(KPIPeriod || (exports.KPIPeriod = KPIPeriod = {}));
