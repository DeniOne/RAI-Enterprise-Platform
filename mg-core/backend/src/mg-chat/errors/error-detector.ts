/**
 * Error Detector
 * 
 * Detects error conditions in user input using deterministic heuristics.
 * NO ML, NO external libs, NO side effects.
 */

import { ErrorDetectionResult, ErrorContext } from './error.types';
import { routeError } from './error-router';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SPAM_THRESHOLD = 3; // Same message repeated >= 3 times
const FLOOD_THRESHOLD = 5; // Messages per minute
const FLOOD_WINDOW_MS = 60 * 1000; // 1 minute

// Simple profanity/aggression wordlist (Russian)
const AGGRESSION_KEYWORDS = [
    'тупой', 'идиот', 'дурак', 'урод', 'мразь', 'гавно',
    'сука', 'блять', 'хуй', 'пиздец', 'ебать'
];

// Emotional overload phrases
const EMOTIONAL_OVERLOAD_PHRASES = [
    'не вывожу', 'очень тяжело', 'не могу больше', 'устал',
    'перегруз', 'выгорел', 'сил нет'
];

// =============================================================================
// DETECTOR
// =============================================================================

/**
 * Detect error conditions in user message.
 * 
 * @param message - User input text
 * @param context - Session-level context (optional)
 * @returns Detection result with error match or null
 */
export function detectError(
    message: string,
    context: ErrorContext = {}
): ErrorDetectionResult {
    // 1. Empty message
    if (message.trim().length === 0) {
        return {
            matched: true,
            match: routeError('empty_message')
        };
    }

    const normalizedMessage = message.toLowerCase().trim();

    // 2. Spam repetition (same message >= 3 times)
    if (context.recentMessages && context.recentMessages.length > 0) {
        const count = context.recentMessages.filter(
            msg => msg.toLowerCase().trim() === normalizedMessage
        ).length;

        if (count >= SPAM_THRESHOLD) {
            return {
                matched: true,
                match: routeError('spam_repetition')
            };
        }
    }

    // 3. Flooding (messages per minute > threshold)
    if (context.messageTimestamps && context.messageTimestamps.length > 0) {
        const now = Date.now();
        const recentCount = context.messageTimestamps.filter(
            ts => now - ts < FLOOD_WINDOW_MS
        ).length;

        if (recentCount > FLOOD_THRESHOLD) {
            return {
                matched: true,
                match: routeError('flooding')
            };
        }
    }

    // 4. Aggression detection (profanity wordlist)
    const hasAggression = AGGRESSION_KEYWORDS.some(
        keyword => normalizedMessage.includes(keyword)
    );

    if (hasAggression) {
        return {
            matched: true,
            match: routeError('aggression_detected')
        };
    }

    // 5. Emotional overload
    const hasEmotionalOverload = EMOTIONAL_OVERLOAD_PHRASES.some(
        phrase => normalizedMessage.includes(phrase)
    );

    if (hasEmotionalOverload) {
        return {
            matched: true,
            match: routeError('emotional_overload')
        };
    }

    // No error detected
    return {
        matched: false
    };
}
