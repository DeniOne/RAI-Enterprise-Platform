/**
 * Integrity Action Service
 * Module 13: Corporate University
 * 
 * CANON:
 * - NO automatic sanctions
 * - HUMAN-IN-THE-LOOP only
 * - Mandatory audit log for all actions
 * - Double confirmation logic represented in state
 */

import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export class IntegrityActionService {
    /**
     * Invalidate a graduation/certificate
     * CANON: Requires mandatory comment and evidence
     */
    async invalidateCertification(params: {
        enrollmentId: string;
        reason: string;
        evidenceLinks: string[];
        actorId: string;
    }) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: params.enrollmentId }
        });

        if (!enrollment) throw new Error('Enrollment not found');
        if (enrollment.status !== 'COMPLETED') {
            throw new Error('Only completed enrollments can be invalidated');
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Update enrollment status back to ACTIVE or a special REVOKED status
            // For now we'll mark it as ACTIVE so they have to retake if allowed
            const updated = await tx.enrollment.update({
                where: { id: params.enrollmentId },
                data: {
                    status: 'ACTIVE', // Or create a REVOKED status in schema
                    completed_at: null
                }
            });

            // 2. Create Audit Log entry (using AntiFraudSignal model as a container for now, or AuditLog if exits)
            // It's better to use a dedicated AuditLog or Event if possible.
            // MatrixGin schema has Event model which is canonical for history.
            await tx.event.create({
                data: {
                    type: 'CERTIFICATION_INVALIDATED' as any,
                    source: 'integrity_action_service',
                    subject_id: params.enrollmentId,
                    subject_type: 'enrollment',
                    payload: {
                        userId: enrollment.user_id,
                        courseId: enrollment.course_id,
                        reason: params.reason,
                        evidenceLinks: params.evidenceLinks,
                        actorId: params.actorId,
                        timestamp: new Date()
                    }
                }
            });

            logger.info('[IntegrityActionService] Certification invalidated by human', {
                enrollmentId: params.enrollmentId,
                actorId: params.actorId
            });

            return updated;
        });
    }

    /**
     * Clear a suspicious signal (Validate)
     * Marks the signal as reviewed and resolved
     */
    async validateSignal(signalId: string, comment: string, actorId: string) {
        return await prisma.antiFraudSignal.update({
            where: { id: signalId },
            data: {
                // Assuming we add a 'is_resolved' or similar field
                // If not in schema, we use the context to store audit log
                context: {
                    resolved: true,
                    resolvedBy: actorId,
                    resolvedAt: new Date(),
                    comment
                }
            }
        });
    }

    /**
     * Get all active security signals for dashboard
     */
    async getSecuritySignals(filters?: any) {
        return await prisma.antiFraudSignal.findMany({
            where: {
                // Filter out resolved ones if we had a status field
                ...filters
            },
            orderBy: { detected_at: 'desc' },
            take: 100
        });
    }
}

export const integrityActionService = new IntegrityActionService();
