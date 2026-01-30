"use strict";
/**
 * Entity Card Builder
 *
 * Builds EntityCard from Registry Graph.
 * NO OTHER SOURCE ALLOWED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityCardBuilder = exports.EntityCardBuilder = void 0;
const crypto_1 = require("crypto");
const core_1 = require("../registry/core");
const logger_1 = require("../config/logger");
// =============================================================================
// WIDGET MAPPING
// =============================================================================
const TYPE_TO_WIDGET = {
    'STRING': 'text',
    'INTEGER': 'number',
    'DECIMAL': 'decimal',
    'BOOLEAN': 'boolean',
    'DATE': 'date',
    'DATETIME': 'datetime',
    'ENUM': 'select',
    'JSON': 'json'
};
const CARDINALITY_MAP = {
    'ONE_TO_ONE': '1:1',
    'ONE_TO_MANY': '1:N',
    'MANY_TO_ONE': 'N:1',
    'MANY_TO_MANY': 'M:N'
};
// =============================================================================
// ENTITY CARD BUILDER
// =============================================================================
class EntityCardBuilder {
    /**
     * Build EntityCard from Registry.
     * @throws Error if entity not found
     */
    build(entityType) {
        // Resolve URN
        const urn = this.resolveUrn(entityType);
        // Get entity from Registry
        const entity = core_1.Registry.getEntity(urn);
        if (!entity) {
            throw new Error(`[EntityCardBuilder] Entity not found: ${urn}`);
        }
        logger_1.logger.debug(`[EntityCardBuilder] Building card for: ${urn}`);
        // Build card components
        const attributes = this.buildAttributes(entity);
        const relations = this.buildRelations(entity, urn);
        const lifecycle = this.buildLifecycle(entity);
        const permissions = this.buildPermissions(entity);
        const metadata = this.buildMetadata(entity);
        // Calculate checksum
        const checksum = this.calculateChecksum(entity);
        const card = {
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
        logger_1.logger.debug(`[EntityCardBuilder] Card built: ${urn} (${attributes.length} attrs, ${relations.length} rels)`);
        return card;
    }
    /**
     * Build all entity cards
     */
    buildAll() {
        const entities = core_1.Registry.getAllEntities();
        return entities.map(e => this.build(e.urn));
    }
    // =========================================================================
    // PRIVATE: Build attributes
    // =========================================================================
    buildAttributes(entity) {
        const attrs = [];
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
    isReadonly(attr) {
        // Fields that are readonly by convention
        const readonlyFields = ['created_at', 'updated_at', 'created_by'];
        return readonlyFields.includes(attr.name);
    }
    getWidget(attr) {
        if (attr.type === 'STRING' && attr.name.includes('description')) {
            return 'textarea';
        }
        return TYPE_TO_WIDGET[attr.type] || 'text';
    }
    getGroup(attr) {
        // Group by naming convention
        if (attr.name.includes('date'))
            return 'dates';
        if (attr.name.includes('email') || attr.name.includes('phone'))
            return 'contacts';
        return 'general';
    }
    // =========================================================================
    // PRIVATE: Build relations
    // =========================================================================
    buildRelations(entity, urn) {
        const rels = [];
        let order = 0;
        for (const rel of entity.schema.relationships) {
            const targetEntity = core_1.Registry.getEntity(rel.target_entity_type_urn);
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
    buildLifecycle(entity) {
        // Standard FSM for all entities
        // In future, this can be read from FsmDefinition in Registry
        const states = [
            { code: 'draft', label: 'Черновик', color: '#9E9E9E', isFinal: false },
            { code: 'active', label: 'Активен', color: '#4CAF50', isFinal: false },
            { code: 'archived', label: 'Архив', color: '#F44336', isFinal: true }
        ];
        const transitions = {
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
    buildPermissions(entity) {
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
    buildMetadata(entity) {
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
    resolveUrn(entityType) {
        if (entityType.startsWith('urn:mg:')) {
            return entityType;
        }
        // Convert short name to full URN
        return `urn:mg:type:${entityType}`;
    }
    extractEntityName(urn) {
        const parts = urn.split(':');
        return parts[parts.length - 1];
    }
    toLabel(name) {
        // Convert snake_case to Title Case
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    calculateChecksum(entity) {
        const data = JSON.stringify({
            urn: entity.urn,
            schema: entity.schema,
            class: entity.class,
            domain: entity.domain
        });
        return (0, crypto_1.createHash)('sha256')
            .update(data)
            .digest('hex')
            .substring(0, 16);
    }
}
exports.EntityCardBuilder = EntityCardBuilder;
// =============================================================================
// SINGLETON
// =============================================================================
exports.entityCardBuilder = new EntityCardBuilder();
