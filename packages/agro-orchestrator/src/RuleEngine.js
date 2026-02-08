"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const json_logic_js_1 = require("json-logic-js");
class RuleEngine {
    evaluate(rule, context) {
        try {
            const isValid = (0, json_logic_js_1.apply)(rule.condition, context.inputData);
            if (isValid) {
                return { status: 'OK' };
            }
            else {
                return {
                    status: rule.severity,
                    ruleId: rule.id,
                    reason: this.formatErrorMessage(rule.errorMessage, context.inputData),
                    data: { contextData: context.inputData, ruleCondition: rule.condition }
                };
            }
        }
        catch (error) {
            console.error(`Rule Evaluation Error [${rule.id}]:`, error);
            return {
                status: 'BLOCK',
                ruleId: rule.id,
                reason: `System Error during Rule Evaluation: ${error.message}`
            };
        }
    }
    validateTransition(rules, context) {
        const failures = [];
        for (const rule of rules) {
            const result = this.evaluate(rule, context);
            if (result.status !== 'OK') {
                failures.push(result);
                if (result.status === 'BLOCK') {
                    return result;
                }
            }
        }
        if (failures.length > 0) {
            return failures[0];
        }
        return { status: 'OK' };
    }
    formatErrorMessage(template, data) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] !== undefined ? String(data[key]) : match;
        });
    }
}
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=RuleEngine.js.map