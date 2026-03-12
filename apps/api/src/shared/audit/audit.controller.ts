import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import {
  AuditService,
  AuditLogFilter,
  PaginationOptions,
} from "./audit.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuditLog } from "@rai/prisma-client";
import { Authorized } from "../auth/authorized.decorator";
import { AUDIT_READ_ROLES } from "../auth/rbac.constants";

/**
 * REST API для просмотра аудит-логов.
 * Read-only API — запись логов происходит автоматически через AuditService.
 */
@ApiTags("Audit")
@ApiBearerAuth()
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs — Список аудит-событий с фильтрацией и пагинацией
   */
  @Get("logs")
  @Authorized(...AUDIT_READ_ROLES)
  @ApiOperation({ summary: "Получить список аудит-событий" })
  @ApiQuery({
    name: "action",
    required: false,
    description: "Фильтр по типу действия",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    description: "Фильтр по ID пользователя",
  })
  @ApiQuery({
    name: "dateFrom",
    required: false,
    description: "Дата начала (ISO)",
  })
  @ApiQuery({
    name: "dateTo",
    required: false,
    description: "Дата окончания (ISO)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Номер страницы",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Записей на странице (макс 100)",
  })
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
  @Authorized(...AUDIT_READ_ROLES)
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

  @Get("logs/:id/proof")
  @Authorized(...AUDIT_READ_ROLES)
  @ApiOperation({ summary: "Получить proof нотариализации аудит-события" })
  @ApiResponse({ status: 200, description: "Детали notarization/WORM proof" })
  @ApiResponse({ status: 404, description: "Proof не найден" })
  async getLogProof(@Param("id") id: string) {
    const proof = await this.auditService.findProofById(id);
    if (!proof) {
      throw new NotFoundException(`Audit notarization proof for ${id} not found`);
    }

    return proof;
  }
}
