/**
 * Registry Type Definitions
 * 
 * Canonical types for Registry-Driven Architecture.
 * All entities, relations, and metadata are defined here.
 */

// =============================================================================
// ATTRIBUTE TYPES
// =============================================================================

export type RegistryAttributeType =
    | 'STRING'
    | 'INTEGER'
    | 'DECIMAL'
    | 'BOOLEAN'
    | 'DATE'
    | 'DATETIME'
    | 'ENUM'
    | 'JSON';

export type RegistryCardinality =
    | 'ONE_TO_ONE'
    | 'ONE_TO_MANY'
    | 'MANY_TO_ONE'
    | 'MANY_TO_MANY';

export type RegistryEntityClass =
    | 'core'
    | 'reference'
    | 'relation'
    | 'meta';

// =============================================================================
// ATTRIBUTE DEFINITION
// =============================================================================

export interface EnumOption {
    value: string;
    label: string;
}

export interface AttributeDefinition {
    name: string;
    type: RegistryAttributeType;
    required: boolean;
    unique?: boolean;
    description?: string;
    enum_options?: EnumOption[];
    default_value?: any;
}

// =============================================================================
// RELATIONSHIP DEFINITION
// =============================================================================

export interface RelationshipDefinition {
    name: string;
    target_entity_type_urn: string;
    cardinality: RegistryCardinality;
    required: boolean;
    description?: string;
    impact?: {
        type: 'blocking' | 'dependent' | 'informational';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description?: string;
    };
}

// =============================================================================
// ENTITY SCHEMA
// =============================================================================

export interface EntitySchema {
    attributes: AttributeDefinition[];
    relationships: RelationshipDefinition[];
}

// =============================================================================
// ENTITY TYPE DEFINITION (from JSON files)
// =============================================================================

export interface EntityTypeDefinition {
    urn: string;
    name: string;
    domain: string;
    class: RegistryEntityClass;
    description: string;
    lifecycle_fsm_urn: string;
    schema: EntitySchema;
    /**
     * Views definition (Forms, Tables, etc).
     * Weakly typed here to avoid circular dependency.
     * Validated by EntityCardGuard.
     */
    views?: Record<string, any>;
}

export interface EntityTypeFile {
    entity_type: EntityTypeDefinition;
}

// =============================================================================
// REGISTRY GRAPH
// =============================================================================

export interface RegistryNode {
    urn: string;
    definition: EntityTypeDefinition;
    outgoing: Map<string, RegistryEdge[]>;  // relationship name -> edges
    incoming: Map<string, RegistryEdge[]>;  // relationship name -> edges
}

export interface RegistryEdge {
    from_urn: string;
    to_urn: string;
    relationship_name: string;
    cardinality: RegistryCardinality;
    required: boolean;
}

// =============================================================================
// REGISTRY METADATA
// =============================================================================

export interface RegistryMetadata {
    version: string;
    loadedAt: Date;
    checksum: string;
    entityCount: number;
    relationCount: number;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationError {
    file: string;
    entity_urn?: string;
    field?: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

// =============================================================================
// REGISTRY INTERFACE (read-only contract)
// =============================================================================

export interface IRegistry {
    readonly metadata: RegistryMetadata;

    // Entity access
    getEntity(urn: string): EntityTypeDefinition | undefined;
    getAllEntities(): EntityTypeDefinition[];
    getEntitiesByDomain(domain: string): EntityTypeDefinition[];
    getEntitiesByClass(entityClass: RegistryEntityClass): EntityTypeDefinition[];

    // Graph traversal
    getOutgoingRelationships(urn: string): RelationshipDefinition[];
    getIncomingRelationships(urn: string): RelationshipDefinition[];
    getDependencies(urn: string): string[];  // entities this depends on
    getDependents(urn: string): string[];    // entities that depend on this

    // Validation
    hasEntity(urn: string): boolean;
}
