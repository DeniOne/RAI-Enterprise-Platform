// Module 29: Library & Archive - Audit Events
// CANON: All critical actions must emit audit events

export enum LibraryAuditEvent {
    DOCUMENT_CREATED = 'library.document_created',
    VERSION_CREATED = 'library.version_created',
    ACTIVE_VERSION_CHANGED = 'library.active_version_changed',
    DOCUMENT_ARCHIVED = 'library.document_archived',
    DOCUMENT_DESTROYED = 'library.document_destroyed',
    RESTRICTED_ACCESS = 'library.restricted_access',
}

export interface DocumentCreatedEvent {
    documentId: string;
    title: string;
    documentType: string;
    actorId: string;
    timestamp: Date;
}

export interface VersionCreatedEvent {
    versionId: string;
    documentId: string;
    version: string;
    storageRef: string;
    checksum: string;
    actorId: string;
    timestamp: Date;
}

export interface ActiveVersionChangedEvent {
    documentId: string;
    oldVersionId: string | null;
    newVersionId: string;
    actorId: string;
    timestamp: Date;
}

export interface DocumentArchivedEvent {
    documentId: string;
    reason: string;
    actorId: string;
    timestamp: Date;
}

export interface DocumentDestroyedEvent {
    documentId: string;
    legalBasis: string;
    approvedBy: string;
    timestamp: Date;
}

export interface RestrictedAccessEvent {
    documentId: string;
    actorId: string;
    action: string;
    denied: boolean;
    reason: string;
    timestamp: Date;
}
