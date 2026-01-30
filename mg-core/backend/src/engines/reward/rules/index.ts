/**
 * Reward Rules Index - Phase 1.3
 * 
 * Экспортирует все Reward Rules.
 */

import { EventType } from '../../../types/core/event.types';
import { IRewardRule } from '../../../types/core/reward.types';

// Импорт правил
import { shiftCompletionRule, successfulShiftRule } from './shift.rule';
import { positiveFeedbackRule, perfectScoreRule } from './feedback.rule';
import { courseCompletionRule, testPassedRule } from './training.rule';

// =============================================================================
// RULE EXPORTS
// =============================================================================

export { shiftCompletionRule, successfulShiftRule } from './shift.rule';
export { positiveFeedbackRule, perfectScoreRule } from './feedback.rule';
export { courseCompletionRule, testPassedRule } from './training.rule';

// =============================================================================
// ALL RULES
// =============================================================================

/**
 * Все правила вознаграждений
 */
export const ALL_REWARD_RULES: IRewardRule[] = [
    // Shift rewards
    shiftCompletionRule,
    successfulShiftRule,
    // Feedback rewards
    positiveFeedbackRule,
    perfectScoreRule,
    // Training rewards
    courseCompletionRule,
    testPassedRule,
];

// =============================================================================
// RULE REGISTRY
// =============================================================================

/**
 * Получить правило по имени
 */
export function getRuleByName(name: string): IRewardRule | undefined {
    return ALL_REWARD_RULES.find(r => r.name === name);
}

/**
 * Получить правила по типу события
 */
export function getRulesByEventType(eventType: EventType): IRewardRule[] {
    return ALL_REWARD_RULES.filter(r => r.trigger.event_type === eventType);
}
