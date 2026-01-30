"use strict";
/**
 * Economy Analytics Controller
 * PHASE 4 — Analytics, Observability & Governance
 * Refactored to Express (no NestJS)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.economyAnalyticsController = exports.EconomyAnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
// @ts-ignore
const common_1 = require("@nestjs/common");
// @ts-ignore
const mvp_learning_contour_guard_1 = require("../../guards/mvp-learning-contour.guard");
// @ts-ignore
let EconomyAnalyticsController = class EconomyAnalyticsController {
    /**
     * GET /api/economy/analytics/overview
     * Глобальные показатели системы. Доступно ролям MANAGER, EXECUTIVE (ADMIN).
     */
    async getOverview(req, res) {
        try {
            const role = req.headers['x-user-role'];
            this.checkRole(role, ['ADMIN', 'HR_MANAGER', 'BRANCH_MANAGER'], res);
            if (res.headersSent)
                return;
            const overview = await analytics_service_1.economyAnalyticsService.getGlobalOverview();
            res.json(overview);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/economy/analytics/store
     * Статистика востребованности магазина. Доступно всем.
     */
    async getStoreActivity(req, res) {
        try {
            const activity = await analytics_service_1.economyAnalyticsService.getStoreActivity();
            res.json(activity);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/economy/analytics/wallet/my
     * Персональный тренд и баланс.
     */
    async getMyTrend(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const trend = await analytics_service_1.economyAnalyticsService.getUserWalletTrend(userId);
            res.json(trend);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/economy/analytics/wallet/:userId
     * Просмотр аудита сотрудника. Доступно HEAD_OF_DEPT (DEPARTMENT_HEAD).
     */
    async getUserTrend(req, res) {
        try {
            const role = req.headers['x-user-role'];
            this.checkRole(role, ['ADMIN', 'DEPARTMENT_HEAD'], res);
            if (res.headersSent)
                return;
            const targetUserId = req.params.userId;
            const trend = await analytics_service_1.economyAnalyticsService.getUserWalletTrend(targetUserId);
            res.json(trend);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * GET /api/economy/analytics/audit
     * Журнал аудита. Для админов - весь, для юзеров - свой.
     */
    async getAudit(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            const role = req.headers['x-user-role'];
            if (role === 'ADMIN') {
                const audit = await analytics_service_1.economyAnalyticsService.getAuditTrail();
                return res.json(audit);
            }
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const audit = await analytics_service_1.economyAnalyticsService.getAuditTrail(userId);
            res.json(audit);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    /**
     * Helper for basic RBAC checks (Phase 4 Testing Mode)
     */
    checkRole(role, allowedRoles, res) {
        if (!role || !allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied for role: ${role || 'anonymous'}` });
        }
    }
};
exports.EconomyAnalyticsController = EconomyAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EconomyAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('store'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EconomyAnalyticsController.prototype, "getStoreActivity", null);
__decorate([
    (0, common_1.Get)('wallet/my'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EconomyAnalyticsController.prototype, "getMyTrend", null);
__decorate([
    (0, common_1.Get)('wallet/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EconomyAnalyticsController.prototype, "getUserTrend", null);
__decorate([
    (0, common_1.Get)('audit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EconomyAnalyticsController.prototype, "getAudit", null);
exports.EconomyAnalyticsController = EconomyAnalyticsController = __decorate([
    (0, common_1.Controller)('api/economy/analytics')
    // @ts-ignore
    ,
    (0, common_1.UseGuards)(mvp_learning_contour_guard_1.MVPLearningContourGuard)
], EconomyAnalyticsController);
exports.economyAnalyticsController = new EconomyAnalyticsController();
