import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { registryAccessEngine } from '../core/registry-access.engine';
import { RegistryErrorFactory } from '../core/registry-error.factory'; // Step 17 Factory
import { registryMutationService } from '../services/registry-mutation.service'; // Step 20 Service

/**
 * Registry Entity Controller
 * 
 * Serves pure READ-ONLY projections of Entities.
 * Includes Core Data, Attributes, and Relationships.
 * NO computed logic. NO side effects.
 */
export class RegistryEntityController {

    /**
     * GET /api/registry/entities
     * Returns list of entities by entity_type_urn.
     * Query: ?type=urn:mg:type:role&limit=50&offset=0
     */
    async list(req: Request, res: Response) {
        try {
            const { type, limit = '50', offset = '0', search } = req.query;
            const user = req.user as any;

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
            const where: any = {
                entity_type_urn: resolvedUrn
            };

            // By default, showing all for Registry Management. 
            // In public modules, we would filter by is_active.

            // Optional search filter
            if (search && typeof search === 'string') {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { urn: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [entities, total] = await Promise.all([
                prisma.registryEntity.findMany({
                    where,
                    take: Math.min(parseInt(limit as string), 100),
                    skip: parseInt(offset as string),
                    orderBy: { updated_at: 'desc' }
                }),
                prisma.registryEntity.count({ where })
            ]);

            // Map to response format expected by UI
            const data = entities.map(e => ({
                id: e.urn, // use urn as id for UI compatibility
                urn: e.urn,
                code: (e.attributes as any)?.code || e.urn.split(':').pop(),
                name: e.name || (e.attributes as any)?.name || e.urn,
                description: e.description || (e.attributes as any)?.description,
                lifecycle_status: e.fsm_state,
                created_at: e.created_at.toISOString(),
                updated_at: e.updated_at.toISOString()
            }));

            res.json({ data, total });
        } catch (error: any) {
            console.error('Error in RegistryEntityController.list:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/registry/entities/:urn
     * Returns full entity view: core, attributes, relationships.
     */
    async getOne(req: Request, res: Response) {
        try {
            const { urn } = req.params;
            const user = req.user as any;

            // 1. Visibility Check (Entity Level)
            // canViewEntity(user, urn, type) - type is unknown initially, pass wildcard or look up first?
            // Actually standard flow: Look up entity -> Check access -> Return.
            // But we want to fail 404 if hidden.
            // Let's optimize: fetch raw -> check -> throw 404 if hidden.

            // 2. Fetch Entity (Raw)
            const entity = await prisma.registryEntity.findUnique({
                where: { urn }
            });

            if (!entity) {
                throw RegistryErrorFactory.entityNotFound();
            }

            const canView = registryAccessEngine.canViewEntity(user, urn, entity.entity_type_urn);
            if (!canView) {
                // FAIL CLOSED: Return 404
                throw RegistryErrorFactory.entityNotFound();
            }

            // 2b. Fetch Relationships (Outgoing & Incoming)
            const [outgoing, incoming] = await Promise.all([
                prisma.registryRelationship.findMany({ where: { from_urn: urn } }),
                prisma.registryRelationship.findMany({ where: { to_urn: urn } })
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
            const prunedResult = registryAccessEngine.pruneEntityData(user, result as any);

            res.json(prunedResult);


        } catch (error: any) {
            console.error('Error in RegistryEntityController.getOne:', error);
            const status = error.statusCode || 500;
            res.status(status).json({ message: error.message });
        }
    }


    /**
     * GET /api/registry/entities/:type/:id
     * Returns entity by type and id (urn constructed as type:id).
     */
    async getById(req: Request, res: Response) {
        try {
            const { type, id } = req.params;

            // Try direct lookup first (if id is full urn)
            let entity = await prisma.registryEntity.findUnique({
                where: { urn: id }
            });

            // If not found, try constructing urn from type:id
            if (!entity) {
                const constructedUrn = `${type}:${id}`;
                entity = await prisma.registryEntity.findUnique({
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
                code: (entity.attributes as any)?.code || entity.urn.split(':').pop(),
                name: entity.name || (entity.attributes as any)?.name || entity.urn,
                description: entity.description || (entity.attributes as any)?.description,
                lifecycle_status: entity.fsm_state,
                attributes: entity.attributes,
                created_at: entity.created_at.toISOString(),
                updated_at: entity.updated_at.toISOString()
            });
        } catch (error: any) {
            console.error('Error in RegistryEntityController.getById:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * POST /api/registry/entities
     * Creates a new entity.
     */
    async create(req: Request, res: Response) {
        try {
            const { type, attributes, code, name, description } = req.body;
            const user = req.user as any;

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

            const entity = await registryMutationService.createEntity(type, entityAttributes, user);

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
        } catch (error: any) {
            console.error('Error in RegistryEntityController.create:', error);
            const status = error.statusCode || 500;
            res.status(status).json({ message: error.message });
        }
    }

    /**
     * PUT /api/registry/entities/:urn
     * Full update of an existing entity.
     */
    async update(req: Request, res: Response) {
        try {
            const { urn } = req.params;
            const { attributes } = req.body;
            const user = req.user as any;

            // TODO: Access Control for Update

            const entity = await registryMutationService.updateEntity(urn, attributes, user);
            res.json(entity);
        } catch (error: any) {
            console.error('Error in RegistryEntityController.update:', error);
            const status = error.statusCode || 500;
            res.status(status).json({ message: error.message });
        }
    }

    /**
     * PATCH /api/registry/entities/:type/:id
     * Partial update of an existing entity.
     */
    async partialUpdate(req: Request, res: Response) {
        try {
            const { type, id } = req.params;
            const { name, description, ...attributes } = req.body;
            const user = req.user as any;

            // Find entity by id (which is urn)
            const existing = await prisma.registryEntity.findUnique({
                where: { urn: id }
            });

            if (!existing) {
                res.status(404).json({ message: 'Entity not found' });
                return;
            }

            // Merge attributes
            const newAttributes = {
                ...(existing.attributes as object),
                ...attributes
            };
            if (name) (newAttributes as any).name = name;
            if (description) (newAttributes as any).description = description;

            const entity = await prisma.registryEntity.update({
                where: { urn: id },
                data: {
                    name: name || existing.name,
                    description: description || existing.description,
                    attributes: newAttributes
                }
            });

            // Audit log
            await prisma.registryAuditEvent.create({
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
                code: (entity.attributes as any)?.code || entity.urn.split(':').pop(),
                name: entity.name || (entity.attributes as any)?.name,
                description: entity.description,
                lifecycle_status: entity.fsm_state,
                updated_at: entity.updated_at.toISOString()
            });
        } catch (error: any) {
            console.error('Error in RegistryEntityController.partialUpdate:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * POST /api/registry/entities/:type/:id/lifecycle
     * Execute lifecycle transition: activate | archive
     */
    async lifecycle(req: Request, res: Response) {
        try {
            const { type, id } = req.params;
            const { action } = req.body; // 'activate' | 'archive'
            const user = req.user as any;

            if (!action || !['activate', 'archive'].includes(action)) {
                res.status(400).json({ message: 'Action must be "activate" or "archive"' });
                return;
            }

            const newState = action === 'activate' ? 'active' : 'archived';

            const entity = await prisma.registryEntity.update({
                where: { urn: id },
                data: {
                    fsm_state: newState,
                    is_active: action === 'activate'
                }
            });

            // Audit log
            await prisma.registryAuditEvent.create({
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
        } catch (error: any) {
            console.error('Error in RegistryEntityController.lifecycle:', error);
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/registry/entities/:type/:id/audit
     * Returns audit log for entity.
     */
    async audit(req: Request, res: Response) {
        try {
            const { type, id } = req.params;

            const events = await prisma.registryAuditEvent.findMany({
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
        } catch (error: any) {
            console.error('Error in RegistryEntityController.audit:', error);
            res.status(500).json({ message: error.message });
        }
    }

}

export const registryEntityController = new RegistryEntityController();

