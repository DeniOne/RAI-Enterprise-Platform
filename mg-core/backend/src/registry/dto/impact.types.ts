export enum ChangeType {
    ENTITY_UPDATE = 'ENTITY_UPDATE', // For entity attribute updates
    ENTITY_LIFECYCLE_TRANSITION = 'ENTITY_LIFECYCLE_TRANSITION',
    RELATIONSHIP_CREATE = 'RELATIONSHIP_CREATE',
    RELATIONSHIP_DELETE = 'RELATIONSHIP_DELETE',
    RELATIONSHIP_UPDATE = 'RELATIONSHIP_UPDATE',
    ATTRIBUTE_DEFINITION_UPDATE = 'ATTRIBUTE_DEFINITION_UPDATE', // For future use
    FSM_DEFINITION_UPDATE = 'FSM_DEFINITION_UPDATE' // For future use
}

export enum ImpactLevel {
    BLOCKING = 'BLOCKING',
    WARNING = 'WARNING',
    INFO = 'INFO'
}

export enum ImpactCode {
    // Blocking
    GRAPH_INTEGRITY_BREAK = 'GRAPH_INTEGRITY_BREAK',    // Breaking graph connectivity or constraints
    LIFECYCLE_BREAK = 'LIFECYCLE_BREAK',             // Invalid state transition or archiving dependencies
    CARDINALITY_VIOLATION = 'CARDINALITY_VIOLATION',   // Violating 1-1, 1-N rules
    FSM_INVALIDATION = 'FSM_INVALIDATION',             // Entity state not allowed by FSM

    // Warning
    CARDINALITY_NARROWING = 'CARDINALITY_NARROWING',   // e.g. 1-N -> 1-1 (Risky if data exists)
    ORPHAN_RELATIONSHIP = 'ORPHAN_RELATIONSHIP',       // Relationship left dangling (if soft delete)

    // Info
    METADATA_UPDATE = 'METADATA_UPDATE',
    NO_IMPACT = 'NO_IMPACT'
}

export interface ImpactItem {
    level: ImpactLevel;
    code: ImpactCode;
    entity_urn: string;
    description: string;
    path: string[]; // Traversal path [A, B, C]
}

export interface ImpactReport {
    summary: {
        blocking: number;
        warning: number;
        info: number;
    };
    graph_snapshot_hash: string; // Hash of the traversal state
    impacts: ImpactItem[];
}

export interface ImpactPreviewDto {
    change_type: ChangeType;
    target_urn: string;
    proposed_data?: any;
    force?: boolean; // Only for Warnings
    reason?: string; // Required if force=true
}
