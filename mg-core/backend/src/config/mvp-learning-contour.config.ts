/**
 * MVP Learning Contour Configuration
 * 
 * CANONICAL SOURCE OF TRUTH for MVP mode boundaries
 * 
 * See: documentation/06-MVP-LEARNING-CONTOUR
 */

export const MVP_LEARNING_CONTOUR_CONFIG = {
    /**
     * Enable/disable MVP mode
     * Set to false to restore full system functionality
     */
    enabled: true,

    /**
     * Forbidden features in MVP mode
     * These features are DISABLED and return 403 Forbidden
     */
    forbiddenFeatures: {
        gmc: true,                    // GoldMatrixCoin (GMC) operations
        store: true,                  // Store/Marketplace
        auctions: true,               // Auction system
        analytics: true,              // Analytics & KPI dashboards
        webUIForEmployees: true,      // Web UI for employees (Telegram only)
        aiEvaluation: true,           // AI evaluation of people
        kpi: true,                    // KPI management
        sanctions: true,              // Sanctions/penalties
    },

    /**
     * Allowed features in MVP mode
     */
    allowedFeatures: {
        corporateUniversity: true,    // Corporate University module
        telegramBot: true,            // Telegram Bot interface
        matrixCoinRecognition: true,  // MC recognition (symbolic only)
        courseRecommendations: true,  // PhotoCompany-based recommendations
    },

    /**
     * MatrixCoin rules in MVP
     * 
     * CRITICAL: MC is UNIVERSAL recognition unit
     * MVP restricts USAGE SCOPE, not SEMANTIC DEFINITION
     */
    matrixCoin: {
        symbolic: true,               // Recognition only, not currency
        noMoneyConversion: true,      // No conversion to real money
        noComparison: true,           // No employee comparison
        noPower: true,                // No influence on status/power
        learningContextOnly: true,    // Used ONLY in learning context
    },

    /**
     * Learning rules in MVP
     */
    learning: {
        voluntary: true,              // No mandatory participation
        noDeepKnowledgeChecks: true,  // Fact-based completion only
        symbolicCertification: true,  // Certificates are symbolic
        maxModulesPerCourse: 7,       // Simplified course structure
    },

    /**
     * PhotoCompany integration
     * 
     * CANONICAL: PhotoCompany is CENTRAL SOURCE OF TRUTH
     * for course recommendations
     */
    photoCompany: {
        centralSourceOfTruth: true,   // All recommendations from PhotoCompany
        requiredMetrics: ['CK', 'OKK', 'CONVERSION', 'QUALITY'],
        noGenericRecommendations: true, // NO soft recommendations
    },

    /**
     * Telegram Bot roles
     * 
     * CANONICAL: Bot has EXACTLY 2 roles
     */
    telegramBot: {
        roles: {
            viewer: true,               // Reads, shows, explains
            notifier: true,             // Notifies about events
        },
        forbiddenBehaviors: {
            evaluatesPeople: false,     // NEVER evaluates
            comparesEmployees: false,   // NEVER compares
            pushesKPI: false,           // NEVER pushes KPI
            givesEarnMoreAdvice: false, // NEVER gives "earn more" advice
        },
    },

    /**
     * Forbidden endpoints (for Guard)
     */
    forbiddenEndpoints: [
        '/api/store/purchase',
        '/economy/store/access',
        '/economy/auction/participate',
        '/economy/analytics',
        '/api/gmc',
        '/api/analytics',
    ],
};

/**
 * Type-safe config access
 */
export type MVPLearningContourConfig = typeof MVP_LEARNING_CONTOUR_CONFIG;
