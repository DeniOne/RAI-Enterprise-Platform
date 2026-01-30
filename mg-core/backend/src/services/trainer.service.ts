import { prisma } from '../config/prisma';
import { MentorshipStatus, TrainerStatus } from '@prisma/client';
import { antiFraudEngine } from '../engines/anti-fraud.engine';
import { logger } from '../config/logger';

export class TrainerService {
    /**
     * Get trainer dashboard data (READ-MODEL)
     * Strictly aggregation, no side effects
     */
    async getTrainerDashboardData(trainerId: string) {
        const trainer = await prisma.trainer.findUnique({
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

        if (!trainer) throw new Error('Trainer not found');

        const activeTrainees = trainer.mentorships.filter(m => m.status === MentorshipStatus.PROBATION || m.status === MentorshipStatus.ACTIVE);
        const completedTrainees = trainer.mentorships.filter(m => m.status === MentorshipStatus.COMPLETED);

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
    async grantAccreditation(params: {
        trainerId: string;
        level: 'JUNIOR' | 'SENIOR' | 'MASTER';
        weight: number;
        grantedBy: string;
        expiresAt?: Date;
    }) {
        // Deactivate previous active accreditations
        await prisma.trainerAccreditation.updateMany({
            where: { trainer_id: params.trainerId, is_active: true },
            data: { is_active: false }
        });

        return await prisma.trainerAccreditation.create({
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
    async startMentorship(params: {
        trainerId: string;
        traineeId: string;
        plan?: any;
    }) {
        const trainer = await prisma.trainer.findUnique({
            where: { id: params.trainerId },
            include: { accreditations: { where: { is_active: true } } }
        });

        if (!trainer || trainer.accreditations.length === 0) {
            throw new Error('Trainer must have an active accreditation to start mentorship');
        }

        // Expected end: current date + 60 days probation
        const expectedEnd = new Date();
        expectedEnd.setDate(expectedEnd.getDate() + 60);

        const period = await prisma.mentorshipPeriod.create({
            data: {
                trainer_id: params.trainerId,
                trainee_id: params.traineeId,
                status: MentorshipStatus.PROBATION,
                expected_end_at: expectedEnd,
                plan: params.plan
            }
        });

        // Update trainer stats
        await prisma.trainer.update({
            where: { id: params.trainerId },
            data: { trainees_total: { increment: 1 } }
        });

        return period;
    }

    /**
     * Complete mentorship period
     * CANON: Legally significant action, Audit logged, Event-driven rewards
     */
    async completeMentorship(params: {
        periodId: string;
        status: MentorshipStatus;
        notes: string;
        metrics: {
            nps_score?: number;
            kpi_improvement?: number;
            quality_score?: number;
        };
        actorId: string;
    }) {
        const period = await prisma.mentorshipPeriod.findUnique({
            where: { id: params.periodId },
            include: { trainer: true }
        });

        if (!period) throw new Error('Mentorship period not found');
        if (period.status === MentorshipStatus.COMPLETED || period.status === MentorshipStatus.FAILED) {
            throw new Error('Mentorship period is already finalized');
        }

        // 1. Persist result
        const result = await prisma.trainingResult.create({
            data: {
                mentorship_period_id: params.periodId,
                nps_score: params.metrics.nps_score,
                kpi_improvement: params.metrics.kpi_improvement,
                quality_score: params.metrics.quality_score,
                notes: `Finalized by ${params.actorId}: ${params.notes}`
            }
        });

        // 2. Update period status
        const finishedPeriod = await prisma.mentorshipPeriod.update({
            where: { id: params.periodId },
            data: {
                status: params.status,
                finished_at: new Date()
            }
        });

        // 3. Update trainer global stats if successful
        if (params.status === MentorshipStatus.COMPLETED) {
            await prisma.trainer.update({
                where: { id: period.trainer_id },
                data: { trainees_successful: { increment: 1 } }
            });
        }

        // 4. Emit canonical event for Reward Engine
        await prisma.event.create({
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
    private async updateTrainerRating(trainerId: string) {
        const results = await prisma.trainingResult.findMany({
            where: { mentorship_period: { trainer_id: trainerId } }
        });

        if (results.length === 0) return;

        const npsScores = results.filter(r => r.nps_score !== null).map(r => r.nps_score!);
        const avgNPS = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;

        await prisma.trainer.update({
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
    async getTrainers(filters?: { specialty?: any; status?: string }) {
        const where: any = {};
        if (filters?.specialty) where.specialty = filters.specialty;
        if (filters?.status) where.status = filters.status as TrainerStatus;

        return await prisma.trainer.findMany({
            where,
            include: { accreditations: { where: { is_active: true } } },
            orderBy: { rating: 'desc' }
        });
    }

    /**
     * Apply to become a trainer
     */
    async createTrainerApplication(userId: string, specialty: any) {
        const existing = await prisma.trainer.findUnique({ where: { user_id: userId } });
        if (existing) throw new Error('User is already a trainer or candidate');

        return await prisma.trainer.create({
            data: {
                user_id: userId,
                specialty,
                status: TrainerStatus.CANDIDATE
            }
        });
    }
}

export const trainerService = new TrainerService();
