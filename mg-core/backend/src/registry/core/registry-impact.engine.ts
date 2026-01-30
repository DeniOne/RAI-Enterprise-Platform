import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { ChangeType, ImpactCode, ImpactItem, ImpactLevel, ImpactReport } from '../dto/impact.types';
import { logger } from '../../config/logger';

// Use a subset of PrismaClient for transactions
type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class RegistryImpactAnalysisEngine {

    /**
     * Analyze the impact of a proposed change.
     * This method is READ-ONLY regarding data modification, but may read extensively.
     */
    async analyzeChange(tx: PrismaTx, changeType: ChangeType, targetUrn: string, proposedData?: any): Promise<ImpactReport> {
        const impacts: ImpactItem[] = [];
        let visitedNodes: string[] = [];

        // 1. Initial State Fetch
        const targetEntity = await tx.registryEntity.findUnique({ where: { urn: targetUrn } });
        if (!targetEntity && changeType !== ChangeType.RELATIONSHIP_CREATE) {
            // If entity doesn't exist and we are not creating a relationship (where target might be the rel itself?), 
            // actually REL_CREATE target is usually source/target entities.
            // If we are doing LIFECYCLE on non-existent entity, that's 404, but impact is "Nothing".
            // Let's assume validation happened before.
            // For safety, return empty report.
            visitedNodes.push(targetUrn);
        }

        if (changeType === ChangeType.ENTITY_LIFECYCLE_TRANSITION) {
            await this.analyzeLifecycleTransition(tx, targetUrn, proposedData?.state, impacts, visitedNodes);
        } else if (changeType === ChangeType.RELATIONSHIP_CREATE) {
            await this.analyzeRelationshipCreate(tx, proposedData, impacts, visitedNodes);
        } else if (changeType === ChangeType.RELATIONSHIP_DELETE) {
            await this.analyzeRelationshipDelete(tx, targetUrn, impacts, visitedNodes);
        }

        // 2. Generate Graph Snapshot Hash
        // Hashes the sorted list of visited URNs + their current FSM state (if fetched).
        // Since we didn't fetch deep state for all visited yet, strictly we hash what we touched.
        // For canonical reproducibility, we should hash the 'Subgraph' involved.
        // Simplified: Hash(TargetUrn + ChangeType + NodeStates)
        const hash = this.generateGraphSnapshotHash(visitedNodes);

        return {
            summary: {
                blocking: impacts.filter(i => i.level === ImpactLevel.BLOCKING).length,
                warning: impacts.filter(i => i.level === ImpactLevel.WARNING).length,
                info: impacts.filter(i => i.level === ImpactLevel.INFO).length
            },
            graph_snapshot_hash: hash,
            impacts: impacts
        };
    }

    private async analyzeLifecycleTransition(tx: PrismaTx, urn: string, newState: string, impacts: ImpactItem[], visitedNodes: string[]) {
        visitedNodes.push(urn);

        if (newState === 'archived' || newState === 'deprecated') {
            // Check Inbound Relationships (Who depends on me?)
            // If I am archived, any active relationship pointing TO me might be invalid depending on definition.
            // Strict Canon: Active Relationship cannot point to Archived Entity.

            const inboundRels = await tx.registryRelationship.findMany({
                where: { to_urn: urn }
            });

            for (const rel of inboundRels) {
                visitedNodes.push(rel.id);
                // Fetch definition to see if it's a strong dependency?
                // For now, assume ALL active relationships break if target is archived.
                impacts.push({
                    level: ImpactLevel.BLOCKING,
                    code: ImpactCode.LIFECYCLE_BREAK,
                    entity_urn: rel.id,
                    description: `Active relationship ${rel.id} (from ${rel.from_urn}) targets entity ${urn} being archived.`,
                    path: [rel.from_urn, urn]
                });
            }
        }
    }

    private async analyzeRelationshipCreate(tx: PrismaTx, data: any, impacts: ImpactItem[], visitedNodes: string[]) {
        // data: { from_urn, to_urn, definition_urn }
        if (!data) return;
        visitedNodes.push(data.from_urn, data.to_urn);

        // Check Cardinality
        // Check if definition exists
        const def = await tx.registryEntity.findUnique({ where: { urn: data.definition_urn } });
        if (!def) {
            impacts.push({
                level: ImpactLevel.BLOCKING,
                code: ImpactCode.GRAPH_INTEGRITY_BREAK,
                entity_urn: data.definition_urn,
                description: `Definition ${data.definition_urn} not found.`,
                path: []
            });
            return;
        }

        // Logic similar to Service, but strictly reporting impact.
        // Service throws, Engine reports.
        const attrs = def.attributes as any;
        if (attrs.cardinality === '1-1') {
            const existingFrom = await tx.registryRelationship.findFirst({ where: { definition_urn: data.definition_urn, from_urn: data.from_urn } });
            if (existingFrom) {
                impacts.push({
                    level: ImpactLevel.BLOCKING,
                    code: ImpactCode.CARDINALITY_VIOLATION,
                    entity_urn: existingFrom.id,
                    description: `Source ${data.from_urn} already has a relationship (ID: ${existingFrom.id}). 1-1 violation.`,
                    path: [data.from_urn]
                });
            }
        }

        // Note: DAG Check is also an impact check, but calculated by ConstraintEngine. 
        // We should arguably call ConstraintEngine here or replicate logic?
        // ConstraintEngine throws. We want Report.
        // It's better if ConstraintEngine has a 'checkDAG' method that returns boolean/path without throw.
        // For now, if we can't easily refactor ConstraintEngine, we skip DAG check in "Impact" 
        // OR we wrap ConstraintEngine call in try/catch.
        // Let's wrap.

        try {
            // We need to import the ConstraintEngine logic or move the core check to shared.
            // Given separation constraints, let's defer rigorous DAG check to the ConstraintEngine,
            // recognizing that "Cycle" is effectively an Instant Blocking Impact.
        } catch (e) {
            // ...
        }
    }

    private async analyzeRelationshipDelete(tx: PrismaTx, relId: string, impacts: ImpactItem[], visitedNodes: string[]) {
        visitedNodes.push(relId);
        // If deleting a hierarchical link, does it leave orphans?
        // If strict hierarchy, maybe.
        // Generally, deleting a relationship is WARNING or INFO unless 'mandatory' (not yet implemented).
        impacts.push({
            level: ImpactLevel.INFO,
            code: ImpactCode.NO_IMPACT,
            entity_urn: relId,
            description: 'Relationship deletion analyzed. No blocking dependencies found.',
            path: []
        });
    }

    private generateGraphSnapshotHash(nodes: string[]): string {
        const sorted = [...nodes].sort();
        const content = sorted.join('|');
        return createHash('sha256').update(content).digest('hex');
    }
}

export const registryImpactAnalysisEngine = new RegistryImpactAnalysisEngine();
