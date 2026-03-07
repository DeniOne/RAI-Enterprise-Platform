import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import type { AgentConfiguration } from "@rai/prisma-client";
import { RaiToolName } from "../rai-chat/tools/rai-tools.types";
import type {
  AgentConfigItemDto,
  AgentConfigsResponseDto,
  AgentRegistryItemDto,
  UpsertAgentConfigDto,
} from "./dto/agent-config.dto";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import {
  AgentRegistryService,
  getDefaultToolsForRole,
  type AgentRuntimeRole,
  isAgentRuntimeRole,
} from "../rai-chat/agent-registry.service";

function toItemDto(row: AgentConfiguration & { role: AgentRuntimeRole }): AgentConfigItemDto {
  const capabilities = Array.isArray(row.capabilities) ? (row.capabilities as string[]) : [];
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    systemPrompt: row.systemPrompt,
    llmModel: row.llmModel,
    maxTokens: row.maxTokens,
    isActive: row.isActive,
    companyId: row.companyId,
    capabilities,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toAuditMetadata(item: AgentConfigItemDto, extra?: Record<string, unknown>) {
  return {
    role: item.role,
    name: item.name,
    llmModel: item.llmModel,
    maxTokens: item.maxTokens,
    isActive: item.isActive,
    companyId: item.companyId,
    capabilities: item.capabilities,
    ...extra,
  };
}

function isCanonicalAgentConfig(
  row: AgentConfiguration,
): row is AgentConfiguration & { role: AgentRuntimeRole } {
  return isAgentRuntimeRole(row.role);
}

function assertCanonicalAgentConfig(
  row: AgentConfiguration,
): AgentConfiguration & { role: AgentRuntimeRole } {
  if (!isCanonicalAgentConfig(row)) {
    throw new ForbiddenException(
      `Agent role ${row.role} is outside canonical registry domain`,
    );
  }
  return row;
}

@Injectable()
export class AgentManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configGuard: AgentConfigGuardService,
    private readonly agentRegistry: AgentRegistryService,
  ) {}

  async getAgentConfigs(companyId: string): Promise<AgentConfigsResponseDto> {
    const [global, tenantOverrides, registry] = await Promise.all([
      this.prisma.agentConfiguration.findMany({ where: { companyId: null } }),
      this.prisma.agentConfiguration.findMany({ where: { companyId } }),
      this.agentRegistry.getRegistry(companyId),
    ]);
    return {
      global: global.filter(isCanonicalAgentConfig).map(toItemDto),
      tenantOverrides: tenantOverrides.filter(isCanonicalAgentConfig).map(toItemDto),
      agents: registry.map((entry): AgentRegistryItemDto => ({
        role: entry.definition.role,
        agentName: entry.definition.name,
        businessRole: entry.definition.businessRole,
        ownerDomain: entry.definition.ownerDomain,
        runtime: {
          configId: entry.runtime.configId,
          source: entry.runtime.source,
          bindingsSource: entry.runtime.bindingsSource,
          llmModel: entry.runtime.llmModel,
          maxTokens: entry.runtime.maxTokens,
          systemPrompt: entry.runtime.systemPrompt,
          capabilities: entry.runtime.capabilities,
          tools: entry.runtime.tools,
          isActive: entry.runtime.isActive,
        },
        tenantAccess: {
          companyId: entry.tenantAccess.companyId,
          mode: entry.tenantAccess.mode,
          source: entry.tenantAccess.source,
          isActive: entry.tenantAccess.isActive,
        },
      })),
    };
  }

  async upsertAgentConfig(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
  ): Promise<AgentConfigItemDto> {
    throw new BadRequestException(
      "Direct production config writes are forbidden. Use governed prompt-change workflow.",
    );
  }

  async getStoredConfigSnapshot(
    callerCompanyId: string,
    role: AgentRuntimeRole,
    scope: "tenant" | "global",
  ): Promise<UpsertAgentConfigDto | null> {
    const companyId = scope === "global" ? null : callerCompanyId;
    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: { role, companyId },
      },
    });
    if (!existing || !isCanonicalAgentConfig(existing)) {
      return null;
    }
    return {
      name: existing.name,
      role: existing.role,
      systemPrompt: existing.systemPrompt,
      llmModel: existing.llmModel,
      maxTokens: existing.maxTokens,
      isActive: existing.isActive,
      capabilities: Array.isArray(existing.capabilities)
        ? (existing.capabilities as string[])
        : [],
      tools: await this.getStoredToolBindings(role, companyId),
    };
  }

  async restoreStoredConfigSnapshot(
    callerCompanyId: string,
    role: AgentRuntimeRole,
    scope: "tenant" | "global",
    snapshot: UpsertAgentConfigDto | null,
  ): Promise<void> {
    const companyId = scope === "global" ? null : callerCompanyId;
    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: { role, companyId },
      },
    });

    if (!snapshot) {
      if (existing) {
        await this.prisma.agentConfiguration.delete({
          where: { id: existing.id },
        });
        await this.prisma.agentCapabilityBinding.deleteMany({
          where: { role, companyId },
        });
        await this.prisma.agentToolBinding.deleteMany({
          where: { role, companyId },
        });
      }
      return;
    }

    if (existing) {
      await this.prisma.agentConfiguration.update({
        where: { id: existing.id },
        data: {
          name: snapshot.name,
          systemPrompt: snapshot.systemPrompt,
          llmModel: snapshot.llmModel,
          maxTokens: snapshot.maxTokens,
          isActive: snapshot.isActive,
          capabilities: snapshot.capabilities,
        },
      });
      await this.syncPersistedBindings(callerCompanyId, snapshot, scope);
      return;
    }

    await this.prisma.agentConfiguration.create({
      data: {
        name: snapshot.name,
        role: snapshot.role,
        systemPrompt: snapshot.systemPrompt,
        llmModel: snapshot.llmModel,
        maxTokens: snapshot.maxTokens,
        isActive: snapshot.isActive,
        capabilities: snapshot.capabilities,
        companyId,
      },
    });
    await this.syncPersistedBindings(callerCompanyId, snapshot, scope);
  }

  async applyPromotedAgentConfig(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
    governanceMetadata?: Record<string, unknown>,
  ): Promise<AgentConfigItemDto> {
    const companyId = scope === "global" ? null : callerCompanyId;

    const existing = await this.prisma.agentConfiguration.findUnique({
      where: {
        agent_config_role_company_unique: { role: dto.role, companyId },
      },
    });

    const data = {
      name: dto.name,
      systemPrompt: dto.systemPrompt,
      llmModel: dto.llmModel,
      maxTokens: dto.maxTokens,
      isActive: dto.isActive ?? true,
      capabilities: dto.capabilities ?? [],
    };

    if (existing) {
      const updated = await this.prisma.agentConfiguration.update({
        where: { id: existing.id },
        data,
      });
      await this.syncPersistedBindings(callerCompanyId, dto, scope);
      const item = toItemDto(assertCanonicalAgentConfig(updated));
      await this.prisma.auditLog.create({
        data: {
          action: "AGENT_CONFIG_PROMOTED_UPDATE",
          companyId: callerCompanyId,
          metadata: toAuditMetadata(item, { scope, ...governanceMetadata }),
        },
      });
      await this.writeBindingsAudit(callerCompanyId, dto, scope, governanceMetadata);
      return item;
    }

    const created = await this.prisma.agentConfiguration.create({
      data: {
        ...data,
        role: dto.role,
        companyId,
      },
    });
    await this.syncPersistedBindings(callerCompanyId, dto, scope);
    const item = toItemDto(assertCanonicalAgentConfig(created));
    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_PROMOTED_CREATE",
        companyId: callerCompanyId,
        metadata: toAuditMetadata(item, { scope, ...governanceMetadata }),
      },
    });
    await this.writeBindingsAudit(callerCompanyId, dto, scope, governanceMetadata);
    return item;
  }

  private async syncPersistedBindings(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
  ): Promise<void> {
    const companyId = scope === "global" ? null : callerCompanyId;
    const capabilities = dto.capabilities ?? [];
    const tools = await this.resolveToolsForSync(dto, companyId);

    await this.prisma.agentCapabilityBinding.deleteMany({
      where: { role: dto.role, companyId },
    });
    if (capabilities.length > 0) {
      await this.prisma.agentCapabilityBinding.createMany({
        data: capabilities.map((capability) => ({
          role: dto.role,
          capability,
          companyId,
          isEnabled: true,
        })),
      });
    }

    await this.prisma.agentToolBinding.deleteMany({
      where: { role: dto.role, companyId },
    });
    if (tools.length > 0) {
      await this.prisma.agentToolBinding.createMany({
        data: tools.map((toolName) => ({
          role: dto.role,
          toolName,
          companyId,
          isEnabled: true,
        })),
      });
    }
  }

  private async writeBindingsAudit(
    companyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
    governanceMetadata?: Record<string, unknown>,
  ): Promise<void> {
    const bindingCompanyId = scope === "global" ? null : companyId;
    const resolvedTools = await this.resolveToolsForSync(dto, bindingCompanyId);
    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_BINDINGS_SYNCED",
        companyId,
        metadata: {
          role: dto.role,
          scope,
          capabilities: dto.capabilities ?? [],
          tools: resolvedTools,
          ...governanceMetadata,
        },
      },
    });
  }

  private async resolveToolsForSync(
    dto: UpsertAgentConfigDto,
    companyId: string | null,
  ): Promise<string[]> {
    if (dto.tools) {
      return dto.tools;
    }

    const existingBindings = await this.getStoredToolBindings(dto.role, companyId);
    if (existingBindings.length > 0) {
      return existingBindings;
    }

    // Backward-compatibility bootstrap only for legacy clients that do not send explicit tool bindings yet.
    return (dto.capabilities ?? []).length > 0 ? getDefaultToolsForRole(dto.role) : [];
  }

  private async getStoredToolBindings(
    role: AgentRuntimeRole,
    companyId: string | null,
  ): Promise<RaiToolName[]> {
    const rows = await this.prisma.agentToolBinding.findMany({
      where: { role, companyId, isEnabled: true },
      orderBy: { toolName: "asc" },
    });
    return rows.map((row) => row.toolName as RaiToolName);
  }
}
