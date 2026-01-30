/**
 * Error UX Types
 * 
 * Strict types for error detection and routing.
 * No optional undocumented fields.
 */

export interface ErrorUXMatch {
    errorId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    text: string;
    actions: string[];
}

export interface ErrorDetectionResult {
    matched: boolean;
    match?: ErrorUXMatch;
}

/**
 * Error detection context (session-level memory)
 */
export interface ErrorContext {
    recentMessages?: string[];
    messageTimestamps?: number[];
}
