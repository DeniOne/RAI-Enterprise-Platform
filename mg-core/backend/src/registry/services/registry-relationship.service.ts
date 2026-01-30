import { prisma } from '../../config/prisma';
import { registryConstraintEngine } from '../core/registry-constraint.engine';
import { registryImpactAnalysisEngine } from '../core/registry-impact.engine';
import { ChangeType, ImpactLevel } from '../dto/impact.types';
import { logger } from '../../config/logger';

interface CreateRelationshipDto {
    definition_urn: string;
    from_urn: string;
    to_urn: string;
    attributes?: any;
    force?: boolean;
    reason?: string;
}

export class RegistryRelationshipService {

    async createRelationship(dto: CreateRelationshipDto): Promise<any> {
        const { definition_urn, from_urn, to_urn, attributes, force, reason } = dto;

        // 1. Transaction Boundary
        return await prisma.$transaction(async (tx) => {

            // --- IMPACT ANALYSIS GATE ---
            const impactReport = await registryImpactAnalysisEngine.analyzeChange(
                tx,
                ChangeType.RELATIONSHIP_CREATE,
                to_urn,
                { from_urn, to_urn, definition_urn }
            );

            const blocking = impactReport.impacts.filter(i => i.level === ImpactLevel.BLOCKING);
            if (blocking.length > 0) {
                await tx.registryAuditEvent.create({
                    data: {
                        action: 'IMPACT_COMMIT_BLOCKED',
                        entity_urn: 'urn:mg:system:gate',
                        actor_urn: 'urn:mg:system:api',
                        payload: { reason: 'Blocking impacts found', impacts: blocking as any }
                    }
                });
                throw new Error(`Conflict: Operation blocked by Impact Analysis. ${blocking.length} blocking issues found.`);
            }

            const warnings = impactReport.impacts.filter(i => i.level === ImpactLevel.WARNING);
            if (warnings.length > 0) {
                if (!force || !reason) {
                    throw new Error(`Conflict: Operation has ${warnings.length} warnings. Require 'force: true' and 'reason'.`);
                }
                await tx.registryAuditEvent.create({
                    data: {
                        action: 'IMPACT_OVERRIDE_APPLIED',
                        entity_urn: 'urn:mg:system:gate',
                        actor_urn: 'urn:mg:system:api',
                        payload: { reason: reason, warnings: warnings as any }
                    }
                });
            }
            // -----------------------------

            // 2. Validate Metamodel (Definition)
            const definition = await tx.registryEntity.findUnique({
                where: { urn: definition_urn }
            });

            if (!definition) {
                throw new Error(`Relationship definition ${definition_urn} not found`);
            }

            // Core Invariant Check: Is Active?
            registryConstraintEngine.validateDefinitionState(definition);

            // 3. Validate Entities Exist
            const fromEntity = await tx.registryEntity.findUnique({ where: { urn: from_urn } });
            if (!fromEntity) throw new Error(`Source entity ${from_urn} not found`);

            const toEntity = await tx.registryEntity.findUnique({ where: { urn: to_urn } });
            if (!toEntity) throw new Error(`Target entity ${to_urn} not found`);

            // 3.1 Validate Entity Types against Definition
            const defAttrs = definition.attributes as any;
            if (defAttrs.from_entity_type_urn && fromEntity.entity_type_urn !== defAttrs.from_entity_type_urn) {
                // Relaxed check: Ideally should check hierarchy if entity types have inheritance.
                // For now, strict strict equality or skip if definition allows 'any' (unlikely).
                throw new Error(`Source entity type ${fromEntity.entity_type_urn} does not match definition requirement ${defAttrs.from_entity_type_urn}`);
            }
            if (defAttrs.to_entity_type_urn && toEntity.entity_type_urn !== defAttrs.to_entity_type_urn) {
                throw new Error(`Target entity type ${toEntity.entity_type_urn} does not match definition requirement ${defAttrs.to_entity_type_urn}`);
            }

            // 4. Validate Cardinality
            const cardinality = defAttrs.cardinality; // '1-1', '1-n', 'n-n'

            if (cardinality === '1-1' || cardinality === '1-n') {
                // Cannot have multiple TO for same FROM? No, wait.
                // 1-n means One FROM can have Many TOs (Parent->Children).
                // Or does it mean One FROM relates to One TO?
                // Standard notation: Source-Target.
                // 1-n: Source can relate to N targets? Usually "One-to-Many".
                // BUT usually in DB modeling: Parent(1) has Child(N).
                // The relationship is usually stored on Child pointing to Parent.
                // Here we store Edges.
                // If 1-n (One Source to Many Targets), then Source can appear multiple times as FROM? Yes.
                // But Target can appear only ONCE as TO? Correct. (Child has only 1 parent).

                // Let's implement Strict interpretation:
                // 1-1: Source unique in FROM, Target unique in TO.
                // 1-n: Target unique in TO (Each child has 1 parent). Source can be multiple in FROM.
                // n-1: Source unique in FROM (Each child has 1 parent). Target can be multiple in TO.
                // n-n: No uniqueness constraints.

                // Let's assume 1-n means "One From, Many To" -> A single parent has many children.
                // This implies a Child (To) can only be linked to ONE Parent (From)?
                // Actually, "1-to-many" usually describes the FROM side.
                // Let's stick to standard Graph edge logic.
                // If I am a Parent, I can have many Children.
                // Does it mean a Child can have many Parents? No, that would be n-n.
                // So 1-n implies: FROM is 1, TO is N. 
                // Wait, cardinality is tricky.
                // Let's implement: 
                // 1-1: Check if `from_urn` exists in FROM OR `to_urn` exists in TO.
                // 1-n: Check if `to_urn` exists in TO (Target can only be target once).

                if (cardinality === '1-1') {
                    const existingFrom = await tx.registryRelationship.findFirst({ where: { definition_urn, from_urn } });
                    if (existingFrom) throw new Error(`Cardinality violation 1-1: Source ${from_urn} already has a relationship`);

                    const existingTo = await tx.registryRelationship.findFirst({ where: { definition_urn, to_urn: to_urn } }); // Fix: to_urn: to_urn
                    if (existingTo) throw new Error(`Cardinality violation 1-1: Target ${to_urn} already has a relationship`);
                }
                else if (cardinality === '1-n') {
                    // One Source -> Many Targets? Or Many Sources -> One Target?
                    // If standard Parent-Child (1 Parent, N Children).
                    // Parent is From, Child is To.
                    // Can Child have multiple Parents? No.
                    // So To must be unique.
                    const existingTo = await tx.registryRelationship.findFirst({ where: { definition_urn, to_urn: to_urn } });
                    if (existingTo) throw new Error(`Cardinality violation 1-n: Target ${to_urn} already has a parent/source`);
                }
            }

            // 5. Core DAG Enforcement (Invariant)
            // This throws 409 if cycle detected
            await registryConstraintEngine.enforceDAGConstraint(tx, from_urn, to_urn, definition_urn);

            // 6. Insert
            const relationship = await tx.registryRelationship.create({
                data: {
                    definition_urn,
                    from_urn,
                    to_urn,
                    attributes
                }
            });

            // 7. Audit
            await tx.registryAuditEvent.create({
                data: {
                    action: 'RELATIONSHIP_CREATED',
                    entity_urn: relationship.id, // Or maybe from_urn? No, use rel ID.
                    actor_urn: 'urn:mg:system:api', // TODO: user context
                    payload: {
                        definition: definition_urn,
                        from: from_urn,
                        to: to_urn
                    }
                }
            });

            return relationship;
        });
    }

    async updateRelationship(id: string, dto: { from_urn?: string; to_urn?: string; attributes?: any; force?: boolean; reason?: string }): Promise<any> {
        const { from_urn, to_urn, attributes, force, reason } = dto;

        return await prisma.$transaction(async (tx) => {
            const currentRel = await tx.registryRelationship.findUnique({ where: { id } });
            if (!currentRel) throw new Error('Relationship not found');

            // If Re-parenting (Target Change) or Re-sourcing (Source Change)
            const isMove = (to_urn && to_urn !== currentRel.to_urn) || (from_urn && from_urn !== currentRel.from_urn);

            if (isMove) {
                const newTo = to_urn || currentRel.to_urn;
                const newFrom = from_urn || currentRel.from_urn;

                // Analyze Impact as a "New" Relationship creation
                const impactReport = await registryImpactAnalysisEngine.analyzeChange(
                    tx,
                    ChangeType.RELATIONSHIP_CREATE,
                    newTo,
                    { from_urn: newFrom, to_urn: newTo, definition_urn: currentRel.definition_urn }
                );

                const blocking = impactReport.impacts.filter(i => i.level === ImpactLevel.BLOCKING);
                if (blocking.length > 0) {
                    await tx.registryAuditEvent.create({
                        data: {
                            action: 'IMPACT_COMMIT_BLOCKED',
                            entity_urn: 'urn:mg:system:gate',
                            actor_urn: 'urn:mg:system:api',
                            payload: { reason: 'Blocking impacts (Update/Move)', impacts: blocking as any }
                        }
                    });
                    throw new Error(`Conflict: Move blocked by Impact Analysis. ${blocking.length} blocking issues.`);
                }

                const warnings = impactReport.impacts.filter(i => i.level === ImpactLevel.WARNING);
                if (warnings.length > 0 && (!force || !reason)) {
                    throw new Error(`Conflict: Move has ${warnings.length} warnings. Require 'force: true'.`);
                }

                // Validation: Entities Exist
                if (to_urn) {
                    const toEntity = await tx.registryEntity.findUnique({ where: { urn: to_urn } });
                    if (!toEntity) throw new Error(`Target entity ${to_urn} not found`);
                }
                if (from_urn) {
                    const fromEntity = await tx.registryEntity.findUnique({ where: { urn: from_urn } });
                    if (!fromEntity) throw new Error(`Source entity ${from_urn} not found`);
                }

                // DAG check (Strict)
                await registryConstraintEngine.enforceDAGConstraint(tx, newFrom, newTo, currentRel.definition_urn);
            }

            // Execute Update
            const updated = await tx.registryRelationship.update({
                where: { id },
                data: {
                    to_urn: to_urn || undefined,
                    from_urn: from_urn || undefined,
                    attributes: attributes || undefined
                }
            });

            // Audit
            await tx.registryAuditEvent.create({
                data: {
                    action: 'RELATIONSHIP_UPDATED',
                    entity_urn: id,
                    actor_urn: 'urn:mg:system:api',
                    payload: {
                        old_target: currentRel.to_urn, new_target: to_urn,
                        old_source: currentRel.from_urn, new_source: from_urn,
                        override: force
                    }
                }
            });

            return updated;
        });
    }

    async deleteRelationship(id: string, force?: boolean, reason?: string): Promise<any> {
        return await prisma.$transaction(async (tx) => {
            const impactReport = await registryImpactAnalysisEngine.analyzeChange(
                tx,
                ChangeType.RELATIONSHIP_DELETE,
                id
            );

            const blocking = impactReport.impacts.filter(i => i.level === ImpactLevel.BLOCKING);
            if (blocking.length > 0) {
                throw new Error(`Conflict: Delete blocked by Impact Analysis.`);
            }

            const deleted = await tx.registryRelationship.delete({ where: { id } });

            await tx.registryAuditEvent.create({
                data: {
                    action: 'RELATIONSHIP_DELETED',
                    entity_urn: id,
                    actor_urn: 'urn:mg:system:api',
                    payload: { reason }
                }
            });

            return deleted;
        });
    }

    async getRelationships(definitionUrn?: string, fromUrn?: string, toUrn?: string) {
        return prisma.registryRelationship.findMany({
            where: {
                definition_urn: definitionUrn,
                from_urn: fromUrn,
                to_urn: toUrn
            }
        });
    }
}

export const registryRelationshipService = new RegistryRelationshipService();
