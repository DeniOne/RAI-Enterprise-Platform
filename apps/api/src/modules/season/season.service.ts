import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgroAuditService } from "../agro-audit/agro-audit.service";
import { CreateSeasonInput } from "./dto/create-season.input";
import { UpdateSeasonInput } from "./dto/update-season.input";
import { SeasonBusinessRulesService } from "./services/season-business-rules.service";
import { SeasonSnapshotService } from "./services/season-snapshot.service";
import { User, Season, SeasonStatus } from "@rai/prisma-client";
import { AgriculturalAuditEvent } from "../agro-audit/enums/audit-events.enum";
import { AgroOrchestrator, getRapeseedStageById } from "@rai/agro-orchestrator";
import { AgroContext } from "@rai/agro-orchestrator";

import { ActionDecisionService } from "../risk/decision.service";
import { RiskService } from "../risk/risk.service";
import { RiskTargetType } from "@rai/prisma-client";
import { RiskBlockedError } from "../risk/risk.errors";

@Injectable()
export class SeasonService {
  private readonly orchestrator: AgroOrchestrator = new AgroOrchestrator();

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AgroAuditService,
    private readonly businessRules: SeasonBusinessRulesService,
    private readonly snapshotService: SeasonSnapshotService,
    private readonly riskService: RiskService,
    private readonly decisionService: ActionDecisionService,
  ) { }

  /**
   * Creates a new season with multi-tenancy and audit.
   */
  async create(
    input: CreateSeasonInput,
    user: User,
    companyId: string,
  ): Promise<Season> {
    // 1. Verify Field belongs to Company
    const field = await this.prisma.field.findFirst({
      where: { id: input.fieldId, client: { companyId } },
    });
    if (!field) {
      throw new NotFoundException(
        `Field ${input.fieldId} not found or access denied`,
      );
    }

    // 2. Verify Rapeseed belongs to Company or is system-wide
    const rapeseed = await this.prisma.rapeseed.findFirst({
      where: {
        id: input.rapeseedId,
        OR: [{ companyId: null }, { companyId }],
      },
    });
    if (!rapeseed) {
      throw new NotFoundException(
        `Rapeseed ${input.rapeseedId} not found or access denied`,
      );
    }

    // 3. Validate Business Rules
    await this.businessRules.validateRapeseedSeason({
      ...input,
      companyId,
    });

    // 4. Create Season
    const season = await this.prisma.season.create({
      data: {
        ...input,
        companyId,
        isLocked: false,
      },
    });

    // 5. Audit
    await this.auditService.log(
      AgriculturalAuditEvent.RAPESEED_SEASON_CREATED,
      user,
      {
        seasonId: season.id,
        fieldId: season.fieldId,
        rapeseedId: season.rapeseedId,
      },
    );

    return season;
  }

  /**
   * Updates an existing season with security and lock checks.
   */
  async update(
    input: UpdateSeasonInput,
    user: User,
    companyId: string,
  ): Promise<Season> {
    const season = await this._validateAndGetSeason(input.id, companyId);

    this._checkLock(season);

    // Validate business rules if key parameters changed
    if (input.startDate || input.year || input.rapeseedId) {
      await this.businessRules.validateRapeseedSeason({
        ...season,
        ...input,
      });
    }

    const updatedCount = await this.prisma.season.updateMany({
      where: { id: input.id, companyId },
      data: {
        ...input,
      },
    });
    if (updatedCount.count === 0) {
      throw new NotFoundException(`Season ${input.id} not found or access denied`);
    }
    const updatedSeason = await this.prisma.season.findFirst({
      where: { id: input.id, companyId },
    });
    if (!updatedSeason) {
      throw new NotFoundException(`Season ${input.id} not found or access denied`);
    }

    // Audit simplified for now
    await this.auditService.log(
      AgriculturalAuditEvent.RAPESEED_SEASON_UPDATED as any,
      user,
      { seasonId: updatedSeason.id, changes: input },
    );

    return updatedSeason;
  }

  /**
   * Finds a single season ensuring company access.
   */
  async findOne(id: string, companyId: string): Promise<Season> {
    return this._validateAndGetSeason(id, companyId);
  }

  /**
   * Finds all seasons for a specific company.
   */
  async findAll(companyId: string): Promise<Season[]> {
    return this.prisma.season.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Completes and locks the season. Trigger for snapshots.
   * Uses production transaction settings and high-reliability audit logging.
   */
  async completeSeason(
    id: string,
    actualYield: number,
    user: User,
    companyId: string,
  ): Promise<Season> {
    return this.prisma.$transaction(
      async (tx) => {
        // 1. Получаем сезон с проверкой доступа
        const season = await tx.season.findFirst({
          where: { id, companyId },
        });

        if (!season) {
          throw new NotFoundException(
            `Season ${id} not found or access denied`,
          );
        }

        if (season.isLocked) {
          throw new BadRequestException(
            `Season ${season.id} is already locked`,
          );
        }

        // 2. Обновляем сезон
        const completedCount = await tx.season.updateMany({
          where: { id, companyId },
          data: {
            status: SeasonStatus.COMPLETED,
            actualYield,
            isLocked: true,
            lockedAt: new Date(),
            lockedBy: user.id,
          },
        });
        if (completedCount.count === 0) {
          throw new NotFoundException(`Season ${id} not found or access denied`);
        }
        const completedSeason = await tx.season.findFirst({
          where: { id, companyId },
        });
        if (!completedSeason) {
          throw new NotFoundException(`Season ${id} not found or access denied`);
        }

        // 3. Создаем снапшот внутри той же транзакции
        await this.snapshotService.createSnapshotTransaction(
          tx,
          completedSeason.id,
          companyId,
          user,
        );

        // 4. Аудит (с гарантией доставки через ретраи)
        await this.auditService.logWithRetry(
          AgriculturalAuditEvent.RAPESEED_SEASON_COMPLETED,
          user,
          { seasonId: completedSeason.id, actualYield },
        );

        return completedSeason;
      }
    );
  }

  /**
   * Transitions a season to a new stage using AgroOrchestrator.
   * Formula: Service = IO, Orchestrator = Brain.
   */
  async transitionStage(
    id: string,
    targetStageId: string,
    metadata: any,
    user: User,
    companyId: string,
  ): Promise<Season> {
    // 1. IO: Load state
    const season = await this.prisma.season.findFirst({
      where: { id, companyId },
      include: { stageProgress: true },
    });

    if (!season) {
      throw new NotFoundException(`Season ${id} not found or access denied`);
    }

    // --- RISK GATE (B6.2) ---
    const riskAssessment = await this.riskService.assess(
      companyId,
      RiskTargetType.SEASON,
      id
    );

    if (riskAssessment.verdict === 'BLOCKED') {
      await this.decisionService.record(
        companyId,
        `TRANSITION_${targetStageId}`,
        id,
        riskAssessment
      );
      throw new RiskBlockedError(riskAssessment);
    }
    // ------------------------

    this._checkLock(season);

    // 2. IO: Prepare context for Brain
    const targetStage = getRapeseedStageById(targetStageId);
    if (!targetStage) {
      throw new BadRequestException(
        `Stage ${targetStageId} not found in Rapeseed preset`,
      );
    }

    const context: AgroContext = {
      fieldId: season.fieldId,
      cropCycleId: season.id,
      currentStageId: season.currentStageId,
      inputData: metadata || {},
    };

    // 3. BRAIN: Resolve transition
    // For phase Alpha we use preset rules or empty for now
    const result = await this.orchestrator.transition(targetStage, context, []);

    if (!result.success) {
      throw new BadRequestException(
        `Transition to ${targetStageId} blocked: ${result.validation.reason}`,
      );
    }

    // 4. IO: Persist new state
    return this.prisma.$transaction(async (tx) => {
      const updatedCount = await tx.season.updateMany({
        where: { id, companyId },
        data: {
          currentStageId: targetStageId,
          status:
            targetStageId === "16_SEASON_CLOSE"
              ? SeasonStatus.COMPLETED
              : SeasonStatus.ACTIVE,
        },
      });
      if (updatedCount.count === 0) {
        throw new NotFoundException(`Season ${id} not found or access denied`);
      }
      const updated = await tx.season.findFirst({
        where: { id, companyId },
      });
      if (!updated) {
        throw new NotFoundException(`Season ${id} not found or access denied`);
      }

      await tx.seasonStageProgress.create({ // tenant-lint:ignore tenant scope inherited from seasonId relation
        data: {
          seasonId: id,
          stageId: targetStageId,
          metadata: metadata || {},
        },
      });

      // 5. IO: Audit
      await this.auditService.log(
        AgriculturalAuditEvent.RAPESEED_SEASON_UPDATED as any,
        user,
        {
          seasonId: id,
          transition: { from: season.currentStageId, to: targetStageId },
          metadata,
        },
      );

      return updated;
    });
  }

  /**
   * Internal helper to validate company access and existence.
   */
  private async _validateAndGetSeason(
    id: string,
    companyId: string,
  ): Promise<Season> {
    const season = await this.prisma.season.findFirst({
      where: { id, companyId },
    });

    if (!season) {
      throw new NotFoundException(`Season ${id} not found or access denied`);
    }

    return season;
  }

  /**
   * Internal helper to check if season is locked.
   */
  private _checkLock(season: Season): void {
    if (season.isLocked) {
      // Log violation attempt.
      // Note: In a real system we might want to wait for this to be sure it's logged,
      // but throwing the error will also be caught by global exception filters.
      this.auditService
        .log(
          AgriculturalAuditEvent.RAPESEED_SEASON_UPDATE_ATTEMPT_ON_LOCKED,
          { id: "SYSTEM", companyId: season.companyId } as any,
          { seasonId: season.id },
        )
        .catch((err) => console.error("Failed to log lock violation:", err));

      throw new BadRequestException(
        `Season ${season.id} is locked and cannot be modified`,
      );
    }
  }
}
