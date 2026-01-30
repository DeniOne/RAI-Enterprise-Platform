import { prisma } from '../config/prisma';

export class AdaptationService {
    /**
     * Get mentorship and 1-on-1 status for a specific user
     */
    async getMyAdaptationStatus(userId: string) {
        const mentorship = await prisma.mentorship.findUnique({
            where: { mentee_id: userId },
            include: {
                mentor: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        avatar: true,
                        role: true,
                    }
                }
            }
        });

        const next1on1 = await prisma.oneOnOne.findFirst({
            where: {
                employee_id: userId,
                scheduled_at: { gte: new Date() },
                completed_at: null
            },
            orderBy: { scheduled_at: 'asc' },
            include: {
                manager: {
                    select: {
                        first_name: true,
                        last_name: true
                    }
                }
            }
        });

        return {
            mentor: mentorship ? {
                id: mentorship.mentor.id,
                name: `${mentorship.mentor.first_name} ${mentorship.mentor.last_name}`,
                avatar: mentorship.mentor.avatar,
                role: mentorship.mentor.role,
                status: mentorship.status
            } : null,
            nextMeeting: next1on1 ? {
                id: next1on1.id,
                scheduledAt: next1on1.scheduled_at,
                managerName: `${next1on1.manager.first_name} ${next1on1.manager.last_name}`
            } : null
        };
    }

    /**
     * Create a 1-on-1 meeting
     */
    async create1on1(data: { managerId: string, employeeId: string, scheduledAt: Date }) {
        return await prisma.oneOnOne.create({
            data: {
                manager_id: data.managerId,
                employee_id: data.employeeId,
                scheduled_at: data.scheduledAt
            }
        });
    }

    /**
     * Complete a 1-on-1 meeting with private notes and soft-signal mood
     */
    async complete1on1(id: string, notes: string, actionItems: any, mood: number) {
        return await prisma.oneOnOne.update({
            where: { id },
            data: {
                notes, // Private to manager
                action_items: actionItems,
                mood, // Soft signal, NOT a KPI
                completed_at: new Date()
            }
        });
    }

    /**
     * Get management dashboard stats for a manager
     * CRITICAL: Anonymized aggregation only! No individual ranks.
     */
    async getTeamStatus(managerId: string) {
        // 1. Find all mentees
        const mentees = await prisma.mentorship.findMany({
            where: { mentor_id: managerId, status: 'ACTIVE' },
            include: {
                mentee: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        avatar: true,
                        erp_role: { select: { name: true } }
                    }
                }
            }
        });

        // 2. Aggregate team happiness (Trend/Average only)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSessions = await prisma.oneOnOne.findMany({
            where: {
                manager_id: managerId,
                completed_at: { gte: thirtyDaysAgo, not: null },
                mood: { not: null }
            },
            select: { mood: true, completed_at: true }
        });

        const avgMood = recentSessions.length > 0
            ? recentSessions.reduce((acc, s) => acc + (s.mood || 0), 0) / recentSessions.length
            : null;

        // Anonymized result for dashboard
        return {
            mentees: mentees.map((m: any) => m.mentee),
            teamHappiness: {
                average: avgMood ? Math.round(avgMood * 10) / 10 : null,
                label: "Advisory Metric - Not a KPI",
                sessionCount: recentSessions.length
            },
            pendingMeetings: await prisma.oneOnOne.findMany({
                where: {
                    manager_id: managerId,
                    completed_at: null,
                    scheduled_at: { gte: new Date() }
                },
                include: {
                    employee: { select: { first_name: true, last_name: true } }
                },
                orderBy: { scheduled_at: 'asc' }
            })
        };
    }
}

export const adaptationService = new AdaptationService();
