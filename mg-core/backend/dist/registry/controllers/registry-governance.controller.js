"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryGovernanceController = exports.RegistryGovernanceController = void 0;
const registry_visibility_rules_1 = require("../core/registry-visibility.rules");
const registry_access_engine_1 = require("../core/registry-access.engine");
const registry_schema_service_1 = require("../services/registry-schema.service"); // Ensure this is exported/accessible
class RegistryGovernanceController {
    /**
     * GET /api/registry/governance/snapshot
     * Returns the current Rules Artifact and version info.
     * Truly read-only reflection of the backend state.
     */
    async getSnapshot(req, res) {
        try {
            // In a real system, we might compute a hash of the rules for integrity check.
            res.json({
                timestamp: new Date().toISOString(),
                version: '1.0.0', // Dynamic if rules are versioned
                rules: registry_visibility_rules_1.VISIBILITY_RULES,
                // We could also include summary of schemas count, etc.
                summary: 'Active MatrixGin Registry Governance Snapshot'
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/registry/governance/projection-map
     * Query: ?entity_type=<urn>&role=<role>
     * Returns: { visible_attributes, hidden_attributes, ... }
     * Diagnostic tool to verify 'pruneSchema' logic without logging in as that user.
     */
    async getProjectionMap(req, res) {
        try {
            const entityTypeUrn = req.query.entity_type;
            const role = req.query.role; // Target Role to simulate
            if (!entityTypeUrn || !role) {
                res.status(400).json({ message: 'Missing entity_type or role query params' });
                return;
            }
            // 1. Fetch Full Schema (Admin View)
            // We use a user with 'REGISTRY_ADMIN' permission to get the base schema,
            // OR we assume schemaService.getSchema returns RAW schema if we don't pass a user?
            // Actually, in Step 16 we integrated Access Check.
            // If we are calling schemaService.getSchema, we need to bypass pruning if we want the "Baseline".
            // Implementation Detail: schemaService.getSchema now accepts 'user'.
            // To get RAW schema, we simulate an ADMIN user.
            // Fetch raw schema (no access control here, pruneSchema handles visibility)
            const rawSchema = await registry_schema_service_1.registrySchemaService.getSchema(entityTypeUrn);
            // If Step 16 modification made user mandatory, we pass admin.
            // 2. Compute Pruned Schema (Target Role View)
            const targetUser = { roles: [role] };
            const prunedSchema = registry_access_engine_1.registryAccessEngine.pruneSchema(targetUser, rawSchema);
            // 3. Calculate Diff (What is Hidden?)
            const rawAttrCodes = rawSchema.attributes.map((a) => a.code);
            const prunedAttrCodes = prunedSchema.attributes.map((a) => a.code);
            const hiddenAttributes = rawSchema.attributes.filter(a => !prunedAttrCodes.includes(a.code));
            const rawRelCodes = rawSchema.relationships.map((r) => r.code);
            const prunedRelCodes = prunedSchema.relationships.map((r) => r.code);
            const hiddenRelationships = rawSchema.relationships.filter(r => !prunedRelCodes.includes(r.code));
            res.json({
                entity_type: entityTypeUrn,
                simulated_role: role,
                visible_attributes: prunedSchema.attributes,
                hidden_attributes: hiddenAttributes,
                visible_relationships: prunedSchema.relationships,
                hidden_relationships: hiddenRelationships
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.RegistryGovernanceController = RegistryGovernanceController;
exports.registryGovernanceController = new RegistryGovernanceController();
