import { BadRequestException, Controller, Get, Patch, Post, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { Roles } from "../../shared/auth/roles.decorator";
import { UserRole } from "@rai/prisma-client";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { AgentManagementService } from "./agent-management.service";
import {
  AgentConfigsResponseDto,
  UpsertAgentConfigDtoSchema,
  type AgentConfigItemDto,
} from "./dto/agent-config.dto";

@Controller("rai/agents")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.AGRONOMIST, UserRole.CFO, UserRole.CLIENT_ADMIN)
export class AgentsConfigController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly agentManagement: AgentManagementService,
  ) { }

  @Get("config")
  async getConfig(): Promise<AgentConfigsResponseDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.agentManagement.getAgentConfigs(companyId);
  }

  @Post("config")
  async upsertConfig(
    @Body() body: unknown,
    @Query("scope") scope?: string,
  ): Promise<AgentConfigItemDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsed = UpsertAgentConfigDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    const scopeVal = scope === "global" ? "global" : "tenant";
    if (scopeVal === "global") {
      // опционально: проверять супер-админ и т.п.
    }
    return this.agentManagement.upsertAgentConfig(companyId, parsed.data, scopeVal);
  }

  @Patch("config/toggle")
  async toggleAgent(
    @Body() body: { role: string; isActive: boolean },
  ): Promise<AgentConfigItemDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (typeof body?.role !== "string" || typeof body?.isActive !== "boolean") {
      throw new BadRequestException("body: { role: string, isActive: boolean } required");
    }
    return this.agentManagement.toggleAgent(companyId, body.role, body.isActive);
  }
}
