"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryFormService = exports.RegistryFormService = void 0;
const registry_schema_service_1 = require("./registry-schema.service");
const registry_access_engine_1 = require("../core/registry-access.engine");
const prisma_1 = require("../../config/prisma");
const registry_form_dto_1 = require("../dto/registry-form.dto");
const entity_schema_dto_1 = require("../dto/entity-schema.dto");
class RegistryFormService {
    async getFormProjection(entityTypeUrn, mode, user, entityUrn // Required for EDIT/VIEW
    ) {
        // 1. Fetch Schema (Raw) — no access control here, pruneSchema handles visibility
        const rawSchema = await registry_schema_service_1.registrySchemaService.getSchema(entityTypeUrn);
        // 2. Fetch Data (If EDIT/VIEW)
        let entityData = null;
        if ((mode === registry_form_dto_1.FormMode.EDIT || mode === registry_form_dto_1.FormMode.VIEW) && entityUrn) {
            entityData = await prisma_1.prisma.registryEntity.findUnique({ where: { urn: entityUrn } });
            if (!entityData)
                throw new Error(`Entity ${entityUrn} not found`);
        }
        // 3. Apply Visibility (Pruning)
        // This removes hidden attributes completely from the DTO
        const prunedSchema = registry_access_engine_1.registryAccessEngine.pruneSchema(user, rawSchema);
        // 4. Map to Form Projection
        const attributesSection = {
            title: 'General Information',
            fields: []
        };
        // Map Attributes
        for (const attr of prunedSchema.attributes) {
            const val = entityData ? entityData.attributes?.[attr.code] : (attr.default_value || null);
            attributesSection.fields.push(this.mapAttributeToField(attr, val, mode));
        }
        // TODO: Map Relationships to a separate section or fields
        // For simple forms, we might treat relationships as special fields or sub-lists.
        // Step 20 scope implies "Universal Form", usually covers inputs. 
        // Let's create a "Relations" section if relations exist.
        const relationsSection = {
            title: 'Connections',
            fields: []
        };
        // Reuse pruning for relations logic if available, currently schema service returns relationships
        // map relations... (omitted for brevity unless required by current strict scope)
        const sections = [attributesSection];
        if (relationsSection.fields.length > 0)
            sections.push(relationsSection);
        return {
            entity_type: entityTypeUrn,
            mode,
            title: `${this.capitalize(mode)} ${prunedSchema.entity_type.label}`,
            sections
        };
    }
    mapAttributeToField(attr, value, mode) {
        let widget = registry_form_dto_1.FormWidgetType.INPUT_TEXT;
        // 1. Determine Base Widget
        switch (attr.data_type) {
            case entity_schema_dto_1.RegistryAttributeType.BOOLEAN:
                widget = registry_form_dto_1.FormWidgetType.INPUT_BOOLEAN;
                break;
            case entity_schema_dto_1.RegistryAttributeType.INTEGER:
            case entity_schema_dto_1.RegistryAttributeType.DECIMAL:
                widget = registry_form_dto_1.FormWidgetType.INPUT_NUMBER;
                break;
            case entity_schema_dto_1.RegistryAttributeType.DATE:
            case entity_schema_dto_1.RegistryAttributeType.DATETIME:
                widget = registry_form_dto_1.FormWidgetType.INPUT_DATE;
                break;
            case entity_schema_dto_1.RegistryAttributeType.ENUM:
                widget = registry_form_dto_1.FormWidgetType.INPUT_SELECT;
                break;
            // TODO: JSON -> DOCUMENT? or specialized
        }
        // 2. Override for VIEW mode or Read-Only fields
        if (mode === registry_form_dto_1.FormMode.VIEW) {
            widget = registry_form_dto_1.FormWidgetType.STATIC_TEXT;
        }
        else if (mode === registry_form_dto_1.FormMode.EDIT && !attr.is_editable) {
            widget = registry_form_dto_1.FormWidgetType.STATIC_TEXT;
        }
        return {
            code: attr.code,
            label: attr.label,
            description: attr.description,
            required: attr.is_required,
            widget,
            val: value,
            config: {
                options: attr.enum_options
            }
        };
    }
    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }
}
exports.RegistryFormService = RegistryFormService;
exports.registryFormService = new RegistryFormService();
