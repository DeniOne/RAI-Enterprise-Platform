import { Request, Response } from 'express';
import gamificationService from '../services/gamification.service';

class GamificationController {
    // ========== STATUS ENDPOINTS ==========

    async getMyStatus(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const status = await gamificationService.getMyStatus(userId);
            res.json(status);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async calculateStatus(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const result = await gamificationService.calculateStatus(userId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // ========== ACHIEVEMENT ENDPOINTS ==========

    async getAchievements(req: Request, res: Response) {
        try {
            const userId = req.params.userId || (req.user as any).id;
            const achievements = await gamificationService.getAchievements(userId);
            res.json(achievements);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getAvailableAchievements(req: Request, res: Response) {
        try {
            const achievements = await gamificationService.getAvailableAchievements();
            res.json(achievements);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async awardAchievement(req: Request, res: Response) {
        try {
            // Admin only - should be protected by middleware
            const { userId } = req.params;
            const { achievementId } = req.body;

            if (!achievementId) {
                return res.status(400).json({ message: 'achievementId is required' });
            }

            const result = await gamificationService.awardAchievement(userId, achievementId);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // ========== LEADERBOARD ENDPOINTS ==========

    async getLeaderboard(req: Request, res: Response) {
        try {
            const metric = req.params.metric || req.query.metric as string;
            const period = req.params.period || req.query.period as string;

            const leaderboard = await gamificationService.getLeaderboard(metric, period);
            res.json(leaderboard);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getMyRank(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const ranks = await gamificationService.getMyRank(userId);
            res.json(ranks);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // ========== QUEST ENDPOINTS ==========

    async getActiveQuests(req: Request, res: Response) {
        try {
            const quests = await gamificationService.getActiveQuests();
            res.json(quests);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async startQuest(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const { id: questId } = req.params;

            const progress = await gamificationService.startQuest(userId, questId);
            res.json(progress);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async getQuestProgress(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const { id: questId } = req.params;

            const progress = await gamificationService.getQuestProgress(userId, questId);

            if (!progress) {
                return res.status(404).json({ message: 'Quest progress not found' });
            }

            res.json(progress);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async abandonQuest(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const { id: questId } = req.params;

            const result = await gamificationService.abandonQuest(userId, questId);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // ========== ADMIN/CRON ENDPOINTS ==========

    async triggerStatusCalculation(req: Request, res: Response) {
        try {
            // This endpoint can be used to manually trigger status calculation
            // Should be protected by admin middleware
            const result = await gamificationService.calculateAllStatuses();
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new GamificationController();
