"use strict";
/**
 * Qualification Rules Index - Phase 1.2
 *
 * Экспортирует все Qualification Rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_QUALIFICATION_RULES = exports.riskOfDowngradeRule = exports.eligibleForUpgradeRule = void 0;
exports.getRuleByName = getRuleByName;
const upgrade_rule_1 = require("./upgrade.rule");
const downgrade_rule_1 = require("./downgrade.rule");
// =============================================================================
// RULE EXPORTS
// =============================================================================
var upgrade_rule_2 = require("./upgrade.rule");
Object.defineProperty(exports, "eligibleForUpgradeRule", { enumerable: true, get: function () { return upgrade_rule_2.eligibleForUpgradeRule; } });
var downgrade_rule_2 = require("./downgrade.rule");
Object.defineProperty(exports, "riskOfDowngradeRule", { enumerable: true, get: function () { return downgrade_rule_2.riskOfDowngradeRule; } });
// =============================================================================
// ALL RULES
// =============================================================================
/**
 * Все правила квалификации
 *
 * Порядок важен: сначала проверяем upgrade, потом downgrade.
 * Если ни одно не сработало — stable.
 */
exports.ALL_QUALIFICATION_RULES = [
    upgrade_rule_1.eligibleForUpgradeRule,
    downgrade_rule_1.riskOfDowngradeRule,
];
// =============================================================================
// RULE REGISTRY
// =============================================================================
/**
 * Получить правило по имени
 */
function getRuleByName(name) {
    return exports.ALL_QUALIFICATION_RULES.find(r => r.name === name);
}
