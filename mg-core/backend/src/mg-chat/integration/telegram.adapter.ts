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

import { NormalizedTextInput, NormalizedCallbackInput } from './telegram.types';
import { detectError, ErrorContext, MGChatError } from '../errors';
import { resolveIntent } from '../intent';
import { dispatchAction } from '../dispatcher';
import { renderTelegramMessage, MGChatResponse, TelegramRenderedMessage } from '../telegram';
import { routeScenario } from '../scenarios';
import { aclMiddleware, ACLForbiddenError, ACLOutOfScopeError, AccessContext } from '../../access/mg-chat-acl';

/**
 * Process text message through Core pipeline.
 * 
 * @param input - Normalized text input from Sandbox
 * @param accessContext - Verified user context
 */
export async function processTextMessage(
    input: NormalizedTextInput,
    accessContext: AccessContext,
    context: ErrorContext = {}
): Promise<TelegramRenderedMessage> {
    // Step 1: Error UX Interceptor
    const errorResult = detectError(input.text, context);

    if (errorResult.matched && errorResult.match) {
        // Error detected → render error UX
        const errorResponse: MGChatResponse = {
            text: errorResult.match.text,
            actions: errorResult.match.actions
        };
        return renderTelegramMessage(errorResponse);
    }

    // Step 2: Intent Resolver
    const intentResult = resolveIntent(input.text);

    if (!intentResult.resolved) {
        // Intent not resolved → fallback to unknown_intent
        const fallbackResponse: MGChatResponse = {
            text: "Я не понял запрос. Могу помочь с основными вещами:",
            actions: ['my_tasks', 'my_shifts', 'my_status']
        };
        return renderTelegramMessage(fallbackResponse);
    }

    // Step 3: ACL Check
    try {
        aclMiddleware({
            intent: intentResult.intent!.intentId,
            accessContext
        });
    } catch (error) {
        // Проброс ACL ошибок как доменных ошибок MG Chat
        if (error instanceof ACLForbiddenError) {
            throw new MGChatError('ACL_FORBIDDEN');
        }
        if (error instanceof ACLOutOfScopeError) {
            throw new MGChatError('ACL_OUT_OF_SCOPE');
        }
        throw error;
    }

    // Step 4: Build response from intent via Scenario Router
    const response = await routeScenario({
        ...intentResult.intent!,
        userId: accessContext.userId // Fill real userId from access context
    });

    // Step 5: Telegram UX Renderer
    return renderTelegramMessage(response);
}

/**
 * Process callback query through Core pipeline.
 * 
 * @param input - Normalized callback input from Sandbox
 * @param accessContext - Verified user context
 */
export async function processCallback(
    input: NormalizedCallbackInput,
    accessContext: AccessContext
): Promise<TelegramRenderedMessage> {
    // Step 1: Action Dispatcher
    const dispatchResult = dispatchAction(input.actionId);

    if (dispatchResult.status === 'error') {
        // Unknown action → error UX
        const errorResponse: MGChatResponse = {
            text: `Действие не найдено: ${dispatchResult.error_code}`,
            actions: ['my_tasks', 'my_shifts']
        };
        return renderTelegramMessage(errorResponse);
    }

    // Step 2: Intent Resolver (reuse)
    const intentResult = resolveIntent(dispatchResult.intent);

    if (!intentResult.resolved) {
        // Intent not resolved → fallback
        const fallbackResponse: MGChatResponse = {
            text: "Не удалось обработать действие.",
            actions: ['my_tasks']
        };
        return renderTelegramMessage(fallbackResponse);
    }

    // Step 3: ACL Check
    try {
        aclMiddleware({
            intent: intentResult.intent!.intentId,
            accessContext
        });
    } catch (error) {
        // Проброс ACL ошибок как доменных ошибок MG Chat
        if (error instanceof ACLForbiddenError) {
            throw new MGChatError('ACL_FORBIDDEN');
        }
        if (error instanceof ACLOutOfScopeError) {
            throw new MGChatError('ACL_OUT_OF_SCOPE');
        }
        throw error;
    }

    // Step 4: Build response from intent via Scenario Router
    const response = await routeScenario({
        ...intentResult.intent!,
        userId: accessContext.userId // Fill real userId
    });

    // Step 5: Telegram UX Renderer
    return renderTelegramMessage(response);
}
