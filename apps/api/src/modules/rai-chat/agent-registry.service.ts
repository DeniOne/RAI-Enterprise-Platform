import { Injectable } from "@nestjs/common";
import type { AgentConfiguration } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RaiToolName } from "./tools/rai-tools.types";
import { EffectiveAgentKernelEntry } from "./agent-platform/agent-platform.types";
import { buildKernelEntry } from "./agent-platform/agent-platform.defaults";

export type CanonicalAgentRuntimeRole =
  | "agronomist"
  | "economist"
  | "knowledge"
  | "monitoring"
  | "crm_agent"
  | "front_office_agent"
  | "contracts_agent";

export type AgentRuntimeRole = string;

export interface AgentDefinition {
  role: string;
  name: string;
  businessRole: string;
  ownerDomain: string;
  defaultModel: string;
  defaultMaxTokens: number;
  defaultCapabilities: string[];
}

export interface AgentTenantAccess {
  companyId: string;
  role: string;
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
    autonomyMode?: "advisory" | "hybrid" | "autonomous";
    runtimeProfile?: Record<string, unknown>;
    memoryPolicy?: Record<string, unknown>;
    outputContract?: Record<string, unknown>;
    governancePolicy?: Record<string, unknown>;
    isActive: boolean;
    source: "global" | "tenant";
    bindingsSource: "persisted" | "bootstrap";
  };
  tenantAccess: AgentTenantAccess;
}

const AGENT_DEFINITIONS: Record<CanonicalAgentRuntimeRole, AgentDefinition> = {
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
  crm_agent: {
    role: "crm_agent",
    name: "CrmAgent",
    businessRole: "CRM-операции по контрагентам, связям, карточкам и клиентским действиям",
    ownerDomain: "crm",
    defaultModel: "openai/gpt-5-mini",
    defaultMaxTokens: 8000,
    defaultCapabilities: ["CrmToolsRegistry"],
  },
  front_office_agent: {
    role: "front_office_agent",
    name: "FrontOfficeAgent",
    businessRole: "Коммуникационный ingress: журнал диалогов, классификация сообщений и эскалация в owner-домены",
    ownerDomain: "front_office",
    defaultModel: "openai/gpt-5-mini",
    defaultMaxTokens: 6000,
    defaultCapabilities: ["FrontOfficeToolsRegistry"],
  },
  contracts_agent: {
    role: "contracts_agent",
    name: "ContractsAgent",
    businessRole: "Коммерческие договоры, обязательства, исполнение, счета, платежи и аллокации",
    ownerDomain: "commerce",
    defaultModel: "openai/gpt-5.2",
    defaultMaxTokens: 10000,
    defaultCapabilities: ["ContractsToolsRegistry"],
  },
};

const AGENT_ROLES = Object.keys(AGENT_DEFINITIONS) as CanonicalAgentRuntimeRole[];

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

interface PersistedConnectorBinding {
  role: string;
  connectorName: string;
  accessMode: string;
  scopes: unknown;
  isEnabled: boolean;
}

export const DEFAULT_TOOL_BINDINGS: Record<CanonicalAgentRuntimeRole, RaiToolName[]> = {
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
  crm_agent: [
    RaiToolName.LookupCounterpartyByInn,
    RaiToolName.RegisterCounterparty,
    RaiToolName.CreateCounterpartyRelation,
    RaiToolName.CreateCrmAccount,
    RaiToolName.GetCrmAccountWorkspace,
    RaiToolName.UpdateCrmAccount,
    RaiToolName.CreateCrmContact,
    RaiToolName.UpdateCrmContact,
    RaiToolName.DeleteCrmContact,
    RaiToolName.CreateCrmInteraction,
    RaiToolName.UpdateCrmInteraction,
    RaiToolName.DeleteCrmInteraction,
    RaiToolName.CreateCrmObligation,
    RaiToolName.UpdateCrmObligation,
    RaiToolName.DeleteCrmObligation,
  ],
  front_office_agent: [
    RaiToolName.LogDialogMessage,
    RaiToolName.ClassifyDialogThread,
    RaiToolName.CreateFrontOfficeEscalation,
  ],
  contracts_agent: [
    RaiToolName.CreateCommerceContract,
    RaiToolName.ListCommerceContracts,
    RaiToolName.GetCommerceContract,
    RaiToolName.CreateCommerceObligation,
    RaiToolName.CreateFulfillmentEvent,
    RaiToolName.ListFulfillmentEvents,
    RaiToolName.CreateInvoiceFromFulfillment,
    RaiToolName.PostInvoice,
    RaiToolName.ListInvoices,
    RaiToolName.CreatePayment,
    RaiToolName.ConfirmPayment,
    RaiToolName.AllocatePayment,
    RaiToolName.GetArBalance,
  ],
};

export function isAgentRuntimeRole(value: string): value is CanonicalAgentRuntimeRole {
  return AGENT_ROLES.includes(value as CanonicalAgentRuntimeRole);
}

export function getDefaultToolsForRole(role: CanonicalAgentRuntimeRole): RaiToolName[] {
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
): Map<CanonicalAgentRuntimeRole, T[]> {
  const map = new Map<CanonicalAgentRuntimeRole, T[]>();
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

function indexByRole(rows: AgentConfiguration[]): Map<CanonicalAgentRuntimeRole, AgentConfiguration> {
  return new Map(
    rows
      .filter((row): row is AgentConfiguration & { role: CanonicalAgentRuntimeRole } =>
        AGENT_ROLES.includes(row.role as CanonicalAgentRuntimeRole),
      )
      .map((row) => [row.role as CanonicalAgentRuntimeRole, row]),
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
      globalConnectorBindings,
      tenantConnectorBindings,
    ] = await Promise.all([
      this.prisma.agentConfiguration.findMany({ where: { companyId: null } }),
      this.prisma.agentConfiguration.findMany({ where: { companyId } }),
      this.prisma.agentCapabilityBinding.findMany({ where: { companyId: null } }),
      this.prisma.agentCapabilityBinding.findMany({ where: { companyId } }),
      this.prisma.agentToolBinding.findMany({ where: { companyId: null } }),
      this.prisma.agentToolBinding.findMany({ where: { companyId } }),
      this.prisma.agentConnectorBinding.findMany({ where: { companyId: null } }),
      this.prisma.agentConnectorBinding.findMany({ where: { companyId } }),
    ]);

    const globalByRole = indexByRole(globalRows);
    const tenantByRole = indexByRole(tenantRows);
    const globalCapabilitiesByRole = indexBindingsByRole(globalCapabilityBindings);
    const tenantCapabilitiesByRole = indexBindingsByRole(tenantCapabilityBindings);
    const globalToolsByRole = indexBindingsByRole(globalToolBindings);
    const tenantToolsByRole = indexBindingsByRole(tenantToolBindings);
    const globalConnectorsByRole = indexBindingsByRole(globalConnectorBindings);
    const tenantConnectorsByRole = indexBindingsByRole(tenantConnectorBindings);

    const canonicalEntries = AGENT_ROLES.map((role) =>
      this.buildEntry(
        companyId,
        role,
        globalByRole.get(role),
        tenantByRole.get(role),
        globalCapabilitiesByRole.get(role) ?? [],
        tenantCapabilitiesByRole.get(role) ?? [],
        globalToolsByRole.get(role) ?? [],
        tenantToolsByRole.get(role) ?? [],
        globalConnectorsByRole.get(role) ?? [],
        tenantConnectorsByRole.get(role) ?? [],
      ),
    );
    const futureRoles = uniqueStrings(
      [...globalRows, ...tenantRows]
        .map((row) => row.role)
        .filter((role): role is string => typeof role === "string" && !isAgentRuntimeRole(role)),
    );
    const futureEntries = futureRoles
      .map((role) =>
        this.buildFutureEntry(
          companyId,
          role,
          globalRows.find((row) => row.role === role),
          tenantRows.find((row) => row.role === role),
          globalCapabilityBindings.filter((binding) => binding.role === role),
          tenantCapabilityBindings.filter((binding) => binding.role === role),
          globalToolBindings.filter((binding) => binding.role === role),
          tenantToolBindings.filter((binding) => binding.role === role),
        ),
      )
      .filter((entry): entry is EffectiveAgentRegistryEntry => Boolean(entry));

    return [...canonicalEntries, ...futureEntries];
  }

  async getEffectiveAgent(
    companyId: string,
    role: CanonicalAgentRuntimeRole,
  ): Promise<EffectiveAgentRegistryEntry | null> {
    const [
      globalRow,
      tenantRow,
      globalCapabilityBindings,
      tenantCapabilityBindings,
      globalToolBindings,
      tenantToolBindings,
      globalConnectorBindings,
      tenantConnectorBindings,
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
      this.prisma.agentConnectorBinding.findMany({
        where: { role, companyId: null },
      }),
      this.prisma.agentConnectorBinding.findMany({
        where: { role, companyId },
      }),
    ]);

    return this.buildEntry(
      companyId,
      role,
      globalRow ?? undefined,
      tenantRow ?? undefined,
      globalCapabilityBindings,
      tenantCapabilityBindings,
      globalToolBindings,
      tenantToolBindings,
      globalConnectorBindings,
      tenantConnectorBindings,
    );
  }

  async getEffectiveKernel(
    companyId: string,
    role: string,
  ): Promise<EffectiveAgentKernelEntry | null> {
    if (!isAgentRuntimeRole(role)) {
      return this.getEffectiveKernelForFutureRole(companyId, role);
    }
    const entry = await this.getEffectiveAgent(companyId, role);
    if (!entry) {
      return null;
    }

    const [globalConnectorBindings, tenantConnectorBindings] = await Promise.all([
      this.prisma.agentConnectorBinding.findMany({
        where: { role, companyId: null, isEnabled: true },
      }),
      this.prisma.agentConnectorBinding.findMany({
        where: { role, companyId, isEnabled: true },
      }),
    ]);

    return buildKernelEntry({
      role,
      name: entry.definition.name,
      ownerDomain: entry.definition.ownerDomain,
      description: entry.definition.businessRole,
      model: entry.runtime.llmModel,
      maxTokens: entry.runtime.maxTokens,
      systemPrompt:
        entry.runtime.systemPrompt ||
        `You are ${entry.definition.name}. Stay governed, concise, and evidence-grounded.`,
      isActive: entry.runtime.isActive,
      source: entry.runtime.source,
      bindingsSource: entry.runtime.bindingsSource,
      capabilities: entry.runtime.capabilities,
      enabledTools: entry.runtime.tools,
      autonomyMode: entry.runtime.autonomyMode,
      runtimeProfileOverride: entry.runtime.runtimeProfile,
      memoryPolicyOverride: entry.runtime.memoryPolicy,
      outputContractOverride: entry.runtime.outputContract,
      governancePolicyOverride: entry.runtime.governancePolicy,
      connectorBindingsOverride: [...globalConnectorBindings, ...tenantConnectorBindings].map(
        (binding) => ({
          connectorName: binding.connectorName,
          accessMode: (binding.accessMode as "read" | "write" | "governed_write") ?? "read",
          scopes: Array.isArray(binding.scopes) ? (binding.scopes as string[]) : [],
        }),
      ),
    });
  }

  private async getEffectiveKernelForFutureRole(
    companyId: string,
    role: string,
  ): Promise<EffectiveAgentKernelEntry | null> {
    const [globalRow, tenantRow, globalToolBindings, tenantToolBindings, globalConnectorBindings, tenantConnectorBindings] =
      await Promise.all([
        this.prisma.agentConfiguration.findUnique({
          where: { agent_config_role_company_unique: { role, companyId: null } },
        }),
        this.prisma.agentConfiguration.findUnique({
          where: { agent_config_role_company_unique: { role, companyId } },
        }),
        this.prisma.agentToolBinding.findMany({ where: { role, companyId: null, isEnabled: true } }),
        this.prisma.agentToolBinding.findMany({ where: { role, companyId, isEnabled: true } }),
        this.prisma.agentConnectorBinding.findMany({ where: { role, companyId: null, isEnabled: true } }),
        this.prisma.agentConnectorBinding.findMany({ where: { role, companyId, isEnabled: true } }),
      ]);

    const effectiveRow = tenantRow ?? globalRow;
    if (!effectiveRow) {
      return null;
    }

    const runtimeProfileOverride = this.asObject(effectiveRow.runtimeProfile);
    const adapterRole = this.resolveExecutionAdapterRole(runtimeProfileOverride);
    const enabledTools = [...globalToolBindings, ...tenantToolBindings].map((binding) => binding.toolName);

    return buildKernelEntry({
      role,
      baseRole: adapterRole,
      name: effectiveRow.name,
      ownerDomain: this.resolveFutureOwnerDomain(role, effectiveRow.capabilities, adapterRole),
      description: `${effectiveRow.name} runtime profile`,
      model: effectiveRow.llmModel,
      maxTokens: effectiveRow.maxTokens,
      systemPrompt:
        effectiveRow.systemPrompt || `You are ${effectiveRow.name}. Stay governed, concise, and evidence-grounded.`,
      isActive: effectiveRow.isActive,
      source: tenantRow ? "tenant" : "global",
      bindingsSource: enabledTools.length > 0 ? "persisted" : "bootstrap",
      capabilities: Array.isArray(effectiveRow.capabilities) ? (effectiveRow.capabilities as string[]) : [],
      enabledTools,
      autonomyMode:
        effectiveRow.autonomyMode === "hybrid" || effectiveRow.autonomyMode === "autonomous"
          ? effectiveRow.autonomyMode
          : "advisory",
      runtimeProfileOverride,
      memoryPolicyOverride: this.asObject(effectiveRow.memoryPolicy),
      outputContractOverride: this.asObject(effectiveRow.outputContract),
      governancePolicyOverride: this.asObject(effectiveRow.governancePolicy),
      connectorBindingsOverride: [...globalConnectorBindings, ...tenantConnectorBindings].map((binding) => ({
        connectorName: binding.connectorName,
        accessMode: (binding.accessMode as "read" | "write" | "governed_write") ?? "read",
        scopes: Array.isArray(binding.scopes) ? (binding.scopes as string[]) : [],
      })),
    });
  }

  private buildEntry(
    companyId: string,
    role: CanonicalAgentRuntimeRole,
    globalRow?: AgentConfiguration,
    tenantRow?: AgentConfiguration,
    globalCapabilityBindings: PersistedCapabilityBinding[] = [],
    tenantCapabilityBindings: PersistedCapabilityBinding[] = [],
    globalToolBindings: PersistedToolBinding[] = [],
    tenantToolBindings: PersistedToolBinding[] = [],
    _globalConnectorBindings: PersistedConnectorBinding[] = [],
    _tenantConnectorBindings: PersistedConnectorBinding[] = [],
  ): EffectiveAgentRegistryEntry {
    const definition = AGENT_DEFINITIONS[role];
    const effectiveRow = tenantRow ?? globalRow;
    const source = tenantRow ? "tenant" : "global";
    const isBootstrapOnly = !effectiveRow;
    const isActive = effectiveRow?.isActive ?? true;
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
        autonomyMode:
          effectiveRow?.autonomyMode === "hybrid" || effectiveRow?.autonomyMode === "autonomous"
            ? effectiveRow.autonomyMode
            : "advisory",
        runtimeProfile: this.asObject(effectiveRow?.runtimeProfile),
        memoryPolicy: this.asObject(effectiveRow?.memoryPolicy),
        outputContract: this.asObject(effectiveRow?.outputContract),
        governancePolicy: this.asObject(effectiveRow?.governancePolicy),
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
        mode: tenantRow
          ? tenantRow.isActive
            ? "OVERRIDE"
            : "DENIED"
          : isBootstrapOnly
            ? "INHERITED"
            : "INHERITED",
        isActive,
        source: tenantRow ? "tenant" : "global",
      },
    };
  }

  private buildFutureEntry(
    companyId: string,
    role: string,
    globalRow?: AgentConfiguration,
    tenantRow?: AgentConfiguration,
    globalCapabilityBindings: PersistedCapabilityBinding[] = [],
    tenantCapabilityBindings: PersistedCapabilityBinding[] = [],
    globalToolBindings: PersistedToolBinding[] = [],
    tenantToolBindings: PersistedToolBinding[] = [],
  ): EffectiveAgentRegistryEntry | null {
    const effectiveRow = tenantRow ?? globalRow;
    if (!effectiveRow) {
      return null;
    }
    const runtimeProfile = this.asObject(effectiveRow.runtimeProfile);
    const adapterRole = this.resolveExecutionAdapterRole(runtimeProfile);
    const source = tenantRow ? "tenant" : "global";
    const persistedCapabilities = this.applyBindings<string>(
      [],
      globalCapabilityBindings.map((binding) => ({
        key: binding.capability,
        isEnabled: binding.isEnabled,
      })),
      tenantCapabilityBindings.map((binding) => ({
        key: binding.capability,
        isEnabled: binding.isEnabled,
      })),
    );
    const persistedTools = this.applyBindings<RaiToolName>(
      [],
      globalToolBindings.map((binding) => ({
        key: binding.toolName as RaiToolName,
        isEnabled: binding.isEnabled,
      })),
      tenantToolBindings.map((binding) => ({
        key: binding.toolName as RaiToolName,
        isEnabled: binding.isEnabled,
      })),
    );
    const hasPersistedCapabilityBindings =
      globalCapabilityBindings.length > 0 || tenantCapabilityBindings.length > 0;
    const hasPersistedToolBindings =
      globalToolBindings.length > 0 || tenantToolBindings.length > 0;

    return {
      definition: {
        role,
        name: effectiveRow.name,
        businessRole: this.resolveFutureBusinessRole(role, effectiveRow),
        ownerDomain: this.resolveFutureOwnerDomain(role, effectiveRow.capabilities, adapterRole),
        defaultModel: effectiveRow.llmModel,
        defaultMaxTokens: effectiveRow.maxTokens,
        defaultCapabilities: Array.isArray(effectiveRow.capabilities)
          ? (effectiveRow.capabilities as string[])
          : [],
      },
      runtime: {
        configId: effectiveRow.id,
        systemPrompt: effectiveRow.systemPrompt ?? "",
        llmModel: effectiveRow.llmModel,
        maxTokens: effectiveRow.maxTokens,
        capabilities: hasPersistedCapabilityBindings
          ? uniqueStrings(persistedCapabilities)
          : Array.isArray(effectiveRow.capabilities)
            ? (effectiveRow.capabilities as string[])
            : [],
        tools: hasPersistedToolBindings ? persistedTools : [],
        autonomyMode:
          effectiveRow.autonomyMode === "hybrid" || effectiveRow.autonomyMode === "autonomous"
            ? effectiveRow.autonomyMode
            : "advisory",
        runtimeProfile,
        memoryPolicy: this.asObject(effectiveRow.memoryPolicy),
        outputContract: this.asObject(effectiveRow.outputContract),
        governancePolicy: this.asObject(effectiveRow.governancePolicy),
        isActive: effectiveRow.isActive ?? true,
        source,
        bindingsSource:
          hasPersistedCapabilityBindings || hasPersistedToolBindings ? "persisted" : "bootstrap",
      },
      tenantAccess: {
        companyId,
        role,
        mode: tenantRow ? (tenantRow.isActive ? "OVERRIDE" : "DENIED") : "INHERITED",
        isActive: effectiveRow.isActive ?? true,
        source,
      },
    };
  }

  private asObject(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }

  private resolveCapabilities(
    role: CanonicalAgentRuntimeRole,
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
    role: CanonicalAgentRuntimeRole,
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

  private resolveExecutionAdapterRole(
    runtimeProfile?: Record<string, unknown>,
  ): CanonicalAgentRuntimeRole {
    const candidate = runtimeProfile?.executionAdapterRole;
    return typeof candidate === "string" && isAgentRuntimeRole(candidate)
      ? candidate
      : "knowledge";
  }

  private resolveFutureOwnerDomain(
    role: string,
    capabilities: unknown,
    adapterRole: CanonicalAgentRuntimeRole,
  ): string {
    const firstCapability = Array.isArray(capabilities) ? capabilities.find((item) => typeof item === "string") : null;
    return typeof firstCapability === "string"
      ? firstCapability.replace(/ToolsRegistry$/, "").toLowerCase()
      : role.split("_")[0] || adapterRole;
  }

  private resolveFutureBusinessRole(role: string, row: AgentConfiguration): string {
    const outputContract = this.asObject(row.outputContract);
    const sections = Array.isArray(outputContract?.sections)
      ? (outputContract.sections as string[])
      : [];
    if (sections.length > 0) {
      return `${row.name}: ${sections.join(", ")}`;
    }
    return `${role} governed runtime role`;
  }
}
