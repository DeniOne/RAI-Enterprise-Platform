import { registrySchemaService } from './registry-schema.service';
import { registryAccessEngine } from '../core/registry-access.engine';
import { registryEntityController } from '../controllers/registry-entity.controller'; // Need service-level access ideally, refactor if needed. Using prisma directly for data fetch is cleaner here.
import { prisma } from '../../config/prisma';
import { FormProjectionDto, FormMode, FormSectionDto, FormFieldDto, FormWidgetType } from '../dto/registry-form.dto';
import { RegistryAttributeType, AttributeDefinitionDto } from '../dto/entity-schema.dto';

export class RegistryFormService {

    async getFormProjection(
        entityTypeUrn: string,
        mode: FormMode,
        user: any,
        entityUrn?: string // Required for EDIT/VIEW
    ): Promise<FormProjectionDto> {

        // 1. Fetch Schema (Raw) — no access control here, pruneSchema handles visibility
        const rawSchema = await registrySchemaService.getSchema(entityTypeUrn);

        // 2. Fetch Data (If EDIT/VIEW)
        let entityData: any = null;
        if ((mode === FormMode.EDIT || mode === FormMode.VIEW) && entityUrn) {
            entityData = await prisma.registryEntity.findUnique({ where: { urn: entityUrn } });
            if (!entityData) throw new Error(`Entity ${entityUrn} not found`);
        }

        // 3. Apply Visibility (Pruning)
        // This removes hidden attributes completely from the DTO
        const prunedSchema = registryAccessEngine.pruneSchema(user, rawSchema);

        // 4. Map to Form Projection
        const attributesSection: FormSectionDto = {
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
        const relationsSection: FormSectionDto = {
            title: 'Connections',
            fields: []
        };
        // Reuse pruning for relations logic if available, currently schema service returns relationships
        // map relations... (omitted for brevity unless required by current strict scope)

        const sections = [attributesSection];
        if (relationsSection.fields.length > 0) sections.push(relationsSection);

        return {
            entity_type: entityTypeUrn,
            mode,
            title: `${this.capitalize(mode)} ${prunedSchema.entity_type.label}`,
            sections
        };
    }

    private mapAttributeToField(attr: AttributeDefinitionDto, value: any, mode: FormMode): FormFieldDto {
        let widget = FormWidgetType.INPUT_TEXT;

        // 1. Determine Base Widget
        switch (attr.data_type) {
            case RegistryAttributeType.BOOLEAN: widget = FormWidgetType.INPUT_BOOLEAN; break;
            case RegistryAttributeType.INTEGER:
            case RegistryAttributeType.DECIMAL: widget = FormWidgetType.INPUT_NUMBER; break;
            case RegistryAttributeType.DATE:
            case RegistryAttributeType.DATETIME: widget = FormWidgetType.INPUT_DATE; break;
            case RegistryAttributeType.ENUM: widget = FormWidgetType.INPUT_SELECT; break;
            // TODO: JSON -> DOCUMENT? or specialized
        }

        // 2. Override for VIEW mode or Read-Only fields
        if (mode === FormMode.VIEW) {
            widget = FormWidgetType.STATIC_TEXT;
        } else if (mode === FormMode.EDIT && !attr.is_editable) {
            widget = FormWidgetType.STATIC_TEXT;
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

    private capitalize(s: string) {
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }
}

export const registryFormService = new RegistryFormService();
