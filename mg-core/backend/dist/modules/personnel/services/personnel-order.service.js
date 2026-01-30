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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const hr_domain_event_service_1 = require("./hr-domain-event.service");
let PersonnelOrderService = class PersonnelOrderService {
    prisma;
    hrEventService;
    constructor(prisma, hrEventService) {
        this.prisma = prisma;
        this.hrEventService = hrEventService;
    }
    /**
     * Create personnel order
     */
    async create(personalFileId, orderType, data, actorId, actorRole) {
        // Generate unique order number
        const orderNumber = await this.generateOrderNumber(orderType);
        const order = await this.prisma.personnelOrder.create({
            data: {
                personalFileId,
                orderType,
                orderNumber,
                title: data.title,
                content: data.content,
                basis: data.basis,
                orderDate: data.orderDate,
                effectiveDate: data.effectiveDate,
                status: 'DRAFT',
                createdById: actorId,
            },
        });
        // Emit ORDER_CREATED event
        await this.hrEventService.emit({
            eventType: 'ORDER_CREATED',
            aggregateType: 'PERSONNEL_ORDER',
            aggregateId: order.id,
            actorId,
            actorRole,
            payload: {
                orderType,
                orderNumber,
                personalFileId,
            },
            newState: { status: 'DRAFT' },
        });
        return order;
    }
    /**
     * Sign order (DIRECTOR only!)
     * CRITICAL: Only DIRECTOR role can sign orders
     */
    async sign(id, signerId, signerRole) {
        const order = await this.prisma.personnelOrder.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException(`PersonnelOrder ${id} not found`);
        }
        if (order.status !== 'APPROVED' && order.status !== 'DRAFT') {
            throw new common_1.ForbiddenException(`Cannot sign order in status ${order.status}. Must be APPROVED or DRAFT.`);
        }
        // Update order
        const signed = await this.prisma.personnelOrder.update({
            where: { id },
            data: {
                status: 'SIGNED',
                signedById: signerId,
                signedAt: new Date(),
            },
        });
        // Emit ORDER_SIGNED event (CRITICAL: validates DIRECTOR role)
        await this.hrEventService.emit({
            eventType: 'ORDER_SIGNED',
            aggregateType: 'PERSONNEL_ORDER',
            aggregateId: id,
            actorId: signerId,
            actorRole: signerRole, // Will throw if not DIRECTOR
            payload: {
                orderNumber: order.orderNumber,
                orderType: order.orderType,
            },
            previousState: { status: order.status },
            newState: { status: 'SIGNED' },
            legalBasis: `Order signed by ${signerRole}`,
        });
        return signed;
    }
    /**
     * Cancel order
     */
    async cancel(id, reason, actorId, actorRole) {
        const order = await this.prisma.personnelOrder.findUnique({
            where: { id },
        });
        if (!order) {
            throw new common_1.NotFoundException(`PersonnelOrder ${id} not found`);
        }
        if (order.status === 'SIGNED') {
            throw new common_1.ForbiddenException('Cannot cancel signed order');
        }
        const cancelled = await this.prisma.personnelOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
        // Emit ORDER_CANCELLED event
        await this.hrEventService.emit({
            eventType: 'ORDER_CANCELLED',
            aggregateType: 'PERSONNEL_ORDER',
            aggregateId: id,
            actorId,
            actorRole,
            payload: {
                reason,
                orderNumber: order.orderNumber,
            },
            previousState: { status: order.status },
            newState: { status: 'CANCELLED' },
        });
        return cancelled;
    }
    /**
     * Generate unique order number
     * Format: {TYPE}-{YEAR}-{SEQ}
     */
    async generateOrderNumber(orderType) {
        const year = new Date().getFullYear();
        const count = await this.prisma.personnelOrder.count({
            where: {
                orderType,
                orderDate: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });
        const typePrefix = orderType.substring(0, 3).toUpperCase();
        return `${typePrefix}-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    /**
     * Find order by ID
     */
    async findById(id) {
        const order = await this.prisma.personnelOrder.findUnique({
            where: { id },
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`PersonnelOrder ${id} not found`);
        }
        return order;
    }
};
exports.PersonnelOrderService = PersonnelOrderService;
exports.PersonnelOrderService = PersonnelOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, hr_domain_event_service_1.HRDomainEventService])
], PersonnelOrderService);
