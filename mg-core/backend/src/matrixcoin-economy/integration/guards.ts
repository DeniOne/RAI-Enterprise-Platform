/**
 * Economy Integration Guards
 * Module 08 — MatrixCoin-Economy
 * STEP 6 — INTEGRATION BOUNDARIES
 * 
 * ⚠️ STRICT ACCESS CONTROL
 * Enforces IntegrationMatrix.
 */

import { RequesterModule, IntegrationScope, IntegrationMatrix } from './matrix';

export class IntegrationAccessDeniedError extends Error {
    constructor(requester: string, scope: string) {
        super(`Access Denied for Requester [${requester}] on Scope [${scope}]`);
        this.name = 'IntegrationAccessDeniedError';
    }
}

export function guardIntegrationAccess(
    requester: RequesterModule,
    requiredScope: IntegrationScope
): void {
    const allowedScopes = IntegrationMatrix[requester];

    if (!allowedScopes || !allowedScopes.includes(requiredScope)) {
        throw new IntegrationAccessDeniedError(requester, requiredScope);
    }
}

export function guardContractCompliance<T>(
    data: T,
    validator: (d: T) => boolean
): void {
    if (!validator(data)) {
        throw new Error('Integration Data Contract Violation: Output shape mismatch.');
    }
}
