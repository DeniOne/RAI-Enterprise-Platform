import { Router } from 'express';
import passport from 'passport';
import gamificationController from '../controllers/gamification.controller';

const router = Router();

// All routes require authentication
router.use(passport.authenticate('jwt', { session: false }));

// ========== STATUS ROUTES ==========
router.get('/my-status', gamificationController.getMyStatus);
router.post('/status/calc', gamificationController.calculateStatus);

// ========== ACHIEVEMENT ROUTES ==========
router.get('/achievements', gamificationController.getAchievements);
router.get('/achievements/available', gamificationController.getAvailableAchievements);
router.get('/achievements/:userId', gamificationController.getAchievements);
router.post('/achievements/:userId/award', gamificationController.awardAchievement); // Admin only

// ========== LEADERBOARD ROUTES ==========
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/leaderboard/:metric/:period', gamificationController.getLeaderboard);
router.get('/my-rank', gamificationController.getMyRank);

// ========== QUEST ROUTES ==========
router.get('/quests', gamificationController.getActiveQuests);
router.post('/quests/:id/start', gamificationController.startQuest);
router.get('/quests/:id/progress', gamificationController.getQuestProgress);
router.post('/quests/:id/abandon', gamificationController.abandonQuest);

// ========== ADMIN/CRON ROUTES ==========
router.post('/admin/calculate-all-statuses', gamificationController.triggerStatusCalculation); // Admin only

export default router;
