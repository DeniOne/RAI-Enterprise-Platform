/**
 * Qualification Service
 * Module 13: Corporate University
 * 
 * CANON:
 * - Qualification changes ONLY via approved upgrade
 * - Source of truth: PhotoCompany metrics (NOT grades/tests/wishes)
 * - QualificationSnapshot is immutable, append-only
 * - NO direct qualification updates
 */

import { prisma } from '../config/prisma';
import { CourseGrade } from '@prisma/client';

interface PhotoCompanyMetrics {
    okk?: number;
    ck?: number;
    conversion?: number;
    quality?: number;
    retouchTime?: number;
    avgCheck?: number;
    shiftsCount: number;
    period: {
        from: Date;
        to: Date;
    };
}

interface GradeRequirements {
    minOKK?: number;
    minCK?: number;
    minConversion?: number;
    minQuality?: number;
    maxRetouchTime?: number;
    minAvgCheck?: number;
    minStableShifts: number; // Minimum number of shifts with stable metrics
}

export class QualificationService {
    /**
     * Propose qualification upgrade based on PhotoCompany metrics
     * 
     * CANON: Proposal created ONLY by system, NOT by Trainer
     * Source: PhotoCompany metrics (last N shifts)
     */
    async proposeQualificationUpgrade(
        userId: string,
        photocompanyMetrics: PhotoCompanyMetrics
    ): Promise<{ proposalId: string; newGrade: CourseGrade } | null> {
        // Get current grade
        const userGrade = await prisma.userGrade.findUnique({
            where: { user_id: userId },
        });

        if (!userGrade) {
            throw new Error('User grade not found');
        }

        const currentGrade = userGrade.current_grade;
        const nextGrade = this.getNextGrade(currentGrade);

        if (!nextGrade) {
            // Already at maximum grade
            return null;
        }

        // Check if metrics meet requirements for next grade
        const requirements = this.getGradeRequirements(nextGrade);
        const meetsRequirements = this.checkMetrics(photocompanyMetrics, requirements);

        if (!meetsRequirements) {
            return null;
        }

        // Check stability period (minimum number of shifts)
        if (photocompanyMetrics.shiftsCount < requirements.minStableShifts) {
            return null;
        }

        // Create proposal (this would integrate with Approval Workflow in real implementation)
        // For now, we'll create a simple proposal record
        const proposalId = `proposal_${userId}_${Date.now()}`;

        // Log proposal for manual approval
        console.log(`[QualificationService] Proposal created:`, {
            userId,
            currentGrade,
            proposedGrade: nextGrade,
            metrics: photocompanyMetrics,
            proposalId,
        });

        return {
            proposalId,
            newGrade: nextGrade,
        };
    }

    /**
     * Apply approved qualification upgrade
     * 
     * CANON: Creates immutable QualificationSnapshot
     * NO UPDATE operations on snapshots
     */
    async applyApprovedUpgrade(
        proposalId: string,
        userId: string,
        newGrade: CourseGrade,
        photocompanyMetrics: PhotoCompanyMetrics,
        approvedBy: string,
        reason: string
    ): Promise<void> {
        // Get current grade
        const userGrade = await prisma.userGrade.findUnique({
            where: { user_id: userId },
        });

        if (!userGrade) {
            throw new Error('User grade not found');
        }

        const previousGrade = userGrade.current_grade;

        // Create immutable snapshot
        await prisma.qualificationSnapshot.create({
            data: {
                user_id: userId,
                previous_grade: previousGrade,
                new_grade: newGrade,
                photocompany_metrics: photocompanyMetrics as any,
                stability_period: photocompanyMetrics.shiftsCount,
                proposal_id: proposalId,
                approved_by: approvedBy,
                approved_at: new Date(),
                reason,
            },
        });

        // Update current grade
        await prisma.userGrade.update({
            where: { user_id: userId },
            data: {
                current_grade: newGrade,
                grade_history: {
                    push: {
                        grade: newGrade,
                        changedAt: new Date().toISOString(),
                        reason,
                        approvedBy,
                    },
                },
            },
        });

        // Emit event for other systems
        await prisma.event.create({
            data: {
                type: 'QUALIFICATION_CHANGED',
                source: 'qualification_service',
                subject_id: userId,
                subject_type: 'user',
                payload: {
                    previousGrade,
                    newGrade,
                    proposalId,
                    approvedBy,
                    reason,
                },
            },
        });
    }

    /**
     * Check if metrics meet requirements
     * 
     * CANON: Source = PhotoCompany metrics ONLY
     */
    checkMetrics(
        metrics: PhotoCompanyMetrics,
        requirements: GradeRequirements
    ): boolean {
        if (requirements.minOKK && (!metrics.okk || metrics.okk < requirements.minOKK)) {
            return false;
        }

        if (requirements.minCK && (!metrics.ck || metrics.ck < requirements.minCK)) {
            return false;
        }

        if (requirements.minConversion && (!metrics.conversion || metrics.conversion < requirements.minConversion)) {
            return false;
        }

        if (requirements.minQuality && (!metrics.quality || metrics.quality < requirements.minQuality)) {
            return false;
        }

        if (requirements.maxRetouchTime && metrics.retouchTime && metrics.retouchTime > requirements.maxRetouchTime) {
            return false;
        }

        if (requirements.minAvgCheck && (!metrics.avgCheck || metrics.avgCheck < requirements.minAvgCheck)) {
            return false;
        }

        return true;
    }

    /**
     * Get requirements for a specific grade
     * 
     * CANON: Requirements based on PhotoCompany metrics
     */
    getGradeRequirements(grade: CourseGrade): GradeRequirements {
        const requirements: Record<CourseGrade, GradeRequirements> = {
            INTERN: {
                minStableShifts: 0, // Entry level
            },
            SPECIALIST: {
                minOKK: 70,
                minCK: 60,
                minStableShifts: 6,
            },
            PROFESSIONAL: {
                minOKK: 80,
                minCK: 70,
                minConversion: 50,
                minStableShifts: 6,
            },
            EXPERT: {
                minOKK: 85,
                minCK: 75,
                minConversion: 60,
                minQuality: 90,
                minStableShifts: 6,
            },
            MASTER: {
                minOKK: 90,
                minCK: 80,
                minConversion: 70,
                minQuality: 95,
                maxRetouchTime: 30,
                minStableShifts: 12, // Higher stability requirement for master
            },
        };

        return requirements[grade];
    }

    /**
     * Get next grade in progression
     */
    private getNextGrade(currentGrade: CourseGrade): CourseGrade | null {
        const progression: CourseGrade[] = [
            'INTERN',
            'SPECIALIST',
            'PROFESSIONAL',
            'EXPERT',
            'MASTER',
        ];

        const currentIndex = progression.indexOf(currentGrade);
        if (currentIndex === -1 || currentIndex === progression.length - 1) {
            return null;
        }

        return progression[currentIndex + 1];
    }

    /**
     * Get qualification history for user
     */
    async getQualificationHistory(userId: string) {
        const snapshots = await prisma.qualificationSnapshot.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });

        return snapshots.map((snapshot) => ({
            id: snapshot.id,
            previousGrade: snapshot.previous_grade,
            newGrade: snapshot.new_grade,
            photocompanyMetrics: snapshot.photocompany_metrics,
            stabilityPeriod: snapshot.stability_period,
            proposalId: snapshot.proposal_id,
            approvedBy: snapshot.approved_by,
            approvedAt: snapshot.approved_at,
            reason: snapshot.reason,
            createdAt: snapshot.created_at,
        }));
    }
}

export const qualificationService = new QualificationService();
