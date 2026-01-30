"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrySchemaService = exports.RegistrySchemaService = void 0;
const prisma_1 = require("../../config/prisma");
class RegistrySchemaService {
    // System URNs (Inferred - ideally should be in constants)
    SYS_REL_HAS_ATTRIBUTE = 'urn:mg:sys:rel:has_attribute';
    SYS_REL_HAS_RELATIONSHIP = 'urn:mg:sys:rel:has_outgoing_relation';
    SYS_REL_HAS_FSM = 'urn:mg:sys:rel:has_fsm';
    async getSchema(entityTypeUrn) {
        // Auto-resolve short URNs
        let resolvedUrn = entityTypeUrn;
        if (!entityTypeUrn.includes(':')) {
            const normalized = entityTypeUrn.replace(/-/g, '_');
            resolvedUrn = `urn:mg:type:${normalized}`;
        }
        // 1. Fetch Entity Type
        const entity = await prisma_1.prisma.registryEntity.findUnique({
            where: { urn: resolvedUrn }
        });
        if (!entity) {
            throw new Error(`Entity Type with URN ${resolvedUrn} not found`);
        }
        // 2. Extract Schema from JSON
        // The bootstrap service saves 'schema', 'views', etc. into the 'attributes' JSON column.
        const meta = entity.attributes;
        const schema = meta.schema || { attributes: [], relationships: [] };
        const fsmUrn = meta.lifecycle_fsm_urn || 'urn:mg:fsm:default:v1';
        // 3. Map Attributes
        // 3. Map Attributes
        const attributes = (schema.attributes || []).map((attr) => ({
            urn: attr.urn || `urn:mg:attr:${entity.name?.toLowerCase() || 'entity'}:${attr.name}`,
            code: attr.name,
            label: attr.ui?.label || attr.label || this.toLabel(attr.name),
            description: attr.description || null,
            data_type: attr.type,
            is_required: attr.required || false,
            is_array: attr.is_array || false,
            is_unique: attr.unique || false,
            is_editable: true,
            default_value: attr.default ?? null,
            validation_rules: attr.validation || null,
            ui_component: attr.ui?.widget || null,
            enum_options: attr.enum_options || []
        }));
        // 4. Map Relationships
        const relationships = (schema.relationships || []).map((rel) => ({
            urn: `urn:mg:rel:${entity.name?.toLowerCase() || 'entity'}:${rel.name}`,
            code: rel.name,
            label: rel.label || this.toLabel(rel.name),
            target_entity_type_urn: rel.target || rel.target_entity_type_urn,
            cardinality: rel.type || rel.cardinality || 'ONE_TO_MANY',
            is_required: rel.required || false,
            is_editable: true
        }));
        // 5. Fetch FSM (Optional - kept simple for now)
        let fsm = null;
        if (fsmUrn) {
            // We could fetch FSM entity but for now return ref
            fsm = {
                urn: fsmUrn,
                initial_state_code: 'draft',
                states: [],
                transitions: []
            };
        }
        return {
            entity_type: {
                urn: entity.urn,
                label: entity.name || entity.urn,
                description: entity.description || meta.description || null,
                module: meta.domain || 'system',
                is_abstract: false
            },
            attributes,
            relationships,
            fsm
        };
    }
    toLabel(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
exports.RegistrySchemaService = RegistrySchemaService;
exports.registrySchemaService = new RegistrySchemaService();
