"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionOrderService = exports.ProductionOrderService = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
const PRODUCTION_ORDER_FSM = {
    [client_1.ProductionOrderStatus.DRAFT]: [client_1.ProductionOrderStatus.PLANNED, client_1.ProductionOrderStatus.CANCELLED],
    [client_1.ProductionOrderStatus.PLANNED]: [client_1.ProductionOrderStatus.IN_PROGRESS, client_1.ProductionOrderStatus.CANCELLED],
    [client_1.ProductionOrderStatus.IN_PROGRESS]: [client_1.ProductionOrderStatus.ON_HOLD, client_1.ProductionOrderStatus.COMPLETED, client_1.ProductionOrderStatus.CANCELLED],
    [client_1.ProductionOrderStatus.ON_HOLD]: [client_1.ProductionOrderStatus.IN_PROGRESS, client_1.ProductionOrderStatus.CANCELLED],
    [client_1.ProductionOrderStatus.COMPLETED]: [], // Terminal
    [client_1.ProductionOrderStatus.CANCELLED]: [], // Terminal
};
function validateStatusTransition(current, next) {
    const allowed = PRODUCTION_ORDER_FSM[current];
    if (!allowed || !allowed.includes(next)) {
        throw new Error(`Invalid production order status transition: ${current} -> ${next}`);
    }
}
class ProductionOrderService {
    async create(data, userId) {
        // ... (remaining create code)
        const order = await prisma_1.prisma.productionOrder.create({
            data: {
                source_type: data.source_type,
                source_ref_id: data.source_ref_id,
                product_type: data.product_type,
                quantity: data.quantity,
                created_by_id: userId,
                status: client_1.ProductionOrderStatus.DRAFT,
            }
        });
        // 3. Log Audit
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_ORDER_CREATE',
                entity_type: 'ProductionOrder',
                entity_id: order.id,
                user_id: userId,
                details: { ...data }
            }
        });
        return order;
    }
    async getOne(id) {
        return prisma_1.prisma.productionOrder.findUnique({
            where: { id },
            include: {
                work_orders: { orderBy: { sequence_order: 'asc' } },
                quality_checks: true,
                defects: true
            }
        });
    }
    async getAll() {
        return prisma_1.prisma.productionOrder.findMany({
            orderBy: { created_at: 'desc' }
        });
    }
    async updateStatus(id, status, userId) {
        // 1. Fetch current
        const order = await prisma_1.prisma.productionOrder.findUnique({ where: { id } });
        if (!order)
            throw new Error('Order not found');
        // 2. Transition Logic (Strict FSM)
        validateStatusTransition(order.status, status);
        const updated = await prisma_1.prisma.productionOrder.update({
            where: { id },
            data: {
                status,
                closed_at: (status === client_1.ProductionOrderStatus.COMPLETED || status === client_1.ProductionOrderStatus.CANCELLED) ? new Date() : null
            }
        });
        // 3. Log Audit
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_ORDER_STATUS_CHANGE',
                entity_type: 'ProductionOrder',
                entity_id: id,
                user_id: userId,
                details: { from: order.status, to: status }
            }
        });
        return updated;
    }
}
exports.ProductionOrderService = ProductionOrderService;
exports.productionOrderService = new ProductionOrderService();
