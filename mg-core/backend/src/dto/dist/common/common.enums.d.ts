export declare enum UserRole {
    ADMIN = "admin",
    HR_MANAGER = "hr_manager",
    DEPARTMENT_HEAD = "department_head",
    BRANCH_MANAGER = "branch_manager",
    EMPLOYEE = "employee"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare enum EmployeeStatus {
    UNIVERSE = "UNIVERSE",
    STAR = "\u0417\u0432\u0435\u0437\u0434\u0430",
    FLINT_CARBON = "\u041A\u0440\u0435\u043C\u0435\u043D\u044C/\u0423\u0433\u043B\u0435\u0440\u043E\u0434",
    TOPCHIK = "\u0422\u043E\u043F\u0447\u0438\u043A",
    PHOTON = "\u0424\u043E\u0442\u043E\u043D"
}
export declare enum EmployeeRank {
    COLLECTOR = "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u0435\u0440",
    INVESTOR = "\u0418\u043D\u0432\u0435\u0441\u0442\u043E\u0440",
    MAGNATE = "\u041C\u0430\u0433\u043D\u0430\u0442"
}
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum Currency {
    MC = "MC",
    GMC = "GMC",
    RUB = "RUB"
}
export declare enum TransactionType {
    EARN = "earn",
    SPEND = "spend",
    TRANSFER = "transfer",
    REWARD = "reward",
    PENALTY = "penalty",
    AUCTION_BID = "auction_bid",
    AUCTION_WIN = "auction_win",
    STORE_PURCHASE = "store_purchase",
    SAFE_ACTIVATION = "safe_activation"
}
export declare enum InteractionLevel {
    MINIMAL = "minimal",
    MODERATE = "moderate",
    ACTIVE = "active",
    INTENSIVE = "intensive"
}
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    BAD_REQUEST = "BAD_REQUEST",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
}
export declare enum AuctionStatus {
    UPCOMING = "upcoming",
    ACTIVE = "active",
    ENDED = "ended"
}
export declare enum KPIPeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly"
}
//# sourceMappingURL=common.enums.d.ts.map