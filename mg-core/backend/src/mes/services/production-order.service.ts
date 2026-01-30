import { prisma } from '../../config/prisma';
import { ProductionOrderStatus } from '@prisma/client';
import { CreateProductionOrderDto, UpdateProductionOrderStatusDto } from '../dto/mes.dto';

const PRODUCTION_ORDER_FSM: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
    [ProductionOrderStatus.DRAFT]: [ProductionOrderStatus.PLANNED, ProductionOrderStatus.CANCELLED],
    [ProductionOrderStatus.PLANNED]: [ProductionOrderStatus.IN_PROGRESS, ProductionOrderStatus.CANCELLED],
    [ProductionOrderStatus.IN_PROGRESS]: [ProductionOrderStatus.ON_HOLD, ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
    [ProductionOrderStatus.ON_HOLD]: [ProductionOrderStatus.IN_PROGRESS, ProductionOrderStatus.CANCELLED],
    [ProductionOrderStatus.COMPLETED]: [], // Terminal
    [ProductionOrderStatus.CANCELLED]: [], // Terminal
};

function validateStatusTransition(current: ProductionOrderStatus, next: ProductionOrderStatus) {
    const allowed = PRODUCTION_ORDER_FSM[current];
    if (!allowed || !allowed.includes(next)) {
        throw new Error(`Invalid production order status transition: ${current} -> ${next}`);
    }
}

export class ProductionOrderService {

    async create(data: CreateProductionOrderDto, userId: string) {
        // ... (remaining create code)
        const order = await prisma.productionOrder.create({
            data: {
                source_type: data.source_type,
                source_ref_id: data.source_ref_id,
                product_type: data.product_type,
                quantity: data.quantity,
                created_by_id: userId,
                status: ProductionOrderStatus.DRAFT,
            }
        });

        // 3. Log Audit
        await prisma.auditLog.create({
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

    async getOne(id: string) {
        return prisma.productionOrder.findUnique({
            where: { id },
            include: {
                work_orders: { orderBy: { sequence_order: 'asc' } },
                quality_checks: true,
                defects: true
            }
        });
    }

    async getAll() {
        return prisma.productionOrder.findMany({
            orderBy: { created_at: 'desc' }
        });
    }

    async updateStatus(id: string, status: ProductionOrderStatus, userId: string) {
        // 1. Fetch current
        const order = await prisma.productionOrder.findUnique({ where: { id } });
        if (!order) throw new Error('Order not found');

        // 2. Transition Logic (Strict FSM)
        validateStatusTransition(order.status, status);

        const updated = await prisma.productionOrder.update({
            where: { id },
            data: {
                status,
                closed_at: (status === ProductionOrderStatus.COMPLETED || status === ProductionOrderStatus.CANCELLED) ? new Date() : null
            }
        });

        // 3. Log Audit
        await prisma.auditLog.create({
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

export const productionOrderService = new ProductionOrderService();
