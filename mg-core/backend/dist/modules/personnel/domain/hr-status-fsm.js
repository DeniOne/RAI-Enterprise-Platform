"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRStatusFSMError = exports.HR_STATUS_TRANSITIONS = void 0;
exports.validateHRStatusTransition = validateHRStatusTransition;
exports.isTerminalStatus = isTerminalStatus;
/**
 * Canonical FSM Transition Map for HR Status
 * CRITICAL: This is the ONLY source of truth for valid HR status transitions
 */
exports.HR_STATUS_TRANSITIONS = {
    ONBOARDING: ['PROBATION', 'EMPLOYED', 'TERMINATED'],
    PROBATION: ['EMPLOYED', 'TERMINATED'],
    EMPLOYED: ['SUSPENDED', 'LEAVE', 'TERMINATED'],
    SUSPENDED: ['EMPLOYED', 'TERMINATED'],
    LEAVE: ['EMPLOYED', 'TERMINATED'],
    TERMINATED: ['ARCHIVED'],
    ARCHIVED: [], // Terminal state - no transitions allowed
};
/**
 * FSM Validation Error
 */
class HRStatusFSMError extends Error {
    constructor(from, to) {
        const allowed = exports.HR_STATUS_TRANSITIONS[from];
        super(`Invalid HR status transition: ${from} → ${to}. ` +
            `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`);
        this.name = 'HRStatusFSMError';
    }
}
exports.HRStatusFSMError = HRStatusFSMError;
/**
 * Validate HR status transition
 * @throws {HRStatusFSMError} if transition is invalid
 */
function validateHRStatusTransition(from, to) {
    const allowedTransitions = exports.HR_STATUS_TRANSITIONS[from];
    if (!allowedTransitions.includes(to)) {
        throw new HRStatusFSMError(from, to);
    }
}
/**
 * Check if status is terminal (no further transitions allowed)
 */
function isTerminalStatus(status) {
    return exports.HR_STATUS_TRANSITIONS[status].length === 0;
}
