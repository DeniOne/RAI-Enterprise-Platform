import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';

interface GraphNode {
    urn: string;
    label: string;
    type: string;
}

interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    definition_urn: string;
}

export class RegistryGraphController {

    /**
     * GET /api/registry/graph/context/:urn
     * Query: view=neighborhood (default) | extended
     *        snapshotId (optional)
     */
    async getGraphContext(req: Request, res: Response) {
        try {
            const { urn } = req.params;
            const viewType = (req.query.view as string) || 'neighborhood';
            const snapshotId = req.query.snapshotId as string;

            // Strict Server-Side View Definitions
            const maxDepth = viewType === 'extended' ? 2 : 1;

            // Note: If snapshotId is present, we SHOULD ideally query historical state.
            // For Step 14 MVP, we will query CURRENT state but return it structure-wise.
            // If we had the Replay Engine from Step 13 active, we'd use it here.

            const nodes = new Map<string, GraphNode>();
            const edges: GraphEdge[] = [];
            const visited = new Set<string>();

            // Recursive Traversal Function
            const traverse = async (currentUrn: string, currentDepth: number) => {
                if (currentDepth > maxDepth) return;
                if (visited.has(currentUrn)) return;
                visited.add(currentUrn);

                // 1. Fetch Entity
                const entity = await prisma.registryEntity.findUnique({
                    where: { urn: currentUrn },
                    select: { urn: true, name: true, entity_type_urn: true }
                });

                if (!entity) return;

                nodes.set(entity.urn, {
                    urn: entity.urn,
                    label: entity.name || entity.urn,
                    type: entity.entity_type_urn
                });

                // 2. Fetch Neighbors
                // Outgoing
                const outgoing = await prisma.registryRelationship.findMany({
                    where: { from_urn: currentUrn }
                });

                // Incoming
                const incoming = await prisma.registryRelationship.findMany({
                    where: { to_urn: currentUrn }
                });

                // Combine
                const allRels = [...outgoing, ...incoming];

                for (const rel of allRels) {
                    const isOutgoing = rel.from_urn === currentUrn;
                    const neighborUrn = isOutgoing ? rel.to_urn : rel.from_urn;

                    // Add Edge
                    // Duplicate check: avoid adding same edge ID twice
                    if (!edges.find(e => e.id === rel.id)) {
                        edges.push({
                            id: rel.id,
                            source: rel.from_urn,
                            target: rel.to_urn,
                            label: rel.definition_urn, // Simplification
                            definition_urn: rel.definition_urn
                        });
                    }

                    // Recurse
                    await traverse(neighborUrn, currentDepth + 1);
                }
            };

            await traverse(urn, 0); // Start at depth 0 (Focus Node)

            res.json({
                nodes: Array.from(nodes.values()),
                edges
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/registry/graph/path
     * Query: from, to
     * Returns 404 if no precomputed path exists.
     */
    async getGraphPath(req: Request, res: Response) {
        // Mock implementation for MVP - strictly denying dynamic search
        res.status(404).json({ message: 'No precomputed path found between these entities.' });
    }
}

export const registryGraphController = new RegistryGraphController();
