"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
class GamificationService {
    // ========== STATUS CALCULATION ==========
    async getMyStatus(userId) {
        const status = await prisma_1.prisma.userGamificationStatus.findFirst({
            where: { user_id: userId },
            include: { status: true },
            orderBy: { achieved_at: 'desc' }
        });
        if (!status) {
            // Return default Photon status
            const photonStatus = await prisma_1.prisma.gamificationLevel.findFirst({
                where: { name: 'PHOTON' }
            });
            return photonStatus ? { status: photonStatus } : null;
        }
        return status;
    }
    async calculateStatus(userId) {
        // 1. Get user data
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true,
                assigned_tasks: { where: { status: 'DONE' } },
                employee: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // 2. Calculate metrics
        const completedTasks = user.assigned_tasks.length;
        const mcBalance = Number(user.wallet?.mc_balance || 0);
        // Calculate tenure in months
        const hireDate = user.employee?.hired_at || user.created_at;
        const tenureMonths = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        // 3. Get all status levels ordered by level
        const levels = await prisma_1.prisma.gamificationLevel.findMany({
            orderBy: { level: 'desc' }
        });
        // 4. Find highest matching level
        let matchedLevel = null;
        for (const level of levels) {
            const requirements = level.requirements;
            if (this.meetsRequirements(requirements, {
                tasks: completedTasks,
                mc: mcBalance,
                tenure_months: tenureMonths,
                is_founder: user.role === 'ADMIN' // Simplified founder check
            })) {
                matchedLevel = level;
                break;
            }
        }
        if (!matchedLevel) {
            // Default to lowest level (PHOTON)
            matchedLevel = levels[levels.length - 1];
        }
        // 5. Update user status if changed
        const currentStatus = await this.getMyStatus(userId);
        if (!currentStatus || currentStatus.status.id !== matchedLevel.id) {
            await prisma_1.prisma.userGamificationStatus.upsert({
                where: {
                    user_id_status_id: {
                        user_id: userId,
                        status_id: matchedLevel.id
                    }
                },
                create: {
                    user_id: userId,
                    status_id: matchedLevel.id,
                    achieved_at: new Date()
                },
                update: {
                    achieved_at: new Date()
                }
            });
            return {
                message: `Status updated to ${matchedLevel.name}`,
                newStatus: matchedLevel,
                upgraded: true
            };
        }
        return {
            message: 'Status unchanged',
            currentStatus: matchedLevel,
            upgraded: false
        };
    }
    meetsRequirements(requirements, metrics) {
        if (requirements.tasks && metrics.tasks < requirements.tasks)
            return false;
        if (requirements.mc && metrics.mc < requirements.mc)
            return false;
        if (requirements.tenure_months && metrics.tenure_months < requirements.tenure_months)
            return false;
        if (requirements.kpi_percent)
            return false; // KPI check not implemented
        if (requirements.is_founder && !metrics.is_founder)
            return false;
        return true;
    }
    async calculateAllStatuses() {
        const users = await prisma_1.prisma.user.findMany({
            where: { status: 'ACTIVE' }
        });
        let updated = 0;
        for (const user of users) {
            try {
                const result = await this.calculateStatus(user.id);
                if (result.upgraded)
                    updated++;
            }
            catch (error) {
                console.error(`Error calculating status for user ${user.id}:`, error);
            }
        }
        return { total: users.length, updated };
    }
    // ========== ACHIEVEMENTS ==========
    async getAchievements(userId) {
        return await prisma_1.prisma.userAchievement.findMany({
            where: { user_id: userId },
            include: { achievement: true },
            orderBy: { earned_at: 'desc' }
        });
    }
    async getAvailableAchievements() {
        return await prisma_1.prisma.achievement.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async awardAchievement(userId, achievementId) {
        // Check if user already has this achievement
        const existing = await prisma_1.prisma.userAchievement.findUnique({
            where: {
                user_id_achievement_id: {
                    user_id: userId,
                    achievement_id: achievementId
                }
            }
        });
        if (existing) {
            throw new Error('User already has this achievement');
        }
        const userAchievement = await prisma_1.prisma.userAchievement.create({
            data: {
                user_id: userId,
                achievement_id: achievementId,
                earned_at: new Date()
            },
            include: { achievement: true }
        });
        // TODO: Send notification
        return userAchievement;
    }
    async checkAndUnlockAchievements(userId) {
        // This would contain logic to check various achievement criteria
        // For now, placeholder
        const unlockedAchievements = [];
        // Example: Check if user completed 10 tasks
        const completedTasks = await prisma_1.prisma.task.count({
            where: { assignee_id: userId, status: 'DONE' }
        });
        if (completedTasks >= 10) {
            const achievement = await prisma_1.prisma.achievement.findFirst({
                where: { name: 'First 10 Tasks' }
            });
            if (achievement) {
                try {
                    const unlocked = await this.awardAchievement(userId, achievement.id);
                    unlockedAchievements.push(unlocked);
                }
                catch (error) {
                    // Already has it
                }
            }
        }
        return unlockedAchievements;
    }
    // ========== LEADERBOARDS ==========
    async getLeaderboard(metric, period) {
        const leaderboardMetric = (metric?.toUpperCase() || 'MC_BALANCE');
        const leaderboardPeriod = (period?.toUpperCase() || 'ALL_TIME');
        // Try to get from cache first
        const cached = await prisma_1.prisma.leaderboard.findUnique({
            where: {
                metric_period: {
                    metric: leaderboardMetric,
                    period: leaderboardPeriod
                }
            }
        });
        if (cached && this.isCacheValid(cached.updated_at)) {
            return cached.top_users;
        }
        // Calculate fresh leaderboard
        return await this.updateLeaderboardCache(leaderboardMetric, leaderboardPeriod);
    }
    isCacheValid(updatedAt) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return updatedAt > fiveMinutesAgo;
    }
    async updateLeaderboardCache(metric = client_1.LeaderboardMetric.MC_BALANCE, period = client_1.LeaderboardPeriod.ALL_TIME) {
        let topUsers = [];
        switch (metric) {
            case client_1.LeaderboardMetric.MC_BALANCE:
                topUsers = await this.getTopByMC(period);
                break;
            case client_1.LeaderboardMetric.GMC_BALANCE:
                topUsers = await this.getTopByGMC(period);
                break;
            case client_1.LeaderboardMetric.COMPLETED_TASKS:
                topUsers = await this.getTopByTasks(period);
                break;
            case client_1.LeaderboardMetric.STATUS_LEVEL:
                topUsers = await this.getTopByStatus();
                break;
        }
        // Save to cache
        await prisma_1.prisma.leaderboard.upsert({
            where: {
                metric_period: {
                    metric,
                    period
                }
            },
            create: {
                metric,
                period,
                top_users: topUsers
            },
            update: {
                top_users: topUsers,
                updated_at: new Date()
            }
        });
        return topUsers;
    }
    async getTopByMC(period) {
        const users = await prisma_1.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            include: {
                wallet: true,
                statuses: {
                    include: { status: true },
                    orderBy: { achieved_at: 'desc' },
                    take: 1
                }
            },
            take: 100,
            orderBy: { wallet: { mc_balance: 'desc' } }
        });
        return users.map((u, index) => ({
            userId: u.id,
            name: `${u.first_name} ${u.last_name}`,
            avatar: u.avatar || undefined,
            position: index + 1,
            score: Number(u.wallet?.mc_balance || 0),
            status: u.statuses[0]?.status.name,
            level: u.statuses[0]?.status.level
        }));
    }
    async getTopByGMC(period) {
        const users = await prisma_1.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            include: {
                wallet: true,
                statuses: {
                    include: { status: true },
                    orderBy: { achieved_at: 'desc' },
                    take: 1
                }
            },
            take: 100,
            orderBy: { wallet: { gmc_balance: 'desc' } }
        });
        return users.map((u, index) => ({
            userId: u.id,
            name: `${u.first_name} ${u.last_name}`,
            avatar: u.avatar || undefined,
            position: index + 1,
            score: Number(u.wallet?.gmc_balance || 0),
            status: u.statuses[0]?.status.name,
            level: u.statuses[0]?.status.level
        }));
    }
    async getTopByTasks(period) {
        // Get users with task counts
        const userTasks = await prisma_1.prisma.task.groupBy({
            by: ['assignee_id'],
            where: {
                status: 'DONE',
                assignee_id: { not: null }
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 100
        });
        const userIds = userTasks.map(ut => ut.assignee_id);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            include: {
                statuses: {
                    include: { status: true },
                    orderBy: { achieved_at: 'desc' },
                    take: 1
                }
            }
        });
        const userMap = new Map(users.map(u => [u.id, u]));
        return userTasks.map((ut, index) => {
            const user = userMap.get(ut.assignee_id);
            return {
                userId: ut.assignee_id,
                name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
                avatar: user?.avatar || undefined,
                position: index + 1,
                score: ut._count.id,
                status: user?.statuses[0]?.status.name,
                level: user?.statuses[0]?.status.level
            };
        });
    }
    async getTopByStatus() {
        const users = await prisma_1.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            include: {
                statuses: {
                    include: { status: true },
                    orderBy: { achieved_at: 'desc' },
                    take: 1
                }
            },
            take: 100
        });
        // Sort by status level
        users.sort((a, b) => {
            const levelA = a.statuses[0]?.status.level || 0;
            const levelB = b.statuses[0]?.status.level || 0;
            return levelB - levelA;
        });
        return users.map((u, index) => ({
            userId: u.id,
            name: `${u.first_name} ${u.last_name}`,
            avatar: u.avatar || undefined,
            position: index + 1,
            score: u.statuses[0]?.status.level || 0,
            status: u.statuses[0]?.status.name,
            level: u.statuses[0]?.status.level
        }));
    }
    async getMyRank(userId) {
        const ranks = {};
        // MC rank
        const mcRank = await this.getUserRankInMetric(userId, client_1.LeaderboardMetric.MC_BALANCE);
        ranks.mc = mcRank;
        // GMC rank
        const gmcRank = await this.getUserRankInMetric(userId, client_1.LeaderboardMetric.GMC_BALANCE);
        ranks.gmc = gmcRank;
        // Tasks rank
        const tasksRank = await this.getUserRankInMetric(userId, client_1.LeaderboardMetric.COMPLETED_TASKS);
        ranks.tasks = tasksRank;
        // Status rank
        const statusRank = await this.getUserRankInMetric(userId, client_1.LeaderboardMetric.STATUS_LEVEL);
        ranks.status = statusRank;
        return ranks;
    }
    async getUserRankInMetric(userId, metric) {
        const leaderboard = await this.getLeaderboard(metric, client_1.LeaderboardPeriod.ALL_TIME);
        const entries = leaderboard;
        const index = entries.findIndex(e => e.userId === userId);
        return index >= 0 ? index + 1 : -1;
    }
    // ========== QUESTS ==========
    async getActiveQuests() {
        return await prisma_1.prisma.quest.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' }
        });
    }
    async startQuest(userId, questId) {
        // Check if quest exists and is active
        const quest = await prisma_1.prisma.quest.findUnique({
            where: { id: questId }
        });
        if (!quest || !quest.is_active) {
            throw new Error('Quest not found or inactive');
        }
        // Check if user already started this quest
        const existing = await prisma_1.prisma.questProgress.findUnique({
            where: {
                user_id_quest_id: {
                    user_id: userId,
                    quest_id: questId
                }
            }
        });
        if (existing && existing.status !== client_1.QuestStatus.ABANDONED) {
            throw new Error('Quest already started');
        }
        // Create or update quest progress
        const progress = await prisma_1.prisma.questProgress.upsert({
            where: {
                user_id_quest_id: {
                    user_id: userId,
                    quest_id: questId
                }
            },
            create: {
                user_id: userId,
                quest_id: questId,
                status: client_1.QuestStatus.IN_PROGRESS,
                started_at: new Date(),
                progress: {}
            },
            update: {
                status: client_1.QuestStatus.IN_PROGRESS,
                started_at: new Date(),
                progress: {}
            },
            include: { quest: true }
        });
        return progress;
    }
    async getQuestProgress(userId, questId) {
        return await prisma_1.prisma.questProgress.findUnique({
            where: {
                user_id_quest_id: {
                    user_id: userId,
                    quest_id: questId
                }
            },
            include: { quest: true }
        });
    }
    async abandonQuest(userId, questId) {
        return await prisma_1.prisma.questProgress.update({
            where: {
                user_id_quest_id: {
                    user_id: userId,
                    quest_id: questId
                }
            },
            data: {
                status: client_1.QuestStatus.ABANDONED
            }
        });
    }
    async completeQuest(userId, questId) {
        const quest = await prisma_1.prisma.quest.findUnique({
            where: { id: questId }
        });
        if (!quest) {
            throw new Error('Quest not found');
        }
        // Update quest progress
        await prisma_1.prisma.questProgress.update({
            where: {
                user_id_quest_id: {
                    user_id: userId,
                    quest_id: questId
                }
            },
            data: {
                status: client_1.QuestStatus.COMPLETED,
                completed_at: new Date()
            }
        });
        // Award MC rewards (via canonical registry)
        if (quest.reward_mc > 0) {
            const { checkCanon } = require('../core/canon');
            // Validate via centralized registry
            await checkCanon({
                canon: 'MC',
                action: 'MC_EARN',
                source: 'API',
                payload: {
                    questId,
                    userId,
                    amount: quest.reward_mc,
                    // Quest rewards are operational engagement - allowed
                    monetaryEquivalent: false,
                    kpiBased: false,
                    creativeTask: false,
                    noExpiration: false,
                    unlimited: false
                },
                userId
            });
            // Registry handles validation, logging, and errors
            // If we reach here, operation is allowed
            await prisma_1.prisma.wallet.update({
                where: { user_id: userId },
                data: {
                    mc_balance: { increment: quest.reward_mc }
                }
            });
            await prisma_1.prisma.transaction.create({
                data: {
                    type: 'REWARD',
                    currency: 'MC',
                    amount: quest.reward_mc,
                    recipient_id: userId,
                    description: `Quest reward: ${quest.title}`
                }
            });
        }
        // GMC rewards are FORBIDDEN by canonical rules
        // GMC cannot be earned automatically - it must be recognized by Heroes Fund Committee
        if (quest.reward_gmc > 0) {
            const { checkGMCCanon, CanonicalViolationError, CanonicalViolationLogger } = require('../core/canon');
            const canonCheck = checkGMCCanon({
                action: 'GMC_GRANT_AUTOMATIC',
                source: 'API',
                payload: {
                    automatic: true,
                    questId,
                    userId,
                    amount: quest.reward_gmc
                }
            });
            // Log the violation
            await CanonicalViolationLogger.log('GMC', canonCheck.violation, 'API', 'QUEST_COMPLETION_GMC_REWARD', { questId, userId, amount: quest.reward_gmc }, userId);
            // Throw error - GMC cannot be granted automatically
            throw new CanonicalViolationError('GMC', canonCheck.violation, `${canonCheck.message} Quest GMC rewards violate canonical rules. GMC must be granted by Heroes Fund Committee, not automatically.`);
        }
        return {
            message: 'Quest completed',
            rewards: {
                mc: quest.reward_mc,
                gmc: 0 // GMC rewards blocked by canonical guard
            }
        };
    }
}
exports.GamificationService = GamificationService;
exports.default = new GamificationService();
