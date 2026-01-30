import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

export class RegistryConstraintEngine {
    /**
     * Enforces that adding a relationship does not violate the DAG constraint (Resulting in a cycle)
     * This MUST be called within a transaction.
     * 
     * @param tx - Prisma Transaction Client
     * @param fromUrn - Source Entity URN
     * @param toUrn - Target Entity URN
     * @param definitionUrn - The definition URN governing this relationship
     * @throws Error if cycle is detected (409)
     */
    async enforceDAGConstraint(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, fromUrn: string, toUrn: string, definitionUrn: string): Promise<void> {
        // 1. Check if definition is hierarchical
        // We assume the caller (Service) has checked the definition metadata or we fetch it here.
        // For strictness, we fetch it here or rely on the fact that if we are calling this, it IS hierarchical.
        // But to be the "Absolute Law", we should ideally know. 
        // For performance, we'll accept a flag or check DB. Let's check DB for safety.

        const definition = await tx.registryEntity.findUnique({
            where: { urn: definitionUrn }
        });

        if (!definition) throw new Error(`Relationship definition ${definitionUrn} not found`);

        const attributes = definition.attributes as any;
        const isHierarchical = attributes?.is_hierarchical === true;
        const isCyclicAllowed = attributes?.is_cyclic_allowed === true;

        if (!isHierarchical || isCyclicAllowed) {
            return; // No DAG constraint needed
        }

        // 2. Check for self-reference (Direct Cycle)
        if (fromUrn === toUrn) {
            throw new Error(`Cycle detected: Cannot relate entity ${fromUrn} to itself in a hierarchical relationship.`);
        }

        // 3. Check for Indirect Cycles using Recursive SQL (Postgres)
        // We start from `toUrn` and see if we can reach `fromUrn`.
        // If we can reach `fromUrn` starting from `toUrn`, then adding `fromUrn -> toUrn` creates a cycle.

        // We only traverse relationships defined by THIS definition? 
        // Or ALL hierarchical relationships?
        // Usually, a hierarchy is specific to a relation type (e.g. "Parent-Child" vs "Dependency").
        // We will constrain traversal to the same definition_urn.

        const cyclePath = await tx.$queryRaw<any[]>`
            WITH RECURSIVE traverse AS (
                -- Base case: direct children of "toUrn"
                SELECT to_urn, from_urn, ARRAY[from_urn, to_urn] as path
                FROM registry_relationships
                WHERE from_urn = ${toUrn} 
                  AND definition_urn = ${definitionUrn}
                
                UNION ALL
                
                -- Recursive step: children of children
                SELECT r.to_urn, r.from_urn, t.path || r.to_urn
                FROM registry_relationships r
                INNER JOIN traverse t ON r.from_urn = t.to_urn
                WHERE r.definition_urn = ${definitionUrn}
                  AND NOT r.to_urn = ANY(t.path) -- Prevent infinite loop in query if cycle already exists (shouldn't happen if integrity holds)
            )
            SELECT path FROM traverse
            WHERE to_urn = ${fromUrn}
            LIMIT 1;
        `;

        if (cyclePath && cyclePath.length > 0) {
            throw new Error(`Cycle detected: Adding ${fromUrn} -> ${toUrn} violates DAG constraint for hierarchy ${definitionUrn}. Path exists from target to source.`);
        }
    }

    validateDefinitionState(definition: any): void {
        if (!definition.is_active || definition.fsm_state !== 'active') {
            throw new Error(`Relationship definition ${definition.urn} is not ACTIVE.`);
        }
    }
}

export const registryConstraintEngine = new RegistryConstraintEngine();
