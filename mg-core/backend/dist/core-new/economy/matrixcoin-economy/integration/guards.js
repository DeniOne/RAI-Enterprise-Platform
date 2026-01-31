"use strict";
/**
 * Economy Integration Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 6 — INTEGRATION BOUNDARIES
 *
 * ⚠️ STRICT ACCESS CONTROL
 * Enforces IntegrationMatrix.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationAccessDeniedError = void 0;
exports.guardIntegrationAccess = guardIntegrationAccess;
exports.guardContractCompliance = guardContractCompliance;
const matrix_1 = require("./matrix");
class IntegrationAccessDeniedError extends Error {
    constructor(requester, scope) {
        super(`Access Denied for Requester [${requester}] on Scope [${scope}]`);
        this.name = 'IntegrationAccessDeniedError';
    }
}
exports.IntegrationAccessDeniedError = IntegrationAccessDeniedError;
function guardIntegrationAccess(requester, requiredScope) {
    const allowedScopes = matrix_1.IntegrationMatrix[requester];
    if (!allowedScopes || !allowedScopes.includes(requiredScope)) {
        throw new IntegrationAccessDeniedError(requester, requiredScope);
    }
}
function guardContractCompliance(data, validator) {
    if (!validator(data)) {
        throw new Error('Integration Data Contract Violation: Output shape mismatch.');
    }
}
