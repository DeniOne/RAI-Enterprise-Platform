/**
 * AI Guardrails - Phase 2.1
 * 
 * Canon: AI объясняет. Человек решает.
 * 
 * AI ДОЛЖЕН ОТКАЗАТЬ, если запрос:
 * - требует изменить данные
 * - требует принять решение
 * - требует начислить награду
 * - требует повысить / понизить квалификацию
 * - требует обойти правила
 */

import {
    FORBIDDEN_INTENTS,
    ForbiddenIntent,
    IGuardrailsCheckResult,
} from '../../types/core/ai.types';

// =============================================================================
// FORBIDDEN PATTERNS
// =============================================================================

/**
 * Паттерны для обнаружения запрещённых намерений
 */
const INTENT_PATTERNS: Record<ForbiddenIntent, RegExp[]> = {
    change_data: [
        /измен(и|ить|яй)/i,
        /обнов(и|ить)/i,
        /удал(и|ить)/i,
        /созда(й|ть)/i,
        /update/i,
        /delete/i,
        /insert/i,
        /modify/i,
    ],
    grant_reward: [
        /начисл(и|ить)/i,
        /выда(й|ть)\s*(бонус|награ|MC|GMC)/i,
        /награ(ди|дить)/i,
        /grant.*reward/i,
        /add.*bonus/i,
    ],
    modify_qualification: [
        /повыс(ь|ить)\s*(квалификац|уровень|статус)/i,
        /пониз(ь|ить)\s*(квалификац|уровень|статус)/i,
        /смен(и|ить)\s*(квалификац|уровень)/i,
        /upgrade.*qualification/i,
        /downgrade.*qualification/i,
    ],
    execute_action: [
        /выполн(и|ить)/i,
        /запуст(и|ить)/i,
        /сдела(й|ть)/i,
        /execute/i,
        /run/i,
        /trigger/i,
    ],
    make_decision: [
        /реш(и|ить)/i,
        /прим(и|ять)\s*решение/i,
        /утверд(и|ить)/i,
        /одобр(и|ить)/i,
        /откаж(и|ать)/i,
        /decide/i,
        /approve/i,
        /reject/i,
    ],
    bypass_rules: [
        /обойти/i,
        /игнорир(уй|овать)/i,
        /пропуст(и|ить)\s*правил/i,
        /без\s*провер/i,
        /bypass/i,
        /skip.*validation/i,
        /ignore.*rule/i,
    ],
    compare_people: [
        /кто\s*лучше/i,
        /кто\s*хуже/i,
        /сравни\s*(сотрудник|людей|работник)/i,
        /ранжируй/i,
        /who.*better/i,
        /rank.*employee/i,
    ],
    give_advice: [
        /что\s*(нужно|надо|следует)\s*делать/i,
        /посовету(й|ть)/i,
        /рекоменду(й|ть)\s*действ/i,
        /как\s*поступить/i,
        /what.*should.*do/i,
        /recommend.*action/i,
    ],
};

// =============================================================================
// REFUSAL MESSAGE
// =============================================================================

/**
 * Стандартное сообщение отказа
 */
export const REFUSAL_MESSAGE =
    'AI Analyst не имеет права выполнять это действие. ' +
    'AI объясняет. Решение принимает человек.';

// =============================================================================
// GUARDRAILS CHECK
// =============================================================================

/**
 * Проверить запрос на запрещённые намерения
 * 
 * @param request - текст запроса
 * @returns результат проверки
 */
export function checkGuardrails(request: string): IGuardrailsCheckResult {
    const detected: ForbiddenIntent[] = [];

    for (const intent of FORBIDDEN_INTENTS) {
        const patterns = INTENT_PATTERNS[intent];

        for (const pattern of patterns) {
            if (pattern.test(request)) {
                if (!detected.includes(intent)) {
                    detected.push(intent);
                }
                break; // Достаточно одного совпадения для intent
            }
        }
    }

    if (detected.length > 0) {
        return {
            allowed: false,
            reason: REFUSAL_MESSAGE,
            detected_intents: detected,
        };
    }

    return { allowed: true };
}

/**
 * Валидировать запрос (выбросить ошибку если запрещён)
 * 
 * @param request - текст запроса
 * @throws Error если запрос содержит запрещённые намерения
 */
export function validateRequest(request: string): void {
    const result = checkGuardrails(request);

    if (!result.allowed) {
        throw new Error(result.reason);
    }
}

/**
 * Получить сообщение отказа
 */
export function getRefusalMessage(): string {
    return REFUSAL_MESSAGE;
}
