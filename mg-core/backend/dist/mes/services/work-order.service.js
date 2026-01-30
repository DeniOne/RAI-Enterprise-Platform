"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workOrderService = exports.WorkOrderService = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
class WorkOrderService {
    async create(data, userId) {
        // Validate Production Order
        const pOrder = await prisma_1.prisma.productionOrder.findUnique({ where: { id: data.production_order_id } });
        if (!pOrder)
            throw new Error('Production Order not found');
        const workOrder = await prisma_1.prisma.workOrder.create({
            data: {
                production_order_id: data.production_order_id,
                operation_type: data.operation_type,
                sequence_order: data.sequence_order,
                assigned_to_id: data.assigned_to_id,
                status: client_1.WorkOrderStatus.PENDING
            }
        });
        // Audit Log
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_WORK_ORDER_CREATE',
                entity_type: 'WorkOrder',
                entity_id: workOrder.id,
                user_id: userId,
                details: { ...data }
            }
        });
        return workOrder;
    }
    async updateStatus(id, status, userId) {
        const wo = await prisma_1.prisma.workOrder.findUnique({ where: { id } });
        if (!wo)
            throw new Error('Work Order not found');
        const updated = await prisma_1.prisma.workOrder.update({
            where: { id },
            data: {
                status,
                started_at: (status === client_1.WorkOrderStatus.IN_PROGRESS && !wo.started_at) ? new Date() : wo.started_at,
                finished_at: (status === client_1.WorkOrderStatus.COMPLETED) ? new Date() : null
            }
        });
        // Audit Log
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_WORK_ORDER_STATUS_CHANGE',
                entity_type: 'WorkOrder',
                entity_id: id,
                user_id: userId,
                details: { from: wo.status, to: status }
            }
        });
        return updated;
    }
}
exports.WorkOrderService = WorkOrderService;
exports.workOrderService = new WorkOrderService();
