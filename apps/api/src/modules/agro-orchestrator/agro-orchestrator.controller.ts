import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AgroOrchestratorService } from "./agro-orchestrator.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import {
  AplStateMachine,
  AplStage,
  AplEvent,
  APL_STATE_METADATA,
} from "../../shared/state-machine";

class TransitionDto {
  targetStage?: string; // @deprecated
  event?: AplEvent;
  metadata?: Record<string, any>;
}

/**
 * APL Orchestrator API.
 * Manages season lifecycle through deterministic FSM stages.
 */
@ApiTags("APL Orchestrator")
@ApiBearerAuth()
@Controller("orchestrator")
@UseGuards(JwtAuthGuard)
export class AgroOrchestratorController {
  constructor(private readonly orchestratorService: AgroOrchestratorService) {}

  /**
   * GET /orchestrator/stages — Get all APL stage definitions
   */
  @Get("stages")
  @ApiOperation({ summary: "Получить все этапы APL" })
  @ApiResponse({ status: 200, description: "Список всех этапов" })
  getAllStages() {
    return Object.values(APL_STATE_METADATA).map((s) => ({
      id: s.id,
      name: s.name,
      nameRu: s.nameRu,
      order: s.order,
      isTerminal: s.isTerminal,
    }));
  }

  /**
   * GET /orchestrator/seasons/:id/stage — Get current stage of a season
   */
  @Get("seasons/:id/stage")
  @ApiOperation({ summary: "Получить текущий этап сезона" })
  @ApiResponse({ status: 200, description: "Текущий этап" })
  async getCurrentStage(
    @Param("id") seasonId: string,
    @CurrentUser() user: User,
  ) {
    return this.orchestratorService.getCurrentStage(seasonId, user.companyId!);
  }

  /**
   * POST /orchestrator/seasons/:id/initialize — Initialize season with first stage
   */
  @Post("seasons/:id/initialize")
  @ApiOperation({ summary: "Инициализировать сезон (первый этап)" })
  @ApiResponse({ status: 200, description: "Сезон инициализирован" })
  async initializeSeason(
    @Param("id") seasonId: string,
    @CurrentUser() user: User,
  ) {
    return this.orchestratorService.initializeSeason(
      seasonId,
      user.companyId!,
      user,
    );
  }

  /**
   * POST /orchestrator/seasons/:id/transition — Transition to next stage (Compatibility)
   */
  @Post("seasons/:id/transition")
  @ApiOperation({ summary: "Перейти к следующему этапу (Совместимость)" })
  async transitionToStage(
    @Param("id") seasonId: string,
    @Body() dto: TransitionDto,
    @CurrentUser() user: User,
  ) {
    if (dto.event) {
      return this.orchestratorService.applyEvent(
        seasonId,
        dto.event,
        user.companyId!,
        user,
        dto.metadata,
      );
    }
    return this.orchestratorService.transitionToStage(
      seasonId,
      dto.targetStage as AplStage,
      user.companyId!,
      user,
      dto.metadata,
    );
  }

  /**
   * POST /orchestrator/seasons/:id/event — Apply event to lifecycle
   */
  @Post("seasons/:id/event")
  @ApiOperation({ summary: "Применить событие к жизненному циклу" })
  async applyEvent(
    @Param("id") seasonId: string,
    @Body() dto: TransitionDto,
    @CurrentUser() user: User,
  ) {
    if (!dto.event) {
      throw new BadRequestException("Event is required");
    }
    return this.orchestratorService.applyEvent(
      seasonId,
      dto.event,
      user.companyId!,
      user,
      dto.metadata,
    );
  }

  /**
   * GET /orchestrator/seasons/:id/transitions — Get available transitions
   */
  @Get("seasons/:id/transitions")
  @ApiOperation({ summary: "Получить доступные переходы" })
  @ApiResponse({
    status: 200,
    description: "Список доступных следующих этапов и событий",
  })
  async getAvailableTransitions(
    @Param("id") seasonId: string,
    @CurrentUser() user: User,
  ) {
    return this.orchestratorService.getAvailableTransitions(
      seasonId,
      user.companyId!,
    );
  }

  /**
   * GET /orchestrator/seasons/:id/history — Get stage history
   */
  @Get("seasons/:id/history")
  @ApiOperation({ summary: "Получить историю этапов сезона" })
  @ApiResponse({ status: 200, description: "История переходов" })
  async getStageHistory(
    @Param("id") seasonId: string,
    @CurrentUser() user: User,
  ) {
    return this.orchestratorService.getStageHistory(seasonId, user.companyId!);
  }
}
