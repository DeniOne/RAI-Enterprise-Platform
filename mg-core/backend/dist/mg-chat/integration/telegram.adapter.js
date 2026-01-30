"use strict";
/**
 * Telegram Core Adapter
 *
 * Orchestrates Core pipeline execution.
 *
 * WHY THIS EXISTS:
 * - Glue between normalized input and Core pipeline
 * - Enforces correct pipeline order
 * - NO business logic, ONLY orchestration
 *
 * RULES:
 * - NO skipping steps
 * - NO combining branches
 * - NO decision making
 * - ONLY call Core functions in order
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTextMessage = processTextMessage;
exports.processCallback = processCallback;
const errors_1 = require("../errors");
const intent_1 = require("../intent");
const dispatcher_1 = require("../dispatcher");
const telegram_1 = require("../telegram");
const scenarios_1 = require("../scenarios");
const mg_chat_acl_1 = require("../../access/mg-chat-acl");
/**
 * Process text message through Core pipeline.
 *
 * @param input - Normalized text input from Sandbox
 * @param accessContext - Verified user context
 */
async function processTextMessage(input, accessContext, context = {}) {
    // Step 1: Error UX Interceptor
    const errorResult = (0, errors_1.detectError)(input.text, context);
    if (errorResult.matched && errorResult.match) {
        // Error detected → render error UX
        const errorResponse = {
            text: errorResult.match.text,
            actions: errorResult.match.actions
        };
        return (0, telegram_1.renderTelegramMessage)(errorResponse);
    }
    // Step 2: Intent Resolver
    const intentResult = (0, intent_1.resolveIntent)(input.text);
    if (!intentResult.resolved) {
        // Intent not resolved → fallback to unknown_intent
        const fallbackResponse = {
            text: "Я не понял запрос. Могу помочь с основными вещами:",
            actions: ['my_tasks', 'my_shifts', 'my_status']
        };
        return (0, telegram_1.renderTelegramMessage)(fallbackResponse);
    }
    // Step 3: ACL Check
    try {
        (0, mg_chat_acl_1.aclMiddleware)({
            intent: intentResult.intent.intentId,
            accessContext
        });
    }
    catch (error) {
        // Проброс ACL ошибок как доменных ошибок MG Chat
        if (error instanceof mg_chat_acl_1.ACLForbiddenError) {
            throw new errors_1.MGChatError('ACL_FORBIDDEN');
        }
        if (error instanceof mg_chat_acl_1.ACLOutOfScopeError) {
            throw new errors_1.MGChatError('ACL_OUT_OF_SCOPE');
        }
        throw error;
    }
    // Step 4: Build response from intent via Scenario Router
    const response = await (0, scenarios_1.routeScenario)({
        ...intentResult.intent,
        userId: accessContext.userId // Fill real userId from access context
    });
    // Step 5: Telegram UX Renderer
    return (0, telegram_1.renderTelegramMessage)(response);
}
/**
 * Process callback query through Core pipeline.
 *
 * @param input - Normalized callback input from Sandbox
 * @param accessContext - Verified user context
 */
async function processCallback(input, accessContext) {
    // Step 1: Action Dispatcher
    const dispatchResult = (0, dispatcher_1.dispatchAction)(input.actionId);
    if (dispatchResult.status === 'error') {
        // Unknown action → error UX
        const errorResponse = {
            text: `Действие не найдено: ${dispatchResult.error_code}`,
            actions: ['my_tasks', 'my_shifts']
        };
        return (0, telegram_1.renderTelegramMessage)(errorResponse);
    }
    // Step 2: Intent Resolver (reuse)
    const intentResult = (0, intent_1.resolveIntent)(dispatchResult.intent);
    if (!intentResult.resolved) {
        // Intent not resolved → fallback
        const fallbackResponse = {
            text: "Не удалось обработать действие.",
            actions: ['my_tasks']
        };
        return (0, telegram_1.renderTelegramMessage)(fallbackResponse);
    }
    // Step 3: ACL Check
    try {
        (0, mg_chat_acl_1.aclMiddleware)({
            intent: intentResult.intent.intentId,
            accessContext
        });
    }
    catch (error) {
        // Проброс ACL ошибок как доменных ошибок MG Chat
        if (error instanceof mg_chat_acl_1.ACLForbiddenError) {
            throw new errors_1.MGChatError('ACL_FORBIDDEN');
        }
        if (error instanceof mg_chat_acl_1.ACLOutOfScopeError) {
            throw new errors_1.MGChatError('ACL_OUT_OF_SCOPE');
        }
        throw error;
    }
    // Step 4: Build response from intent via Scenario Router
    const response = await (0, scenarios_1.routeScenario)({
        ...intentResult.intent,
        userId: accessContext.userId // Fill real userId
    });
    // Step 5: Telegram UX Renderer
    return (0, telegram_1.renderTelegramMessage)(response);
}
