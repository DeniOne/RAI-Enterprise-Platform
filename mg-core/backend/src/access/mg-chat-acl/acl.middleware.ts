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

import { AccessContext } from "./acl.types";
import { resolveACL } from "./acl.resolver";

/**
 * Доменные ошибки ACL.
 * Эти ошибки ловятся выше и уходят в Error UX Interceptor.
 */
export class ACLForbiddenError extends Error {
    constructor(intent: string, contour: string) {
        super(`ACL_FORBIDDEN: intent "${intent}" not allowed for contour "${contour}"`);
        this.name = "ACLForbiddenError";
    }
}

export class ACLOutOfScopeError extends Error {
    constructor(intent: string, scope: string) {
        super(`ACL_OUT_OF_SCOPE: intent "${intent}" not allowed for scope "${scope}"`);
        this.name = "ACLOutOfScopeError";
    }
}

/**
 * Входные данные для ACL middleware.
 */
export type ACLMiddlewareInput = {
    intent: string;
    accessContext: AccessContext;
};

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
export function aclMiddleware(input: ACLMiddlewareInput): void {
    const { intent, accessContext } = input;

    const decision = resolveACL(intent, accessContext);

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
