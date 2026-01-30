import { registryRelationshipService } from '../registry/services/registry-relationship.service';

// Actually, registryRelationshipService has getRelationships.

/**
 * Analytics Registry Bridge
 * 
 * STRICT READ-ONLY consumer of the Registry.
 * Provides graph traversal and structure resolution for Analytics/KPIs.
 * 
 * NON-NEGOTIABLE:
 * - NO Mutation methods (create/update/delete).
 * - NO Impact Analysis for Writes (since writes are forbidden).
 * - USES Registry as Single Source of Truth for Hierarchy.
 */
export class AnalyticsRegistryBridgeService {
    private static instance: AnalyticsRegistryBridgeService;

    // Definitions
    private readonly DEF_PARENT_ORG_UNIT = 'urn:mg:def:ofs:parent_org_unit'; // Child -> Parent
    private readonly DEF_BELONGS_TO_ORG = 'urn:mg:def:ofs:belongs_to_org';   // Employee -> Dept

    // URN Prefixes for parsing helpers
    private readonly PREFIX_DEPT = 'urn:mg:ofs:department:';
    private readonly PREFIX_USER = 'urn:mg:identity:user:';

    private constructor() { }

    public static getInstance(): AnalyticsRegistryBridgeService {
        if (!AnalyticsRegistryBridgeService.instance) {
            AnalyticsRegistryBridgeService.instance = new AnalyticsRegistryBridgeService();
        }
        return AnalyticsRegistryBridgeService.instance;
    }

    /**
     * Extracts Domain ID from Registry URN.
     * Centralized helper to avoid hardcoding split logic in Analytics code.
     */
    public extractDomainId(urn: string): string | null {
        const parts = urn.split(':');
        if (parts.length < 4) return null; // urn:mg:domain:entity:id
        return parts[parts.length - 1];
    }

    /**
     * Get all child departments (direct descendants) for a given department URN.
     * Returns list of Domain IDs.
     */
    async getDirectChildDepartmentIds(deptUrn: string): Promise<string[]> {
        // Relationship: Child -> Parent (PARENT_ORG_UNIT)
        // usage: getRelationships(def, from, to)
        // We want children of 'deptUrn'. 
        // In PARENT_ORG_UNIT, Child is FROM, Parent is TO.
        // So we query where TO = deptUrn.

        const rels = await registryRelationshipService.getRelationships(
            this.DEF_PARENT_ORG_UNIT,
            undefined, // Any child
            deptUrn    // Specific parent
        );

        return rels
            .map(r => this.extractDomainId(r.from_urn))
            .filter((id): id is string => id !== null);
    }

    /**
     * Get Department Subtree (Recursive).
     * Returns a flat list of ALL descendant Department Domain IDs (including self).
     * Useful for "Rollup" KPIs.
     * 
     * NOTE: In a real Graph DB, this is one query. 
     * Here we simulate recursion (or assume ltree if we optimized).
     * Keeping it simple (BFS) for MVP.
     */
    async getDepartmentSubtreeIds(rootDeptId: string): Promise<string[]> {
        const rootUrn = `${this.PREFIX_DEPT}${rootDeptId}`;
        const allIds = new Set<string>();
        allIds.add(rootDeptId);

        let queue = [rootUrn];

        while (queue.length > 0) {
            const currentParent = queue.shift()!;

            // Find children (Where TO = currentParent)
            const childrenRels = await registryRelationshipService.getRelationships(
                this.DEF_PARENT_ORG_UNIT,
                undefined,
                currentParent
            );

            for (const rel of childrenRels) {
                const childId = this.extractDomainId(rel.from_urn);
                if (childId && !allIds.has(childId)) {
                    allIds.add(childId);
                    queue.push(rel.from_urn);
                }
            }
        }

        return Array.from(allIds);
    }

    /**
     * Get all Employees belonging to a Department.
     * Returns Employee User IDs.
     */
    async getDepartmentEmployeeIds(deptId: string): Promise<string[]> {
        const deptUrn = `${this.PREFIX_DEPT}${deptId}`;

        // Relationship: Employee -> Dept (BELONGS_TO_ORG)
        // FROM = Employee, TO = Description
        const rels = await registryRelationshipService.getRelationships(
            this.DEF_BELONGS_TO_ORG,
            undefined,
            deptUrn
        );

        return rels
            .map(r => this.extractDomainId(r.from_urn))
            .filter((id: string | null): id is string => id !== null);
    }
}

export const analyticsRegistryBridge = AnalyticsRegistryBridgeService.getInstance();
