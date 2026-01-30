"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerToolsService = exports.ManagerToolsService = void 0;
const prisma_1 = require("../config/prisma");
const exceptions_1 = require("../exceptions");
class ManagerToolsService {
    /**
     * Submit a new Kaizen suggestion (Employee)
     */
    async submitKaizen(authorId, text) {
        if (!text || text.trim().length < 10) {
            throw new exceptions_1.ValidationError('Suggestion text is too short. Minimum 10 characters.');
        }
        return await prisma_1.prisma.kaizen.create({
            data: {
                author_id: authorId,
                text,
                status: 'NEW',
                history: [
                    {
                        status: 'NEW',
                        actorId: authorId,
                        timestamp: new Date().toISOString(),
                        comment: 'Initial submission'
                    }
                ]
            }
        });
    }
    /**
     * Review a Kaizen suggestion (Manager Only via Guard/Controller)
     * CRITICAL: Enforce comment if rejected. History preservation.
     */
    async reviewKaizen(managerId, kaizenId, status, comment) {
        const kaizen = await prisma_1.prisma.kaizen.findUnique({
            where: { id: kaizenId }
        });
        if (!kaizen)
            throw new Error('Kaizen suggestion not found');
        if (status === 'REJECTED' && (!comment || comment.trim().length < 5)) {
            throw new exceptions_1.ValidationError('Rejection requires a constructive comment (min 5 chars).');
        }
        const newHistoryItem = {
            status,
            actorId: managerId,
            timestamp: new Date().toISOString(),
            comment
        };
        const updatedHistory = [...kaizen.history, newHistoryItem];
        return await prisma_1.prisma.kaizen.update({
            where: { id: kaizenId },
            data: {
                status,
                manager_comment: comment,
                history: updatedHistory
            }
        });
    }
    /**
     * Get Kaizen feed for manager review
     */
    async getKaizenFeed(status) {
        return await prisma_1.prisma.kaizen.findMany({
            where: status ? { status } : {},
            include: {
                author: {
                    select: {
                        first_name: true,
                        last_name: true,
                        avatar: true,
                        erp_role: { select: { name: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }
    /**
     * Get aggregated mood for Team Happiness Widget (Mirror of AdaptationService.getTeamStatus)
     * Ensuring service logic consistency.
     */
    async getTeamHappinessReport(managerId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sessions = await prisma_1.prisma.oneOnOne.findMany({
            where: {
                manager_id: managerId,
                completed_at: { gte: thirtyDaysAgo, not: null },
                mood: { not: null }
            },
            select: { mood: true }
        });
        const avg = sessions.length > 0
            ? sessions.reduce((acc, s) => acc + (s.mood || 0), 0) / sessions.length
            : null;
        return {
            average: avg ? Math.round(avg * 10) / 10 : null,
            trend: 'STABLE', // Simplified trend logic for now
            status: 'Advisory - Not a KPI'
        };
    }
}
exports.ManagerToolsService = ManagerToolsService;
exports.managerToolsService = new ManagerToolsService();
