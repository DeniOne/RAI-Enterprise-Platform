/**
 * MG Chat Message Handler Example
 * 
 * Demonstrates the complete flow:
 * 1. Error UX Interceptor (Step 3)
 * 2. Intent Resolver (Step 2)
 * 3. Response handling
 */

import { detectError, ErrorContext } from './errors';
import { resolveIntent } from './intent';

/**
 * Handle incoming user message.
 * 
 * This is a reference implementation showing the integration
 * of Error UX Interceptor and Intent Resolver.
 */
export async function handleMessage(
    message: string,
    context: ErrorContext = {}
): Promise<{ text: string; actions: string[] }> {

    // =========================================================================
    // STEP 1: Error UX Interception (BEFORE intent resolution)
    // =========================================================================

    const errorResult = detectError(message, context);

    if (errorResult.matched && errorResult.match) {
        // Error detected → return error UX response (STOP here)
        console.log(`[MG Chat] Error detected: ${errorResult.match.errorId}`);

        return {
            text: errorResult.match.text,
            actions: errorResult.match.actions
        };
    }

    // =========================================================================
    // STEP 2: Intent Resolution (normal flow)
    // =========================================================================

    const intentResult = resolveIntent(message);

    if (!intentResult.resolved) {
        // Low confidence or no match → fallback to unknown_intent
        console.log(`[MG Chat] Intent not resolved: ${intentResult.reason}`);

        return {
            text: "Я не понял запрос. Могу помочь с основными вещами:",
            actions: ['my_tasks', 'my_shifts', 'my_status']
        };
    }

    // =========================================================================
    // STEP 3: Intent Handling (TODO: Step 4 - Response Builder)
    // =========================================================================

    console.log(`[MG Chat] Intent resolved: ${intentResult.intent!.intentId}`);

    // TODO: Route to Response Builder
    // For now, return placeholder
    return {
        text: `Intent: ${intentResult.intent!.intentId}`,
        actions: []
    };
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/*
// Example 1: Normal message
const response1 = await handleMessage("что у меня сегодня");
// → Intent resolved: get_my_day

// Example 2: Empty message (error intercepted)
const response2 = await handleMessage("");
// → Error detected: empty_message
// → { text: "Я не получил сообщение. Хочешь продолжить?", actions: [...] }

// Example 3: Aggression (error intercepted)
const response3 = await handleMessage("ты тупой бот");
// → Error detected: aggression_detected
// → { text: "Понимаю, что сейчас напряжённо. Давай попробуем спокойно разобраться.", actions: [...] }

// Example 4: Spam (error intercepted with context)
const context: ErrorContext = {
    recentMessages: ["привет", "привет", "привет"]
};
const response4 = await handleMessage("привет", context);
// → Error detected: spam_repetition
// → { text: "Кажется, мы зациклились. Как лучше продолжить?", actions: [...] }
*/
