import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { HRDomainEventService } from './hr-domain-event.service';

@Injectable()
export class PersonnelOrderService {
    constructor(
        private prisma: PrismaService,
        private hrEventService: HRDomainEventService
    ) { }

    /**
     * Create personnel order
     */
    async create(
        personalFileId: string,
        orderType: any,
        data: {
            title: string;
            content: string;
            basis?: string;
            orderDate: Date;
            effectiveDate: Date;
        },
        actorId: string,
        actorRole: string
    ) {
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
    async sign(
        id: string,
        signerId: string,
        signerRole: string
    ) {
        const order = await this.prisma.personnelOrder.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`PersonnelOrder ${id} not found`);
        }

        if (order.status !== 'APPROVED' && order.status !== 'DRAFT') {
            throw new ForbiddenException(
                `Cannot sign order in status ${order.status}. Must be APPROVED or DRAFT.`
            );
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
    async cancel(
        id: string,
        reason: string,
        actorId: string,
        actorRole: string
    ) {
        const order = await this.prisma.personnelOrder.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`PersonnelOrder ${id} not found`);
        }

        if (order.status === 'SIGNED') {
            throw new ForbiddenException('Cannot cancel signed order');
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
    private async generateOrderNumber(orderType: string): Promise<string> {
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
    async findById(id: string) {
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
            throw new NotFoundException(`PersonnelOrder ${id} not found`);
        }

        return order;
    }
}
