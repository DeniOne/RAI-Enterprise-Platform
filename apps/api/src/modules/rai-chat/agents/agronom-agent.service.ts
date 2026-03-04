import { Injectable } from "@nestjs/common";
import { RaiToolName } from "../tools/rai-tools.types";
import { AgroToolsRegistry } from "../tools/agro-tools.registry";
import { RaiToolActorContext } from "../tools/rai-tools.types";

export interface AgronomAgentInput {
  companyId: string;
  traceId: string;
  intent: "generate_tech_map_draft" | "compute_deviations";
  fieldRef?: string;
  seasonRef?: string;
  crop?: "rapeseed" | "sunflower";
  scope?: { seasonId?: string; fieldId?: string };
}

export interface AgronomAgentResult {
  agentName: "AgronomAgent";
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
  data: unknown;
  confidence: number;
  missingContext: string[];
  explain: string;
  toolCallsCount: number;
  traceId: string;
}

@Injectable()
export class AgronomAgent {
  constructor(private readonly agroToolsRegistry: AgroToolsRegistry) {}

  async run(input: AgronomAgentInput): Promise<AgronomAgentResult> {
    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
    };

    if (input.intent === "generate_tech_map_draft") {
      const missing: string[] = [];
      if (!input.fieldRef) missing.push("fieldRef");
      if (!input.seasonRef) missing.push("seasonRef");
      if (missing.length > 0) {
        return {
          agentName: "AgronomAgent",
          status: "NEEDS_MORE_DATA",
          data: {},
          confidence: 0,
          missingContext: missing,
          explain: `Не хватает контекста: ${missing.join(", ")}`,
          toolCallsCount: 0,
          traceId: input.traceId,
        };
      }
      try {
        const data = await this.agroToolsRegistry.execute(
          RaiToolName.GenerateTechMapDraft,
          {
            fieldRef: input.fieldRef!,
            seasonRef: input.seasonRef!,
            crop: input.crop ?? "rapeseed",
          },
          actorContext,
        );
        return {
          agentName: "AgronomAgent",
          status: "COMPLETED",
          data,
          confidence: 0.6,
          missingContext: [],
          explain:
            "Черновик создан детерминированно. LLM-агроном не подключён.",
          toolCallsCount: 1,
          traceId: input.traceId,
        };
      } catch (err) {
        return {
          agentName: "AgronomAgent",
          status: "FAILED",
          data: {},
          confidence: 0,
          missingContext: [],
          explain: String((err as Error).message),
          toolCallsCount: 1,
          traceId: input.traceId,
        };
      }
    }

    if (input.intent === "compute_deviations") {
      try {
        const data = await this.agroToolsRegistry.execute(
          RaiToolName.ComputeDeviations,
          { scope: input.scope ?? {} },
          actorContext,
        );
        return {
          agentName: "AgronomAgent",
          status: "COMPLETED",
          data,
          confidence: 0.9,
          missingContext: [],
          explain: "Отклонения получены из AgroToolsRegistry.",
          toolCallsCount: 1,
          traceId: input.traceId,
        };
      } catch (err) {
        return {
          agentName: "AgronomAgent",
          status: "FAILED",
          data: {},
          confidence: 0,
          missingContext: [],
          explain: String((err as Error).message),
          toolCallsCount: 1,
          traceId: input.traceId,
        };
      }
    }

    return {
      agentName: "AgronomAgent",
      status: "FAILED",
      data: {},
      confidence: 0,
      missingContext: [],
      explain: `Неизвестный intent: ${(input as AgronomAgentInput).intent}`,
      toolCallsCount: 0,
      traceId: input.traceId,
    };
  }
}
