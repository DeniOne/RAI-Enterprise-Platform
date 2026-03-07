import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { Roles } from "../../shared/auth/roles.decorator";
import { UserRole } from "@rai/prisma-client";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentPromptGovernanceService } from "./agent-prompt-governance.service";
import {
  AgentConfigsResponseDto,
  CanaryReviewDtoSchema,
  RollbackChangeDtoSchema,
  UpsertAgentConfigDtoSchema,
  type AgentConfigChangeRequestDto,
} from "./dto/agent-config.dto";

@Controller("rai/agents")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.AGRONOMIST, UserRole.CFO, UserRole.CLIENT_ADMIN)
export class AgentsConfigController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly agentManagement: AgentManagementService,
    private readonly promptGovernance: AgentPromptGovernanceService,
  ) { }

  @Get("config")
  async getConfig(): Promise<AgentConfigsResponseDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.agentManagement.getAgentConfigs(companyId);
  }

  @Post("config/change-requests")
  async createChangeRequest(
    @Body() body: unknown,
    @Query("scope") scope?: string,
  ): Promise<AgentConfigChangeRequestDto> {
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
    return this.promptGovernance.createChangeRequest(companyId, parsed.data, scopeVal);
  }

  @Post("config/change-requests/:changeId/canary/start")
  async startCanary(
    @Param("changeId") changeId: string,
  ): Promise<AgentConfigChangeRequestDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.promptGovernance.startCanary(companyId, changeId);
  }

  @Post("config/change-requests/:changeId/canary/review")
  async reviewCanary(
    @Param("changeId") changeId: string,
    @Body() body: unknown,
  ): Promise<AgentConfigChangeRequestDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsed = CanaryReviewDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    return this.promptGovernance.reviewCanary(companyId, changeId, parsed.data);
  }

  @Post("config/change-requests/:changeId/promote")
  async promoteChange(
    @Param("changeId") changeId: string,
  ): Promise<AgentConfigChangeRequestDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.promptGovernance.promoteApprovedChange(companyId, changeId);
  }

  @Post("config/change-requests/:changeId/rollback")
  async rollbackChange(
    @Param("changeId") changeId: string,
    @Body() body: unknown,
  ): Promise<AgentConfigChangeRequestDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsed = RollbackChangeDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    return this.promptGovernance.rollbackPromotedChange(
      companyId,
      changeId,
      parsed.data.reason,
    );
  }
}
