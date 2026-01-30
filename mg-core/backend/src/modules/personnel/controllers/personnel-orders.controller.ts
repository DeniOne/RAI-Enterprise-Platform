import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PersonnelOrderService } from '../services/personnel-order.service';
import { CreateOrderDto, SignOrderDto, CancelOrderDto } from '../dto/request';
import { OrderResponseDto } from '../dto/response';
import { PersonnelAccessGuard, RequireDirectorGuard } from '../guards';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('api/personnel/orders')
@UseGuards(PersonnelAccessGuard)
export class PersonnelOrdersController {
    constructor(
        private readonly orderService: PersonnelOrderService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * GET /api/personnel/orders
     * Список приказов
     * RBAC: HR_SPECIALIST+
     */
    @Get()
    async findAll(
        @Query('status') status?: string,
        @Query('orderType') orderType?: string,
        @Query('personalFileId') personalFileId?: string,
    ): Promise<OrderResponseDto[]> {
        const where: any = {};

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

        return orders as OrderResponseDto[];
    }

    /**
     * GET /api/personnel/orders/:id
     * Детали приказа
     * RBAC: HR_SPECIALIST+
     */
    @Get(':id')
    async findById(@Param('id') id: string): Promise<OrderResponseDto> {
        const order = await this.orderService.findById(id);
        return order as OrderResponseDto;
    }

    /**
     * POST /api/personnel/orders
     * Создание приказа
     * RBAC: HR_SPECIALIST+
     */
    @Post()
    async create(
        @Body() dto: CreateOrderDto,
        @Req() req: any,
    ): Promise<OrderResponseDto> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_SPECIALIST';

        const order = await this.orderService.create(
            dto.personalFileId,
            dto.orderType,
            {
                title: dto.title,
                content: dto.content,
                basis: dto.basis,
                orderDate: new Date(dto.orderDate),
                effectiveDate: new Date(dto.effectiveDate),
            },
            actorId,
            actorRole,
        );

        return order as OrderResponseDto;
    }

    /**
     * POST /api/personnel/orders/:id/sign
     * Подписание приказа
     * CRITICAL: DIRECTOR ONLY!
     * RBAC: DIRECTOR
     */
    @Post(':id/sign')
    @UseGuards(RequireDirectorGuard)
    async sign(
        @Param('id') id: string,
        @Body() dto: SignOrderDto,
        @Req() req: any,
    ): Promise<OrderResponseDto> {
        const signerRole = req.user?.role || 'UNKNOWN';

        // CRITICAL: Validate DIRECTOR role
        // This will be enforced by HRDomainEventService.emit()
        // which validates role permissions for ORDER_SIGNED event

        const order = await this.orderService.sign(
            id,
            dto.signerId,
            signerRole,
        );

        return order as OrderResponseDto;
    }

    /**
     * POST /api/personnel/orders/:id/cancel
     * Отмена приказа
     * RBAC: HR_MANAGER+
     */
    @Post(':id/cancel')
    async cancel(
        @Param('id') id: string,
        @Body() dto: CancelOrderDto,
        @Req() req: any,
    ): Promise<OrderResponseDto> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';

        const order = await this.orderService.cancel(
            id,
            dto.reason,
            actorId,
            actorRole,
        );

        return order as OrderResponseDto;
    }

    /**
     * GET /api/personnel/orders/:id/pdf
     * Генерация PDF приказа
     * RBAC: HR_SPECIALIST+
     * TODO: Requires DocumentGeneratorService
     */
    @Get(':id/pdf')
    async generatePdf(@Param('id') id: string): Promise<any> {
        throw new Error('Not implemented - requires DocumentGeneratorService');
    }
}
