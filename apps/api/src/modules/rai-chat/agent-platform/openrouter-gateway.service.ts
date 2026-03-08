import { Injectable, Logger } from "@nestjs/common";
import { AgentRuntimeRole } from "../agent-registry.service";
import { PromptMessage } from "./agent-prompt-assembly.service";

export interface LlmGenerationRequest {
  traceId: string;
  agentRole: AgentRuntimeRole;
  model: string;
  messages: PromptMessage[];
  temperature: number;
  maxTokens: number;
  responseFormat?: "text";
  timeoutMs: number;
}

export interface LlmGenerationResult {
  provider: "openrouter";
  model: string;
  outputText: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  rawResponseMeta: Record<string, unknown>;
}

@Injectable()
export class OpenRouterGatewayService {
  private readonly logger = new Logger(OpenRouterGatewayService.name);

  async generate(input: LlmGenerationRequest): Promise<LlmGenerationResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY_MISSING");
    }

    const timeout = AbortSignal.timeout(input.timeoutMs);
    const response = await fetch(
      process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(process.env.OPENROUTER_HTTP_REFERER
            ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
            : {}),
          ...(process.env.OPENROUTER_APP_TITLE
            ? { "X-Title": process.env.OPENROUTER_APP_TITLE }
            : {}),
        },
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          temperature: input.temperature,
          max_tokens: input.maxTokens,
        }),
        signal: timeout,
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(
        `openrouter_request_failed traceId=${input.traceId} role=${input.agentRole} status=${response.status}`,
      );
      throw new Error(`OPENROUTER_REQUEST_FAILED:${response.status}:${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      model?: string;
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
      id?: string;
    };

    const outputText = payload.choices?.[0]?.message?.content?.trim();
    if (!outputText) {
      throw new Error("OPENROUTER_EMPTY_RESPONSE");
    }

    return {
      provider: "openrouter",
      model: payload.model ?? input.model,
      outputText,
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens: payload.usage?.total_tokens ?? 0,
      },
      finishReason: payload.choices?.[0]?.finish_reason ?? "stop",
      rawResponseMeta: {
        id: payload.id ?? null,
      },
    };
  }
}
