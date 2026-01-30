import { HRStatus } from '@prisma/client';

/**
 * Canonical FSM Transition Map for HR Status
 * CRITICAL: This is the ONLY source of truth for valid HR status transitions
 */
export const HR_STATUS_TRANSITIONS: Record<HRStatus, HRStatus[]> = {
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
export class HRStatusFSMError extends Error {
  constructor(from: HRStatus, to: HRStatus) {
    const allowed = HR_STATUS_TRANSITIONS[from];
    super(
      `Invalid HR status transition: ${from} → ${to}. ` +
      `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`
    );
    this.name = 'HRStatusFSMError';
  }
}

/**
 * Validate HR status transition
 * @throws {HRStatusFSMError} if transition is invalid
 */
export function validateHRStatusTransition(
  from: HRStatus,
  to: HRStatus
): void {
  const allowedTransitions = HR_STATUS_TRANSITIONS[from];
  
  if (!allowedTransitions.includes(to)) {
    throw new HRStatusFSMError(from, to);
  }
}

/**
 * Check if status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: HRStatus): boolean {
  return HR_STATUS_TRANSITIONS[status].length === 0;
}
