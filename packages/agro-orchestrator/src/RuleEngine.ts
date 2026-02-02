// f:\RAI_EP\packages\agro-orchestrator\src\RuleEngine.ts

import { apply, RulesLogic } from 'json-logic-js';
import { ValidationResult, AgroContext } from './types';

export interface AgroRule {
    id: string;
    condition: RulesLogic;
    errorMessage: string; // Template for explainability
    severity: 'BLOCK' | 'WARN';
}

export class RuleEngine {
    /**
     * Evaluates a single rule against the context.
     * STRICTLY READ-ONLY. NO SIDE EFFECTS.
     */
    public evaluate(rule: AgroRule, context: AgroContext): ValidationResult {
        try {
            // json-logic returns TRUE if rule passes, FALSE if it fails
            // We assume the rule defines the "GOOD" state.
            // E.g. { ">": [{ "var": "soilMoisture" }, 12] } -> Must be > 12 to pass.
            const isValid = apply(rule.condition, context.inputData);

            if (isValid) {
                return { status: 'OK' };
            } else {
                return {
                    status: rule.severity,
                    ruleId: rule.id,
                    reason: this.formatErrorMessage(rule.errorMessage, context.inputData),
                    data: { contextData: context.inputData, ruleCondition: rule.condition }
                };
            }
        } catch (error: any) {
            console.error(`Rule Evaluation Error [${rule.id}]:`, error);
            return {
                status: 'BLOCK',
                ruleId: rule.id,
                reason: `System Error during Rule Evaluation: ${error.message}`
            };
        }
    }

    /**
     * Validates a transition against a set of constraints.
     * Returns OK only if ALL hard constraints pass.
     * Returns WARN if soft constraints fail but hard pass.
     * Returns BLOCK if ANY hard constraint fails.
     */
    public validateTransition(rules: AgroRule[], context: AgroContext): ValidationResult {
        const failures: ValidationResult[] = [];

        for (const rule of rules) {
            const result = this.evaluate(rule, context);
            if (result.status !== 'OK') {
                failures.push(result);
                // Fail fast on BLOCK
                if (result.status === 'BLOCK') {
                    return result;
                }
            }
        }

        // If we have warnings but no blocks
        if (failures.length > 0) {
            // Return the first warning for now (or aggregate)
            return failures[0];
        }

        return { status: 'OK' };
    }

    private formatErrorMessage(template: string, data: any): string {
        // Simple interpolation: "Moisture {val} is too low"
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] !== undefined ? String(data[key]) : match;
        });
    }
}
