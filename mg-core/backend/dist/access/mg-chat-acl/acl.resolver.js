"use strict";
/**
 * ACL Mapping Layer — Resolver
 *
 * Чистая функция для проверки доступа к intent.
 *
 * Свойства:
 * - deterministic
 * - no side effects
 * - no DB calls
 * - no business logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveACL = resolveACL;
const acl_policy_1 = require("./acl.policy");
/**
 * Проверяет соответствие intent паттерну.
 *
 * Правила:
 * - exact match: pattern === intent
 * - namespace match: pattern.endsWith(".*") && intent.startsWith(prefix + ".")
 *
 * НЕ regex, НЕ glob, ТОЛЬКО namespace prefix match.
 *
 * @param pattern - паттерн из policy (employee.*, manager.show_team_overview)
 * @param intent - resolved intent
 * @returns true если intent соответствует паттерну
 */
function matchIntent(pattern, intent) {
    if (pattern.endsWith(".*")) {
        const prefix = pattern.slice(0, -2);
        return intent.startsWith(prefix + ".");
    }
    return pattern === intent;
}
/**
 * Находит первое подходящее правило для intent в контуре.
 *
 * Порядок обработки:
 * 1. exact match (manager.show_team_overview)
 * 2. namespace match (manager.*)
 *
 * @param rules - правила контура
 * @param intent - resolved intent
 * @returns найденное правило или undefined
 */
function findMatchingRule(rules, intent) {
    return rules.find((rule) => matchIntent(rule.intent, intent));
}
/**
 * Проверяет доступ к intent в заданном контексте.
 *
 * Алгоритм:
 * 1. Получить policy rules по context.contour
 * 2. Найти первое правило, где matchIntent(rule.intent, intent) === true
 * 3. Если правило не найдено → FORBIDDEN
 * 4. Если найдено, но context.scope не входит в allowedScopes → OUT_OF_SCOPE
 * 5. Иначе → allowed
 *
 * @param intent - resolved intent (employee.show_my_tasks)
 * @param context - контекст доступа пользователя
 * @param policy - ACL policy map (по умолчанию MG_CHAT_ACL_POLICY)
 * @returns решение ACL
 */
function resolveACL(intent, context, policy = acl_policy_1.MG_CHAT_ACL_POLICY) {
    const rules = policy[context.contour];
    if (!rules) {
        return { allowed: false, reason: "FORBIDDEN" };
    }
    const matchingRule = findMatchingRule(rules, intent);
    if (!matchingRule) {
        return { allowed: false, reason: "FORBIDDEN" };
    }
    if (!matchingRule.allowedScopes.includes(context.scope)) {
        return { allowed: false, reason: "OUT_OF_SCOPE" };
    }
    return { allowed: true };
}
