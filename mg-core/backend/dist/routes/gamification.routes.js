"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const gamification_controller_1 = __importDefault(require("../controllers/gamification.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(passport_1.default.authenticate('jwt', { session: false }));
// ========== STATUS ROUTES ==========
router.get('/my-status', gamification_controller_1.default.getMyStatus);
router.post('/status/calc', gamification_controller_1.default.calculateStatus);
// ========== ACHIEVEMENT ROUTES ==========
router.get('/achievements', gamification_controller_1.default.getAchievements);
router.get('/achievements/available', gamification_controller_1.default.getAvailableAchievements);
router.get('/achievements/:userId', gamification_controller_1.default.getAchievements);
router.post('/achievements/:userId/award', gamification_controller_1.default.awardAchievement); // Admin only
// ========== LEADERBOARD ROUTES ==========
router.get('/leaderboard', gamification_controller_1.default.getLeaderboard);
router.get('/leaderboard/:metric/:period', gamification_controller_1.default.getLeaderboard);
router.get('/my-rank', gamification_controller_1.default.getMyRank);
// ========== QUEST ROUTES ==========
router.get('/quests', gamification_controller_1.default.getActiveQuests);
router.post('/quests/:id/start', gamification_controller_1.default.startQuest);
router.get('/quests/:id/progress', gamification_controller_1.default.getQuestProgress);
router.post('/quests/:id/abandon', gamification_controller_1.default.abandonQuest);
// ========== ADMIN/CRON ROUTES ==========
router.post('/admin/calculate-all-statuses', gamification_controller_1.default.triggerStatusCalculation); // Admin only
exports.default = router;
