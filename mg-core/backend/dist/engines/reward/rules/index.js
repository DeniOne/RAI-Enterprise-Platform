"use strict";
/**
 * Reward Rules Index - Phase 1.3
 *
 * Экспортирует все Reward Rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_REWARD_RULES = exports.testPassedRule = exports.courseCompletionRule = exports.perfectScoreRule = exports.positiveFeedbackRule = exports.successfulShiftRule = exports.shiftCompletionRule = void 0;
exports.getRuleByName = getRuleByName;
exports.getRulesByEventType = getRulesByEventType;
// Импорт правил
const shift_rule_1 = require("./shift.rule");
const feedback_rule_1 = require("./feedback.rule");
const training_rule_1 = require("./training.rule");
// =============================================================================
// RULE EXPORTS
// =============================================================================
var shift_rule_2 = require("./shift.rule");
Object.defineProperty(exports, "shiftCompletionRule", { enumerable: true, get: function () { return shift_rule_2.shiftCompletionRule; } });
Object.defineProperty(exports, "successfulShiftRule", { enumerable: true, get: function () { return shift_rule_2.successfulShiftRule; } });
var feedback_rule_2 = require("./feedback.rule");
Object.defineProperty(exports, "positiveFeedbackRule", { enumerable: true, get: function () { return feedback_rule_2.positiveFeedbackRule; } });
Object.defineProperty(exports, "perfectScoreRule", { enumerable: true, get: function () { return feedback_rule_2.perfectScoreRule; } });
var training_rule_2 = require("./training.rule");
Object.defineProperty(exports, "courseCompletionRule", { enumerable: true, get: function () { return training_rule_2.courseCompletionRule; } });
Object.defineProperty(exports, "testPassedRule", { enumerable: true, get: function () { return training_rule_2.testPassedRule; } });
// =============================================================================
// ALL RULES
// =============================================================================
/**
 * Все правила вознаграждений
 */
exports.ALL_REWARD_RULES = [
    // Shift rewards
    shift_rule_1.shiftCompletionRule,
    shift_rule_1.successfulShiftRule,
    // Feedback rewards
    feedback_rule_1.positiveFeedbackRule,
    feedback_rule_1.perfectScoreRule,
    // Training rewards
    training_rule_1.courseCompletionRule,
    training_rule_1.testPassedRule,
];
// =============================================================================
// RULE REGISTRY
// =============================================================================
/**
 * Получить правило по имени
 */
function getRuleByName(name) {
    return exports.ALL_REWARD_RULES.find(r => r.name === name);
}
/**
 * Получить правила по типу события
 */
function getRulesByEventType(eventType) {
    return exports.ALL_REWARD_RULES.filter(r => r.trigger.event_type === eventType);
}
