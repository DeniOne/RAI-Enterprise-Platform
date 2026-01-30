"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryEntityController = exports.RegistryEntityController = void 0;
const prisma_1 = require("../../config/prisma");
const registry_access_engine_1 = require("../core/registry-access.engine");
const registry_error_factory_1 = require("../core/registry-error.factory"); // Step 17 Factory
const registry_mutation_service_1 = require("../services/registry-mutation.service"); // Step 20 Service
/**
 * Registry Entity Controller
 *
 * Serves pure READ-ONLY projections of Entities.
 * Includes Core Data, Attributes, and Relationships.
 * NO computed logic. NO side effects.
 */
class RegistryEntityController {
    /**
     * GET /api/registry/entities
     * Returns list of entities by entity_type_urn.
     * Query: ?type=urn:mg:type:role&limit=50&offset=0
     */
    async list(req, res) {
        try {
            const { type, limit = '50', offset = '0', search } = req.query;
            const user = req.user;
            if (!type || typeof type !== 'string') {
                res.status(400).json({ message: 'Query parameter "type" is required' });
                return;
            }
            // Normalize: kebab-case to snake_case (e.g., "policy-rule" -> "policy_rule")
            let resolvedUrn = type;
            if (!type.includes(':')) {
                const normalized = type.replace(/-/g, '_');
                resolvedUrn = `urn:mg:type:${normalized}`;
            }
            // Build where clause
            const where = {
                entity_type_urn: resolvedUrn,
                is_active: true
            };
            // Optional search filter
            if (search && typeof search === 'string') {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { urn: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [entities, total] = await Promise.all([
                prisma_1.prisma.registryEntity.findMany({
                    where,
                    take: Math.min(parseInt(limit), 100),
                    skip: parseInt(offset),
                    orderBy: { updated_at: 'desc' }
                }),
                prisma_1.prisma.registryEntity.count({ where })
            ]);
            // Map to response format expected by UI
            const data = entities.map(e => ({
                id: e.urn, // use urn as id for UI compatibility
                urn: e.urn,
                code: e.attributes?.code || e.urn.split(':').pop(),
                name: e.name || e.attributes?.name || e.urn,
                description: e.description || e.attributes?.description,
                lifecycle_status: e.fsm_state,
                created_at: e.created_at.toISOString(),
                updated_at: e.updated_at.toISOString()
            }));
            res.json({ data, total });
        }
        catch (error) {
            console.error('Error in RegistryEntityController.list:', error);
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/registry/entities/:urn
     * Returns full entity view: core, attributes, relationships.
     */
    async getOne(req, res) {
        try {
            const { urn } = req.params;
            const user = req.user;
            // 1. Visibility Check (Entity Level)
            // canViewEntity(user, urn, type) - type is unknown initially, pass wildcard or look up first?
            // Actually standard flow: Look up entity -> Check access -> Return.
            // But we want to fail 404 if hidden.
            // Let's optimize: fetch raw -> check -> throw 404 if hidden.
            // 2. Fetch Entity (Raw)
            const entity = await prisma_1.prisma.registryEntity.findUnique({
                where: { urn }
            });
            if (!entity) {
                throw registry_error_factory_1.RegistryErrorFactory.entityNotFound();
            }
            const canView = registry_access_engine_1.registryAccessEngine.canViewEntity(user, urn, entity.entity_type_urn);
            if (!canView) {
                // FAIL CLOSED: Return 404
                throw registry_error_factory_1.RegistryErrorFactory.entityNotFound();
            }
            // 2b. Fetch Relationships (Outgoing & Incoming)
            const [outgoing, incoming] = await Promise.all([
                prisma_1.prisma.registryRelationship.findMany({ where: { from_urn: urn } }),
                prisma_1.prisma.registryRelationship.findMany({ where: { to_urn: urn } })
            ]);
            // 3. Construct Result
            const relationships = {
                outgoing,
                incoming
            };
            const result = {
                urn: entity.urn,
                entity_type_urn: entity.entity_type_urn, // Correct field name
                name: entity.urn,
                attributes: entity.attributes,
                relationships
            };
            // Re-apply pruning from AccessEngine which might strip attributes
            const prunedResult = registry_access_engine_1.registryAccessEngine.pruneEntityData(user, result);
            res.json(prunedResult);
        }
        catch (error) {
            console.error('Error in RegistryEntityController.getOne:', error);
            const status = error.statusCode || 500;
            res.status(status).json({ message: error.message });
        }
    }
    /**
     * GET /api/registry/entities/:type/:id
     * Returns entity by type and id (urn constructed as type:id).
     */
    async getById(req, res) {
        try {
            const { type, id } = req.params;
            // Try direct lookup first (if id is full urn)
            let entity = await prisma_1.prisma.registryEntity.findUnique({
                where: { urn: id }
            });
            // If not found, try constructing urn from type:id
            if (!entity) {
                const constructedUrn = `${type}:${id}`;
                entity = await prisma_1.prisma.registryEntity.findUnique({
                    where: { urn: constructedUrn }
                });
            }
            if (!entity) {
                res.status(404).json({ message: 'Entity not found' });
                return;
            }
            // Map to UI format
            res.json({
                id: entity.urn,
                urn: entity.urn,
                code: entity.attributes?.code || entity.urn.split(':').pop(),
                name: entity.name || entity.attributes?.name || entity.urn,
                description: entity.description || entity.attributes?.description,
                lifecycle_status: entity.fsm_state,
                attributes: entity.attributes,
                created_at: entity.created_at.toISOString(),
                updated_at: entity.updated_at.toISOString()
            });
        }
        catch (error) {
            console.error('Error in RegistryEntityController.getById:', error);
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * POST /api/registry/entities
     * Creates a new entity.
     */
    async create(req, res) {
        try {
            const { type, attributes, code, name, description } = req.body;
            const user = req.user;
            if (!type) {
                res.status(400).json({ message: 'Field "type" is required' });
                return;
            }
            // Build attributes object
            const entityAttributes = {
                ...attributes,
                code: code || attributes?.code,
                name: name || attributes?.name,
                description: description || attributes?.description
            };
            const entity = await registry_mutation_service_1.registryMutationService.createEntity(type, entityAttributes, user);
            // Return in UI-compatible format
            res.status(201).json({
                id: entity.urn,
                urn: entity.urn,
                code: entityAttributes.code || entity.urn.split(':').pop(),
                name: entityAttributes.name || entity.urn,
                description: entityAttributes.description,
                lifecycle_status: entity.fsm_state,
                created_at: entity.created_at.toISOString(),
                updated_at: entity.updated_at.toISOString()
            });
        }
        catch (error) {
            console.error('Error in RegistryEntityController.create:', error);
            const status = error.statusCode || 500;
            res.status(status).json({ message: error.message });
        }
    }
    /**
     * PUT /api/registry/entities/:urn
     * Full update of an existing entity.
     */
    async update(req, res) {
        try {
            const { urn } = req.params;
            const { attributes } = req.body;
            const user = req.user;
            // TODO: Access Control for Update
            const entity = await registry_mutation_service_1.registryMutationService.updateEntity(urn, attributes, user);
            res.json(entity);
        }
        catch (error) {
            console.error('Error in RegistryEntityController.update:', error);
            const status = error.statusCode || 500;
            res.status(status).json({ message: error.message });
        }
    }
    /**
     * PATCH /api/registry/entities/:type/:id
     * Partial update of an existing entity.
     */
    async partialUpdate(req, res) {
        try {
            const { type, id } = req.params;
            const { name, description, ...attributes } = req.body;
            const user = req.user;
            // Find entity by id (which is urn)
            const existing = await prisma_1.prisma.registryEntity.findUnique({
                where: { urn: id }
            });
            if (!existing) {
                res.status(404).json({ message: 'Entity not found' });
                return;
            }
            // Merge attributes
            const newAttributes = {
                ...existing.attributes,
                ...attributes
            };
            if (name)
                newAttributes.name = name;
            if (description)
                newAttributes.description = description;
            const entity = await prisma_1.prisma.registryEntity.update({
                where: { urn: id },
                data: {
                    name: name || existing.name,
                    description: description || existing.description,
                    attributes: newAttributes
                }
            });
            // Audit log
            await prisma_1.prisma.registryAuditEvent.create({
                data: {
                    entity_urn: entity.urn,
                    action: 'UPDATE',
                    actor_urn: user?.id ? `urn:mg:user:${user.id}` : 'system',
                    payload: { changes: req.body }
                }
            });
            res.json({
                id: entity.urn,
                urn: entity.urn,
                code: entity.attributes?.code || entity.urn.split(':').pop(),
                name: entity.name || entity.attributes?.name,
                description: entity.description,
                lifecycle_status: entity.fsm_state,
                updated_at: entity.updated_at.toISOString()
            });
        }
        catch (error) {
            console.error('Error in RegistryEntityController.partialUpdate:', error);
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * POST /api/registry/entities/:type/:id/lifecycle
     * Execute lifecycle transition: activate | archive
     */
    async lifecycle(req, res) {
        try {
            const { type, id } = req.params;
            const { action } = req.body; // 'activate' | 'archive'
            const user = req.user;
            if (!action || !['activate', 'archive'].includes(action)) {
                res.status(400).json({ message: 'Action must be "activate" or "archive"' });
                return;
            }
            const newState = action === 'activate' ? 'active' : 'archived';
            const entity = await prisma_1.prisma.registryEntity.update({
                where: { urn: id },
                data: {
                    fsm_state: newState,
                    is_active: action === 'activate'
                }
            });
            // Audit log
            await prisma_1.prisma.registryAuditEvent.create({
                data: {
                    entity_urn: entity.urn,
                    action: 'LIFECYCLE_TRANSITION',
                    actor_urn: user?.id ? `urn:mg:user:${user.id}` : 'system',
                    payload: { from: action === 'activate' ? 'archived' : 'active', to: newState }
                }
            });
            res.json({
                id: entity.urn,
                urn: entity.urn,
                lifecycle_status: entity.fsm_state,
                updated_at: entity.updated_at.toISOString()
            });
        }
        catch (error) {
            console.error('Error in RegistryEntityController.lifecycle:', error);
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/registry/entities/:type/:id/audit
     * Returns audit log for entity.
     */
    async audit(req, res) {
        try {
            const { type, id } = req.params;
            const events = await prisma_1.prisma.registryAuditEvent.findMany({
                where: { entity_urn: id },
                orderBy: { created_at: 'desc' },
                take: 50
            });
            res.json({
                data: events.map(e => ({
                    id: e.id,
                    action: e.action,
                    actor: e.actor_urn,
                    payload: e.payload,
                    timestamp: e.created_at.toISOString()
                })),
                total: events.length
            });
        }
        catch (error) {
            console.error('Error in RegistryEntityController.audit:', error);
            res.status(500).json({ message: error.message });
        }
    }
}
exports.RegistryEntityController = RegistryEntityController;
exports.registryEntityController = new RegistryEntityController();
