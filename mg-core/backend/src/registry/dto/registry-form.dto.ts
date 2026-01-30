import { RegistryAttributeType } from './entity-schema.dto';

export enum FormWidgetType {
    INPUT_TEXT = 'INPUT_TEXT',
    INPUT_NUMBER = 'INPUT_NUMBER',
    INPUT_DATE = 'INPUT_DATE',
    INPUT_BOOLEAN = 'INPUT_BOOLEAN',
    INPUT_SELECT = 'INPUT_SELECT',
    INPUT_REFERENCE = 'INPUT_REFERENCE',
    INPUT_DOCUMENT = 'INPUT_DOCUMENT',
    STATIC_TEXT = 'STATIC_TEXT', // For Read-Only / View Mode
    HIDDEN = 'HIDDEN' // Should generally be pruned, but if needed for logic
}

export enum FormMode {
    CREATE = 'CREATE',
    EDIT = 'EDIT',
    VIEW = 'VIEW'
}

export interface FormFieldDto {
    code: string;
    label: string;
    description: string | null;
    widget: FormWidgetType;
    required: boolean;
    val: any | null; // Current value (for Edit/View)
    config?: any; // Extra widget config (e.g. enum options)
}

export interface FormSectionDto {
    title: string;
    fields: FormFieldDto[];
}

export interface FormProjectionDto {
    entity_type: string;
    mode: FormMode;
    title: string;
    sections: FormSectionDto[];
}
