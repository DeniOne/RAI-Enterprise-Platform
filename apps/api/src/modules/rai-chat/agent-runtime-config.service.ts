import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RaiToolName } from "./tools/rai-tools.types";

type AgentRuntimeRole = "agronomist" | "economist" | "knowledge" | "monitoring";

interface ToolRuntimeMapping {
  role: AgentRuntimeRole;
  requiredCapability: string;
}

const TOOL_RUNTIME_MAP: Partial<Record<RaiToolName, ToolRuntimeMapping>> = {
  [RaiToolName.GenerateTechMapDraft]: {
    role: "agronomist",
    requiredCapability: "AgroToolsRegistry",
  },
  [RaiToolName.ComputeDeviations]: {
    role: "agronomist",
    requiredCapability: "AgroToolsRegistry",
  },
  [RaiToolName.ComputePlanFact]: {
    role: "economist",
    requiredCapability: "FinanceToolsRegistry",
  },
  [RaiToolName.SimulateScenario]: {
    role: "economist",
    requiredCapability: "FinanceToolsRegistry",
  },
  [RaiToolName.ComputeRiskAssessment]: {
    role: "economist",
    requiredCapability: "FinanceToolsRegistry",
  },
  [RaiToolName.QueryKnowledge]: {
    role: "knowledge",
    requiredCapability: "KnowledgeToolsRegistry",
  },
  [RaiToolName.EmitAlerts]: {
    role: "monitoring",
    requiredCapability: "RiskToolsRegistry",
  },
  [RaiToolName.GetWeatherForecast]: {
    role: "monitoring",
    requiredCapability: "RiskToolsRegistry",
  },
};

export interface EffectiveAgentRuntimeConfig {
  role: AgentRuntimeRole;
  isActive: boolean;
  capabilities: string[];
  source: "tenant" | "global";
}

export interface ToolAccessDecision {
  allowed: boolean;
  reasonCode?: "AGENT_DISABLED" | "CAPABILITY_DENIED";
  role?: AgentRuntimeRole;
  requiredCapability?: string;
}

@Injectable()
export class AgentRuntimeConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveToolAccess(
    companyId: string,
    toolName: RaiToolName,
  ): Promise<ToolAccessDecision> {
    const mapping = TOOL_RUNTIME_MAP[toolName];
    if (!mapping) {
      return { allowed: true };
    }

    const config = await this.getEffectiveConfig(companyId, mapping.role);
    if (!config) {
      // Backward compatibility: пока нет runtime-конфига, не ломаем исполнение.
      return {
        allowed: true,
        role: mapping.role,
        requiredCapability: mapping.requiredCapability,
      };
    }

    if (!config.isActive) {
      return {
        allowed: false,
        reasonCode: "AGENT_DISABLED",
        role: mapping.role,
        requiredCapability: mapping.requiredCapability,
      };
    }

    const hasCapability =
      config.capabilities.includes(mapping.requiredCapability) ||
      config.capabilities.includes(toolName);
    if (!hasCapability) {
      return {
        allowed: false,
        reasonCode: "CAPABILITY_DENIED",
        role: mapping.role,
        requiredCapability: mapping.requiredCapability,
      };
    }

    return {
      allowed: true,
      role: mapping.role,
      requiredCapability: mapping.requiredCapability,
    };
  }

  async getEffectiveConfig(
    companyId: string,
    role: AgentRuntimeRole,
  ): Promise<EffectiveAgentRuntimeConfig | null> {
    const [tenantOverride, globalDefault] = await Promise.all([
      this.prisma.agentConfiguration.findUnique({
        where: {
          agent_config_role_company_unique: {
            role,
            companyId,
          },
        },
      }),
      this.prisma.agentConfiguration.findUnique({
        where: {
          agent_config_role_company_unique: {
            role,
            companyId: null,
          },
        },
      }),
    ]);

    const row = tenantOverride ?? globalDefault;
    if (!row) {
      return null;
    }

    return {
      role: row.role as AgentRuntimeRole,
      isActive: row.isActive,
      capabilities: Array.isArray(row.capabilities)
        ? (row.capabilities as string[])
        : [],
      source: tenantOverride ? "tenant" : "global",
    };
  }
}
