import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ExplorationCaseStatus,
  ExplorationMode,
  ExplorationType,
  SignalSource,
  WarRoomStatus,
} from "@rai/prisma-client";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { ExplorationService } from "./exploration.service";

@ApiTags("Исследования")
@ApiBearerAuth()
@Controller("exploration")
@UseGuards(JwtAuthGuard)
export class ExplorationController {
  constructor(private readonly explorationService: ExplorationService) {}

  @Post("signals")
  @ApiOperation({ summary: "Создать стратегический сигнал" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        source: { enum: Object.values(SignalSource) },
        rawPayload: { type: "object" },
        confidenceScore: { type: "number" },
        initiatorId: { type: "string" },
      },
      required: ["rawPayload"],
    },
  })
  @ApiResponse({ status: 201, description: "Сигнал создан" })
  async createSignal(
    @CurrentUser() user: { companyId: string },
    @Body()
    body: {
      source?: SignalSource;
      rawPayload: unknown;
      confidenceScore?: number;
      initiatorId?: string;
    },
  ) {
    return this.explorationService.ingestSignal(user.companyId, {
      source: body.source,
      rawPayload: body.rawPayload,
      confidenceScore: body.confidenceScore,
      initiatorId: body.initiatorId,
    });
  }

  @Post("cases/from-signal/:signalId")
  @ApiOperation({ summary: "Перевести сигнал в кейс исследования" })
  @ApiParam({ name: "signalId", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        initiatorId: { type: "string" },
        explorationMode: { enum: Object.values(ExplorationMode) },
        type: { enum: Object.values(ExplorationType) },
        triageConfig: { type: "object" },
        ownerId: { type: "string" },
        timeboxDeadline: { type: "string", format: "date-time" },
        riskScore: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Кейс исследования создан из сигнала" })
  @ApiResponse({ status: 404, description: "Сигнал не найден" })
  async triageFromSignal(
    @CurrentUser() user: { companyId: string },
    @Param("signalId") signalId: string,
    @Body()
    body: {
      initiatorId?: string;
      explorationMode?: ExplorationMode;
      type?: ExplorationType;
      triageConfig?: unknown;
      ownerId?: string;
      timeboxDeadline?: string;
      riskScore?: number;
    },
  ) {
    return this.explorationService.triageToCase(user.companyId, signalId, body);
  }

  @Get("showcase")
  @ApiOperation({ summary: "Получить витрину кейсов исследований" })
  @ApiQuery({ name: "mode", required: false, enum: Object.values(ExplorationMode) })
  @ApiQuery({
    name: "status",
    required: false,
    enum: Object.values(ExplorationCaseStatus),
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Данные витрины" })
  async getShowcase(
    @CurrentUser() user: { companyId: string },
    @Query("mode") mode?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.explorationService.getShowcase(user.companyId, {
      mode,
      status,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Post("cases/:id/transition")
  @ApiOperation({ summary: "Сменить статус кейса исследования по конечному автомату FSM" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        targetStatus: { enum: Object.values(ExplorationCaseStatus) },
        role: { type: "string" },
      },
      required: ["targetStatus"],
    },
  })
  @ApiResponse({ status: 200, description: "Статус кейса обновлен" })
  @ApiResponse({ status: 403, description: "Недопустимый переход или запрет по RBAC" })
  @ApiResponse({ status: 404, description: "Кейс не найден" })
  async transitionCase(
    @CurrentUser() user: { companyId: string },
    @Param("id") caseId: string,
    @Body()
    body: {
      targetStatus: ExplorationCaseStatus;
      role?: string;
    },
  ) {
    return this.explorationService.transitionCase(user.companyId, caseId, body);
  }

  @Post("war-room/:id/events")
  @ApiOperation({ summary: "Добавить append-only событие решения в комнату решений" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        participantId: { type: "string" },
        decisionData: { type: "object" },
        signatureHash: { type: "string" },
      },
      required: ["participantId", "decisionData", "signatureHash"],
    },
  })
  @ApiResponse({ status: 201, description: "Событие решения комнаты решений создано" })
  @ApiResponse({ status: 404, description: "Сессия комнаты решений или участник не найдены" })
  async appendWarRoomEvent(
    @CurrentUser() user: { companyId: string },
    @Param("id") warRoomSessionId: string,
    @Body()
    body: {
      participantId: string;
      decisionData: unknown;
      signatureHash: string;
    },
  ) {
    return this.explorationService.appendWarRoomDecisionEvent(
      user.companyId,
      warRoomSessionId,
      body,
    );
  }

  @Post("cases/:id/war-room/open")
  @ApiOperation({ summary: "Открыть сессию комнаты решений для кейса исследования" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        facilitatorId: { type: "string" },
        deadline: { type: "string", format: "date-time" },
        participants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              userId: { type: "string" },
              role: { type: "string" },
            },
            required: ["userId", "role"],
          },
        },
      },
      required: ["facilitatorId", "deadline", "participants"],
    },
  })
  @ApiResponse({ status: 201, description: "Сессия комнаты решений открыта" })
  @ApiResponse({ status: 404, description: "Кейс исследования или пользователи не найдены" })
  async openWarRoom(
    @CurrentUser() user: { companyId: string },
    @Param("id") explorationCaseId: string,
    @Body()
    body: {
      facilitatorId: string;
      deadline: string;
      participants: Array<{ userId: string; role: string }>;
    },
  ) {
    return this.explorationService.openWarRoomSession(
      user.companyId,
      explorationCaseId,
      body,
    );
  }

  @Post("war-room/:id/close")
  @ApiOperation({ summary: "Закрыть сессию комнаты решений с обязательным resolutionLog" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        resolutionLog: { type: "object" },
        status: { enum: Object.values(WarRoomStatus) },
      },
      required: ["resolutionLog"],
    },
  })
  @ApiResponse({ status: 200, description: "Сессия комнаты решений закрыта" })
  @ApiResponse({
    status: 400,
    description:
      "Отсутствует resolutionLog или неполное голосование DECISION_MAKER",
  })
  async closeWarRoom(
    @CurrentUser() user: { companyId: string },
    @Param("id") warRoomSessionId: string,
    @Body()
    body: {
      resolutionLog: unknown;
      status?: WarRoomStatus;
    },
  ) {
    return this.explorationService.closeWarRoomSession(
      user.companyId,
      warRoomSessionId,
      body,
    );
  }
}
