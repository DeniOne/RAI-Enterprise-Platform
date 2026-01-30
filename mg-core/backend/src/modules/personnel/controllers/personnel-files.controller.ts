import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PersonalFileService } from '../services/personal-file.service';
import { CreatePersonalFileDto, UpdateStatusDto } from '../dto/request';
import { PersonalFileResponseDto } from '../dto/response';
import { PersonnelAccessGuard } from '../guards';
import { PrismaService } from '@/prisma/prisma.service';


@Controller('api/personnel/files')
@UseGuards(PersonnelAccessGuard)
export class PersonnelFilesController {
    constructor(
        private readonly personalFileService: PersonalFileService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * GET /api/personnel/files
     * Список личных дел
     * RBAC: HR_SPECIALIST+
     */
    @Get()
    async findAll(
        @Query('status') status?: string,
        @Query('departmentId') departmentId?: string,
        @Query('employeeId') employeeId?: string,
    ): Promise<PersonalFileResponseDto[]> {
        // Build filter object
        const where: any = {};

        if (status) {
            where.hrStatus = status;
        }

        if (employeeId) {
            where.employeeId = employeeId;
        }

        // TODO: Add department filtering when employee.departmentId is available
        // if (departmentId) {
        //   where.employee = { departmentId };
        // }

        const files = await this.prisma.personalFile.findMany({
            where,
            include: {
                employee: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return files as PersonalFileResponseDto[];
    }

    /**
     * GET /api/personnel/files/:id
     * Детали личного дела
     * RBAC: HR_SPECIALIST+
     */
    @Get(':id')
    async findById(@Param('id') id: string): Promise<PersonalFileResponseDto> {
        const file = await this.personalFileService.findById(id);
        return file as PersonalFileResponseDto;
    }

    /**
     * POST /api/personnel/files
     * Создание личного дела
     * RBAC: HR_MANAGER+
     */
    @Post()
    async create(
        @Body() dto: CreatePersonalFileDto,
        @Req() req: any,
    ): Promise<PersonalFileResponseDto> {
        // Extract actor info from request (from auth middleware)
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';

        const file = await this.personalFileService.create(
            dto.employeeId,
            actorId,
            actorRole
        );

        return file as PersonalFileResponseDto;
    }

    /**
     * PATCH /api/personnel/files/:id/status
     * Обновление статуса личного дела
     * RBAC: HR_MANAGER+
     */
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateStatusDto,
        @Req() req: any,
    ): Promise<PersonalFileResponseDto> {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';

        const file = await this.personalFileService.updateStatus(
            id,
            dto.newStatus,
            actorId,
            actorRole,
            dto.reason,
        );

        return file as PersonalFileResponseDto;
    }

    /**
     * POST /api/personnel/files/:id/archive
     * Передача личного дела в архив (Module 29)
     * RBAC: HR_MANAGER+
     */
    @Post(':id/archive')
    async archive(@Param('id') id: string): Promise<{ message: string }> {
        // TODO: Implement archive integration with Module 29
        throw new Error('Not implemented - requires Module 29 integration');
    }
}
