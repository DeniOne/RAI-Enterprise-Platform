/**
 * Reward Engine Index - Phase 1.3
 * 
 * Экспортирует все компоненты Reward Engine.
 */

// Engine
export { RewardEngine, RewardValidationError } from './reward-engine';

// Recorder
export { recordRewardCalculation, recordMultipleRewardCalculations } from './reward-recorder';

// Rules
export {
    shiftCompletionRule,
    successfulShiftRule,
    positiveFeedbackRule,
    perfectScoreRule,
    courseCompletionRule,
    testPassedRule,
    ALL_REWARD_RULES,
    getRuleByName,
    getRulesByEventType,
} from './rules';

// Re-export types
export type {
    RewardCurrency,
    IRewardRule,
    IRewardTrigger,
    IRewardInput,
    IRewardCalculation,
} from '../../types/core/reward.types';
