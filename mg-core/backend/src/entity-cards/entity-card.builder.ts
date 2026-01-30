/**
 * Entity Card Builder
 * 
 * Builds EntityCard from Registry Graph.
 * NO OTHER SOURCE ALLOWED.
 */

import { createHash } from 'crypto';
import { Registry } from '../registry/core';
import {
    EntityCard,
    EntityCardAttribute,
    EntityCardRelation,
    EntityCardLifecycle,
    EntityCardPermissions,
    EntityCardMetadata,
    EntityCardWidget,
    EntityCardCardinality,
    EntityCardState
} from './entity-card.types';
import {
    EntityTypeDefinition,
    AttributeDefinition,
    RelationshipDefinition,
    RegistryCardinality
} from '../registry/core/registry.types';
import { logger } from '../config/logger';

// =============================================================================
// WIDGET MAPPING
// =============================================================================

const TYPE_TO_WIDGET: Record<string, EntityCardWidget> = {
    'STRING': 'text',
    'INTEGER': 'number',
    'DECIMAL': 'decimal',
    'BOOLEAN': 'boolean',
    'DATE': 'date',
    'DATETIME': 'datetime',
    'ENUM': 'select',
    'JSON': 'json'
};

const CARDINALITY_MAP: Record<RegistryCardinality, EntityCardCardinality> = {
    'ONE_TO_ONE': '1:1',
    'ONE_TO_MANY': '1:N',
    'MANY_TO_ONE': 'N:1',
    'MANY_TO_MANY': 'M:N'
};

// =============================================================================
// ENTITY CARD BUILDER
// =============================================================================

export class EntityCardBuilder {
    /**
     * Build EntityCard from Registry.
     * @throws Error if entity not found
     */
    build(entityType: string): EntityCard {
        // Resolve URN
        const urn = this.resolveUrn(entityType);

        // Get entity from Registry
        const entity = Registry.getEntity(urn);
        if (!entity) {
            throw new Error(`[EntityCardBuilder] Entity not found: ${urn}`);
        }

        logger.debug(`[EntityCardBuilder] Building card for: ${urn}`);

        // Build card components
        const attributes = this.buildAttributes(entity);
        const relations = this.buildRelations(entity, urn);
        const lifecycle = this.buildLifecycle(entity);
        const permissions = this.buildPermissions(entity);
        const metadata = this.buildMetadata(entity);

        // Calculate checksum
        const checksum = this.calculateChecksum(entity);

        const card: EntityCard = {
            entityType: this.extractEntityName(urn),
            urn,
            name: entity.name,
            attributes,
            relations,
            lifecycle,
            permissions,
            metadata,
            views: entity.views || {},
            checksum,
            builtAt: new Date().toISOString()
        };

        logger.debug(`[EntityCardBuilder] Card built: ${urn} (${attributes.length} attrs, ${relations.length} rels)`);

        return card;
    }

    /**
     * Build all entity cards
     */
    buildAll(): EntityCard[] {
        const entities = Registry.getAllEntities();
        return entities.map(e => this.build(e.urn));
    }

    // =========================================================================
    // PRIVATE: Build attributes
    // =========================================================================

    private buildAttributes(entity: EntityTypeDefinition): EntityCardAttribute[] {
        const attrs: EntityCardAttribute[] = [];
        let order = 0;

        for (const attr of entity.schema.attributes) {
            attrs.push({
                name: attr.name,
                type: attr.type,
                required: attr.required,
                readonly: this.isReadonly(attr),
                unique: attr.unique || false,
                enum: attr.enum_options?.map(opt => ({
                    value: opt.value,
                    label: opt.label
                })),
                default: attr.default_value,
                ui: {
                    label: this.toLabel(attr.name),
                    widget: this.getWidget(attr),
                    group: this.getGroup(attr),
                    order: order++,
                    placeholder: attr.description,
                    description: attr.description
                }
            });
        }

        return attrs;
    }

    private isReadonly(attr: AttributeDefinition): boolean {
        // Fields that are readonly by convention
        const readonlyFields = ['created_at', 'updated_at', 'created_by'];
        return readonlyFields.includes(attr.name);
    }

    private getWidget(attr: AttributeDefinition): EntityCardWidget {
        if (attr.type === 'STRING' && attr.name.includes('description')) {
            return 'textarea';
        }
        return TYPE_TO_WIDGET[attr.type] || 'text';
    }

    private getGroup(attr: AttributeDefinition): string {
        // Group by naming convention
        if (attr.name.includes('date')) return 'dates';
        if (attr.name.includes('email') || attr.name.includes('phone')) return 'contacts';
        return 'general';
    }

    // =========================================================================
    // PRIVATE: Build relations
    // =========================================================================

    private buildRelations(entity: EntityTypeDefinition, urn: string): EntityCardRelation[] {
        const rels: EntityCardRelation[] = [];
        let order = 0;

        for (const rel of entity.schema.relationships) {
            const targetEntity = Registry.getEntity(rel.target_entity_type_urn);

            rels.push({
                name: rel.name,
                target: rel.target_entity_type_urn,
                targetName: targetEntity?.name || this.extractEntityName(rel.target_entity_type_urn),
                cardinality: CARDINALITY_MAP[rel.cardinality],
                required: rel.required,
                readonly: false,
                kind: (rel.cardinality === 'ONE_TO_MANY' || rel.cardinality === 'MANY_TO_MANY') ? 'many' : 'one',
                direction: 'out', // Default direction
                impact: rel.impact,
                ui: {
                    label: this.toLabel(rel.name),
                    widget: 'relation',
                    order: order++,
                    description: rel.description
                }
            });
        }

        return rels;
    }

    // =========================================================================
    // PRIVATE: Build lifecycle
    // =========================================================================

    private buildLifecycle(entity: EntityTypeDefinition): EntityCardLifecycle {
        // Standard FSM for all entities
        // In future, this can be read from FsmDefinition in Registry
        const states: EntityCardState[] = [
            { code: 'draft', label: 'Черновик', color: '#9E9E9E', isFinal: false },
            { code: 'active', label: 'Активен', color: '#4CAF50', isFinal: false },
            { code: 'archived', label: 'Архив', color: '#F44336', isFinal: true }
        ];

        const transitions: Record<string, string[]> = {
            'draft': ['active'],
            'active': ['archived'],
            'archived': []
        };

        return {
            initialState: 'draft',
            states,
            transitions
        };
    }

    // =========================================================================
    // PRIVATE: Build permissions
    // =========================================================================

    private buildPermissions(entity: EntityTypeDefinition): EntityCardPermissions {
        // Generate permission codes based on entity URN
        const entityName = this.extractEntityName(entity.urn);
        const domain = entity.domain;

        return {
            create: [`${domain}:${entityName}:create`, `${domain}:admin`],
            read: [`${domain}:${entityName}:read`, `${domain}:admin`],
            update: [`${domain}:${entityName}:update`, `${domain}:admin`],
            delete: [`${domain}:${entityName}:delete`, `${domain}:admin`],
            archive: [`${domain}:${entityName}:archive`, `${domain}:admin`]
        };
    }

    // =========================================================================
    // PRIVATE: Build metadata
    // =========================================================================

    private buildMetadata(entity: EntityTypeDefinition): EntityCardMetadata {
        return {
            domain: entity.domain,
            class: entity.class,
            tags: [],
            description: entity.description,
            version: '1.0.0'
        };
    }

    // =========================================================================
    // PRIVATE: Helpers
    // =========================================================================

    private resolveUrn(entityType: string): string {
        if (entityType.startsWith('urn:mg:')) {
            return entityType;
        }
        // Convert short name to full URN
        return `urn:mg:type:${entityType}`;
    }

    private extractEntityName(urn: string): string {
        const parts = urn.split(':');
        return parts[parts.length - 1];
    }

    private toLabel(name: string): string {
        // Convert snake_case to Title Case
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private calculateChecksum(entity: EntityTypeDefinition): string {
        const data = JSON.stringify({
            urn: entity.urn,
            schema: entity.schema,
            class: entity.class,
            domain: entity.domain
        });

        return createHash('sha256')
            .update(data)
            .digest('hex')
            .substring(0, 16);
    }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const entityCardBuilder = new EntityCardBuilder();
