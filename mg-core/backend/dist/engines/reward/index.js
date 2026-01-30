"use strict";
/**
 * Reward Engine Index - Phase 1.3
 *
 * Экспортирует все компоненты Reward Engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRulesByEventType = exports.getRuleByName = exports.ALL_REWARD_RULES = exports.testPassedRule = exports.courseCompletionRule = exports.perfectScoreRule = exports.positiveFeedbackRule = exports.successfulShiftRule = exports.shiftCompletionRule = exports.recordMultipleRewardCalculations = exports.recordRewardCalculation = exports.RewardValidationError = exports.RewardEngine = void 0;
// Engine
var reward_engine_1 = require("./reward-engine");
Object.defineProperty(exports, "RewardEngine", { enumerable: true, get: function () { return reward_engine_1.RewardEngine; } });
Object.defineProperty(exports, "RewardValidationError", { enumerable: true, get: function () { return reward_engine_1.RewardValidationError; } });
// Recorder
var reward_recorder_1 = require("./reward-recorder");
Object.defineProperty(exports, "recordRewardCalculation", { enumerable: true, get: function () { return reward_recorder_1.recordRewardCalculation; } });
Object.defineProperty(exports, "recordMultipleRewardCalculations", { enumerable: true, get: function () { return reward_recorder_1.recordMultipleRewardCalculations; } });
// Rules
var rules_1 = require("./rules");
Object.defineProperty(exports, "shiftCompletionRule", { enumerable: true, get: function () { return rules_1.shiftCompletionRule; } });
Object.defineProperty(exports, "successfulShiftRule", { enumerable: true, get: function () { return rules_1.successfulShiftRule; } });
Object.defineProperty(exports, "positiveFeedbackRule", { enumerable: true, get: function () { return rules_1.positiveFeedbackRule; } });
Object.defineProperty(exports, "perfectScoreRule", { enumerable: true, get: function () { return rules_1.perfectScoreRule; } });
Object.defineProperty(exports, "courseCompletionRule", { enumerable: true, get: function () { return rules_1.courseCompletionRule; } });
Object.defineProperty(exports, "testPassedRule", { enumerable: true, get: function () { return rules_1.testPassedRule; } });
Object.defineProperty(exports, "ALL_REWARD_RULES", { enumerable: true, get: function () { return rules_1.ALL_REWARD_RULES; } });
Object.defineProperty(exports, "getRuleByName", { enumerable: true, get: function () { return rules_1.getRuleByName; } });
Object.defineProperty(exports, "getRulesByEventType", { enumerable: true, get: function () { return rules_1.getRulesByEventType; } });
