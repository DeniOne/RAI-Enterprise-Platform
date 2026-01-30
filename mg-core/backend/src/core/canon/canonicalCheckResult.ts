import { CanonicalViolationType } from './canonicalViolation';

/**
 * Result of a canonical check for GMC operations
 * 
 * This interface is returned by the canonical guard
 * to indicate whether an operation is allowed or violates canon.
 */
export interface CanonicalCheckResult {
    /**
     * Whether the operation is allowed under canonical rules
     */
    allowed: boolean;

    /**
     * Type of violation if operation is not allowed
     * Undefined if allowed === true
     */
    violation?: CanonicalViolationType;

    /**
     * Human-readable message explaining the decision
     * Should be clear and reference the specific canonical rule
     */
    message: string;
}
