import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { LaborContractService } from '../services/labor-contract.service';
import { CreateContractDto, CreateAmendmentDto, TerminateContractDto } from '../dto/request';
import { ContractResponseDto } from '../dto/response';
import { PersonnelAccessGuard, RequireDirectorGuard } from '../guards';
import { PrismaService } from '@/prisma/prisma.service';


@Controller('api/personnel/contracts')
@UseGuards(PersonnelAccessGuard)
export class LaborContractsController {
    constructor(
        private readonly contractService: LaborContractService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * GET /api/personnel/contracts
     * Список контрактов
     * RBAC: HR_SPECIALIST+
     */
    @Get()
    async findAll(
        @Query('status') status?: string,
        @Query('contractType') contractType?: string,
        @Query('personalFileId') personalFileId?: string,
    ): Promise<ContractResponseDto[]> {
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (contractType) {
            where.contractType = contractType;
        }

        if (personalFileId) {
            where.personalFileId = personalFileId;
        }

        const contracts = await this.prisma.laborContract.findMany({
            where,
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
                amendments: true,
            },
            orderBy: {
                contractDate: 'desc',
            },
        });

        return contracts as ContractResponseDto[];
    }

    /**
     * GET /api/personnel/contracts/expiring
     * Истекающие срочные договоры
     * RBAC: HR_MANAGER+
     */
    @Get('expiring')
    async findExpiring(@Query('days') days?: number): Promise<ContractResponseDto[]> {
        const contracts = await this.contractService.findExpiring(days || 30);
        return contracts as ContractResponseDto[];
    }

    /**
     * GET /api/personnel/contracts/:id
     * Детали контракта
     * RBAC: HR_SPECIALIST+
     */
    @Get(':id')
    async findById(@Param('id') id: string): Promise<ContractResponseDto> {
        // TODO: Implement findById in service
        throw new Error('Not implemented');
    }

    /**
     * POST /api/personnel/contracts
     * Создание трудового договора
     * RBAC: HR_MANAGER+
     */
    @Post()
    async create(
        @Body() dto: CreateContractDto,
        @Req() req: any,
    ): Promise<ContractResponseDto> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';

        const contract = await this.contractService.create(
            dto.personalFileId,
            {
                contractType: dto.contractType,
                contractDate: new Date(dto.contractDate),
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                positionId: dto.positionId,
                departmentId: dto.departmentId,
                salary: dto.salary,
                salaryType: dto.salaryType,
                workSchedule: dto.workSchedule,
                probationDays: dto.probationDays,
            },
            actorId,
            actorRole,
        );

        return contract as ContractResponseDto;
    }

    /**
     * POST /api/personnel/contracts/:id/amendments
     * Создание дополнительного соглашения
     * RBAC: HR_MANAGER+
     */
    @Post(':id/amendments')
    async createAmendment(
        @Param('id') id: string,
        @Body() dto: CreateAmendmentDto,
        @Req() req: any,
    ): Promise<any> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';

        const amendment = await this.contractService.createAmendment(
            id,
            dto.changes,
            actorId,
            actorRole,
        );

        return amendment;
    }

    /**
     * POST /api/personnel/contracts/:id/terminate
     * Расторжение трудового договора
     * CRITICAL: DIRECTOR ONLY!
     * RBAC: DIRECTOR
     */
    @Post(':id/terminate')
    @UseGuards(RequireDirectorGuard)
    async terminate(
        @Param('id') id: string,
        @Body() dto: TerminateContractDto,
        @Req() req: any,
    ): Promise<ContractResponseDto> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'UNKNOWN';

        // CRITICAL: Validate DIRECTOR role
        // This will be enforced by HRDomainEventService.emit()
        // which validates role permissions for CONTRACT_TERMINATED event

        const contract = await this.contractService.terminate(
            id,
            dto.reason,
            new Date(dto.terminationDate),
            actorId,
            actorRole,
        );

        return contract as ContractResponseDto;
    }
}
