import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { TaskService } from "./task.service";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User, Task, TaskStatus } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import {
  PaginationDto,
  PaginatedResult,
} from "../../shared/dto/pagination.dto";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  EXECUTION_ROLES,
  PLANNING_READ_ROLES,
} from "../../shared/auth/rbac.constants";

/**
 * REST API для задач — Integration API для Telegram Bot и внешних систем.
 * GraphQL API остаётся для web-интерфейса.
 */
@ApiTags("Tasks")
@ApiBearerAuth()
@Controller("tasks")
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /tasks/my — Задачи текущего пользователя
   */
  @Get("my")
  @Authorized(...EXECUTION_ROLES)
  @ApiOperation({ summary: "Получить мои задачи" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: TaskStatus,
    description: "Фильтр по статусу",
  })
  @ApiResponse({ status: 200, description: "Список задач пользователя" })
  async getMyTasks(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
    @Query("status") status?: TaskStatus,
  ): Promise<PaginatedResult<Task>> {
    const where = {
      assigneeId: user.id,
      companyId: user.companyId,
      ...(status
        ? { status }
        : { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } }),
    };

    // Enforce pagination
    const take = pagination.limit || 20;
    const skip = pagination.skip || 0;
    const page = pagination.page || 1;

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          field: { select: { id: true, name: true } },
          season: { select: { id: true, year: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take,
        skip,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * GET /tasks/:id — Детали задачи
   */
  @Get(":id")
  @Authorized(...PLANNING_READ_ROLES)
  @ApiOperation({ summary: "Получить детали задачи" })
  @ApiResponse({ status: 200, description: "Детали задачи" })
  @ApiResponse({ status: 404, description: "Задача не найдена" })
  async getTask(@Param("id") id: string, @CurrentUser() user: User) {
    return this.prisma.task.findFirstOrThrow({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        field: true,
        season: true,
        actualResources: true,
      },
    });
  }

  /**
   * POST /tasks/:id/start — Начать выполнение задачи
   */
  @Post(":id/start")
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: "Начать выполнение задачи" })
  @ApiResponse({ status: 200, description: "Задача начата" })
  @ApiResponse({ status: 400, description: "Невалидный переход статуса" })
  async startTask(
    @Param("id") id: string,
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.startTask(id, user, user.companyId!);
  }

  /**
   * POST /tasks/:id/complete — Завершить задачу
   */
  @Post(":id/complete")
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: "Завершить задачу" })
  @ApiResponse({ status: 200, description: "Задача завершена" })
  @ApiResponse({ status: 400, description: "Невалидный переход статуса" })
  async completeTask(
    @Param("id") id: string,
    @Body() body: { actuals?: any[] },
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.completeTask(
      id,
      body.actuals || [],
      user,
      user.companyId!,
    );
  }

  /**
   * POST /tasks/:id/cancel — Отменить задачу
   */
  @Post(":id/cancel")
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: "Отменить задачу" })
  @ApiResponse({ status: 200, description: "Задача отменена" })
  async cancelTask(
    @Param("id") id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: User,
  ): Promise<Task> {
    return this.taskService.cancelTask(
      id,
      body.reason || "Cancelled via API",
      user,
      user.companyId!,
    );
  }
}
