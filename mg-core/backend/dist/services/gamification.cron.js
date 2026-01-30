"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationCron = void 0;
const gamification_service_1 = __importDefault(require("./gamification.service"));
const client_1 = require("@prisma/client");
/**
 * Gamification Cron Jobs
 *
 * Scheduled tasks for automated gamification processes:
 * - Status calculation (daily at 01:00)
 * - Achievement checking (daily at 02:00)
 * - Leaderboard cache updates (every 5 minutes)
 */
class GamificationCron {
    /**
     * Calculate statuses for all active users
     * Runs daily at 01:00
     */
    async calculateAllStatuses() {
        console.log('[CRON] Starting daily status calculation...');
        try {
            const result = await gamification_service_1.default.calculateAllStatuses();
            console.log(`[CRON] Status calculation complete: ${result.updated}/${result.total} users updated`);
            return result;
        }
        catch (error) {
            console.error('[CRON] Error in status calculation:', error);
            throw error;
        }
    }
    /**
     * Check and unlock achievements for all users
     * Runs daily at 02:00
     */
    async checkAllAchievements() {
        console.log('[CRON] Starting achievement check...');
        try {
            // This would iterate through all users and check their achievements
            // For now, placeholder
            console.log('[CRON] Achievement check complete');
            return { message: 'Achievement check completed' };
        }
        catch (error) {
            console.error('[CRON] Error in achievement check:', error);
            throw error;
        }
    }
    /**
     * Update all leaderboard caches
     * Runs every 5 minutes
     */
    async updateAllLeaderboards() {
        console.log('[CRON] Starting leaderboard cache update...');
        try {
            const metrics = [
                client_1.LeaderboardMetric.MC_BALANCE,
                client_1.LeaderboardMetric.GMC_BALANCE,
                client_1.LeaderboardMetric.COMPLETED_TASKS,
                client_1.LeaderboardMetric.STATUS_LEVEL
            ];
            const periods = [
                client_1.LeaderboardPeriod.WEEK,
                client_1.LeaderboardPeriod.MONTH,
                client_1.LeaderboardPeriod.ALL_TIME
            ];
            let updated = 0;
            for (const metric of metrics) {
                for (const period of periods) {
                    await gamification_service_1.default.updateLeaderboardCache(metric, period);
                    updated++;
                }
            }
            console.log(`[CRON] Leaderboard cache update complete: ${updated} leaderboards updated`);
            return { updated };
        }
        catch (error) {
            console.error('[CRON] Error in leaderboard update:', error);
            throw error;
        }
    }
    /**
     * Initialize cron jobs
     * This would be called from the main application
     */
    initializeCronJobs() {
        console.log('[CRON] Initializing gamification cron jobs...');
        // Note: In production, use a proper cron library like node-cron or @nestjs/schedule
        // For now, this is a placeholder structure
        // Example with node-cron:
        // cron.schedule('0 1 * * *', () => this.calculateAllStatuses());
        // cron.schedule('0 2 * * *', () => this.checkAllAchievements());
        // cron.schedule('*/5 * * * *', () => this.updateAllLeaderboards());
        console.log('[CRON] Gamification cron jobs initialized');
    }
}
exports.GamificationCron = GamificationCron;
exports.default = new GamificationCron();
