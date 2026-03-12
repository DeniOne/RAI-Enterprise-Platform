import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
  Param,
  UseInterceptors,
} from "@nestjs/common";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { RequireInternalApiKey } from "../../shared/auth/auth-boundary.decorator";
import { LearningEventService } from "./services/learning-event.service";
import { KeyRegistryService } from "./services/key-registry.service";
import { ModelRegistryService } from "./services/model-registry.service";
import {
  GovernanceService,
  ApprovalAction,
} from "./services/governance.service";
import { CanaryService } from "./services/canary.service";

@RequireInternalApiKey("Adaptive learning pipeline callback boundary")
@Controller("adaptive-learning")
export class AdaptiveLearningController {
  private readonly logger = new Logger(AdaptiveLearningController.name);
  private readonly usedNonces = new Set<string>(); // В проде заменить на Redis TTL

  constructor(
    private readonly learningEvent: LearningEventService,
    private readonly keyRegistry: KeyRegistryService,
    private readonly modelRegistry: ModelRegistryService,
    private readonly governance: GovernanceService,
    private readonly canary: CanaryService,
  ) {}

  /**
   * Callback от ML-пайплайна по завершению обучения.
   */
  @Post("callback")
  async handleMLCallback(
    @Body()
    payload: {
      trainingRunId: string;
      modelHash: string;
      artifactPath: string;
      mae: number;
      companyId: string;
    },
    @Headers("x-rai-signature") signature: string,
    @Headers("x-rai-nonce") nonce: string,
    @Headers("x-rai-timestamp") timestamp: string,
  ) {
    this.logger.log(
      `📞 Received ML Callback for TrainingRun: ${payload.trainingRunId}`,
    );

    // 1. Replay Protection
    if (this.usedNonces.has(nonce)) {
      throw new BadRequestException("Nonce already used.");
    }
    const ts = parseInt(timestamp);
    if (Math.abs(Date.now() - ts) > 300000) {
      // 5 минут окно
      throw new BadRequestException("Callback timestamp expired.");
    }
    this.usedNonces.add(nonce);

    // 2. Регистрация модели в статусе SHADOW (после проверки артефакта)
    const model = await this.modelRegistry.registerModel(payload.companyId, {
      name: `model-${payload.trainingRunId.substring(0, 8)}`,
      version: 1,
      hash: payload.modelHash,
      artifactPath: payload.artifactPath,
      trainingRunId: payload.trainingRunId,
      signature: "temp_dummy_signature", // Плейсхолдер для Phase C
    });

    return {
      status: "ACCEPTED",
      modelId: model.id,
      nextStep: "WAITING_FOR_GOVERNANCE_APPROVAL",
    };
  }

  /**
   * Подача модели на рассмотрение комитета.
   */
  @Post("models/:id/submit-approval")
  @UseInterceptors(IdempotencyInterceptor)
  async submitForApproval(
    @Param("id") modelId: string,
    @Body() body: { userId: string; notes: string },
  ) {
    return this.governance.submitForApproval(modelId, body.userId, body.notes);
  }

  /**
   * Решение комитета (Human-in-the-loop).
   */
  @Post("governance/review/:requestId")
  @UseInterceptors(IdempotencyInterceptor)
  async reviewModel(
    @Param("requestId") requestId: string,
    @Body() body: { userId: string; action: ApprovalAction; comment: string },
  ) {
    return this.governance.reviewModel(
      requestId,
      body.userId,
      body.action,
      body.comment,
    );
  }

  /**
   * Проверка Canary-метрик и возможный откат.
   */
  @Post("models/:id/canary-check")
  @UseInterceptors(IdempotencyInterceptor)
  async canaryCheck(
    @Param("id") id: string,
    @Body()
    metrics: {
      companyId: string;
      mae: number;
      baselineMae: number;
      sampleSize: number;
    },
  ) {
    return this.canary.evaluateCanaryPerformance(
      metrics.companyId,
      id,
      metrics.mae,
      metrics.baselineMae,
      metrics.sampleSize,
    );
  }
}
