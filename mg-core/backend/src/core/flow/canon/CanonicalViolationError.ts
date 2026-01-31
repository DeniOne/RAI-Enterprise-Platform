import { CanonicalViolationType } from './canonicalViolation';

/**
 * Canon type identifier
 */
export type CanonType = 'MC' | 'GMC';

/**
 * Custom error thrown when canonical rules are violated
 * 
 * This error should be thrown whenever an operation attempts
 * to violate the canonical philosophy of MC or GMC.
 * 
 * All violations are logged for audit purposes.
 */
export class CanonicalViolationError extends Error {
    public readonly canon: CanonType;
    public readonly violation: CanonicalViolationType;

    constructor(
        canon: CanonType,
        violation: CanonicalViolationType,
        message: string,
    ) {
        super(message);
        this.name = 'CanonicalViolationError';
        this.canon = canon;
        this.violation = violation;

        // Maintains proper stack trace for where error was thrown (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CanonicalViolationError);
        }
    }

    /**
     * Returns a formatted error message for logging
     */
    public toLogFormat(): string {
        return `[CANONICAL VIOLATION] Canon: ${this.canon}, Violation: ${this.violation}, Message: ${this.message}`;
    }
}
