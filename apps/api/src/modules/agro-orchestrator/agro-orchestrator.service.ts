import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { Season, SeasonStatus, User } from "@prisma/client";
import {
    AplStage,
    STAGE_DEFINITIONS,
    isValidTransition,
    getNextStages,
    isTerminalStage,
    getInitialStage,
} from "./state-machine/apl-stages";

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
    ): Promise<{ stage: string | null; stageInfo: typeof STAGE_DEFINITIONS[AplStage] | null }> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        const stageId = season.currentStageId as AplStage | null;
        const stageInfo = stageId ? STAGE_DEFINITIONS[stageId] : null;

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

        const initialStage = getInitialStage();

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
            message: `Сезон инициализирован: ${STAGE_DEFINITIONS[initialStage].nameRu}`,
        };
    }

    /**
     * Transition season to the next stage.
     */
    async transitionToStage(
        seasonId: string,
        targetStage: AplStage,
        companyId: string,
        user: User,
        metadata?: Record<string, any>,
    ): Promise<StageTransitionResult> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
            include: { stageProgress: true },
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

        // Validate transition
        if (!isValidTransition(currentStage, targetStage)) {
            const allowedNext = getNextStages(currentStage);
            throw new BadRequestException(
                `Недопустимый переход: ${STAGE_DEFINITIONS[currentStage].nameRu} → ${STAGE_DEFINITIONS[targetStage].nameRu}. ` +
                `Допустимые следующие этапы: ${allowedNext.map(s => STAGE_DEFINITIONS[s].nameRu).join(", ")}`,
            );
        }

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
                        previousStage: currentStage,
                        ...metadata,
                    },
                },
            });

            // If terminal stage, complete the season
            if (isTerminalStage(targetStage)) {
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
            message: `Переход выполнен: ${STAGE_DEFINITIONS[currentStage].nameRu} → ${STAGE_DEFINITIONS[targetStage].nameRu}`,
        };
    }

    /**
     * Get available next stages for a season.
     */
    async getAvailableTransitions(
        seasonId: string,
        companyId: string,
    ): Promise<{ stage: string; name: string; nameRu: string }[]> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
        });

        if (!season) {
            throw new NotFoundException("Сезон не найден");
        }

        const currentStage = season.currentStageId as AplStage | null;

        if (!currentStage) {
            // Not initialized — only initial stage is available
            const initial = getInitialStage();
            return [{
                stage: initial,
                name: STAGE_DEFINITIONS[initial].name,
                nameRu: STAGE_DEFINITIONS[initial].nameRu,
            }];
        }

        return getNextStages(currentStage).map(s => ({
            stage: s,
            name: STAGE_DEFINITIONS[s].name,
            nameRu: STAGE_DEFINITIONS[s].nameRu,
        }));
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
