import { Injectable } from "@nestjs/common";
import { AgentExecutionRequest, EffectiveAgentKernelEntry } from "./agent-platform.types";

export interface PromptMessage {
  role: "system" | "user";
  content: string;
}

@Injectable()
export class AgentPromptAssemblyService {
  buildMessages(
    kernel: EffectiveAgentKernelEntry,
    request: AgentExecutionRequest,
  ): PromptMessage[] {
    const recalled = request.memoryContext.recalledEpisodes
      .slice(0, 3)
      .map(
        (item, index) =>
          `[memory_${index + 1}] sim=${item.similarity.toFixed(2)} source=${item.source ?? "episode"} ${item.content}`,
      )
      .join("\n");

    const system = [
      kernel.systemPrompt,
      `Agent role: ${kernel.definition.name}.`,
      `Autonomy mode: ${kernel.definition.defaultAutonomyMode}.`,
      `Allowed tools: ${kernel.toolBindings
        .filter((binding) => binding.isEnabled)
        .map((binding) => binding.toolName)
        .join(", ") || "none"}.`,
      `Output contract sections: ${kernel.outputContract.sections.join(", ")}.`,
      `Governance rules: ${kernel.governancePolicy.humanGateRules.join(", ")}.`,
      `Fallback rules: ${kernel.governancePolicy.fallbackRules.join(", ")}.`,
    ].join("\n");

    const user = [
      `User message: ${request.message}`,
      request.workspaceContext
        ? `Workspace route: ${request.workspaceContext.route}`
        : null,
      request.workspaceContext?.filters
        ? `Workspace filters: ${JSON.stringify(request.workspaceContext.filters)}`
        : null,
      Object.keys(request.memoryContext.profile).length > 0
        ? `Memory profile: ${JSON.stringify(request.memoryContext.profile)}`
        : null,
      recalled ? `Relevant memory:\n${recalled}` : null,
      "Respond briefly, grounded in available evidence, and mention uncertainty when evidence is weak.",
    ]
      .filter(Boolean)
      .join("\n");

    return [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
  }
}
