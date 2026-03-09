import { Injectable, NotFoundException } from "@nestjs/common";
import { ChangeOrderType } from "@rai/prisma-client";
import { TechMapBudgetService } from "../../tech-map/economics/tech-map-budget.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import {
  RaiToolActorContext,
  RaiToolCall,
  RaiToolName,
  TOOL_RISK_MAP,
} from "../tools/rai-tools.types";
import { BudgetExceededError } from "./budget-exceeded.error";
import { AgentRegistryService, AgentRuntimeRole } from "../agent-registry.service";

export type RuntimeBudgetOutcome = "ALLOW" | "DEGRADE" | "DENY";

export interface RuntimeBudgetDecision {
  outcome: RuntimeBudgetOutcome;
  reason: string;
  source: "agent_registry_max_tokens" | "replay_bypass";
  estimatedTokens: number;
  budgetLimit: number | null;
  allowedToolNames: RaiToolName[];
  droppedToolNames: RaiToolName[];
  ownerRoles: AgentRuntimeRole[];
}

const TOOL_TOKEN_COST: Record<RaiToolName, number> = {
  [RaiToolName.EchoMessage]: 300,
  [RaiToolName.WorkspaceSnapshot]: 500,
  [RaiToolName.LogDialogMessage]: 700,
  [RaiToolName.ClassifyDialogThread]: 1200,
  [RaiToolName.CreateFrontOfficeEscalation]: 1800,
  [RaiToolName.ComputeDeviations]: 3000,
  [RaiToolName.ComputePlanFact]: 2500,
  [RaiToolName.EmitAlerts]: 3500,
  [RaiToolName.GenerateTechMapDraft]: 9000,
  [RaiToolName.SimulateScenario]: 5000,
  [RaiToolName.ComputeRiskAssessment]: 3000,
  [RaiToolName.GetWeatherForecast]: 1200,
  [RaiToolName.QueryKnowledge]: 3500,
  [RaiToolName.LookupCounterpartyByInn]: 1800,
  [RaiToolName.RegisterCounterparty]: 4200,
  [RaiToolName.CreateCounterpartyRelation]: 2600,
  [RaiToolName.CreateCrmAccount]: 3200,
  [RaiToolName.GetCrmAccountWorkspace]: 2400,
  [RaiToolName.UpdateCrmAccount]: 3000,
  [RaiToolName.CreateCrmContact]: 2400,
  [RaiToolName.UpdateCrmContact]: 2200,
  [RaiToolName.DeleteCrmContact]: 1800,
  [RaiToolName.CreateCrmInteraction]: 2600,
  [RaiToolName.UpdateCrmInteraction]: 2300,
  [RaiToolName.DeleteCrmInteraction]: 1800,
  [RaiToolName.CreateCrmObligation]: 2800,
  [RaiToolName.UpdateCrmObligation]: 2400,
  [RaiToolName.DeleteCrmObligation]: 1800,
};

@Injectable()
export class BudgetControllerService {
  constructor(
    private readonly budgetService: TechMapBudgetService,
    private readonly prisma: PrismaService,
    private readonly agentRegistry: AgentRegistryService,
  ) {}

  /**
   * Проверяет, не превысит ли добавление deltaCost лимит техкарты.
   * companyId только из actorContext (SECURITY_CANON).
   */
  async validateTransaction(
    techMapId: string,
    deltaCost: number,
    actorContext: RaiToolActorContext,
  ): Promise<void> {
    const { companyId } = actorContext;
    const budget = await this.budgetService.calculateBudget(techMapId, companyId);
    const techMap = await this.prisma.techMap.findFirst({
      where: { id: techMapId, companyId },
      include: {
        field: { select: { area: true } },
        cropZone: { include: { field: { select: { area: true } } } },
      },
    });
    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }
    const area =
      techMap.field?.area ?? techMap.cropZone?.field?.area ?? 0;
    const budgetCapRubHa = techMap.budgetCapRubHa ?? 0;
    const contingencyPct = techMap.contingencyFundPct ?? 0;
    const budgetCapTotal =
      budgetCapRubHa * area * (1 + contingencyPct);
    const projected =
      Math.max(budget.totalActual, budget.totalPlanned) + deltaCost;
    if (budgetCapTotal > 0 && projected > budgetCapTotal) {
      throw new BudgetExceededError(
        `Превышен лимит бюджета техкарты: проекция ${projected.toFixed(0)} ₽ > лимит ${budgetCapTotal.toFixed(0)} ₽`,
        techMapId,
        budgetCapTotal,
        projected,
      );
    }
  }

  /**
   * CANCEL_OP не увеличивает бюджет — разрешён без проверки лимита.
   * ADD_OP, CHANGE_RATE и т.д. требуют последующей validateTransaction с конкретным deltaCost.
   */
  isChangeAllowed(
    _techMapId: string,
    changeType: ChangeOrderType,
  ): { allowed: boolean; requiresValidation: boolean } {
    if (changeType === "CANCEL_OP") {
      return { allowed: true, requiresValidation: false };
    }
    return { allowed: true, requiresValidation: true };
  }

  async evaluateRuntimeBudget(
    requestedToolCalls: RaiToolCall[],
    actorContext: RaiToolActorContext,
  ): Promise<RuntimeBudgetDecision> {
    if (actorContext.replayMode) {
      return {
        outcome: "ALLOW",
        reason: "REPLAY_BYPASS",
        source: "replay_bypass",
        estimatedTokens: this.sumToolCosts(requestedToolCalls.map((call) => call.name)),
        budgetLimit: null,
        allowedToolNames: requestedToolCalls.map((call) => call.name),
        droppedToolNames: [],
        ownerRoles: [],
      };
    }

    if (requestedToolCalls.length === 0) {
      return {
        outcome: "ALLOW",
        reason: "NO_TOOL_CALLS",
        source: "agent_registry_max_tokens",
        estimatedTokens: 0,
        budgetLimit: null,
        allowedToolNames: [],
        droppedToolNames: [],
        ownerRoles: [],
      };
    }

    const registry = await this.agentRegistry.getRegistry(actorContext.companyId);
    const ownersByTool = new Map(
      registry.flatMap((entry) =>
        entry.runtime.tools.map((tool) => [tool, entry] as const),
      ),
    );

    const ownerBudgets = new Map<AgentRuntimeRole, number>();
    const selected: RaiToolName[] = [];
    const dropped: RaiToolName[] = [];
    const ownerRoles = new Set<AgentRuntimeRole>();

    for (const call of requestedToolCalls) {
      const owner = ownersByTool.get(call.name);
      if (!owner) {
        selected.push(call.name);
        continue;
      }

      ownerRoles.add(owner.definition.role);
      const current = ownerBudgets.get(owner.definition.role) ?? 0;
      const next = current + this.estimateToolCost(call.name);
      const limit = owner.runtime.maxTokens;
      if (next <= limit) {
        ownerBudgets.set(owner.definition.role, next);
        selected.push(call.name);
        continue;
      }

      const risk = TOOL_RISK_MAP[call.name]?.riskLevel ?? "READ";
      const hasSelectedForOwner = selected.some(
        (toolName) => ownersByTool.get(toolName)?.definition.role === owner.definition.role,
      );
      if (risk !== "READ" || !hasSelectedForOwner) {
        return {
          outcome: "DENY",
          reason: `TOKEN_BUDGET_EXCEEDED:${owner.definition.role}:${call.name}`,
          source: "agent_registry_max_tokens",
          estimatedTokens: this.sumToolCosts(requestedToolCalls.map((item) => item.name)),
          budgetLimit: limit,
          allowedToolNames: selected,
          droppedToolNames: [...dropped, call.name],
          ownerRoles: [...ownerRoles],
        };
      }

      dropped.push(call.name);
    }

    return {
      outcome: dropped.length > 0 ? "DEGRADE" : "ALLOW",
      reason: dropped.length > 0 ? "TOKEN_BUDGET_DEGRADED" : "WITHIN_BUDGET",
      source: "agent_registry_max_tokens",
      estimatedTokens: this.sumToolCosts(selected),
      budgetLimit:
        ownerRoles.size > 0
          ? Math.min(
              ...[...ownerRoles].map(
                (role) =>
                  registry.find((entry) => entry.definition.role === role)?.runtime.maxTokens ?? Number.MAX_SAFE_INTEGER,
              ),
            )
          : null,
      allowedToolNames: selected,
      droppedToolNames: dropped,
      ownerRoles: [...ownerRoles],
    };
  }

  private estimateToolCost(toolName: RaiToolName): number {
    return TOOL_TOKEN_COST[toolName] ?? 1000;
  }

  private sumToolCosts(toolNames: RaiToolName[]): number {
    return toolNames.reduce((sum, toolName) => sum + this.estimateToolCost(toolName), 0);
  }
}
