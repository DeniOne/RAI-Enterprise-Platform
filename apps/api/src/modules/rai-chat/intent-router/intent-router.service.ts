import { Injectable } from "@nestjs/common";
import { RaiChatRequestDto } from "../dto/rai-chat.dto";
import {
  RaiToolCall,
  RaiToolName,
} from "../tools/rai-tools.types";
import {
  IntentClassification,
  WorkspaceContextForIntent,
} from "./intent-router.types";

@Injectable()
export class IntentRouterService {
  classify(
    message: string,
    workspaceContext?: WorkspaceContextForIntent,
  ): IntentClassification {
    const normalized = message.toLowerCase();

    if (/отклонени|deviation/.test(normalized)) {
      return {
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.7,
        method: "regex",
        reason: "match: отклонени|deviation",
      };
    }

    if (/план[ .-]?факт|plan fact|kpi/.test(normalized)) {
      return {
        toolName: RaiToolName.ComputePlanFact,
        confidence: 0.7,
        method: "regex",
        reason: "match: план-факт|kpi",
      };
    }

    if (/алерт|эскалац|alert/.test(normalized)) {
      return {
        toolName: RaiToolName.EmitAlerts,
        confidence: 0.7,
        method: "regex",
        reason: "match: алерт|alert",
      };
    }

    if (/техкарт|techmap|сделай карту/.test(normalized)) {
      return {
        toolName: RaiToolName.GenerateTechMapDraft,
        confidence: 0.7,
        method: "regex",
        reason: "match: техкарт|techmap",
      };
    }

    return {
      toolName: null,
      confidence: 0,
      method: "regex",
      reason: "no_match",
    };
  }

  buildAutoToolCall(
    message: string,
    request: RaiChatRequestDto,
    classification?: IntentClassification,
  ): RaiToolCall | null {
    const intent = (classification ?? this.classify(message, request.workspaceContext)).toolName;
    if (!intent) {
      return null;
    }

    const activeRefs = request.workspaceContext?.activeEntityRefs ?? [];
    const filters = request.workspaceContext?.filters ?? {};

    if (intent === RaiToolName.ComputeDeviations) {
      return {
        name: intent,
        payload: {
          scope: {
            seasonId:
              typeof filters?.seasonId === "string" ? filters.seasonId : undefined,
            fieldId: activeRefs.find((item) => item.kind === "field")?.id,
          },
        },
      };
    }

    if (intent === RaiToolName.ComputePlanFact) {
      return {
        name: intent,
        payload: {
          scope: {
            planId: typeof filters?.planId === "string" ? filters.planId : undefined,
            seasonId:
              typeof filters?.seasonId === "string" ? filters.seasonId : undefined,
          },
        },
      };
    }

    if (intent === RaiToolName.EmitAlerts) {
      return {
        name: intent,
        payload: {
          severity: /s4/.test(message.toLowerCase()) ? "S4" : "S3",
        },
      };
    }

    if (intent === RaiToolName.GenerateTechMapDraft) {
      const fieldRef = activeRefs.find((item) => item.kind === "field")?.id;
      const seasonRef =
        typeof filters?.seasonId === "string" ? filters.seasonId : undefined;

      if (!fieldRef || !seasonRef) {
        return null;
      }

      return {
        name: intent,
        payload: {
          fieldRef,
          seasonRef,
          crop: /подсолнеч|sunflower/.test(message.toLowerCase())
            ? "sunflower"
            : "rapeseed",
        },
      };
    }

    return null;
  }
}
