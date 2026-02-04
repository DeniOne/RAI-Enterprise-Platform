import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
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
import { User } from "@prisma/client";
import { AplStage, STAGE_DEFINITIONS } from "./state-machine/apl-stages";

class TransitionDto {
    targetStage: string;
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
    constructor(private readonly orchestratorService: AgroOrchestratorService) { }

    /**
     * GET /orchestrator/stages — Get all APL stage definitions
     */
    @Get("stages")
    @ApiOperation({ summary: "Получить все этапы APL" })
    @ApiResponse({ status: 200, description: "Список всех этапов" })
    getAllStages() {
        return Object.values(STAGE_DEFINITIONS).map(s => ({
            id: s.id,
            name: s.name,
            nameRu: s.nameRu,
            order: s.order,
            allowedTransitions: s.allowedTransitions,
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
        return this.orchestratorService.initializeSeason(seasonId, user.companyId!, user);
    }

    /**
     * POST /orchestrator/seasons/:id/transition — Transition to next stage
     */
    @Post("seasons/:id/transition")
    @ApiOperation({ summary: "Перейти к следующему этапу" })
    @ApiResponse({ status: 200, description: "Переход выполнен" })
    @ApiResponse({ status: 400, description: "Недопустимый переход" })
    async transitionToStage(
        @Param("id") seasonId: string,
        @Body() dto: TransitionDto,
        @CurrentUser() user: User,
    ) {
        return this.orchestratorService.transitionToStage(
            seasonId,
            dto.targetStage as AplStage,
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
    @ApiResponse({ status: 200, description: "Список доступных следующих этапов" })
    async getAvailableTransitions(
        @Param("id") seasonId: string,
        @CurrentUser() user: User,
    ) {
        return this.orchestratorService.getAvailableTransitions(seasonId, user.companyId!);
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
