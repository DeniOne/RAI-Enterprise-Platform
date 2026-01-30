import { CanonicalViolationType } from './canonicalViolation';
import { CanonicalCheckResult } from './canonicalCheckResult';

/**
 * Source of the MC operation request
 */
export type MCOperationSource = 'UI' | 'API' | 'AI' | 'CRON';

/**
 * Context for MC canonical check
 */
export interface MCCanonContext {
    /**
     * Action being attempted (e.g., 'MC_GRANT', 'MC_EARN', 'MC_REWARD')
     */
    action: string;

    /**
     * Source of the request
     */
    source: MCOperationSource;

    /**
     * Additional payload data for the operation
     */
    payload: {
        /**
         * Whether this operation treats MC as monetary equivalent
         */
        monetaryEquivalent?: boolean;

        /**
         * Whether this is KPI-based MC grant
         */
        kpiBased?: boolean;

        /**
         * Whether this is for creative task
         */
        creativeTask?: boolean;

        /**
         * Whether MC has no expiration
         */
        noExpiration?: boolean;

        /**
         * Whether unlimited accumulation is allowed
         */
        unlimited?: boolean;

        /**
         * Any other relevant data
         */
        [key: string]: any;
    };
}

/**
 * MC Canonical Guard
 * 
 * This function enforces the canonical rules of MC (Matrix Coin)
 * as defined in MatrixGin v8 philosophy.
 * 
 * CANONICAL RULES:
 * 1. MC is operational behavioral currency, NOT money/salary/bonus
 * 2. MC cannot be direct payment for KPI achievement
 * 3. MC cannot be used to reward creative work
 * 4. MC must have expiration mechanism (burn rate)
 * 5. MC must have accumulation limits (safe)
 * 6. AI cannot grant MC
 * 
 * @param context - The context of the MC operation
 * @returns CanonicalCheckResult indicating if operation is allowed
 */
export function checkMCCanon(context: MCCanonContext): CanonicalCheckResult {
    // RULE 1: AI cannot grant MC
    if (context.source === 'AI') {
        return {
            allowed: false,
            violation: CanonicalViolationType.MC_AI_REWARDING,
            message:
                'AI cannot grant or reward MC. MC decisions must be made by humans or automated based on verified events, not AI judgment.',
        };
    }

    // RULE 2: MC cannot be treated as monetary equivalent
    if (context.payload.monetaryEquivalent === true) {
        return {
            allowed: false,
            violation: CanonicalViolationType.MC_MONETIZATION,
            message:
                'MC cannot be treated as money or monetary equivalent. MC is operational behavioral currency, not a financial instrument.',
        };
    }

    // RULE 3: MC cannot be direct payment for KPI
    if (
        context.payload.kpiBased === true &&
        (context.action.includes('GRANT') ||
            context.action.includes('REWARD') ||
            context.action.includes('EARN'))
    ) {
        return {
            allowed: false,
            violation: CanonicalViolationType.MC_KPI_DIRECT_PAYMENT,
            message:
                'MC cannot be direct payment for KPI achievement. MC rewards operational engagement, not KPI metrics.',
        };
    }

    // RULE 4: MC cannot reward creative work
    if (context.payload.creativeTask === true) {
        return {
            allowed: false,
            violation: CanonicalViolationType.MC_CREATIVE_REWARD,
            message:
                'MC cannot be used to reward creative work. Creative work requires fair monetary compensation, not MC.',
        };
    }

    // RULE 5: MC must have expiration
    if (context.payload.noExpiration === true) {
        return {
            allowed: false,
            violation: CanonicalViolationType.MC_NO_EXPIRATION,
            message:
                'MC must have expiration mechanism (burn rate). MC without expiration loses its behavioral incentive value.',
        };
    }

    // RULE 6: MC must have accumulation limits
    if (context.payload.unlimited === true) {
        return {
            allowed: false,
            violation: CanonicalViolationType.MC_UNLIMITED_ACCUMULATION,
            message:
                'MC cannot have unlimited accumulation. MC must have safe mechanism and accumulation limits.',
        };
    }

    // All checks passed
    return {
        allowed: true,
        message: 'Operation allowed under MC canonical rules.',
    };
}
