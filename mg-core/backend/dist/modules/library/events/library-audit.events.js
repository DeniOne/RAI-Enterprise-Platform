"use strict";
// Module 29: Library & Archive - Audit Events
// CANON: All critical actions must emit audit events
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryAuditEvent = void 0;
var LibraryAuditEvent;
(function (LibraryAuditEvent) {
    LibraryAuditEvent["DOCUMENT_CREATED"] = "library.document_created";
    LibraryAuditEvent["VERSION_CREATED"] = "library.version_created";
    LibraryAuditEvent["ACTIVE_VERSION_CHANGED"] = "library.active_version_changed";
    LibraryAuditEvent["DOCUMENT_ARCHIVED"] = "library.document_archived";
    LibraryAuditEvent["DOCUMENT_DESTROYED"] = "library.document_destroyed";
    LibraryAuditEvent["RESTRICTED_ACCESS"] = "library.restricted_access";
})(LibraryAuditEvent || (exports.LibraryAuditEvent = LibraryAuditEvent = {}));
