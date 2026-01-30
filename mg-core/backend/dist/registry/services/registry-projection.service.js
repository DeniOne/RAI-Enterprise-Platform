"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryProjectionService = exports.RegistryProjectionService = void 0;
const prisma_1 = require("../../config/prisma");
/**
 * Registry Projection Service
 *
 * Responsible for maintaining Read-Only Graph Projections (Views).
 * These are materialized views of the Registry Graph, optimized for fast traversals.
 *
 * ARCHITECTURE LAW:
 * - Read-Only: This service creates/updates Projections, but never creates/updates Core.
 * - Derived: All data is sourced from Registry Core (Relationships).
 * - Eventual Consistency: Projections are updated after Core mutations.
 */
class RegistryProjectionService {
    static instance;
    // Core Definitions
    DEF_PARENT_ORG_UNIT = 'urn:mg:def:ofs:parent_org_unit';
    DEF_OWNS_WALLET = 'urn:mg:def:economy:owns_wallet';
    constructor() { }
    static getInstance() {
        if (!RegistryProjectionService.instance) {
            RegistryProjectionService.instance = new RegistryProjectionService();
        }
        return RegistryProjectionService.instance;
    }
    /**
     * Refreshes the Org Structure Projection (Flattened Hierarchy).
     * Rebuilds the materialized path for all or a specific subtree.
     *
     * @param rootUrn Optional root to refresh subtree for. If null, strict full rebuild (expensive).
     * @param snapshotHash The Core Snapshot hash triggering this build.
     */
    async refreshOrgStructure(snapshotHash, rootUrn) {
        // Logic:
        // 1. Fetch recursively from Core using BFS/DFS.
        // 2. Compute Path string.
        // 3. Upsert to Projection Table.
        // MVP: Full rebuild for simplicity (assuming small graph size for now).
        // For production: Incremental update based on Changed Node.
        // 1. Clear existing projection for this snapshot/scope? 
        // Or upsert. Upsert is safer for partial.
        // Simulating loading the entire org tree from Registry Relationships
        // We find all relationships of type PARENT_ORG_UNIT
        // Then build the tree in memory and write flattening.
        // Fetch ALL parent-child links
        const relationships = await prisma_1.prisma.registryRelationship.findMany({
            where: {
                definition_urn: this.DEF_PARENT_ORG_UNIT
            }
        });
        // Build Adjacency List: Parent -> Children
        const adj = new Map(); // Parent -> Children
        const validNodes = new Set(); // All nodes involved
        for (const r of relationships) {
            // Relation: Child -> Parent (Source -> Target for PARENT_ORG_UNIT)
            // Wait, usually PARENT_ORG_UNIT implies Parent IS THE TARGET?
            // "Department A has Parent Department B". 
            // So From: Child, To: Parent.
            const child = r.from_urn;
            const parent = r.to_urn;
            if (!adj.has(parent))
                adj.set(parent, []);
            adj.get(parent)?.push(child);
            validNodes.add(child);
            validNodes.add(parent);
        }
        // Identify Roots (Nodes with no parent)
        // A node is a root if it is never a 'from' in this relationship type.
        const childrenSet = new Set(relationships.map(r => r.from_urn));
        const roots = Array.from(validNodes).filter(n => !childrenSet.has(n));
        // Traverse and Build Projection
        const updates = [];
        const traverse = (currentUrn, path, depth, root) => {
            const currentPath = path ? `${path}/${currentUrn}` : `/${currentUrn}`;
            updates.push({
                urn: currentUrn,
                path: currentPath,
                depth: depth,
                parent_urn: path.split('/').pop() || null, // simplified
                root_urn: root,
                snapshot_hash: snapshotHash
            });
            const children = adj.get(currentUrn) || [];
            for (const child of children) {
                traverse(child, currentPath, depth + 1, root);
            }
        };
        for (const root of roots) {
            traverse(root, '', 0, root);
        }
        // Batch Write (Prisma doesn't support generic bulk upsert freely, looping for MVP)
        // In Prod: createMany with skipDuplicates or raw SQL.
        // We will distinct by URN.
        await prisma_1.prisma.$transaction(updates.map(u => prisma_1.prisma.registryOrgProjection.upsert({
            where: { urn: u.urn },
            create: { ...u },
            update: { ...u }
        })));
    }
    /**
     * Refreshes Ownership Projections (User -> Wallet/Asset).
     */
    async refreshOwnershipMap(snapshotHash) {
        // Fetch all OWNS_WALLET relationships
        const wallets = await prisma_1.prisma.registryRelationship.findMany({
            where: {
                definition_urn: this.DEF_OWNS_WALLET
            }
        });
        // From: User, To: Wallet
        const updates = wallets.map(r => ({
            owner_urn: r.from_urn,
            asset_urn: r.to_urn,
            asset_type: 'wallet',
            relation_urn: r.id,
            snapshot_hash: snapshotHash
        }));
        await prisma_1.prisma.$transaction(updates.map(u => prisma_1.prisma.registryOwnerProjection.upsert({
            where: { owner_urn_asset_urn: { owner_urn: u.owner_urn, asset_urn: u.asset_urn } },
            create: { ...u },
            update: { ...u }
        })));
    }
}
exports.RegistryProjectionService = RegistryProjectionService;
exports.registryProjectionService = RegistryProjectionService.getInstance();
