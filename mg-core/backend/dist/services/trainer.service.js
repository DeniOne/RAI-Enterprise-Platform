"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainerService = exports.TrainerService = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class TrainerService {
    /**
     * Get trainer dashboard data (READ-MODEL)
     * Strictly aggregation, no side effects
     */
    async getTrainerDashboardData(trainerId) {
        const trainer = await prisma_1.prisma.trainer.findUnique({
            where: { id: trainerId },
            include: {
                accreditations: {
                    where: { is_active: true },
                    orderBy: { granted_at: 'desc' },
                    take: 1
                },
                mentorships: {
                    orderBy: { start_at: 'desc' }
                }
            }
        });
        if (!trainer)
            throw new Error('Trainer not found');
        const activeTrainees = trainer.mentorships.filter(m => m.status === client_1.MentorshipStatus.PROBATION || m.status === client_1.MentorshipStatus.ACTIVE);
        const completedTrainees = trainer.mentorships.filter(m => m.status === client_1.MentorshipStatus.COMPLETED);
        return {
            trainerId: trainer.id,
            status: trainer.status,
            currentAccreditation: trainer.accreditations[0] || null,
            rating: trainer.rating ? Number(trainer.rating) : 0,
            stats: {
                traineesTotal: trainer.trainees_total,
                traineesSuccessful: trainer.trainees_successful,
                avgNPS: trainer.avg_nps ? Number(trainer.avg_nps) : 0
            },
            activeMentorships: activeTrainees,
            history: completedTrainees.slice(0, 10)
        };
    }
    /**
     * Grant accreditation to trainer
     * CANON: Creates a versioned record, does NOT just update a flag
     */
    async grantAccreditation(params) {
        // Deactivate previous active accreditations
        await prisma_1.prisma.trainerAccreditation.updateMany({
            where: { trainer_id: params.trainerId, is_active: true },
            data: { is_active: false }
        });
        return await prisma_1.prisma.trainerAccreditation.create({
            data: {
                trainer_id: params.trainerId,
                level: params.level,
                weight: params.weight,
                granted_by: params.grantedBy,
                expires_at: params.expiresAt,
                is_active: true
            }
        });
    }
    /**
     * Start formal mentorship period
     */
    async startMentorship(params) {
        const trainer = await prisma_1.prisma.trainer.findUnique({
            where: { id: params.trainerId },
            include: { accreditations: { where: { is_active: true } } }
        });
        if (!trainer || trainer.accreditations.length === 0) {
            throw new Error('Trainer must have an active accreditation to start mentorship');
        }
        // Expected end: current date + 60 days probation
        const expectedEnd = new Date();
        expectedEnd.setDate(expectedEnd.getDate() + 60);
        const period = await prisma_1.prisma.mentorshipPeriod.create({
            data: {
                trainer_id: params.trainerId,
                trainee_id: params.traineeId,
                status: client_1.MentorshipStatus.PROBATION,
                expected_end_at: expectedEnd,
                plan: params.plan
            }
        });
        // Update trainer stats
        await prisma_1.prisma.trainer.update({
            where: { id: params.trainerId },
            data: { trainees_total: { increment: 1 } }
        });
        return period;
    }
    /**
     * Complete mentorship period
     * CANON: Legally significant action, Audit logged, Event-driven rewards
     */
    async completeMentorship(params) {
        const period = await prisma_1.prisma.mentorshipPeriod.findUnique({
            where: { id: params.periodId },
            include: { trainer: true }
        });
        if (!period)
            throw new Error('Mentorship period not found');
        if (period.status === client_1.MentorshipStatus.COMPLETED || period.status === client_1.MentorshipStatus.FAILED) {
            throw new Error('Mentorship period is already finalized');
        }
        // 1. Persist result
        const result = await prisma_1.prisma.trainingResult.create({
            data: {
                mentorship_period_id: params.periodId,
                nps_score: params.metrics.nps_score,
                kpi_improvement: params.metrics.kpi_improvement,
                quality_score: params.metrics.quality_score,
                notes: `Finalized by ${params.actorId}: ${params.notes}`
            }
        });
        // 2. Update period status
        const finishedPeriod = await prisma_1.prisma.mentorshipPeriod.update({
            where: { id: params.periodId },
            data: {
                status: params.status,
                finished_at: new Date()
            }
        });
        // 3. Update trainer global stats if successful
        if (params.status === client_1.MentorshipStatus.COMPLETED) {
            await prisma_1.prisma.trainer.update({
                where: { id: period.trainer_id },
                data: { trainees_successful: { increment: 1 } }
            });
        }
        // 4. Emit canonical event for Reward Engine
        await prisma_1.prisma.event.create({
            data: {
                type: 'MENTORSHIP_COMPLETED',
                source: 'trainer_service',
                subject_id: period.trainee_id,
                subject_type: 'user',
                payload: {
                    periodId: period.id,
                    trainerId: period.trainer_id,
                    mentorUserId: period.trainer.user_id,
                    status: params.status,
                    metrics: params.metrics,
                    notes: params.notes,
                    finalizedBy: params.actorId
                }
            }
        });
        // 5. Recalculate ratings (ReadOnly logic inside service is fine)
        await this.updateTrainerRating(period.trainer_id);
        return { period: finishedPeriod, result };
    }
    /**
     * Update trainer rating based on historical results
     */
    async updateTrainerRating(trainerId) {
        const results = await prisma_1.prisma.trainingResult.findMany({
            where: { mentorship_period: { trainer_id: trainerId } }
        });
        if (results.length === 0)
            return;
        const npsScores = results.filter(r => r.nps_score !== null).map(r => r.nps_score);
        const avgNPS = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;
        await prisma_1.prisma.trainer.update({
            where: { id: trainerId },
            data: {
                rating: avgNPS, // Simplified rating for MVP
                avg_nps: avgNPS
            }
        });
    }
    /**
     * Get all trainers with filters
     */
    async getTrainers(filters) {
        const where = {};
        if (filters?.specialty)
            where.specialty = filters.specialty;
        if (filters?.status)
            where.status = filters.status;
        return await prisma_1.prisma.trainer.findMany({
            where,
            include: { accreditations: { where: { is_active: true } } },
            orderBy: { rating: 'desc' }
        });
    }
    /**
     * Apply to become a trainer
     */
    async createTrainerApplication(userId, specialty) {
        const existing = await prisma_1.prisma.trainer.findUnique({ where: { user_id: userId } });
        if (existing)
            throw new Error('User is already a trainer or candidate');
        return await prisma_1.prisma.trainer.create({
            data: {
                user_id: userId,
                specialty,
                status: client_1.TrainerStatus.CANDIDATE
            }
        });
    }
}
exports.TrainerService = TrainerService;
exports.trainerService = new TrainerService();
