"use strict";
/**
 * Economy Integration Matrix
 * Module 08 — MatrixCoin-Economy
 * STEP 6 — INTEGRATION BOUNDARIES
 *
 * ⚠️ STRICT PERMISSION MATRIX
 * Maps Requester -> Allowed Scope.
 * No Dynamic Permissions. Code-Level Versioned.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationMatrix = exports.IntegrationScope = exports.RequesterModule = void 0;
var RequesterModule;
(function (RequesterModule) {
    RequesterModule["ANALYTICS"] = "ANALYTICS";
    RequesterModule["AI_ADVISORY"] = "AI_ADVISORY";
    RequesterModule["OFS_HUMAN"] = "OFS_HUMAN";
    RequesterModule["SYSTEM_INTEGRITY"] = "SYSTEM_INTEGRITY";
    RequesterModule["UNKNOWN"] = "UNKNOWN";
})(RequesterModule || (exports.RequesterModule = RequesterModule = {}));
var IntegrationScope;
(function (IntegrationScope) {
    IntegrationScope["NONE"] = "NONE";
    IntegrationScope["AUDIT_AGGREGATED"] = "AUDIT_AGGREGATED";
    IntegrationScope["AUDIT_FULL"] = "AUDIT_FULL";
    IntegrationScope["GOVERNANCE_FLAGS"] = "GOVERNANCE_FLAGS";
    IntegrationScope["DECISION_READ"] = "DECISION_READ"; // Checking outcomes
})(IntegrationScope || (exports.IntegrationScope = IntegrationScope = {}));
// THE MATRIX
exports.IntegrationMatrix = {
    [RequesterModule.ANALYTICS]: [
        IntegrationScope.AUDIT_AGGREGATED
    ],
    [RequesterModule.AI_ADVISORY]: [
        IntegrationScope.GOVERNANCE_FLAGS // AI can see flags to suggest reviews, but NOT full audit
    ],
    [RequesterModule.OFS_HUMAN]: [
        IntegrationScope.AUDIT_FULL,
        IntegrationScope.GOVERNANCE_FLAGS,
        IntegrationScope.DECISION_READ
    ],
    [RequesterModule.SYSTEM_INTEGRITY]: [
        IntegrationScope.AUDIT_FULL,
        IntegrationScope.GOVERNANCE_FLAGS
    ],
    [RequesterModule.UNKNOWN]: []
};
