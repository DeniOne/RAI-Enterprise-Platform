import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    NotFoundException,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from "@nestjs/swagger";
import { AuditService, AuditLogFilter, PaginationOptions } from "./audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { User } from "@prisma/client";

/**
 * REST API для просмотра аудит-логов.
 * Read-only API — запись логов происходит автоматически через AuditService.
 */
@ApiTags("Audit")
@ApiBearerAuth()
@Controller("audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /**
     * GET /audit/logs — Список аудит-событий с фильтрацией и пагинацией
     */
    @Get("logs")
    @ApiOperation({ summary: "Получить список аудит-событий" })
    @ApiQuery({ name: "action", required: false, description: "Фильтр по типу действия" })
    @ApiQuery({ name: "userId", required: false, description: "Фильтр по ID пользователя" })
    @ApiQuery({ name: "dateFrom", required: false, description: "Дата начала (ISO)" })
    @ApiQuery({ name: "dateTo", required: false, description: "Дата окончания (ISO)" })
    @ApiQuery({ name: "page", required: false, type: Number, description: "Номер страницы" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "Записей на странице (макс 100)" })
    @ApiResponse({ status: 200, description: "Список аудит-событий" })
    async getLogs(
        @Query("action") action?: string,
        @Query("userId") userId?: string,
        @Query("dateFrom") dateFrom?: string,
        @Query("dateTo") dateTo?: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
    ) {
        const filter: AuditLogFilter = {};

        if (action) filter.action = action;
        if (userId) filter.userId = userId;
        if (dateFrom) filter.dateFrom = new Date(dateFrom);
        if (dateTo) filter.dateTo = new Date(dateTo);

        const pagination: PaginationOptions = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
        };

        return this.auditService.findAll(filter, pagination);
    }

    /**
     * GET /audit/logs/:id — Детали аудит-события
     */
    @Get("logs/:id")
    @ApiOperation({ summary: "Получить детали аудит-события" })
    @ApiResponse({ status: 200, description: "Детали события" })
    @ApiResponse({ status: 404, description: "Событие не найдено" })
    async getLogById(@Param("id") id: string) {
        const log = await this.auditService.findById(id);
        if (!log) {
            throw new NotFoundException(`Audit log ${id} not found`);
        }
        return log;
    }
}
