
export enum RegistryAttributeType {
    STRING = 'STRING',
    INTEGER = 'INTEGER',
    DECIMAL = 'DECIMAL',
    BOOLEAN = 'BOOLEAN',
    DATE = 'DATE',
    DATETIME = 'DATETIME',
    ENUM = 'ENUM',
    JSON = 'JSON'
}

export enum RegistryImpactLevel {
    BLOCKING = 'BLOCKING',
    WARNING = 'WARNING',
    INFO = 'INFO',
    NONE = 'NONE'
}

export interface EntityTypeDto {
    urn: string;
    label: string;
    description: string | null;
    module: string;
    is_abstract: boolean;
}

export interface AttributeDefinitionDto {
    urn: string;
    code: string;
    label: string;
    description: string | null;
    data_type: RegistryAttributeType;
    is_required: boolean;
    is_array: boolean;
    is_unique: boolean;
    is_editable: boolean; // From FSM or global rule
    default_value: any | null;
    validation_rules: any | null; // Regex, min/max, etc.
    ui_component: string | null; // Optional hint
    enum_options?: { label: string; value: string }[];
}

export interface RelationshipDefinitionDto {
    urn: string;
    code: string;
    label: string;
    target_entity_type_urn: string;
    cardinality: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
    is_required: boolean;
    is_editable: boolean;
}

export interface FsmStateDto {
    code: string;
    label: string;
    color: string | null;
    is_final: boolean;
}

export interface FsmTransitionDto {
    code: string;
    label: string;
    from_state_code: string;
    to_state_code: string;
    required_permission: string | null;
    ui_action_label: string | null;
}

export interface FsmDefinitionDto {
    urn: string;
    initial_state_code: string;
    states: FsmStateDto[];
    transitions: FsmTransitionDto[];
}

// The main aggregate DTO
export interface EntitySchemaDto {
    entity_type: EntityTypeDto;
    attributes: AttributeDefinitionDto[];
    relationships: RelationshipDefinitionDto[];
    fsm: FsmDefinitionDto | null;
}
