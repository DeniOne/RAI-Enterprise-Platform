import { CanonicalViolationType } from '../canonicalViolation';
import { CanonicalCheckResult } from '../canonicalCheckResult';
import { checkMCCanon, MCCanonContext } from '../mcCanonicalGuard';
import { checkGMCCanon, GMCCanonContext } from '../gmcCanonicalGuard';
import { CanonicalViolationError, CanonType } from '../CanonicalViolationError';
import { CanonicalViolationLogger } from '../canonicalViolationLogger';

/**
 * Unified parameters for canonical check
 */
export interface CanonicalCheckParams {
    /**
     * Which canon to check (MC or GMC)
     */
    canon: CanonType;

    /**
     * Action being attempted
     */
    action: string;

    /**
     * Source of the request
     */
    source: 'UI' | 'API' | 'AI' | 'CRON';

    /**
     * Additional payload data
     */
    payload: any;

    /**
     * Optional user ID for logging
     */
    userId?: string;
}

/**
 * Canonical Guard Registry
 * 
 * SINGLE ENTRY POINT for all MC and GMC canonical checks.
 * 
 * This registry:
 * - Routes to appropriate guard (MC or GMC)
 * - Automatically logs violations
 * - Automatically throws CanonicalViolationError
 * - Ensures consistent enforcement
 * 
 * CRITICAL: Services MUST use this registry.
 * Direct calls to checkMCCanon or checkGMCCanon are FORBIDDEN.
 * 
 * @param params - Unified canonical check parameters
 * @throws CanonicalViolationError if canonical rules are violated
 */
export async function checkCanon(params: CanonicalCheckParams): Promise<void> {
    const { canon, action, source, payload, userId } = params;

    let checkResult: CanonicalCheckResult;

    // Route to appropriate guard
    if (canon === 'MC') {
        const mcContext: MCCanonContext = {
            action,
            source,
            payload,
        };
        checkResult = checkMCCanon(mcContext);
    } else if (canon === 'GMC') {
        const gmcContext: GMCCanonContext = {
            action,
            source,
            payload,
        };
        checkResult = checkGMCCanon(gmcContext);
    } else {
        throw new Error(`Unknown canon type: ${canon}`);
    }

    // If check failed, log and throw
    if (!checkResult.allowed) {
        // Log violation to database
        await CanonicalViolationLogger.log(
            canon,
            checkResult.violation!,
            source,
            action,
            payload,
            userId,
        );

        // Throw error to block operation
        throw new CanonicalViolationError(
            canon,
            checkResult.violation!,
            checkResult.message,
        );
    }

    // Check passed - operation allowed
    // No action needed, service can proceed
}
