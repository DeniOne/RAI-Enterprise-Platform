"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgroOrchestrator = void 0;
const RuleEngine_1 = require("./RuleEngine");
class AgroOrchestrator {
    constructor() {
        this.ruleEngine = new RuleEngine_1.RuleEngine();
    }
    async transition(targetStage, context, rules, isDryRun = false) {
        const validation = this.ruleEngine.validateTransition(rules, context);
        const result = {
            success: validation.status === 'OK' || validation.status === 'WARN',
            fromStageId: context.currentStageId,
            toStageId: targetStage.id,
            validation: validation,
            dryRun: isDryRun
        };
        if (!isDryRun && result.success) {
        }
        return result;
    }
}
exports.AgroOrchestrator = AgroOrchestrator;
//# sourceMappingURL=Orchestrator.js.map