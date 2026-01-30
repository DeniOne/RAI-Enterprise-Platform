import { registrySchemaService } from './registry-schema.service';
import { RegistryAccessEngine } from '../core/registry-access.engine';
import { VISIBILITY_RULES, VisibilityRule } from '../core/registry-visibility.rules';

interface SimulationDiff {
    entity_type: string;
    role: string;
    added_visible_attributes: string[];   // Hidden -> Visible
    removed_visible_attributes: string[]; // Visible -> Hidden
    added_visible_relationships: string[];
    removed_visible_relationships: string[];
}

export class RegistrySimulationService {

    /**
     * Simulates the effect of adding new visibility rules.
     * @param entityTypeUrn Target Entity Type
     * @param role Target User Role
     * @param overlayRules New rules to ADD to the existing set
     */
    async simulateVisibilityChange(
        entityTypeUrn: string,
        role: string,
        overlayRules: VisibilityRule[]
    ): Promise<SimulationDiff> {

        // 1. Setup Context
        const user = { roles: [role] };

        // 2. Instantiate Engines
        const baselineEngine = new RegistryAccessEngine(VISIBILITY_RULES);

        // Merge rules? Or just use overlay? 
        // Goal: "What if we ADD this rule?" -> Global + Overlay
        // Goal: "What if we REPLACE rules?" -> Overlay only
        // Standard "Patch" simulation implies Global + Overlay. Let's assume Additive for now.
        const combinedRules = [...VISIBILITY_RULES, ...overlayRules];
        const simulationEngine = new RegistryAccessEngine(combinedRules);

        // 3. Fetch Raw Data (Admin View)
        // We need the Full Schema to prune it down.
        // Fetch raw schema (no access control here, pruneSchema handles visibility)
        const rawSchema = await registrySchemaService.getSchema(entityTypeUrn);

        // 4. Run Pruning
        const baselineSchema = baselineEngine.pruneSchema(user, rawSchema);
        const simulatedSchema = simulationEngine.pruneSchema(user, rawSchema);

        // 5. Compute Diff
        const baselineAttrs = new Set<string>(baselineSchema.attributes.map((a: any) => a.code));
        const simAttrs = new Set<string>(simulatedSchema.attributes.map((a: any) => a.code));

        const addedAttrs: string[] = [...simAttrs].filter(x => !baselineAttrs.has(x));
        const removedAttrs: string[] = [...baselineAttrs].filter(x => !simAttrs.has(x));

        const baselineRels = new Set<string>(baselineSchema.relationships.map((r: any) => r.code));
        const simRels = new Set<string>(simulatedSchema.relationships.map((r: any) => r.code));

        const addedRels: string[] = [...simRels].filter(x => !baselineRels.has(x));
        const removedRels: string[] = [...baselineRels].filter(x => !simRels.has(x));

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

export const registrySimulationService = new RegistrySimulationService();
