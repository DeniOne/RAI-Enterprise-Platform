"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gamification_service_1 = __importDefault(require("../services/gamification.service"));
class GamificationController {
    // ========== STATUS ENDPOINTS ==========
    async getMyStatus(req, res) {
        try {
            const userId = req.user.id;
            const status = await gamification_service_1.default.getMyStatus(userId);
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async calculateStatus(req, res) {
        try {
            const userId = req.user.id;
            const result = await gamification_service_1.default.calculateStatus(userId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // ========== ACHIEVEMENT ENDPOINTS ==========
    async getAchievements(req, res) {
        try {
            const userId = req.params.userId || req.user.id;
            const achievements = await gamification_service_1.default.getAchievements(userId);
            res.json(achievements);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getAvailableAchievements(req, res) {
        try {
            const achievements = await gamification_service_1.default.getAvailableAchievements();
            res.json(achievements);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async awardAchievement(req, res) {
        try {
            // Admin only - should be protected by middleware
            const { userId } = req.params;
            const { achievementId } = req.body;
            if (!achievementId) {
                return res.status(400).json({ message: 'achievementId is required' });
            }
            const result = await gamification_service_1.default.awardAchievement(userId, achievementId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    // ========== LEADERBOARD ENDPOINTS ==========
    async getLeaderboard(req, res) {
        try {
            const metric = req.params.metric || req.query.metric;
            const period = req.params.period || req.query.period;
            const leaderboard = await gamification_service_1.default.getLeaderboard(metric, period);
            res.json(leaderboard);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async getMyRank(req, res) {
        try {
            const userId = req.user.id;
            const ranks = await gamification_service_1.default.getMyRank(userId);
            res.json(ranks);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // ========== QUEST ENDPOINTS ==========
    async getActiveQuests(req, res) {
        try {
            const quests = await gamification_service_1.default.getActiveQuests();
            res.json(quests);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async startQuest(req, res) {
        try {
            const userId = req.user.id;
            const { id: questId } = req.params;
            const progress = await gamification_service_1.default.startQuest(userId, questId);
            res.json(progress);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async getQuestProgress(req, res) {
        try {
            const userId = req.user.id;
            const { id: questId } = req.params;
            const progress = await gamification_service_1.default.getQuestProgress(userId, questId);
            if (!progress) {
                return res.status(404).json({ message: 'Quest progress not found' });
            }
            res.json(progress);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    async abandonQuest(req, res) {
        try {
            const userId = req.user.id;
            const { id: questId } = req.params;
            const result = await gamification_service_1.default.abandonQuest(userId, questId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    // ========== ADMIN/CRON ENDPOINTS ==========
    async triggerStatusCalculation(req, res) {
        try {
            // This endpoint can be used to manually trigger status calculation
            // Should be protected by admin middleware
            const result = await gamification_service_1.default.calculateAllStatuses();
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.default = new GamificationController();
