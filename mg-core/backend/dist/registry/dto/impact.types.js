"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpactCode = exports.ImpactLevel = exports.ChangeType = void 0;
var ChangeType;
(function (ChangeType) {
    ChangeType["ENTITY_UPDATE"] = "ENTITY_UPDATE";
    ChangeType["ENTITY_LIFECYCLE_TRANSITION"] = "ENTITY_LIFECYCLE_TRANSITION";
    ChangeType["RELATIONSHIP_CREATE"] = "RELATIONSHIP_CREATE";
    ChangeType["RELATIONSHIP_DELETE"] = "RELATIONSHIP_DELETE";
    ChangeType["RELATIONSHIP_UPDATE"] = "RELATIONSHIP_UPDATE";
    ChangeType["ATTRIBUTE_DEFINITION_UPDATE"] = "ATTRIBUTE_DEFINITION_UPDATE";
    ChangeType["FSM_DEFINITION_UPDATE"] = "FSM_DEFINITION_UPDATE"; // For future use
})(ChangeType || (exports.ChangeType = ChangeType = {}));
var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["BLOCKING"] = "BLOCKING";
    ImpactLevel["WARNING"] = "WARNING";
    ImpactLevel["INFO"] = "INFO";
})(ImpactLevel || (exports.ImpactLevel = ImpactLevel = {}));
var ImpactCode;
(function (ImpactCode) {
    // Blocking
    ImpactCode["GRAPH_INTEGRITY_BREAK"] = "GRAPH_INTEGRITY_BREAK";
    ImpactCode["LIFECYCLE_BREAK"] = "LIFECYCLE_BREAK";
    ImpactCode["CARDINALITY_VIOLATION"] = "CARDINALITY_VIOLATION";
    ImpactCode["FSM_INVALIDATION"] = "FSM_INVALIDATION";
    // Warning
    ImpactCode["CARDINALITY_NARROWING"] = "CARDINALITY_NARROWING";
    ImpactCode["ORPHAN_RELATIONSHIP"] = "ORPHAN_RELATIONSHIP";
    // Info
    ImpactCode["METADATA_UPDATE"] = "METADATA_UPDATE";
    ImpactCode["NO_IMPACT"] = "NO_IMPACT";
})(ImpactCode || (exports.ImpactCode = ImpactCode = {}));
