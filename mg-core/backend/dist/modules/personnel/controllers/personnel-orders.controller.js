"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelOrdersController = void 0;
const common_1 = require("@nestjs/common");
const personnel_order_service_1 = require("../services/personnel-order.service");
const request_1 = require("../dto/request");
const guards_1 = require("../guards");
const prisma_service_1 = require("@/prisma/prisma.service");
let PersonnelOrdersController = class PersonnelOrdersController {
    orderService;
    prisma;
    constructor(orderService, prisma) {
        this.orderService = orderService;
        this.prisma = prisma;
    }
    /**
     * GET /api/personnel/orders
     * Список приказов
     * RBAC: HR_SPECIALIST+
     */
    async findAll(status, orderType, personalFileId) {
        const where = {};
        if (status) {
            where.status = status;
        }
        if (orderType) {
            where.orderType = orderType;
        }
        if (personalFileId) {
            where.personalFileId = personalFileId;
        }
        const orders = await this.prisma.personnelOrder.findMany({
            where,
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
        return orders;
    }
    /**
     * GET /api/personnel/orders/:id
     * Детали приказа
     * RBAC: HR_SPECIALIST+
     */
    async findById(id) {
        const order = await this.orderService.findById(id);
        return order;
    }
    /**
     * POST /api/personnel/orders
     * Создание приказа
     * RBAC: HR_SPECIALIST+
     */
    async create(dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_SPECIALIST';
        const order = await this.orderService.create(dto.personalFileId, dto.orderType, {
            title: dto.title,
            content: dto.content,
            basis: dto.basis,
            orderDate: new Date(dto.orderDate),
            effectiveDate: new Date(dto.effectiveDate),
        }, actorId, actorRole);
        return order;
    }
    /**
     * POST /api/personnel/orders/:id/sign
     * Подписание приказа
     * CRITICAL: DIRECTOR ONLY!
     * RBAC: DIRECTOR
     */
    async sign(id, dto, req) {
        const signerRole = req.user?.role || 'UNKNOWN';
        // CRITICAL: Validate DIRECTOR role
        // This will be enforced by HRDomainEventService.emit()
        // which validates role permissions for ORDER_SIGNED event
        const order = await this.orderService.sign(id, dto.signerId, signerRole);
        return order;
    }
    /**
     * POST /api/personnel/orders/:id/cancel
     * Отмена приказа
     * RBAC: HR_MANAGER+
     */
    async cancel(id, dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';
        const order = await this.orderService.cancel(id, dto.reason, actorId, actorRole);
        return order;
    }
    /**
     * GET /api/personnel/orders/:id/pdf
     * Генерация PDF приказа
     * RBAC: HR_SPECIALIST+
     * TODO: Requires DocumentGeneratorService
     */
    async generatePdf(id) {
        throw new Error('Not implemented - requires DocumentGeneratorService');
    }
};
exports.PersonnelOrdersController = PersonnelOrdersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('orderType')),
    __param(2, (0, common_1.Query)('personalFileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PersonnelOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonnelOrdersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PersonnelOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    (0, common_1.UseGuards)(guards_1.RequireDirectorGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_1.SignOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PersonnelOrdersController.prototype, "sign", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_1.CancelOrderDto, Object]),
    __metadata("design:returntype", Promise)
], PersonnelOrdersController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonnelOrdersController.prototype, "generatePdf", null);
exports.PersonnelOrdersController = PersonnelOrdersController = __decorate([
    (0, common_1.Controller)('api/personnel/orders'),
    (0, common_1.UseGuards)(guards_1.PersonnelAccessGuard),
    __metadata("design:paramtypes", [personnel_order_service_1.PersonnelOrderService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PersonnelOrdersController);
