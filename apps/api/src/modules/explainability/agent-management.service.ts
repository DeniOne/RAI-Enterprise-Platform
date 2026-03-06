import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import type { AgentConfiguration } from "@rai/prisma-client";
import type { AgentConfigItemDto, AgentConfigsResponseDto, UpsertAgentConfigDto } from "./dto/agent-config.dto";
import { AgentConfigGuardService } from "./agent-config-guard.service";

function toItemDto(row: AgentConfiguration): AgentConfigItemDto {
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

@Injectable()
export class AgentManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configGuard: AgentConfigGuardService,
  ) {}

  async getAgentConfigs(companyId: string): Promise<AgentConfigsResponseDto> {
    const [global, tenantOverrides] = await Promise.all([
      this.prisma.agentConfiguration.findMany({ where: { companyId: null } }),
      this.prisma.agentConfiguration.findMany({ where: { companyId } }),
    ]);
    return {
      global: global.map(toItemDto),
      tenantOverrides: tenantOverrides.map(toItemDto),
    };
  }

  async upsertAgentConfig(
    callerCompanyId: string,
    dto: UpsertAgentConfigDto,
    scope: "tenant" | "global",
  ): Promise<AgentConfigItemDto> {
    const evalResult = await this.configGuard.assertUpsertAllowed(callerCompanyId, dto);
    if (scope === "global") {
      // только глобальный конфиг — companyId null; право проверяется на уровне контроллера
    }
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
      const item = toItemDto(updated);
      await this.prisma.auditLog.create({
        data: {
          action: "AGENT_CONFIG_UPDATED",
          companyId: callerCompanyId,
          metadata: toAuditMetadata(item, { scope, evalResult }),
        },
      });
      return item;
    }
    const created = await this.prisma.agentConfiguration.create({
      data: {
        ...data,
        role: dto.role,
        companyId,
      },
    });
    const item = toItemDto(created);
    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_CREATED",
        companyId: callerCompanyId,
        metadata: toAuditMetadata(item, { scope, evalResult }),
      },
    });
    return item;
  }

  async toggleAgent(companyId: string, role: string, isActive: boolean): Promise<AgentConfigItemDto> {
    const override = await this.prisma.agentConfiguration.findUnique({
      where: { agent_config_role_company_unique: { role, companyId } },
    });
    if (override) {
      await this.configGuard.assertToggleAllowed(
        companyId,
        role,
        isActive,
        override.llmModel,
      );
      const updated = await this.prisma.agentConfiguration.update({
        where: { id: override.id },
        data: { isActive },
      });
      const item = toItemDto(updated);
      await this.prisma.auditLog.create({
        data: {
          action: "AGENT_CONFIG_TOGGLED",
          companyId,
          metadata: toAuditMetadata(item),
        },
      });
      return item;
    }
    const globalRow = await this.prisma.agentConfiguration.findUnique({
      where: { agent_config_role_company_unique: { role, companyId: null } },
    });
    if (!globalRow) {
      throw new ForbiddenException(`Agent role ${role} not found`);
    }
    await this.configGuard.assertToggleAllowed(
      companyId,
      role,
      isActive,
      globalRow.llmModel,
    );
    const created = await this.prisma.agentConfiguration.create({
      data: {
        name: globalRow.name,
        role: globalRow.role,
        systemPrompt: globalRow.systemPrompt,
        llmModel: globalRow.llmModel,
        maxTokens: globalRow.maxTokens,
        isActive,
        companyId,
        capabilities: (globalRow.capabilities as string[]) ?? [],
      },
    });
    const item = toItemDto(created);
    await this.prisma.auditLog.create({
      data: {
        action: "AGENT_CONFIG_TOGGLED",
        companyId,
        metadata: toAuditMetadata(item),
      },
    });
    return item;
  }
}
