"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrySimulationService = exports.RegistrySimulationService = void 0;
const registry_schema_service_1 = require("./registry-schema.service");
const registry_access_engine_1 = require("../core/registry-access.engine");
const registry_visibility_rules_1 = require("../core/registry-visibility.rules");
class RegistrySimulationService {
    /**
     * Simulates the effect of adding new visibility rules.
     * @param entityTypeUrn Target Entity Type
     * @param role Target User Role
     * @param overlayRules New rules to ADD to the existing set
     */
    async simulateVisibilityChange(entityTypeUrn, role, overlayRules) {
        // 1. Setup Context
        const user = { roles: [role] };
        // 2. Instantiate Engines
        const baselineEngine = new registry_access_engine_1.RegistryAccessEngine(registry_visibility_rules_1.VISIBILITY_RULES);
        // Merge rules? Or just use overlay? 
        // Goal: "What if we ADD this rule?" -> Global + Overlay
        // Goal: "What if we REPLACE rules?" -> Overlay only
        // Standard "Patch" simulation implies Global + Overlay. Let's assume Additive for now.
        const combinedRules = [...registry_visibility_rules_1.VISIBILITY_RULES, ...overlayRules];
        const simulationEngine = new registry_access_engine_1.RegistryAccessEngine(combinedRules);
        // 3. Fetch Raw Data (Admin View)
        // We need the Full Schema to prune it down.
        // Fetch raw schema (no access control here, pruneSchema handles visibility)
        const rawSchema = await registry_schema_service_1.registrySchemaService.getSchema(entityTypeUrn);
        // 4. Run Pruning
        const baselineSchema = baselineEngine.pruneSchema(user, rawSchema);
        const simulatedSchema = simulationEngine.pruneSchema(user, rawSchema);
        // 5. Compute Diff
        const baselineAttrs = new Set(baselineSchema.attributes.map((a) => a.code));
        const simAttrs = new Set(simulatedSchema.attributes.map((a) => a.code));
        const addedAttrs = [...simAttrs].filter(x => !baselineAttrs.has(x));
        const removedAttrs = [...baselineAttrs].filter(x => !simAttrs.has(x));
        const baselineRels = new Set(baselineSchema.relationships.map((r) => r.code));
        const simRels = new Set(simulatedSchema.relationships.map((r) => r.code));
        const addedRels = [...simRels].filter(x => !baselineRels.has(x));
        const removedRels = [...baselineRels].filter(x => !simRels.has(x));
        return {
            entity_type: entityTypeUrn,
            role,
            added_visible_attributes: addedAttrs,
            removed_visible_attributes: removedAttrs, // e.g., if we added a Hiding Rule, this populates
            added_visible_relationships: addedRels,
            removed_visible_relationships: removedRels
        };
    }
}
exports.RegistrySimulationService = RegistrySimulationService;
exports.registrySimulationService = new RegistrySimulationService();
