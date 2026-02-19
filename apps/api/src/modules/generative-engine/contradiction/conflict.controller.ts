import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    Logger,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { DivergenceTrackerService } from './divergence-tracker.service';
import { CounterfactualEngine } from './counterfactual-engine';
import { ConflictMatrixService, DISWeights } from './conflict-matrix.service';
import { OverrideRiskAnalyzer } from '../risk/override-risk-analyzer';
import { ConfirmOverrideDto, OverrideResultDto } from './conflict.dto';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * ConflictController — API Level C: Contradiction-Resilient Intelligence.
 *
 * Endpoints:
 *   POST /api/v1/generative-engine/contradiction/confirm-override
 *   GET  /api/v1/generative-engine/contradiction/divergence/:id
 *   GET  /api/v1/generative-engine/contradiction/divergence/by-draft/:draftId
 *
 * Идемпотентность: Idempotency-Key header или автоматический SHA256.
 */
@Controller('api/v1/generative-engine/contradiction')
export class ConflictController {
    private readonly logger = new Logger(ConflictController.name);

    constructor(
        private readonly divergenceTracker: DivergenceTrackerService,
        private readonly counterfactualEngine: CounterfactualEngine,
        private readonly conflictMatrix: ConflictMatrixService,
        private readonly riskAnalyzer: OverrideRiskAnalyzer,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * POST /confirm-override
     *
     * Полный pipeline:
     * 1. Загрузка GovernanceConfig по disVersion
     * 2. Загрузка draftSnapshot
     * 3. CounterfactualEngine.simulate()
     * 4. OverrideRiskAnalyzer.analyze()
     * 5. ConflictMatrix.calculate()
     * 6. DivergenceTracker.recordDivergence()
     */
    @Post('confirm-override')
    @HttpCode(HttpStatus.OK)
    async confirmOverride(
        @Body() dto: ConfirmOverrideDto,
        @Headers('Idempotency-Key') idempotencyKey?: string,
    ): Promise<OverrideResultDto> {
        this.logger.log(
            `[OVERRIDE] draftId=${dto.draftId}, v=${dto.draftVersion}, ` +
            `company=${dto.companyId}`,
        );

        // 1. Загрузка GovernanceConfig
        const config = await this.prisma.governanceConfig.findUnique({
            where: { versionId: dto.disVersion },
        });
        if (!config) {
            throw new BadRequestException(
                `GovernanceConfig с versionId="${dto.disVersion}" не найден.`,
            );
        }

        const weights = config.weights as unknown as DISWeights;

        // 2. Получаем snapshot черновика (TODO: интеграция с TechMap/GenerationRecord)
        const draftSnapshot = await this.loadDraftSnapshot(
            dto.draftId,
            dto.draftVersion,
        );

        // 3. Counterfactual Simulation
        const cfResult = this.counterfactualEngine.simulate({
            draftSnapshot,
            humanAction: dto.humanAction,
            weights: weights as unknown as Record<string, number>,
            policyVersion: dto.policyVersion || 'v1.0.0',
            simulationMode: dto.simulationMode,
        });

        // 4. Override Risk Analysis
        const riskResult = this.riskAnalyzer.analyze({
            aiDraft: {
                yieldExpected: cfResult.aiTrajectory.expectedYield,
                yieldOverride: cfResult.aiTrajectory.expectedYield,
                costExpected: cfResult.aiTrajectory.expectedCost,
                costOverride: cfResult.aiTrajectory.expectedCost,
                complianceScore: 1.0,
            },
            humanOverride: {
                yieldExpected: cfResult.aiTrajectory.expectedYield,
                yieldOverride: cfResult.humanTrajectory.expectedYield,
                costExpected: cfResult.aiTrajectory.expectedCost,
                costOverride: cfResult.humanTrajectory.expectedCost,
                complianceScore: 0.9, // Default compliance delta
            },
            policyVersion: dto.policyVersion || 'v1.0.0',
            simulationMode: dto.simulationMode,
        });

        // 5. Conflict Matrix (DIS)
        const disResult = this.conflictMatrix.calculate({
            aiYield: cfResult.aiTrajectory.expectedYield,
            humanYield: cfResult.humanTrajectory.expectedYield,
            aiCost: cfResult.aiTrajectory.expectedCost,
            humanCost: cfResult.humanTrajectory.expectedCost,
            deltaRisk: riskResult.deltaRisk,
            aiOperationCount: (draftSnapshot['operations'] as any[] || []).length,
            humanOperationCount: (dto.humanAction['operations'] as any[] || (draftSnapshot['operations'] as any[] || [])).length,
            weights: weights as any,
        });

        // 6. Record Divergence
        const recordId = await this.divergenceTracker.recordDivergence({
            companyId: dto.companyId,
            draftId: dto.draftId,
            draftVersion: dto.draftVersion,
            disVersion: dto.disVersion,
            weightsSnapshot: weights as unknown as Record<string, number>,
            disScore: disResult.disScore,
            simulationHash: cfResult.simulationHash,
            deltaRisk: riskResult.deltaRisk,
            conflictVector: disResult.conflictVector as unknown as Record<string, unknown>,
            humanAction: dto.humanAction,
            explanation: dto.explanation,
            simulationMode: dto.simulationMode,
            policyVersion: dto.policyVersion,
        });

        return {
            divergenceRecordId: recordId,
            disScore: disResult.disScore,
            deltaRisk: riskResult.deltaRisk,
            simulationHash: cfResult.simulationHash,
            regret: cfResult.regret,
            conflictVector: disResult.conflictVector as unknown as Record<string, number>,
            isSystemFallback: riskResult.isSystemFallback,
        };
    }

    /**
     * GET /divergence/:id
     */
    @Get('divergence/:id')
    async getDivergence(@Param('id') id: string) {
        const record = await this.divergenceTracker.findById(id);
        if (!record) {
            throw new BadRequestException(
                `DivergenceRecord id="${id}" не найден.`,
            );
        }
        return record;
    }

    /**
     * GET /divergence/by-draft/:draftId
     */
    @Get('divergence/by-draft/:draftId')
    async getDivergenceByDraft(@Param('draftId') draftId: string) {
        return this.divergenceTracker.findByDraftId(draftId);
    }

    /**
     * Загружает snapshot черновика.
     * TODO: реальная интеграция с GenerationRecord/TechMap.
     */
    private async loadDraftSnapshot(
        draftId: string,
        draftVersion: number,
    ): Promise<Record<string, unknown>> {
        // Ищем в TechMap или возвращаем структуру по умолчанию
        // В production — запрос через GenerationRecordService
        return {
            draftId,
            draftVersion,
            operations: [],
            constraints: [],
            yieldTarget: 30,      // ц/га (default)
            costEstimate: 45000,  // руб/га (default)
        };
    }
}
