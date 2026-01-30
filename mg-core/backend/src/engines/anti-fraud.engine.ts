/**
 * Anti-Fraud Engine
 * Module 13: Corporate University
 * 
 * CANON:
 * - Read-only analyzer (Subscriber pattern)
 * - NO automatic data mutations/sanctions
 * - Output: AntiFraudSignal (event)
 * - Heuristic weights: Time (0.3), IP/Device (0.5), Patterns (0.2)
 */

import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export class AntiFraudEngine {
    /**
     * Analyze a university-related event for fraud signals
     */
    async analyzeEvent(eventId: string) {
        try {
            const event = await prisma.event.findUnique({
                where: { id: eventId }
            });

            if (!event) return;

            switch (event.type) {
                case 'QUIZ_COMPLETED':
                    await this.analyzeQuizCompletion(event);
                    break;
                case 'MENTORSHIP_COMPLETED':
                    await this.analyzeMentorshipCompletion(event);
                    break;
                default:
                    break;
            }
        } catch (error) {
            logger.error('[AntiFraudEngine] Error analyzing event', { eventId, error });
        }
    }

    /**
     * Quiz Fraud Analysis
     */
    private async analyzeQuizCompletion(event: any) {
        const payload = event.payload as any;
        const userId = event.subject_id;

        let confidenceScore = 1.0;
        const signals: string[] = [];

        // 1. Time-on-Quiz Heuristic (Weight: 0.3)
        // If quiz has 10 questions and was finished in < 20 seconds
        const duration = payload.durationSeconds || 0;
        const questionCount = payload.questionCount || 10;
        const minExpectedTime = questionCount * 10; // 10 sec per question

        if (duration < minExpectedTime * 0.2) {
            confidenceScore -= 0.3;
            signals.push('CRITICAL_SPEED_DETECTED');
        } else if (duration < minExpectedTime * 0.5) {
            confidenceScore -= 0.1;
            signals.push('SUSPICIOUS_SPEED');
        }

        // 2. IP/Device Jumps (Weight: 0.5)
        const currentIp = payload.ipAddress;
        const lastAttempts = await prisma.event.findMany({
            where: {
                subject_id: userId,
                subject_type: 'user',
                type: 'QUIZ_COMPLETED',
                id: { not: event.id }
            },
            take: 3,
            orderBy: { timestamp: 'desc' }
        });

        const knownIps = lastAttempts.map(e => (e.payload as any).ipAddress).filter(Boolean);
        if (knownIps.length > 0 && !knownIps.includes(currentIp)) {
            confidenceScore -= 0.5;
            signals.push('GEO_SHIFT_DETECTED');
        }

        // 3. Attempt Patterns (Weight: 0.2)
        // Check if user is retaking quiz suspiciously many times in short period
        const recentAttempts = await prisma.event.count({
            where: {
                subject_id: userId,
                type: 'QUIZ_COMPLETED',
                timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
            }
        });

        if (recentAttempts > 5) {
            confidenceScore -= 0.2;
            signals.push('BRUTEFORCE_PATTERN');
        }

        // Emit Signal if confidence is low
        if (confidenceScore < 0.9) {
            await this.emitSignal({
                userId,
                level: confidenceScore < 0.5 ? 'HIGH' : 'MEDIUM',
                type: 'UNIVERSITY_FRAUD',
                context: {
                    eventId: event.id,
                    confidenceScore,
                    signals,
                    metadata: payload
                }
            });
        }
    }

    /**
     * Mentorship Fraud Analysis
     */
    private async analyzeMentorshipCompletion(event: any) {
        const payload = event.payload as any;
        const mentorUserId = payload.mentorUserId;

        // Simple heuristic: check for impossible mentorship durations
        // (Fake completions of 60-day probation in 1 day)
        const periodId = payload.periodId;
        const period = await prisma.mentorshipPeriod.findUnique({
            where: { id: periodId }
        });

        if (period) {
            const actualDurationDays = (new Date().getTime() - period.start_at.getTime()) / (1000 * 3600 * 24);
            if (actualDurationDays < 7) { // Extremely suspicious for a 60-day probation
                await this.emitSignal({
                    userId: mentorUserId,
                    level: 'HIGH',
                    type: 'MENTORSHIP_ANOMALY',
                    context: {
                        eventId: event.id,
                        periodId,
                        actualDurationDays,
                        signals: ['IMPOSSIBLE_PROBATION_SPEED']
                    }
                });
            }
        }
    }

    /**
     * Emit AntiFraudSignal
     */
    private async emitSignal(params: {
        userId: string;
        level: 'LOW' | 'MEDIUM' | 'HIGH';
        type: string;
        context: any;
    }) {
        logger.warn('[AntiFraudEngine] Fraud signal detected', params);

        await prisma.antiFraudSignal.create({
            data: {
                entity_type: 'User',
                entity_id: params.userId,
                level: params.level,
                type: params.type,
                metric_snapshot: params.context,
                context: params.context,
                detected_at: new Date()
            }
        });
    }
}

export const antiFraudEngine = new AntiFraudEngine();
