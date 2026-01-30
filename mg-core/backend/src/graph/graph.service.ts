/**
 * Graph Service (Secure Core)
 * 
 * Implements read-only graph traversal based on Registry Views.
 * USES: EntityCardCache, EntityCardGraphGuard
 */

import { logger } from '../config/logger';
import { entityCardCache } from '../entity-cards/entity-card.cache';
import { entityCardGraphGuard } from './graph.guard';
import { Registry } from '../registry/core';
import { EntityCardGraphDefinition } from '../entity-cards/entity-card.types';

export interface GraphNodeDto {
    id: string;
    entityType: string;
    label: string;
    urn: string;
    // Data Minimization: No attributes!
}

export interface GraphEdgeDto {
    id: string;
    source: string;
    target: string;
    label: string;
    relation: string;
}

export interface GraphResponseDto {
    nodes: GraphNodeDto[];
    edges: GraphEdgeDto[];
}

export class GraphService {

    /**
     * Get Secure Graph (View-based)
     */
    getGraph(
        entityType: string,
        id: string,
        viewName: string
    ): GraphResponseDto {
        const rootCard = entityCardCache.get(entityType);
        const view = entityCardGraphGuard.validateTraversalContext(rootCard, viewName);
        return this.getGraphByDef(entityType, id, view);
    }

    /**
     * Generic Traversal (Used by ImpactService)
     */
    getGraphByDef(
        entityType: string,
        id: string,
        view: EntityCardGraphDefinition
    ): GraphResponseDto {
        // 3. Initialize Graph State
        const nodes = new Map<string, GraphNodeDto>();
        const edges: GraphEdgeDto[] = [];
        const visited = new Set<string>(); // URN-based visited set to prevent cycles
        // Format of visited: "entityType:id" is usually standard, but strictly URN-like unique ID better
        // For simplicity: `entityType:id`

        // 4. Trace Root (Mock Data for now, as we don't have DB connected to Registry Logic yet fully)
        // Ideally we fetch from DB via EntityService (which is TBD).
        // For Step 10, we will simulate data fetching or use a mock resolver if no DB.
        // WAIT: MatrixGin has DB (Prisma). But accessing generic entities dynamically requires mapping.
        // For this step, to prove the GRAPH LOGIC, I will use a simple "Stub" or "Mock" data fetcher 
        // that respects the traversal rules. Or better: use the 'registry' itself if we are traversing metadata?
        // NO, request is `getGraph(..., id, ...)`, implying runtime instances.

        // Since I cannot implement a full generic DB resolver in one step without context of DB schema for ALL entities,
        // I will implement the TRAVERSAL LOGIC assuming a `fetchInstance(type, id)` helper.
        // For the demo/walkthrough, I'll mock `fetchInstance`.

        const queue: { type: string; id: string; depth: number }[] = [];

        // Add Root
        const rootIdKey = `${entityType}:${id}`;
        visited.add(rootIdKey);
        queue.push({ type: entityType, id, depth: 0 });

        // Fetch root data (simulated)
        const rootInstance = this.fetchInstance(entityType, id);
        nodes.set(rootIdKey, {
            id: rootIdKey,
            entityType: entityType,
            label: rootInstance?.name || rootInstance?.label || `${entityType} ${id}`, // minimal label
            urn: `urn:mg:entity:${entityType}:${id}`
        });

        const maxDepth = view.depth || 1; // Default depth 1 (root + immediate neighbors)

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.depth >= maxDepth) continue;

            const currentCard = entityCardCache.get(current.type);
            // const currentInstance = this.fetchInstance(current.type, current.id); // Not used directly in traversal logic

            // Iterate Relations
            for (const rel of currentCard.relations) {
                // Check edge whitelist (ImpactService passes transient view with whitelists)
                if (!view.edges.includes(rel.name)) continue;

                // Check node whitelist (if present)
                const targetType = this.extractTypeName(rel.target);
                if (view.nodes && !view.nodes.includes(targetType)) continue;

                // If allowed, fetch related items
                const relatedItems = this.fetchRelated(current.type, current.id, rel.name);

                for (const item of relatedItems) {
                    const targetIdKey = `${targetType}:${item.id}`;

                    // Add Node if not exists
                    if (!nodes.has(targetIdKey)) {
                        nodes.set(targetIdKey, {
                            id: targetIdKey,
                            entityType: targetType,
                            label: item.name || item.label || `${targetType} ${item.id}`,
                            urn: `urn:mg:entity:${targetType}:${item.id}`
                        });

                        // Cycle check
                        if (!visited.has(targetIdKey)) {
                            visited.add(targetIdKey);
                            queue.push({ type: targetType, id: item.id, depth: current.depth + 1 });
                        }
                    }

                    // Add Edge
                    edges.push({
                        id: `${current.type}:${current.id}-${rel.name}-${targetIdKey}`,
                        source: current.type + ':' + current.id, // Consistent ID format needed
                        target: targetIdKey,
                        label: rel.ui.label,
                        relation: rel.name
                    });
                }
            }
        }

        return {
            nodes: Array.from(nodes.values()),
            edges
        };
    }

    private extractTypeName(urn: string): string {
        return urn.split(':').pop()!;
    }

    // =========================================================================
    // MOCK DATA FETCHERS (For Step 10 validation without full Generic ORM)
    // =========================================================================

    private fetchInstance(type: string, id: string): any {
        // TODO: Replace with Real Generic ORM
        return { id, name: `${type}_${id}` };
    }

    private fetchRelated(type: string, id: string, relation: string): any[] {
        // TODO: Replace with Real Generic ORM
        // Mocking structure: User -> Roles -> Permissions
        if (type === 'user_account' && relation === 'roles') return [{ id: 'admin' }, { id: 'editor' }];
        if (type === 'role' && id === 'admin' && relation === 'permissions') return [{ id: 'all' }, { id: 'sudo' }];
        if (type === 'role' && id === 'editor' && relation === 'permissions') return [{ id: 'read' }, { id: 'write' }];
        return [];
    }
}

export const graphService = new GraphService();
