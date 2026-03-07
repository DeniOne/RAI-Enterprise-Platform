import { Injectable } from "@nestjs/common";
import type { AgentConfiguration } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RaiToolName } from "./tools/rai-tools.types";

export type AgentRuntimeRole =
  | "agronomist"
  | "economist"
  | "knowledge"
  | "monitoring";

export interface AgentDefinition {
  role: AgentRuntimeRole;
  name: string;
  businessRole: string;
  ownerDomain: "agro" | "finance" | "knowledge" | "risk";
  defaultModel: string;
  defaultMaxTokens: number;
  defaultCapabilities: string[];
}

export interface AgentTenantAccess {
  companyId: string;
  role: AgentRuntimeRole;
  mode: "INHERITED" | "OVERRIDE" | "DENIED";
  isActive: boolean;
  source: "global" | "tenant";
}

export interface EffectiveAgentRegistryEntry {
  definition: AgentDefinition;
  runtime: {
    configId: string | null;
    systemPrompt: string;
    llmModel: string;
    maxTokens: number;
    capabilities: string[];
    tools: RaiToolName[];
    isActive: boolean;
    source: "global" | "tenant";
    bindingsSource: "persisted" | "bootstrap";
  };
  tenantAccess: AgentTenantAccess;
}

const AGENT_DEFINITIONS: Record<AgentRuntimeRole, AgentDefinition> = {
  agronomist: {
    role: "agronomist",
    name: "AgronomAgent",
    businessRole: "Генерация DRAFT техкарт и агрономических рекомендаций",
    ownerDomain: "agro",
    defaultModel: "gpt-4o",
    defaultMaxTokens: 16000,
    defaultCapabilities: ["AgroToolsRegistry"],
  },
  economist: {
    role: "economist",
    name: "EconomistAgent",
    businessRole: "Экономический разбор сценариев и plan/fact аналитика",
    ownerDomain: "finance",
    defaultModel: "gpt-4o-mini",
    defaultMaxTokens: 8000,
    defaultCapabilities: ["FinanceToolsRegistry"],
  },
  knowledge: {
    role: "knowledge",
    name: "KnowledgeAgent",
    businessRole: "RAG и институциональная память RAI",
    ownerDomain: "knowledge",
    defaultModel: "gpt-4o-mini",
    defaultMaxTokens: 4000,
    defaultCapabilities: ["KnowledgeToolsRegistry"],
  },
  monitoring: {
    role: "monitoring",
    name: "MonitoringAgent",
    businessRole: "Мониторинг и алерты в read-only risk контуре",
    ownerDomain: "risk",
    defaultModel: "gpt-4o-mini",
    defaultMaxTokens: 4000,
    defaultCapabilities: ["RiskToolsRegistry"],
  },
};

const AGENT_ROLES = Object.keys(AGENT_DEFINITIONS) as AgentRuntimeRole[];

interface PersistedCapabilityBinding {
  role: string;
  capability: string;
  isEnabled: boolean;
}

interface PersistedToolBinding {
  role: string;
  toolName: string;
  isEnabled: boolean;
}

export const DEFAULT_TOOL_BINDINGS: Record<AgentRuntimeRole, RaiToolName[]> = {
  agronomist: [
    RaiToolName.GenerateTechMapDraft,
    RaiToolName.ComputeDeviations,
  ],
  economist: [
    RaiToolName.ComputePlanFact,
    RaiToolName.SimulateScenario,
    RaiToolName.ComputeRiskAssessment,
  ],
  knowledge: [RaiToolName.QueryKnowledge],
  monitoring: [RaiToolName.EmitAlerts, RaiToolName.GetWeatherForecast],
};

export function isAgentRuntimeRole(value: string): value is AgentRuntimeRole {
  return AGENT_ROLES.includes(value as AgentRuntimeRole);
}

export function getDefaultToolsForRole(role: AgentRuntimeRole): RaiToolName[] {
  return [...DEFAULT_TOOL_BINDINGS[role]];
}

function normalizeCapabilities(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const items = value.filter((entry): entry is string => typeof entry === "string");
  return items.length > 0 ? items : [...fallback];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function indexBindingsByRole<T extends { role: string }>(
  rows: T[],
): Map<AgentRuntimeRole, T[]> {
  const map = new Map<AgentRuntimeRole, T[]>();
  for (const row of rows) {
    if (!isAgentRuntimeRole(row.role)) {
      continue;
    }
    const bucket = map.get(row.role) ?? [];
    bucket.push(row);
    map.set(row.role, bucket);
  }
  return map;
}

function indexByRole(rows: AgentConfiguration[]): Map<AgentRuntimeRole, AgentConfiguration> {
  return new Map(
    rows
      .filter((row): row is AgentConfiguration & { role: AgentRuntimeRole } =>
        AGENT_ROLES.includes(row.role as AgentRuntimeRole),
      )
      .map((row) => [row.role as AgentRuntimeRole, row]),
  );
}

@Injectable()
export class AgentRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegistry(companyId: string): Promise<EffectiveAgentRegistryEntry[]> {
    const [
      globalRows,
      tenantRows,
      globalCapabilityBindings,
      tenantCapabilityBindings,
      globalToolBindings,
      tenantToolBindings,
    ] = await Promise.all([
      this.prisma.agentConfiguration.findMany({ where: { companyId: null } }),
      this.prisma.agentConfiguration.findMany({ where: { companyId } }),
      this.prisma.agentCapabilityBinding.findMany({ where: { companyId: null } }),
      this.prisma.agentCapabilityBinding.findMany({ where: { companyId } }),
      this.prisma.agentToolBinding.findMany({ where: { companyId: null } }),
      this.prisma.agentToolBinding.findMany({ where: { companyId } }),
    ]);

    const globalByRole = indexByRole(globalRows);
    const tenantByRole = indexByRole(tenantRows);
    const globalCapabilitiesByRole = indexBindingsByRole(globalCapabilityBindings);
    const tenantCapabilitiesByRole = indexBindingsByRole(tenantCapabilityBindings);
    const globalToolsByRole = indexBindingsByRole(globalToolBindings);
    const tenantToolsByRole = indexBindingsByRole(tenantToolBindings);

    return AGENT_ROLES.map((role) =>
      this.buildEntry(
        companyId,
        role,
        globalByRole.get(role),
        tenantByRole.get(role),
        globalCapabilitiesByRole.get(role) ?? [],
        tenantCapabilitiesByRole.get(role) ?? [],
        globalToolsByRole.get(role) ?? [],
        tenantToolsByRole.get(role) ?? [],
      ),
    );
  }

  async getEffectiveAgent(
    companyId: string,
    role: AgentRuntimeRole,
  ): Promise<EffectiveAgentRegistryEntry | null> {
    const [
      globalRow,
      tenantRow,
      globalCapabilityBindings,
      tenantCapabilityBindings,
      globalToolBindings,
      tenantToolBindings,
    ] = await Promise.all([
      this.prisma.agentConfiguration.findUnique({
        where: {
          agent_config_role_company_unique: {
            role,
            companyId: null,
          },
        },
      }),
      this.prisma.agentConfiguration.findUnique({
        where: {
          agent_config_role_company_unique: {
            role,
            companyId,
          },
        },
      }),
      this.prisma.agentCapabilityBinding.findMany({
        where: { role, companyId: null },
      }),
      this.prisma.agentCapabilityBinding.findMany({
        where: { role, companyId },
      }),
      this.prisma.agentToolBinding.findMany({
        where: { role, companyId: null },
      }),
      this.prisma.agentToolBinding.findMany({
        where: { role, companyId },
      }),
    ]);

    if (!globalRow && !tenantRow) {
      return null;
    }

    return this.buildEntry(
      companyId,
      role,
      globalRow ?? undefined,
      tenantRow ?? undefined,
      globalCapabilityBindings,
      tenantCapabilityBindings,
      globalToolBindings,
      tenantToolBindings,
    );
  }

  private buildEntry(
    companyId: string,
    role: AgentRuntimeRole,
    globalRow?: AgentConfiguration,
    tenantRow?: AgentConfiguration,
    globalCapabilityBindings: PersistedCapabilityBinding[] = [],
    tenantCapabilityBindings: PersistedCapabilityBinding[] = [],
    globalToolBindings: PersistedToolBinding[] = [],
    tenantToolBindings: PersistedToolBinding[] = [],
  ): EffectiveAgentRegistryEntry {
    const definition = AGENT_DEFINITIONS[role];
    const effectiveRow = tenantRow ?? globalRow;
    const source = tenantRow ? "tenant" : "global";
    const isActive = effectiveRow?.isActive ?? false;
    const persistedCapabilities = this.resolveCapabilities(
      role,
      globalCapabilityBindings,
      tenantCapabilityBindings,
    );
    const persistedTools = this.resolveTools(role, globalToolBindings, tenantToolBindings);
    const hasPersistedCapabilityBindings =
      globalCapabilityBindings.length > 0 || tenantCapabilityBindings.length > 0;
    const hasPersistedToolBindings =
      globalToolBindings.length > 0 || tenantToolBindings.length > 0;
    const capabilities = hasPersistedCapabilityBindings
      ? persistedCapabilities
      : normalizeCapabilities(effectiveRow?.capabilities, definition.defaultCapabilities);
    const tools = hasPersistedToolBindings ? persistedTools : DEFAULT_TOOL_BINDINGS[role];

    return {
      definition,
      runtime: {
        configId: effectiveRow?.id ?? null,
        systemPrompt: effectiveRow?.systemPrompt ?? "",
        llmModel: effectiveRow?.llmModel ?? definition.defaultModel,
        maxTokens: effectiveRow?.maxTokens ?? definition.defaultMaxTokens,
        capabilities,
        tools,
        isActive,
        source,
        bindingsSource:
          hasPersistedCapabilityBindings && hasPersistedToolBindings
            ? "persisted"
            : "bootstrap",
      },
      tenantAccess: {
        companyId,
        role,
        mode: tenantRow ? (tenantRow.isActive ? "OVERRIDE" : "DENIED") : "INHERITED",
        isActive,
        source: tenantRow ? "tenant" : "global",
      },
    };
  }

  private resolveCapabilities(
    role: AgentRuntimeRole,
    globalBindings: PersistedCapabilityBinding[],
    tenantBindings: PersistedCapabilityBinding[],
  ): string[] {
    return uniqueStrings(
      this.applyBindings(
        AGENT_DEFINITIONS[role].defaultCapabilities,
        globalBindings.map((binding) => ({
          key: binding.capability,
          isEnabled: binding.isEnabled,
        })),
        tenantBindings.map((binding) => ({
          key: binding.capability,
          isEnabled: binding.isEnabled,
        })),
      ),
    );
  }

  private resolveTools(
    role: AgentRuntimeRole,
    globalBindings: PersistedToolBinding[],
    tenantBindings: PersistedToolBinding[],
  ): RaiToolName[] {
    return this.applyBindings(
      DEFAULT_TOOL_BINDINGS[role],
      globalBindings.map((binding) => ({
        key: binding.toolName as RaiToolName,
        isEnabled: binding.isEnabled,
      })),
      tenantBindings.map((binding) => ({
        key: binding.toolName as RaiToolName,
        isEnabled: binding.isEnabled,
      })),
    ) as RaiToolName[];
  }

  private applyBindings<T extends string>(
    defaults: T[],
    globalBindings: Array<{ key: T; isEnabled: boolean }>,
    tenantBindings: Array<{ key: T; isEnabled: boolean }>,
  ): T[] {
    const effective = new Set<T>(defaults);

    for (const binding of globalBindings) {
      if (binding.isEnabled) {
        effective.add(binding.key);
      } else {
        effective.delete(binding.key);
      }
    }

    for (const binding of tenantBindings) {
      if (binding.isEnabled) {
        effective.add(binding.key);
      } else {
        effective.delete(binding.key);
      }
    }

    return [...effective];
  }
}
