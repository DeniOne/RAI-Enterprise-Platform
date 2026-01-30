"use strict";
/**
 * ACL Mapping Layer — Middleware
 *
 * Integration point между Intent Resolution и Scenario Execution.
 *
 * Канонический поток:
 * Telegram / HTTP
 *    ↓
 * MG Chat Core
 *    ↓
 * Intent resolved (string)
 *    ↓
 * ACL Middleware  ✅ ВОТ ЗДЕСЬ
 *    ↓
 * Scenario Execution
 *    ↓
 * Backend services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACLOutOfScopeError = exports.ACLForbiddenError = void 0;
exports.aclMiddleware = aclMiddleware;
const acl_resolver_1 = require("./acl.resolver");
/**
 * Доменные ошибки ACL.
 * Эти ошибки ловятся выше и уходят в Error UX Interceptor.
 */
class ACLForbiddenError extends Error {
    constructor(intent, contour) {
        super(`ACL_FORBIDDEN: intent "${intent}" not allowed for contour "${contour}"`);
        this.name = "ACLForbiddenError";
    }
}
exports.ACLForbiddenError = ACLForbiddenError;
class ACLOutOfScopeError extends Error {
    constructor(intent, scope) {
        super(`ACL_OUT_OF_SCOPE: intent "${intent}" not allowed for scope "${scope}"`);
        this.name = "ACLOutOfScopeError";
    }
}
exports.ACLOutOfScopeError = ACLOutOfScopeError;
/**
 * ACL Middleware.
 *
 * Проверяет доступ к intent в заданном контексте.
 *
 * Поведение:
 * - если allowed === true → пропускает дальше (void)
 * - если allowed === false → бросает доменную ошибку (never)
 *
 * Middleware НЕ форматирует ответ.
 * Ошибка ловится выше и уходит в Error UX Interceptor.
 *
 * @param input - intent и контекст доступа
 * @throws {ACLForbiddenError} если intent не разрешён для контура
 * @throws {ACLOutOfScopeError} если intent не разрешён для scope
 */
function aclMiddleware(input) {
    const { intent, accessContext } = input;
    const decision = (0, acl_resolver_1.resolveACL)(intent, accessContext);
    if (!decision.allowed) {
        if (decision.reason === "FORBIDDEN") {
            throw new ACLForbiddenError(intent, accessContext.contour);
        }
        if (decision.reason === "OUT_OF_SCOPE") {
            throw new ACLOutOfScopeError(intent, accessContext.scope);
        }
    }
    // allowed === true → пропускаем дальше
}
