/**
 * Intent Resolution Types
 * 
 * Strict types for intent resolution results.
 * No optional magic fields.
 */

export interface ResolvedIntent {
    intentId: string;
    confidence: number; // 0..1
    matchedExample?: string;
    // Context Fields (Sprint 11)
    userId: string;
    slots: Record<string, any>;
    payload?: any; // For dynamic data passing
}

export interface IntentResolveResult {
    resolved: boolean;
    intent?: ResolvedIntent;
    reason?: 'LOW_CONFIDENCE' | 'NO_MATCH';
}
