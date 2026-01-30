"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.qualificationService = exports.QualificationService = void 0;
const prisma_1 = require("../config/prisma");
class QualificationService {
    /**
     * Propose qualification upgrade based on PhotoCompany metrics
     *
     * CANON: Proposal created ONLY by system, NOT by Trainer
     * Source: PhotoCompany metrics (last N shifts)
     */
    async proposeQualificationUpgrade(userId, photocompanyMetrics) {
        // Get current grade
        const userGrade = await prisma_1.prisma.userGrade.findUnique({
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
    async applyApprovedUpgrade(proposalId, userId, newGrade, photocompanyMetrics, approvedBy, reason) {
        // Get current grade
        const userGrade = await prisma_1.prisma.userGrade.findUnique({
            where: { user_id: userId },
        });
        if (!userGrade) {
            throw new Error('User grade not found');
        }
        const previousGrade = userGrade.current_grade;
        // Create immutable snapshot
        await prisma_1.prisma.qualificationSnapshot.create({
            data: {
                user_id: userId,
                previous_grade: previousGrade,
                new_grade: newGrade,
                photocompany_metrics: photocompanyMetrics,
                stability_period: photocompanyMetrics.shiftsCount,
                proposal_id: proposalId,
                approved_by: approvedBy,
                approved_at: new Date(),
                reason,
            },
        });
        // Update current grade
        await prisma_1.prisma.userGrade.update({
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
        await prisma_1.prisma.event.create({
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
    checkMetrics(metrics, requirements) {
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
    getGradeRequirements(grade) {
        const requirements = {
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
    getNextGrade(currentGrade) {
        const progression = [
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
    async getQualificationHistory(userId) {
        const snapshots = await prisma_1.prisma.qualificationSnapshot.findMany({
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
exports.QualificationService = QualificationService;
exports.qualificationService = new QualificationService();
