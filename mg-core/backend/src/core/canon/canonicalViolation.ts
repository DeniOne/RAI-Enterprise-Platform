/**
 * Canonical Violation Types for MC and GMC
 * 
 * These violation types represent forbidden actions that break
 * the canonical philosophy of MC and GMC in MatrixGin v8.
 */
export enum CanonicalViolationType {
    // ========== GMC VIOLATIONS ==========

    /**
     * Attempt to monetize GMC or treat it as currency
     * GMC is NOT money, NOT a bonus, NOT a tradeable asset
     */
    GMC_MONETIZATION = 'GMC_MONETIZATION',

    /**
     * Attempt to grant GMC automatically without human decision
     * GMC cannot be earned automatically - it must be recognized by committee
     */
    GMC_AUTOMATION = 'GMC_AUTOMATION',

    /**
     * Attempt to bind GMC to KPI or performance metrics
     * GMC is NOT a reward for KPI achievement
     */
    GMC_KPI_BINDING = 'GMC_KPI_BINDING',

    /**
     * Attempt to use GMC in market-like behavior (trading, speculation)
     * GMC is strategic recognition, not a market instrument
     */
    GMC_MARKET_BEHAVIOR = 'GMC_MARKET_BEHAVIOR',

    /**
     * Attempt by AI to interfere with GMC decisions
     * AI can only advise, NEVER decide or grant GMC
     */
    GMC_AI_INTERFERENCE = 'GMC_AI_INTERFERENCE',

    /**
     * Abuse of auction mechanics (e.g., guaranteed wins, manipulation)
     * Auctions must remain event-based and unpredictable
     */
    GMC_AUCTION_ABUSE = 'GMC_AUCTION_ABUSE',

    // ========== MC VIOLATIONS ==========

    /**
     * Attempt to monetize MC or treat it as money
     * MC is operational behavioral currency, NOT money, NOT salary
     */
    MC_MONETIZATION = 'MC_MONETIZATION',

    /**
     * Attempt to use MC as direct payment for KPI achievement
     * MC is NOT a KPI bonus system
     */
    MC_KPI_DIRECT_PAYMENT = 'MC_KPI_DIRECT_PAYMENT',

    /**
     * Attempt to reward creative work with MC
     * MC is for operational engagement, NOT creative compensation
     */
    MC_CREATIVE_REWARD = 'MC_CREATIVE_REWARD',

    /**
     * Attempt to use MC as salary substitute
     * MC is NOT a replacement for fair monetary compensation
     */
    MC_SALARY_SUBSTITUTE = 'MC_SALARY_SUBSTITUTE',

    /**
     * Attempt to grant MC without expiration mechanism
     * MC MUST have burn rate and expiration to maintain value
     */
    MC_NO_EXPIRATION = 'MC_NO_EXPIRATION',

    /**
     * Attempt to allow unlimited MC accumulation
     * MC must have accumulation limits (safe mechanism)
     */
    MC_UNLIMITED_ACCUMULATION = 'MC_UNLIMITED_ACCUMULATION',

    /**
     * Attempt by AI to reward MC
     * AI can only advise, NEVER grant MC
     */
    MC_AI_REWARDING = 'MC_AI_REWARDING',
}
