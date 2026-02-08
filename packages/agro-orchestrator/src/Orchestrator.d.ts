import { AgroContext, CanonicalStage, TransitionResult } from './types';
import { AgroRule } from './RuleEngine';
export declare class AgroOrchestrator {
    private ruleEngine;
    constructor();
    transition(targetStage: CanonicalStage, context: AgroContext, rules: AgroRule[], isDryRun?: boolean): Promise<TransitionResult>;
}
