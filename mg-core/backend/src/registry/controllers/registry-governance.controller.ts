import { Request, Response } from 'express';
import { VISIBILITY_RULES } from '../core/registry-visibility.rules';
import { registryAccessEngine } from '../core/registry-access.engine';
import { registrySchemaService } from '../services/registry-schema.service'; // Ensure this is exported/accessible

export class RegistryGovernanceController {

    /**
     * GET /api/registry/governance/snapshot
     * Returns the current Rules Artifact and version info.
     * Truly read-only reflection of the backend state.
     */
    async getSnapshot(req: Request, res: Response) {
        try {
            // In a real system, we might compute a hash of the rules for integrity check.
            res.json({
                timestamp: new Date().toISOString(),
                version: '1.0.0', // Dynamic if rules are versioned
                rules: VISIBILITY_RULES,
                // We could also include summary of schemas count, etc.
                summary: 'Active MatrixGin Registry Governance Snapshot'
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/registry/governance/projection-map
     * Query: ?entity_type=<urn>&role=<role>
     * Returns: { visible_attributes, hidden_attributes, ... }
     * Diagnostic tool to verify 'pruneSchema' logic without logging in as that user.
     */
    async getProjectionMap(req: Request, res: Response) {
        try {
            const entityTypeUrn = req.query.entity_type as string;
            const role = req.query.role as string; // Target Role to simulate

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
            const rawSchema = await registrySchemaService.getSchema(entityTypeUrn);
            // If Step 16 modification made user mandatory, we pass admin.

            // 2. Compute Pruned Schema (Target Role View)
            const targetUser = { roles: [role] };
            const prunedSchema = registryAccessEngine.pruneSchema(targetUser, rawSchema);

            // 3. Calculate Diff (What is Hidden?)
            const rawAttrCodes = rawSchema.attributes.map((a: { code: string }) => a.code);
            const prunedAttrCodes = prunedSchema.attributes.map((a: { code: string }) => a.code);

            const hiddenAttributes = rawSchema.attributes.filter(a => !prunedAttrCodes.includes(a.code));

            const rawRelCodes = rawSchema.relationships.map((r: { code: string }) => r.code);
            const prunedRelCodes = prunedSchema.relationships.map((r: { code: string }) => r.code);

            const hiddenRelationships = rawSchema.relationships.filter(r => !prunedRelCodes.includes(r.code));

            res.json({
                entity_type: entityTypeUrn,
                simulated_role: role,
                visible_attributes: prunedSchema.attributes,
                hidden_attributes: hiddenAttributes,
                visible_relationships: prunedSchema.relationships,
                hidden_relationships: hiddenRelationships
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const registryGovernanceController = new RegistryGovernanceController();
