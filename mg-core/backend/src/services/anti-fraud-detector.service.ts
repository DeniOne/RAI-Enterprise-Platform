/**
 * Anti-Fraud Detector Service
 * Module 13: Corporate University
 * 
 * CANON: Detector is a PURE FUNCTION
 * - Stateless
 * - Deterministic (same input → same output)
 * - NO side effects
 * - NO async operations
 * - NO database calls
 * 
 * Persistence is handled by separate AntiFraudSignalWriter
 */

import { SignalLevel, SignalType, AntiFraudSignal, DetectionInput } from '../types/anti-fraud.types';

export class AntiFraudDetector {
    /**
     * Main detection method - PURE FUNCTION
     * 
     * @param entityType - Type of entity being analyzed
     * @param entityId - ID of entity
     * @param input - Detection input data
     * @returns Array of detected signals
     */
    detectSignals(
        entityType: 'User' | 'PhotoCompany' | 'Shift' | 'Course',
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal[] {
        const signals: AntiFraudSignal[] = [];

        // Level-specific detection (all pure)
        signals.push(...this.detectMetricLevel(entityType, entityId, input));
        signals.push(...this.detectBehavioralLevel(entityType, entityId, input));
        signals.push(...this.detectRuleViolationLevel(entityType, entityId, input));

        return signals;
    }

    /**
     * Detect Metric-Level signals (LOW)
     * Statistical anomalies, informational
     */
    private detectMetricLevel(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal[] {
        const signals: AntiFraudSignal[] = [];

        // TODO: Implement metric-level detection
        // Examples:
        // - CONVERSION_ANOMALY: 100% conversion over period
        // - UNIFORM_METRICS: No variance in metrics

        return signals;
    }

    /**
     * Detect Behavioral-Level signals (MEDIUM)
     * Patterns requiring attention
     */
    private detectBehavioralLevel(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal[] {
        const signals: AntiFraudSignal[] = [];

        // NO_RESULT_IMPROVEMENT
        if (input.photoCompanyMetrics) {
            const improvementSignal = this.checkNoResultImprovement(entityType, entityId, input);
            if (improvementSignal) signals.push(improvementSignal);
        }

        // EXCESSIVE_RETESTS
        if (input.moduleProgress) {
            const retestSignal = this.checkExcessiveRetests(entityType, entityId, input);
            if (retestSignal) signals.push(retestSignal);
        }

        return signals;
    }

    /**
     * Detect Rule-Violation signals (HIGH)
     * Hard rule violations
     */
    private detectRuleViolationLevel(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal[] {
        const signals: AntiFraudSignal[] = [];

        // NO_PRODUCTION_ACTIVITY
        if (input.photoCompanyMetrics && input.completionDate) {
            const activitySignal = this.checkNoProductionActivity(entityType, entityId, input);
            if (activitySignal) signals.push(activitySignal);
        }

        // ROLE_METRIC_MISMATCH
        if (input.enrollmentData) {
            const mismatchSignal = this.checkRoleMetricMismatch(entityType, entityId, input);
            if (mismatchSignal) signals.push(mismatchSignal);
        }

        return signals;
    }

    /**
     * Check for NO_RESULT_IMPROVEMENT signal
     * Compare metrics before/after course
     */
    private checkNoResultImprovement(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal | null {
        const { photoCompanyMetrics } = input;

        if (!photoCompanyMetrics || !photoCompanyMetrics.before || !photoCompanyMetrics.after) {
            return null;
        }

        const before = photoCompanyMetrics.before;
        const after = photoCompanyMetrics.after;
        const targetMetric = photoCompanyMetrics.targetMetric || 'OKK';

        const beforeValue = before[targetMetric] || 0;
        const afterValue = after[targetMetric] || 0;
        const improvement = afterValue - beforeValue;

        // Signal if no improvement or decline
        if (improvement <= 0) {
            return {
                id: crypto.randomUUID(),
                entity_type: entityType as 'User' | 'PhotoCompany' | 'Shift' | 'Course',
                entity_id: entityId,
                level: SignalLevel.MEDIUM,
                type: SignalType.NO_RESULT_IMPROVEMENT,
                metric_snapshot: {
                    target_metric: targetMetric,
                    before_value: beforeValue,
                    after_value: afterValue,
                    improvement: improvement
                },
                detected_at: new Date(),
                context: {
                    course_id: input.courseId,
                    user_id: input.userId
                }
            };
        }

        return null;
    }

    /**
     * Check for EXCESSIVE_RETESTS signal
     * Count test attempts per module
     */
    private checkExcessiveRetests(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal | null {
        const { moduleProgress } = input;

        if (!moduleProgress || !Array.isArray(moduleProgress)) {
            return null;
        }

        const threshold = 4;
        const excessiveModules = moduleProgress.filter(m => (m.test_attempts || 0) >= threshold);

        if (excessiveModules.length > 0) {
            return {
                id: crypto.randomUUID(),
                entity_type: entityType as 'User' | 'Course' | 'PhotoCompany' | 'Shift',
                entity_id: entityId,
                level: SignalLevel.MEDIUM,
                type: SignalType.EXCESSIVE_RETESTS,
                metric_snapshot: {
                    modules_with_excessive_retests: excessiveModules.map(m => ({
                        module_id: m.module_id,
                        module_title: m.module?.title,
                        attempt_count: m.test_attempts
                    })),
                    threshold: threshold
                },
                detected_at: new Date(),
                context: {
                    course_id: input.courseId,
                    user_id: input.userId
                }
            };
        }

        return null;
    }

    /**
     * Check for NO_PRODUCTION_ACTIVITY signal
     * Verify shifts after course completion
     */
    private checkNoProductionActivity(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal | null {
        const { photoCompanyMetrics, completionDate } = input;

        if (!photoCompanyMetrics || !photoCompanyMetrics.shiftsAfterCompletion) {
            return null;
        }

        const shiftCount = photoCompanyMetrics.shiftsAfterCompletion;
        const threshold = 3;

        if (shiftCount < threshold) {
            return {
                id: crypto.randomUUID(),
                entity_type: entityType as 'User' | 'Course' | 'PhotoCompany' | 'Shift',
                entity_id: entityId,
                level: SignalLevel.HIGH,
                type: SignalType.NO_PRODUCTION_ACTIVITY,
                metric_snapshot: {
                    completion_date: completionDate,
                    check_period_days: 14,
                    shift_count: shiftCount,
                    threshold: threshold
                },
                detected_at: new Date(),
                context: {
                    course_id: input.courseId,
                    user_id: input.userId
                }
            };
        }

        return null;
    }

    /**
     * Check for ROLE_METRIC_MISMATCH signal
     * Verify course target_metric matches user role
     */
    private checkRoleMetricMismatch(
        entityType: string,
        entityId: string,
        input: DetectionInput
    ): AntiFraudSignal | null {
        const { enrollmentData } = input;

        if (!enrollmentData || !enrollmentData.course || !enrollmentData.user) {
            return null;
        }

        const userRole = enrollmentData.user.role?.code || 'GENERAL';
        const targetMetric = enrollmentData.course.target_metric;

        // Role-metric mapping
        const roleMetricMap: Record<string, string[]> = {
            'PHOTOGRAPHER': ['OKK', 'CK', 'CONVERSION'],
            'SALES': ['CONVERSION', 'AVG_CHECK'],
            'RETOUCH': ['QUALITY', 'RETOUCH_TIME'],
            'GENERAL': ['*'] // All metrics allowed
        };

        const allowedMetrics = roleMetricMap[userRole] || ['*'];

        // Check if metric is allowed for role
        const isAllowed = allowedMetrics.includes('*') || allowedMetrics.includes(targetMetric);

        if (!isAllowed) {
            return {
                id: crypto.randomUUID(),
                entity_type: entityType as 'User' | 'Course' | 'PhotoCompany' | 'Shift',
                entity_id: entityId,
                level: SignalLevel.HIGH,
                type: SignalType.ROLE_METRIC_MISMATCH,
                metric_snapshot: {
                    user_role: userRole,
                    course_target_metric: targetMetric,
                    expected_metrics: allowedMetrics
                },
                detected_at: new Date(),
                context: {
                    course_id: input.courseId,
                    user_id: input.userId
                }
            };
        }

        return null;
    }
}

export const antiFraudDetector = new AntiFraudDetector();
