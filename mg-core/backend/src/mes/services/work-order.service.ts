import { prisma } from '../../config/prisma';
import { WorkOrderStatus } from '@prisma/client';
import { CreateWorkOrderDto } from '../dto/mes.dto';

export class WorkOrderService {

    async create(data: CreateWorkOrderDto, userId: string) {
        // Validate Production Order
        const pOrder = await prisma.productionOrder.findUnique({ where: { id: data.production_order_id } });
        if (!pOrder) throw new Error('Production Order not found');

        const workOrder = await prisma.workOrder.create({
            data: {
                production_order_id: data.production_order_id,
                operation_type: data.operation_type,
                sequence_order: data.sequence_order,
                assigned_to_id: data.assigned_to_id,
                status: WorkOrderStatus.PENDING
            }
        });

        // Audit Log
        await prisma.auditLog.create({
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

    async updateStatus(id: string, status: WorkOrderStatus, userId: string) {
        const wo = await prisma.workOrder.findUnique({ where: { id } });
        if (!wo) throw new Error('Work Order not found');

        const updated = await prisma.workOrder.update({
            where: { id },
            data: {
                status,
                started_at: (status === WorkOrderStatus.IN_PROGRESS && !wo.started_at) ? new Date() : wo.started_at,
                finished_at: (status === WorkOrderStatus.COMPLETED) ? new Date() : null
            }
        });

        // Audit Log
        await prisma.auditLog.create({
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

export const workOrderService = new WorkOrderService();
