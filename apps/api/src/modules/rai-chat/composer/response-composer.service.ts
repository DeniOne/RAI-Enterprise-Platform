import { Injectable } from "@nestjs/common";
import {
  RaiChatRequestDto,
  RaiChatResponseDto,
  RaiMemoryUsedDto,
  ExternalAdvisoryDto,
  EvidenceReference,
} from "../dto/rai-chat.dto";
import {
  RaiSuggestedAction,
  RaiToolName,
  ComputeDeviationsResult,
  ComputePlanFactResult,
  EmitAlertsResult,
  GenerateTechMapDraftResult,
} from "../tools/rai-tools.types";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import { RecallResult } from "../memory/memory-coordinator.service";
import { EpisodicRetrievalResponse } from "../../../shared/memory/episodic-retrieval.service";
import { ExecutionResult } from "../runtime/agent-runtime.service";

export interface BuildResponseParams {
  request: RaiChatRequestDto;
  executionResult: ExecutionResult;
  recallResult: RecallResult;
  externalSignalResult: { advisory?: ExternalAdvisoryDto; feedbackStored: boolean };
  traceId: string;
  threadId: string;
  companyId: string;
}

@Injectable()
export class ResponseComposerService {
  constructor(
    private readonly widgetBuilder: RaiChatWidgetBuilder,
    private readonly sensitiveDataFilter: SensitiveDataFilterService,
  ) {}

  async buildResponse(params: BuildResponseParams): Promise<RaiChatResponseDto> {
    const {
      request,
      executionResult,
      recallResult,
      externalSignalResult,
      traceId,
      threadId,
      companyId,
    } = params;
    const { recall, profile } = recallResult;

    let text = `Принял: ${request.message}`;
    if (request.workspaceContext?.route) {
      text += `\nroute: ${request.workspaceContext.route}`;
    }
    if (executionResult.executedTools.length > 0) {
      text += `\nИнструментов выполнено: ${executionResult.executedTools.length}`;
      const toolSummary = this.summarizeExecutedTools(executionResult.executedTools);
      if (toolSummary) text += `\n${toolSummary}`;
    }
    if (recall.items.length > 0) {
      const top = recall.items[0];
      text += `\n(Контекст из памяти: "${top.content.slice(0, 50)}...", sim: ${top.similarity.toFixed(2)})`;
    }
    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) text += `\n(Профиль: ${profileSummary})`;
    if (externalSignalResult.advisory) {
      const a = externalSignalResult.advisory;
      text += `\nAdvisory: ${a.recommendation} — ${a.summary}`;
    }
    if (externalSignalResult.feedbackStored) {
      text += "\nFeedback по advisory записан в память.";
    }
    text = this.sensitiveDataFilter.mask(text);

    const evidence = this.collectEvidence(executionResult);

    return {
      text,
      widgets: this.widgetBuilder.build({
        companyId,
        workspaceContext: request.workspaceContext,
      }),
      toolCalls: executionResult.executedTools.map((t) => ({
        name: t.name,
        payload:
          t.result && typeof t.result === "object"
            ? (t.result as Record<string, unknown>)
            : { result: t.result ?? null },
      })),
      traceId,
      threadId,
      suggestedActions: this.buildSuggestedActions(request),
      openUiToken: undefined,
      advisory: externalSignalResult.advisory,
      memoryUsed: this.buildMemoryUsed(profile, recall),
      evidence: evidence.length > 0 ? evidence : undefined,
      runtimeBudget: executionResult.runtimeBudget,
    };
  }

  buildSuggestedActions(request: RaiChatRequestDto): RaiSuggestedAction[] {
    const actions: RaiSuggestedAction[] = [
      {
        kind: "tool",
        toolName: RaiToolName.EchoMessage,
        title: "Повторить сообщение",
        payload: { message: request.message },
      },
    ];
    if (request.workspaceContext?.route) {
      actions.push({
        kind: "tool",
        toolName: RaiToolName.WorkspaceSnapshot,
        title: "Снять срез рабочего контекста",
        payload: {
          route: request.workspaceContext.route,
          lastUserAction: request.workspaceContext.lastUserAction,
        },
      });
    }
    return actions;
  }

  private extractProfileSummary(profile: Record<string, unknown>): string | null {
    const lastRoute =
      typeof profile.lastRoute === "string" && profile.lastRoute.length > 0
        ? profile.lastRoute
        : null;
    const lastMessagePreview =
      typeof profile.lastMessagePreview === "string" &&
      profile.lastMessagePreview.length > 0
        ? profile.lastMessagePreview
        : null;
    const parts = [
      lastRoute ? `lastRoute=${lastRoute}` : null,
      lastMessagePreview ? `lastMessage=${lastMessagePreview}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? (parts.join("; ") as string) : null;
  }

  private buildMemoryUsed(
    profile: Record<string, unknown>,
    recall: EpisodicRetrievalResponse,
  ): RaiMemoryUsedDto[] {
    const items: RaiMemoryUsedDto[] = [];
    const top = recall.items[0];
    if (top?.content) {
      items.push({
        kind: "episode",
        label: top.content.slice(0, 80),
        confidence: Number(top.confidence ?? 0),
        source: typeof top.metadata?.source === "string" ? top.metadata.source : "episode",
      });
    }
    const profileSummary = this.extractProfileSummary(profile);
    if (profileSummary) {
      items.push({
        kind: "profile",
        label: profileSummary,
        confidence: typeof profile.confidence === "number" ? Number(profile.confidence) : 0.8,
        source: typeof profile.provenance === "string" ? profile.provenance : "profile",
      });
    }
    return items;
  }

  private summarizeExecutedTools(
    executedTools: Array<{ name: RaiToolName; result: unknown }>,
  ): string | null {
    const parts = executedTools
      .map((tool) => {
        if (tool.name === RaiToolName.ComputeDeviations) {
          const r = tool.result as ComputeDeviationsResult & { explain?: string; agentName?: string };
          if (r?.agentName === "AgronomAgent" && r.explain) return r.explain;
          return `Отклонений найдено: ${(r as ComputeDeviationsResult)?.count ?? 0}`;
        }
        if (tool.name === RaiToolName.ComputePlanFact) {
          const r = tool.result as ComputePlanFactResult | { data?: ComputePlanFactResult; agentName?: string };
          const data = "data" in r && r.data ? r.data : (r as ComputePlanFactResult);
          return `План-факт по плану ${data.planId}: ROI ${data.roi}, EBITDA ${data.ebitda}`;
        }
        if (tool.name === RaiToolName.EmitAlerts) {
          const r = tool.result as EmitAlertsResult;
          return `Открытых эскалаций ${r.severity}+ : ${r.count}`;
        }
        if (tool.name === RaiToolName.GenerateTechMapDraft) {
          const r = tool.result as GenerateTechMapDraftResult & { explain?: string; agentName?: string };
          if (r?.agentName === "AgronomAgent" && r.explain) return r.explain;
          return `Черновик техкарты создан: ${(r as GenerateTechMapDraftResult)?.draftId}`;
        }
        return null;
      })
      .filter((x): x is string => Boolean(x));
    return parts.length > 0 ? parts.join("\n") : null;
  }

  private collectEvidence(
    executionResult: ExecutionResult,
  ): EvidenceReference[] {
    const acc: EvidenceReference[] = [];
    for (const tool of executionResult.executedTools) {
      const payload = tool.result as
        | { evidence?: EvidenceReference[] }
        | undefined;
      if (payload?.evidence && Array.isArray(payload.evidence)) {
        acc.push(...payload.evidence);
      }
    }
    return acc;
  }
}
