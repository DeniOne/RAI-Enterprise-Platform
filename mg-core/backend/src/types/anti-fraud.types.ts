/**
 * Anti-Fraud Type Definitions
 * Module 13: Corporate University
 * 
 * CANON: Signals are append-only, immutable, never deleted
 */

// Signal Levels
export enum SignalLevel {
    LOW = 'LOW',           // Statistical anomalies, informational
    MEDIUM = 'MEDIUM',     // Behavioral patterns, requires attention
    HIGH = 'HIGH'          // Rule violations, requires manual review
}

// Signal Types
export enum SignalType {
    // Metric-Level (LOW)
    CONVERSION_ANOMALY = 'CONVERSION_ANOMALY',
    UNIFORM_METRICS = 'UNIFORM_METRICS',

    // Behavioral-Level (MEDIUM)
    NO_RESULT_IMPROVEMENT = 'NO_RESULT_IMPROVEMENT',
    EXCESSIVE_RETESTS = 'EXCESSIVE_RETESTS',

    // Rule-Violation (HIGH)
    NO_PRODUCTION_ACTIVITY = 'NO_PRODUCTION_ACTIVITY',
    ROLE_METRIC_MISMATCH = 'ROLE_METRIC_MISMATCH',
    LIFECYCLE_VIOLATION = 'LIFECYCLE_VIOLATION'
}

// Anti-Fraud Signal Interface
export interface AntiFraudSignal {
    id: string;
    entity_type: 'User' | 'PhotoCompany' | 'Shift' | 'Course';
    entity_id: string;
    level: SignalLevel;
    type: SignalType;
    metric_snapshot: any;
    detected_at: Date;
    context: any; // read-only metadata
}

// Detection Input Data
export interface DetectionInput {
    userId: string;
    courseId?: string;
    enrollmentData?: any;
    moduleProgress?: any;
    completionDate?: Date;
    photoCompanyMetrics?: any;
}
