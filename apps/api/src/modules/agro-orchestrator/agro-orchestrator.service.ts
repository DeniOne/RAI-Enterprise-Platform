import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { Season, SeasonStatus, User } from "@prisma/client";
import {
    AplStateMachine,
    AplStage,
    AplEvent,
    APL_STATE_METADATA,
} from "../../shared/state-machine";

export interface StageTransitionResult {
    success: boolean;
    season: Season;
    previousStage: string | null;
    newStage: string;
    message: string;
}

@Injectable()
export class AgroOrchestratorService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Get current stage of a season.
     */
    async getCurrentStage(
        seasonId: string,
        companyId: string,
    ): Promise<{ stage: string | null; stageInfo: any }> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        const stageId = season.currentStageId as AplStage | null;
        const stageInfo = stageId ? APL_STATE_METADATA[stageId] : null;

        return { stage: stageId, stageInfo };
    }

    /**
     * Initialize season with the first APL stage.
     */
    async initializeSeason(
        seasonId: string,
        companyId: string,
        user: User,
    ): Promise<StageTransitionResult> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        if (season.currentStageId) {
            throw new BadRequestException("Сезон уже инициализирован");
        }

        const initialStage = AplStateMachine.getInitialStage();

        const updated = await this.prisma.$transaction(async (tx) => {
            // Update season with initial stage
            const updatedSeason = await tx.season.update({
                where: { id: seasonId },
                data: {
                    currentStageId: initialStage,
                    status: SeasonStatus.ACTIVE,
                },
            });

            // Record stage progress
            await tx.seasonStageProgress.create({
                data: {
                    seasonId,
                    stageId: initialStage,
                    metadata: { initializedBy: user.id },
                },
            });

            return updatedSeason;
        });

        await this.auditService.log({
            action: "SEASON_INITIALIZED",
            userId: user.id,
            metadata: { seasonId, stage: initialStage },
        });

        return {
            success: true,
            season: updated,
            previousStage: null,
            newStage: initialStage,
            message: `Сезон инициализирован: ${APL_STATE_METADATA[initialStage].nameRu} `,
        };
    }

    /**
     * Transition season to the next stage by target stage ID (Compatibility wrapper).
     * @deprecated Use applyEvent for true event-driven transitions.
     */
    async transitionToStage(
        seasonId: string,
        targetStage: AplStage,
        companyId: string,
        user: User,
        metadata?: Record<string, any>,
    ): Promise<StageTransitionResult> {
        // [COMPATIBILITY]: Mapping target stage to ADVANCE event
        // This is a temporary measure until all clients migrate to applyEvent.
        return this.applyEvent(seasonId, AplEvent.ADVANCE, companyId, user, metadata);
    }

    /**
     * Apply event to season lifecycle.
     */
    async applyEvent(
        seasonId: string,
        event: AplEvent,
        companyId: string,
        user: User,
        metadata?: Record<string, any>,
    ): Promise<StageTransitionResult> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        if (season.isLocked) {
            throw new BadRequestException("Сезон заблокирован и не может быть изменён");
        }

        const currentStage = season.currentStageId as AplStage | null;
        if (!currentStage) {
            throw new BadRequestException("Сезон не инициализирован. Используйте initializeSeason.");
        }

        // FSM Transition (Pure)
        if (!AplStateMachine.canTransition(currentStage, event)) {
            const allowedEvents = AplStateMachine.getAvailableEvents(currentStage);
            throw new BadRequestException(
                `Недопустимое событие: ${event} в состоянии ${APL_STATE_METADATA[currentStage].nameRu}.` +
                `Допустимые события: ${allowedEvents.join(", ")} `,
            );
        }

        const resultEntity = AplStateMachine.transition(
            { id: seasonId, currentStageId: currentStage },
            event
        );
        const targetStage = resultEntity.currentStageId!;

        const updated = await this.prisma.$transaction(async (tx) => {
            // Update season
            const updatedSeason = await tx.season.update({
                where: { id: seasonId },
                data: { currentStageId: targetStage },
            });

            // Record stage progress
            await tx.seasonStageProgress.create({
                data: {
                    seasonId,
                    stageId: targetStage,
                    metadata: {
                        transitionedBy: user.id,
                        event,
                        previousStage: currentStage,
                        ...metadata,
                    },
                },
            });

            // If terminal stage, complete the season
            if (AplStateMachine.isTerminal(targetStage)) {
                await tx.season.update({
                    where: { id: seasonId },
                    data: {
                        status: SeasonStatus.COMPLETED,
                        endDate: new Date(),
                    },
                });
            }

            return updatedSeason;
        });

        await this.auditService.log({
            action: "STAGE_TRANSITION",
            userId: user.id,
            metadata: {
                seasonId,
                event,
                from: currentStage,
                to: targetStage,
                ...(metadata || {}),
            },
        });

        return {
            success: true,
            season: updated,
            previousStage: currentStage,
            newStage: targetStage,
            message: `Переход выполнен успешно: ${APL_STATE_METADATA[targetStage].nameRu} `,
        };
    }

    /**
     * Get available next stages for a season.
     */
    async getAvailableTransitions(
        seasonId: string,
        companyId: string,
    ): Promise<{ event: AplEvent; stage: string; name: string; nameRu: string }[]> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        const currentStage = season.currentStageId as AplStage | null;

        if (!currentStage) {
            // Not initialized — only initialize is possible
            return [];
        }

        // Returns events and their resulting stages
        return AplStateMachine.getAvailableEvents(currentStage).map(event => {
            const result = AplStateMachine.transition({ id: seasonId, currentStageId: currentStage }, event);
            const targetStage = result.currentStageId!;
            const meta = APL_STATE_METADATA[targetStage];
            return {
                event: event,
                stage: targetStage,
                name: meta.name,
                nameRu: meta.nameRu,
            };
        });
    }

    /**
     * Get full stage history for a season.
     */
    async getStageHistory(seasonId: string, companyId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        return this.prisma.seasonStageProgress.findMany({
            where: { seasonId },
            orderBy: { completedAt: "asc" },
        });
    }
}
