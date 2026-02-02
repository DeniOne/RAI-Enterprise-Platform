// f:\RAI_EP\packages\agro-orchestrator\src\Orchestrator.ts

import { AgroContext, CanonicalStage, TransitionResult, ValidationResult } from './types';
import { RuleEngine, AgroRule } from './RuleEngine';

export class AgroOrchestrator {
    private ruleEngine: RuleEngine;

    constructor() {
        this.ruleEngine = new RuleEngine();
    }

    /**
     * Simulates a transition without applying it.
     * DRY-RUN MODE via parameter.
     */
    public async transition(
        targetStage: CanonicalStage,
        context: AgroContext,
        rules: AgroRule[],
        isDryRun: boolean = false
    ): Promise<TransitionResult> {

        // 1. Validate Workflow Logic (Simple Order Check for now)
        // In complex version this would check the Graph
        // For now we assume if the caller requests it, it is graph-valid.

        // 2. Validate Constraints (Rule Engine)
        const validation = this.ruleEngine.validateTransition(rules, context);

        // 3. Construct Result
        const result: TransitionResult = {
            success: validation.status === 'OK' || validation.status === 'WARN',
            fromStageId: context.currentStageId,
            toStageId: targetStage.id,
            validation: validation,
            dryRun: isDryRun
        };

        // 4. If execution (not dry-run) AND successful
        if (!isDryRun && result.success) {
            // Here usually we would emit an event or return a directive to the Core
            // Since this is a library, we just return the "Success" verdict.
            // The caller (Core Service) is responsible for saving the new state.
        }

        return result;
    }
}
