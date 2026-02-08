import { RulesLogic } from 'json-logic-js';
import { ValidationResult, AgroContext } from './types';
export interface AgroRule {
    id: string;
    condition: RulesLogic;
    errorMessage: string;
    severity: 'BLOCK' | 'WARN';
}
export declare class RuleEngine {
    evaluate(rule: AgroRule, context: AgroContext): ValidationResult;
    validateTransition(rules: AgroRule[], context: AgroContext): ValidationResult;
    private formatErrorMessage;
}
