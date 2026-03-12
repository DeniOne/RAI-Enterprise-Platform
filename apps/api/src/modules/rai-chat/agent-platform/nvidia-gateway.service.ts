import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { SecretsService } from "../../../shared/config/secrets.service";

export interface NvidiaGenerationRequest {
  model: string;
  query: string;
  systemPrompt?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  maxTokens?: number;
}

export interface NvidiaGenerationResult {
  outputText: string;
  usage: {
    totalTokens: number;
  };
  rawResponseMeta: Record<string, unknown>;
}

@Injectable()
export class NvidiaGatewayService {
  private readonly logger = new Logger(NvidiaGatewayService.name);
  private readonly invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

  constructor(private readonly secretsService: SecretsService) {}

  async generate(input: NvidiaGenerationRequest): Promise<NvidiaGenerationResult> {
    const apiKey = this.secretsService.getOptionalSecret("NVIDIA_API_KEY");
    if (!apiKey) {
      throw new Error("NVIDIA_API_KEY_MISSING, блядь. Настрой ключ, сука.");
    }

    try {
      const payload = {
        model: input.model,
        messages: [
          ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
          { role: "user", content: input.query },
        ],
        temperature: input.temperature ?? 0.6,
        top_p: input.top_p ?? 0.95,
        top_k: input.top_k ?? 20,
        presence_penalty: input.presence_penalty ?? 0,
        repetition_penalty: input.repetition_penalty ?? 1,
        max_tokens: input.maxTokens ?? 16384,
        chat_template_kwargs: { enable_thinking: true },
      };

      const response = await axios.post(this.invokeUrl, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 120000, // 2 minutes
      });

      const outputText = response.data?.choices?.[0]?.message?.content;
      if (!outputText) {
        throw new Error("NVIDIA_EMPTY_RESPONSE");
      }

      return {
        outputText,
        usage: {
          totalTokens: response.data?.usage?.total_tokens ?? 0,
        },
        rawResponseMeta: {
          id: response.data?.id,
        },
      };
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.message || "Неизвестная ебала в Nvidia API";
      this.logger.error(`nvidia_request_failed error=${message}`);
      throw new Error(`NVIDIA_REQUEST_FAILED: ${message}`);
    }
  }
}
