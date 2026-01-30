"use strict";
/**
 * Registry Graph
 *
 * In-memory graph structure for Registry entities.
 * Supports:
 * - O(1) entity lookup by URN
 * - Relationship traversal
 * - Dependency analysis
 * - Domain/class filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryGraph = void 0;
const logger_1 = require("../../config/logger");
// =============================================================================
// REGISTRY GRAPH IMPLEMENTATION
// =============================================================================
class RegistryGraph {
    nodes = new Map();
    _metadata;
    constructor(entities, checksum) {
        logger_1.logger.info(`[RegistryGraph] Building graph with ${entities.length} entities`);
        // 1. Create nodes for all entities
        for (const entity of entities) {
            this.nodes.set(entity.urn, {
                urn: entity.urn,
                definition: entity,
                outgoing: new Map(),
                incoming: new Map()
            });
        }
        // 2. Build edges from relationships
        let edgeCount = 0;
        for (const entity of entities) {
            const sourceNode = this.nodes.get(entity.urn);
            for (const rel of entity.schema.relationships) {
                const targetNode = this.nodes.get(rel.target_entity_type_urn);
                if (targetNode) {
                    const edge = {
                        from_urn: entity.urn,
                        to_urn: rel.target_entity_type_urn,
                        relationship_name: rel.name,
                        cardinality: rel.cardinality,
                        required: rel.required
                    };
                    // Add to outgoing edges of source
                    if (!sourceNode.outgoing.has(rel.name)) {
                        sourceNode.outgoing.set(rel.name, []);
                    }
                    sourceNode.outgoing.get(rel.name).push(edge);
                    // Add to incoming edges of target
                    if (!targetNode.incoming.has(rel.name)) {
                        targetNode.incoming.set(rel.name, []);
                    }
                    targetNode.incoming.get(rel.name).push(edge);
                    edgeCount++;
                }
            }
        }
        // 3. Set metadata
        this._metadata = {
            version: '1.0.0',
            loadedAt: new Date(),
            checksum,
            entityCount: entities.length,
            relationCount: edgeCount
        };
        logger_1.logger.info(`[RegistryGraph] Graph built: ${entities.length} nodes, ${edgeCount} edges`);
    }
    // =========================================================================
    // IRegistry implementation
    // =========================================================================
    get metadata() {
        return { ...this._metadata };
    }
    getEntity(urn) {
        return this.nodes.get(urn)?.definition;
    }
    getAllEntities() {
        return Array.from(this.nodes.values()).map(n => n.definition);
    }
    getEntitiesByDomain(domain) {
        return this.getAllEntities().filter(e => e.domain === domain);
    }
    getEntitiesByClass(entityClass) {
        return this.getAllEntities().filter(e => e.class === entityClass);
    }
    getOutgoingRelationships(urn) {
        const entity = this.getEntity(urn);
        return entity?.schema.relationships || [];
    }
    getIncomingRelationships(urn) {
        const node = this.nodes.get(urn);
        if (!node)
            return [];
        const result = [];
        for (const [relName, edges] of node.incoming) {
            for (const edge of edges) {
                const sourceEntity = this.getEntity(edge.from_urn);
                if (sourceEntity) {
                    const rel = sourceEntity.schema.relationships.find(r => r.name === relName);
                    if (rel)
                        result.push(rel);
                }
            }
        }
        return result;
    }
    getDependencies(urn) {
        const node = this.nodes.get(urn);
        if (!node)
            return [];
        const deps = new Set();
        for (const edges of node.outgoing.values()) {
            for (const edge of edges) {
                deps.add(edge.to_urn);
            }
        }
        return Array.from(deps);
    }
    getDependents(urn) {
        const node = this.nodes.get(urn);
        if (!node)
            return [];
        const deps = new Set();
        for (const edges of node.incoming.values()) {
            for (const edge of edges) {
                deps.add(edge.from_urn);
            }
        }
        return Array.from(deps);
    }
    hasEntity(urn) {
        return this.nodes.has(urn);
    }
    // =========================================================================
    // Additional graph traversal methods
    // =========================================================================
    /**
     * Get all entities that would be impacted by a change to the given entity.
     * Uses BFS to find all dependents (transitive).
     */
    getImpactedEntities(urn) {
        const impacted = new Set();
        const queue = [urn];
        while (queue.length > 0) {
            const current = queue.shift();
            const dependents = this.getDependents(current);
            for (const dep of dependents) {
                if (!impacted.has(dep) && dep !== urn) {
                    impacted.add(dep);
                    queue.push(dep);
                }
            }
        }
        return Array.from(impacted);
    }
    /**
     * Get all domains in the registry
     */
    getDomains() {
        const domains = new Set();
        for (const node of this.nodes.values()) {
            domains.add(node.definition.domain);
        }
        return Array.from(domains).sort();
    }
    /**
     * Get statistics about the registry
     */
    getStats() {
        const byClass = {};
        const byDomain = {};
        for (const node of this.nodes.values()) {
            const def = node.definition;
            byClass[def.class] = (byClass[def.class] || 0) + 1;
            byDomain[def.domain] = (byDomain[def.domain] || 0) + 1;
        }
        return {
            entities: this._metadata.entityCount,
            relations: this._metadata.relationCount,
            byClass,
            byDomain
        };
    }
}
exports.RegistryGraph = RegistryGraph;
