"use strict";
/**
 * AI Ops Service (Step 12 Core)
 *
 * Aggregates Registry Projections -> Prompts LLM Stub -> Returns Advisory.
 * strictly Deterministic.
 *
 * PHASE 4.5: Adds snapshot ID generation for feedback traceability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiOpsService = exports.AIOpsService = void 0;
const crypto_1 = require("crypto");
const graph_service_1 = require("../graph/graph.service");
const impact_service_1 = require("../impact/impact.service");
const ai_sandbox_adapter_1 = require("./ai-sandbox.adapter");
const ai_ops_guard_1 = require("./ai-ops.guard");
// PHASE 4.5 - Version Constants
const AI_VERSION = 'v1.0.0';
const RULESET_VERSION = 'rules-2026-01';
class AIOpsService {
    /**
     * Analyze Entity Context
     */
    async analyzeEntity(entityType, id) {
        // 1. Data Aggregation (Registry Projections)
        // We use 'graph.default' and 'impact.default' assumptions, or should we ask for a specific analysis view?
        // Step 12 goal says "Consumes Graph + Impact".
        // Let's assume standard analysis views or fallback to defaults.
        // We need to fetch graph and impact.
        // NOTE: In a real system, we might need specific "AI views". 
        // For Step 12, we reuse existing defaults.
        const graph = graph_service_1.graphService.getGraph(entityType, id, 'graph.default');
        const impact = impact_service_1.impactService.getImpactReport(entityType, id, 'impact.default');
        // 2. Deterministic Sorting (Critical for Cache/Idempotency)
        this.sortGraph(graph);
        // Impact report (metrics) is already deterministic, but lists inside might need sorting if ImpactService doesn't.
        // Ideally ImpactService should sort. We sort here to be safe.
        impact.impacts.sort((a, b) => a.id.localeCompare(b.id));
        const context = {
            root: { entityType, id },
            graph,
            impact
        };
        // PHASE 4.5 - Generate deterministic snapshot ID
        const snapshotId = this.generateSnapshotId(context);
        // 3. Prompt Assembly
        const prompt = this.constructPrompt(context);
        // 4. Sandbox Delegation
        const rawResultJson = await ai_sandbox_adapter_1.aiSandboxAdapter.analyze(prompt);
        let rawResult;
        try {
            rawResult = JSON.parse(rawResultJson);
        }
        catch (e) {
            // Fallback for malformed LLM response
            rawResult = [];
        }
        // 5. Guardrail Application
        const recommendations = ai_ops_guard_1.aiOpsGuard.validateOutput(rawResult);
        // PHASE 4.5 - Attach snapshot ID to each recommendation
        const recommendationsWithSnapshot = recommendations.map(rec => ({
            ...rec,
            snapshotId,
            aiVersion: AI_VERSION,
            ruleSetVersion: RULESET_VERSION,
        }));
        return {
            recommendations: recommendationsWithSnapshot,
            metadata: {
                analyzedAt: new Date().toISOString(),
                model: 'matrix-gin-sandbox-v1',
                aiVersion: AI_VERSION,
                ruleSetVersion: RULESET_VERSION,
                snapshotId,
                determinism: true
            }
        };
    }
    sortGraph(graph) {
        graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
        graph.edges.sort((a, b) => a.id.localeCompare(b.id));
    }
    constructPrompt(context) {
        // Minimal Prompt Construction to fit context window
        // In production, this would be a sophisticated template.
        return JSON.stringify(context);
    }
    /**
     * PHASE 4.5 - Generate deterministic snapshot ID
     * Hash of graph + impact data for reproducibility
     */
    generateSnapshotId(context) {
        const dataToHash = JSON.stringify({
            graph: context.graph,
            impact: context.impact,
        });
        return (0, crypto_1.createHash)('sha256')
            .update(dataToHash)
            .digest('hex')
            .substring(0, 16); // 16 chars for readability
    }
}
exports.AIOpsService = AIOpsService;
exports.aiOpsService = new AIOpsService();
