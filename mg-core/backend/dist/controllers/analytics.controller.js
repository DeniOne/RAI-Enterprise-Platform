"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const kpi_service_1 = __importDefault(require("../services/kpi.service"));
class AnalyticsController {
    // GET /api/analytics/personal
    async getPersonalAnalytics(req, res) {
        try {
            // AuthGuard middleware ensures user exists
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }
            const daily = await kpi_service_1.default.calculateDailyStats();
            const weekly = await kpi_service_1.default.calculateWeeklyStats();
            const monthly = await kpi_service_1.default.calculateMonthlyStats();
            res.status(200).json({ success: true, data: { daily, weekly, monthly } });
        }
        catch (error) {
            console.error('Personal analytics error:', error);
            res.status(500).json({ success: false, error: { message: 'Internal server error' } });
        }
    }
    // GET /api/analytics/executive
    async getExecutiveAnalytics(req, res) {
        try {
            // Guard should ensure admin role; we just return aggregated stats
            const daily = await kpi_service_1.default.calculateDailyStats();
            const weekly = await kpi_service_1.default.calculateWeeklyStats();
            const monthly = await kpi_service_1.default.calculateMonthlyStats();
            res.status(200).json({ success: true, data: { daily, weekly, monthly } });
        }
        catch (error) {
            console.error('Executive analytics error:', error);
            res.status(500).json({ success: false, error: { message: 'Internal server error' } });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.default = new AnalyticsController();
