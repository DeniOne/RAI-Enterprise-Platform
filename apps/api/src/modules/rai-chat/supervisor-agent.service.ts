import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { RaiChatRequestDto, RaiChatResponseDto } from "./dto/rai-chat.dto";
import { RaiToolActorContext } from "./tools/rai-tools.types";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { ExternalSignalsService } from "./external-signals.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceSummaryService } from "./trace-summary.service";

@Injectable()
export class SupervisorAgent {
  private readonly logger = new Logger(SupervisorAgent.name);

  constructor(
    private readonly intentRouter: IntentRouterService,
    private readonly memoryCoordinator: MemoryCoordinatorService,
    private readonly agentRuntime: AgentRuntimeService,
    private readonly responseComposer: ResponseComposerService,
    private readonly externalSignalsService: ExternalSignalsService,
    private readonly prisma: PrismaService,
    @Inject(TraceSummaryService)
    private readonly traceSummaryService: TraceSummaryService,
  ) {}

  async orchestrate(
    request: RaiChatRequestDto,
    companyId: string,
    userId?: string,
    options?: { replayMode?: boolean },
  ): Promise<RaiChatResponseDto> {
    const startedAt = Date.now();
    const traceId = request.clientTraceId ?? `tr_${randomUUID()}`;
    const threadId = request.threadId ?? `th_${randomUUID()}`;
    const actorContext: RaiToolActorContext = {
      companyId,
      traceId,
      replayMode: options?.replayMode,
    };

    const recallResult = await this.memoryCoordinator.recallContext(
      request,
      actorContext,
      userId,
    );

    const classification = this.intentRouter.classify(
      request.message,
      request.workspaceContext,
    );
    const autoToolCall = this.intentRouter.buildAutoToolCall(
      request.message,
      request,
      classification,
    );
    const requestedToolCalls = [...(request.toolCalls ?? [])];
    if (
      autoToolCall &&
      !requestedToolCalls.some((t) => t.name === autoToolCall.name)
    ) {
      requestedToolCalls.unshift({
        name: autoToolCall.name,
        payload: autoToolCall.payload as Record<string, unknown>,
      });
    }

    const executionResult = await this.agentRuntime.run({
      requestedToolCalls,
      actorContext,
    });

    const externalSignalResult = await this.externalSignalsService.process({
      companyId,
      traceId,
      threadId,
      userId,
      signals: request.externalSignals,
      feedback: request.advisoryFeedback,
    });

    const response = await this.responseComposer.buildResponse({
      request,
      executionResult,
      recallResult,
      externalSignalResult,
      traceId,
      threadId,
      companyId,
    });

    void this.traceSummaryService.record({
      traceId,
      companyId,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: Date.now() - startedAt,
      modelId: "deterministic",
      promptVersion: "v1",
      toolsVersion: "v1",
      policyId: "default",
    });

    this.writeAiAuditEntry({
      companyId,
      traceId,
      toolNames: executionResult.executedTools.map((t) => t.name),
      intentMethod: classification.method,
    });

    this.memoryCoordinator.commitInteraction(
      request,
      response.text,
      actorContext,
      threadId,
      userId,
    );

    return response;
  }

  private writeAiAuditEntry(params: {
    companyId: string;
    traceId: string;
    toolNames: string[];
    intentMethod: string;
  }): void {
    this.prisma.aiAuditEntry
      .create({
        data: {
          traceId: params.traceId,
          companyId: params.companyId,
          toolNames: params.toolNames,
          model: "deterministic",
          intentMethod: params.intentMethod,
          tokensUsed: 0,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `ai_audit_entry create failed traceId=${params.traceId} err=${String((err as Error)?.message ?? err)}`,
        ),
      );
  }
}
