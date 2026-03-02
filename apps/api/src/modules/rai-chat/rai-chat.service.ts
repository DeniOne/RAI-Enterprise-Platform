import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  RaiChatRequestDto,
  RaiChatResponseDto,
  RaiToolCallDto,
} from "./dto/rai-chat.dto";
import {
  RaiSuggestedAction,
  RaiToolActorContext,
  RaiToolCall,
  RaiToolName,
} from "./tools/rai-tools.types";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";

@Injectable()
export class RaiChatService {
  constructor(private readonly toolsRegistry: RaiToolsRegistry) {}

  async handleChat(
    request: RaiChatRequestDto,
    companyId: string,
  ): Promise<RaiChatResponseDto> {
    const traceId = request.clientTraceId || `tr_${randomUUID()}`;
    const threadId = request.threadId || `th_${randomUUID()}`;
    const actorContext: RaiToolActorContext = {
      companyId,
      traceId,
    };

    const executedTools = await this.executeToolCalls(
      request.toolCalls ?? [],
      actorContext,
    );

    let text = `Принял: ${request.message}`;
    if (request.workspaceContext?.route) {
      text += `\nroute: ${request.workspaceContext.route}`;
    }

    const widgets: RaiChatResponseDto["widgets"] = [
      {
        type: "Last24hChanges",
        payload: {
          route: request.workspaceContext?.route || "unknown",
          ts: new Date().toISOString(),
          companyId,
        },
      },
    ];

    if (executedTools.length > 0) {
      widgets.push({
        type: "ToolExecutionResults",
        payload: {
          items: executedTools.map((tool) => ({
            name: tool.name,
            result: tool.result,
          })),
        },
      });
    }

    return {
      text,
      widgets,
      traceId,
      threadId,
      suggestedActions: this.buildSuggestedActions(request),
    };
  }

  private async executeToolCalls(
    toolCalls: RaiToolCallDto[],
    actorContext: RaiToolActorContext,
  ): Promise<Array<{ name: RaiToolName; result: unknown }>> {
    const results: Array<{ name: RaiToolName; result: unknown }> = [];

    for (const toolCall of toolCalls) {
      const result = await this.toolsRegistry.execute(
        toolCall.name,
        toolCall.payload,
        actorContext,
      );
      results.push({
        name: toolCall.name,
        result,
      });
    }

    return results;
  }

  private buildSuggestedActions(
    request: RaiChatRequestDto,
  ): RaiSuggestedAction[] {
    const actions: RaiSuggestedAction[] = [
      {
        kind: "tool",
        toolName: RaiToolName.EchoMessage,
        title: "Повторить сообщение",
        payload: {
          message: request.message,
        },
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
}
