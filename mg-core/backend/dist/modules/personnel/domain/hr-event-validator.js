"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedEventError = exports.EVENT_ROLE_PERMISSIONS = void 0;
exports.validateActorRole = validateActorRole;
/**
 * Role-based Event Authorization (CANONICAL)
 * CRITICAL: Defines which roles can emit which HR events
 */
exports.EVENT_ROLE_PERMISSIONS = {
    // FACT events (one-time, immutable facts)
    EMPLOYEE_HIRED: ['DIRECTOR', 'HR_MANAGER'],
    EMPLOYEE_DISMISSED: ['DIRECTOR'],
    // STATE CHANGE events (FSM transitions)
    EMPLOYEE_TRANSFERRED: ['DIRECTOR', 'HR_MANAGER'],
    EMPLOYEE_PROMOTED: ['DIRECTOR', 'HR_MANAGER'],
    EMPLOYEE_DEMOTED: ['DIRECTOR'],
    EMPLOYEE_SUSPENDED: ['DIRECTOR'],
    DOCUMENT_UPLOADED: ['HR_SPECIALIST', 'HR_MANAGER', 'DIRECTOR'],
    DOCUMENT_VERIFIED: ['HR_MANAGER', 'DIRECTOR'],
    DOCUMENT_EXPIRED: ['SYSTEM'], // Auto-generated
    ORDER_CREATED: ['HR_SPECIALIST', 'HR_MANAGER'],
    ORDER_SIGNED: ['DIRECTOR'], // CRITICAL: Only DIRECTOR can sign
    ORDER_CANCELLED: ['DIRECTOR', 'HR_MANAGER'],
    CONTRACT_SIGNED: ['DIRECTOR', 'HR_MANAGER'],
    CONTRACT_AMENDED: ['DIRECTOR', 'HR_MANAGER'],
    CONTRACT_TERMINATED: ['DIRECTOR'],
    FILE_ARCHIVED: ['HR_MANAGER', 'DIRECTOR'],
};
/**
 * Unauthorized Event Error
 */
class UnauthorizedEventError extends Error {
    constructor(eventType, actorRole) {
        const allowedRoles = exports.EVENT_ROLE_PERMISSIONS[eventType];
        super(`Role '${actorRole}' not authorized for event '${eventType}'. ` +
            `Allowed roles: ${allowedRoles.join(', ')}`);
        this.name = 'UnauthorizedEventError';
    }
}
exports.UnauthorizedEventError = UnauthorizedEventError;
/**
 * Validate actor role for event emission
 * @throws {UnauthorizedEventError} if role is not authorized
 */
function validateActorRole(eventType, actorRole) {
    const allowedRoles = exports.EVENT_ROLE_PERMISSIONS[eventType];
    if (!allowedRoles || !allowedRoles.includes(actorRole)) {
        throw new UnauthorizedEventError(eventType, actorRole);
    }
}
