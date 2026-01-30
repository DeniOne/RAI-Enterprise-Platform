/**
 * Entity Card Graph Guard (Step 10 Security)
 * 
 * Enforces strict security rules for Graph Traversal:
 * - Validates view match with requested entity
 * - Enforces node whitelisting
 * - Enforces relation whitelisting
 */

import { EntityCard, EntityCardGraphDefinition } from '../entity-cards/entity-card.types';
import { logger } from '../config/logger';

export class EntityCardGraphGuard {

    /**
     * Validate traversal request context.
     * Ensures the view exists, is a graph view, and matches the root entity type.
     */
    validateTraversalContext(
        card: EntityCard,
        viewName: string
    ): EntityCardGraphDefinition {
        const view = card.views[viewName];

        if (!view) {
            throw new Error(`Graph view "${viewName}" not found for entity ${card.entityType}`);
        }

        if (view.type !== 'graph') {
            throw new Error(`View "${viewName}" is not a graph view (type: ${view.type})`);
        }

        if (view.root !== card.entityType) {
            // Strict security rule: Root Match
            throw new Error(`Security Violation: View "${viewName}" declares root "${view.root}" but was requested for "${card.entityType}"`);
        }

        return view as EntityCardGraphDefinition;
    }

    /**
     * Validate Edge Traversal
     * Checks if:
     * 1. Relation is allowed in View Edges Whitelist
     * 2. Target Entity Type is allowed in View Nodes Whitelist
     */
    validateEdgeTraversal(
        view: EntityCardGraphDefinition,
        relationName: string,
        targetEntityType: string
    ): boolean {
        // 1. Edge Whitelist
        if (!view.edges.includes(relationName)) {
            return false;
        }

        // 2. Node Whitelist
        if (!view.nodes.includes(targetEntityType)) {
            return false;
        }

        return true;
    }
}

export const entityCardGraphGuard = new EntityCardGraphGuard();
