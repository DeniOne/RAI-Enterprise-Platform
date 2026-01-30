/**
 * Canonical Guard for MatrixGin
 * 
 * This module exports the canonical guard system for enforcing
 * the philosophical rules of MC and GMC tokens.
 * 
 * CRITICAL: Use ONLY the checkCanon function from registry.
 * Direct use of checkMCCanon or checkGMCCanon is FORBIDDEN.
 */

// Export types for reference
export { CanonicalViolationType } from './canonicalViolation';
export { CanonicalCheckResult } from './canonicalCheckResult';
export {
    CanonicalViolationError,
    CanonType,
} from './CanonicalViolationError';
export { CanonicalViolationLogger } from './canonicalViolationLogger';

// Export ONLY the registry - this is the single entry point
export { checkCanon, CanonicalCheckParams } from './registry';

// NOTE: checkMCCanon and checkGMCCanon are NOT exported
// They are internal implementation details
// All services MUST use checkCanon from registry
