/**
 * ACL Mapping Layer — Type Definitions
 * 
 * Каноническое определение типов для контроля доступа MG Chat.
 * ACL работает по контурам (contours), не по ролям.
 */

export type ManagementContour = "employee" | "manager" | "exec";
export type AccessScope = "self" | "own_unit" | "global";

/**
 * Контекст доступа пользователя.
 * 
 * @property userId - ID пользователя
 * @property roles - роли из Auth (ACL напрямую не использует, future-proof)
 * @property contour - управленческий контур (employee/manager/exec)
 * @property scope - область доступа (self/own_unit/global)
 */
export type AccessContext = {
    userId: string;
    roles: string[];
    contour: ManagementContour;
    scope: AccessScope;
};

/**
 * Результат проверки ACL.
 */
export type ACLDecision =
    | { allowed: true }
    | { allowed: false; reason: "FORBIDDEN" | "OUT_OF_SCOPE" };

/**
 * Правило ACL Policy.
 * 
 * @property intent - exact intent или namespace wildcard (employee.*)
 * @property allowedScopes - разрешённые области доступа
 */
export type ACLPolicyRule = {
    intent: string;
    allowedScopes: AccessScope[];
};

/**
 * ACL Policy Map.
 * 
 * Массив правил по контурам. Порядок важен:
 * - exact match имеет приоритет
 * - затем namespace match
 */
export type ACLPolicy = Record<ManagementContour, ACLPolicyRule[]>;
