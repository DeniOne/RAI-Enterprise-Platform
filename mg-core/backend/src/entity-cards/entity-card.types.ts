/**
 * Entity Card Types
 * 
 * UI-agnostic contract for Entity Cards.
 * Built ONLY from Registry Graph.
 * Used by Backend, Frontend, and AI Core.
 */

// =============================================================================
// UI WIDGET TYPES
// =============================================================================

export type EntityCardWidget =
    | 'text'
    | 'textarea'
    | 'number'
    | 'decimal'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'select'
    | 'relation'
    | 'json'

// =============================================================================
// TABLE VIEW TYPES (Step 8)
// =============================================================================

export type EntityCardDataType = 'string' | 'number' | 'date' | 'datetime' | 'enum' | 'boolean' | 'json';

// Table Renderers
export type EntityCardRendererType = 'text' | 'badge' | 'date' | 'datetime' | 'link' | 'actions' | 'progress';

// Form Widgets (Step 9)
export type EntityCardWidgetType = 'text' | 'textarea' | 'number' | 'decimal' | 'date' | 'datetime' | 'select' | 'relation' | 'boolean' | 'json';

export interface EntityCardTableColumn {
    /** Field name from attribute or relation */
    field: string;

    /** Column header label */
    label: string;

    /** Data type (for sorting/formatting logic) */
    dataType: EntityCardDataType;

    /** Visual renderer (optional, inferred from dataType if missing) */
    renderer?: EntityCardRendererType;

    /** Specific renderer options (e.g. badge colors) */
    rendererOptions?: Record<string, any>;

    /** Is sortable (security contract: API will reject sort if false) */
    sortable?: boolean;

    hidden?: boolean;
    width?: number;
}

export interface EntityCardTableSort {
    field: string;
    order: 'asc' | 'desc';
}

export interface EntityCardTableDefinition {
    type: 'table'; // Discriminator
    columns: EntityCardTableColumn[];
    defaultSort?: EntityCardTableSort;
    pageSize?: number;
}

// =============================================================================
// FORM VIEW TYPES (Step 9)
// =============================================================================

export interface EntityCardFormField {
    /** Field name (attribute code or relation name) */
    field: string;

    /** Data Type (Registry Semantics) */
    dataType: EntityCardDataType;

    /** Validation: Required field */
    required?: boolean;

    /** Security: Readonly field (Backend rejects changes) */
    readonly?: boolean;

    /** UI Configuration (Hints only) */
    ui?: {
        label?: string;
        widget?: EntityCardWidgetType;
        placeholder?: string;
        description?: string;

        /** Visual visibility only. Hidden fields are NOT accepted by Backend. */
        hidden?: boolean;

        group?: string;
        order?: number;
    };
}

export interface EntityCardFormSubmit {
    action: 'create' | 'update';
    endpoint?: string;
}

export interface EntityCardFormDefinition {
    type: 'form'; // Discriminator
    mode: 'create' | 'read' | 'update';
    fields: EntityCardFormField[];
    submit?: EntityCardFormSubmit;
}

// =============================================================================
// GRAPH VIEW TYPES (Step 10)
// =============================================================================

export interface EntityCardGraphDefinition {
    type: 'graph';          // Discriminator
    root: string;           // Root entity type
    nodes: string[];        // Allowed entity types to include (Whitelist)
    edges: string[];        // Allowed relationship names to traverse (Whitelist)
    depth?: number;         // Max traversal depth (backend forced default 1)
    layout?: 'dagre' | 'force';
}

export interface EntityCardGraphDefinition {
    type: 'graph';          // Discriminator
    root: string;           // Root entity type
    nodes: string[];        // Allowed entity types to include (Whitelist)
    edges: string[];        // Allowed relationship names to traverse (Whitelist)
    depth?: number;         // Max traversal depth (backend forced default 1)
    layout?: 'dagre' | 'force';
}

// =============================================================================
// IMPACT VIEW TYPES (Step 11)
// =============================================================================

export interface EntityCardImpactDefinition {
    type: 'impact';         // Discriminator
    root: string;
    edges: string[];        // Edge Whitelist
    maxDepth?: number;      // Hard limit
    include?: string[];     // Impact types to include
    groupBy?: 'severity' | 'type';
}

export type EntityCardView = EntityCardTableDefinition | EntityCardFormDefinition | EntityCardGraphDefinition | EntityCardImpactDefinition;

// =============================================================================
// ATTRIBUTE CARD
// =============================================================================

export interface EntityCardAttribute {
    /** Attribute name (code) */
    name: string;

    /** Data type from Registry */
    type: string;

    /** Is required for create/update */
    required: boolean;

    /** Cannot be modified after creation */
    readonly: boolean;

    /** Must be unique across all instances */
    unique: boolean;

    /** Enum values if type = ENUM */
    enum?: EntityCardEnumOption[];

    /** Default value */
    default?: any;

    /** UI rendering hints */
    ui: {
        /** Display label */
        label: string;

        /** Widget type for rendering */
        widget: EntityCardWidgetType;

        /** Group name for form sections */
        group?: string;

        /** Display order within group */
        order: number;

        /** Placeholder text */
        placeholder?: string;

        /** Help text / tooltip */
        description?: string;
    };
}

export interface EntityCardEnumOption {
    value: string;
    label: string;
}

// =============================================================================
// RELATION CARD
// =============================================================================

export type EntityCardCardinality = '1:1' | '1:N' | 'N:1' | 'M:N';

export interface EntityCardRelation {
    /** Relation name */
    name: string;

    /** Target entity URN */
    target: string;

    /** Target entity type name (for display) */
    targetName: string;

    /** Cardinality type */
    cardinality: EntityCardCardinality;

    /** Is required */
    required: boolean;

    /** Cannot be modified after creation */
    readonly: boolean;

    /** Relation Kind (derived) */
    kind: 'one' | 'many';

    /** Join entity for M:N relations */
    via?: string;

    /** Direction of relation */
    direction: 'out' | 'in';

    /** Impact Metadata (Step 11) */
    impact?: {
        type: 'blocking' | 'dependent' | 'informational';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description?: string;
    };

    /** UI rendering hints */
    ui: {
        label: string;
        widget: 'relation';
        order: number;
        description?: string;
    };
}

// =============================================================================
// LIFECYCLE CARD
// =============================================================================

export interface EntityCardLifecycle {
    /** Current state (for instance) or initial state (for type) */
    initialState: string;

    /** All possible states */
    states: EntityCardState[];

    /** Allowed transitions from each state */
    transitions: Record<string, string[]>;
}

export interface EntityCardState {
    code: string;
    label: string;
    color?: string;
    isFinal: boolean;
}

// =============================================================================
// PERMISSIONS CARD
// =============================================================================

export interface EntityCardPermissions {
    /** Roles/permissions required for create */
    create: string[];

    /** Roles/permissions required for read */
    read: string[];

    /** Roles/permissions required for update */
    update: string[];

    /** Roles/permissions required for delete */
    delete: string[];

    /** Roles/permissions required for archive */
    archive: string[];
}

// =============================================================================
// METADATA
// =============================================================================

export interface EntityCardMetadata {
    /** Domain this entity belongs to */
    domain: string;

    /** Entity class (core, reference, relation, meta) */
    class: string;

    /** Tags for categorization */
    tags: string[];

    /** Description from Registry */
    description: string;

    /** Version of the entity definition */
    version: string;
}

// =============================================================================
// ENTITY CARD (MAIN CONTRACT)
// =============================================================================

export interface EntityCard {
    /** Entity type name (e.g., "person", "role") */
    entityType: string;

    /** Full URN */
    urn: string;

    /** Human-readable name */
    name: string;

    /** All attributes from Registry */
    attributes: EntityCardAttribute[];

    /** All relations from Registry Graph */
    relations: EntityCardRelation[];

    /** Lifecycle FSM */
    lifecycle: EntityCardLifecycle;

    /** Views (Table & Form) */
    views: {
        /** Namespaced views: table.*, form.* with Discriminated Union */
        [viewName: string]: EntityCardView;
    };

    /** Permission requirements */
    permissions: EntityCardPermissions;

    /** Entity metadata */
    metadata: EntityCardMetadata;

    /** Checksum for cache invalidation */
    checksum: string;

    /** Build timestamp */
    builtAt: string;
}

// =============================================================================
// API RESPONSE
// =============================================================================

export interface EntityCardResponse {
    entityType: string;
    card: EntityCard;
}

export interface EntityCardListResponse {
    cards: EntityCard[];
    total: number;
}

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface EntityCardValidationError {
    field: string;
    rule: string;
    message: string;
    value?: any;
}

export interface EntityCardValidationResult {
    valid: boolean;
    errors: EntityCardValidationError[];
}
