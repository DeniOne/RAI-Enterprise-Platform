"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalViolationError = void 0;
/**
 * Custom error thrown when canonical rules are violated
 *
 * This error should be thrown whenever an operation attempts
 * to violate the canonical philosophy of MC or GMC.
 *
 * All violations are logged for audit purposes.
 */
class CanonicalViolationError extends Error {
    canon;
    violation;
    constructor(canon, violation, message) {
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
    toLogFormat() {
        return `[CANONICAL VIOLATION] Canon: ${this.canon}, Violation: ${this.violation}, Message: ${this.message}`;
    }
}
exports.CanonicalViolationError = CanonicalViolationError;
