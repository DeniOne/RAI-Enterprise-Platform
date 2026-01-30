import { HREventType } from '@prisma/client';

/**
 * Role-based Event Authorization (CANONICAL)
 * CRITICAL: Defines which roles can emit which HR events
 */
export const EVENT_ROLE_PERMISSIONS: Record<HREventType, string[]> = {
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
export class UnauthorizedEventError extends Error {
    constructor(eventType: HREventType, actorRole: string) {
        const allowedRoles = EVENT_ROLE_PERMISSIONS[eventType];
        super(
            `Role '${actorRole}' not authorized for event '${eventType}'. ` +
            `Allowed roles: ${allowedRoles.join(', ')}`
        );
        this.name = 'UnauthorizedEventError';
    }
}

/**
 * Validate actor role for event emission
 * @throws {UnauthorizedEventError} if role is not authorized
 */
export function validateActorRole(
    eventType: HREventType,
    actorRole: string
): void {
    const allowedRoles = EVENT_ROLE_PERMISSIONS[eventType];

    if (!allowedRoles || !allowedRoles.includes(actorRole)) {
        throw new UnauthorizedEventError(eventType, actorRole);
    }
}
