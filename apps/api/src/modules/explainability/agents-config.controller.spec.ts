import { CanActivate, ExecutionContext, INestApplication, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { AgentsConfigController } from "./agents-config.controller";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentPromptGovernanceService } from "./agent-prompt-governance.service";

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: "u-test", companyId: "company-a", role: "ADMIN" };
    return true;
  }
}

class TestRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe("AgentsConfigController (HTTP)", () => {
  let app: INestApplication;

  const tenantContext = {
    getCompanyId: jest.fn(() => "company-a"),
  };

  const agentManagement = {
    getAgentConfigs: jest.fn(),
  };

  const promptGovernance = {
    createChangeRequest: jest.fn(),
    startCanary: jest.fn(),
    reviewCanary: jest.fn(),
    promoteApprovedChange: jest.fn(),
    rollbackPromotedChange: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AgentsConfigController],
      providers: [
        { provide: TenantContextService, useValue: tenantContext },
        { provide: AgentManagementService, useValue: agentManagement },
        { provide: AgentPromptGovernanceService, useValue: promptGovernance },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tenantContext.getCompanyId.mockReturnValue("company-a");
  });

  it("POST /api/rai/agents/config/change-requests создаёт governed change request", async () => {
    promptGovernance.createChangeRequest.mockResolvedValue({
      id: "change-1",
      role: "agronomist",
      scope: "TENANT",
      targetVersion: "version-1",
      status: "READY_FOR_CANARY",
      evalVerdict: "APPROVED",
      canaryStatus: "NOT_STARTED",
      rollbackStatus: "NOT_REQUIRED",
      productionDecision: "PENDING",
      requestedConfig: {
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "Prompt v2",
        llmModel: "gpt-4o",
        maxTokens: 1200,
        isActive: true,
        capabilities: ["AgroToolsRegistry"],
      },
      promotedAt: null,
      rolledBackAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/agents/config/change-requests?scope=tenant")
      .send({
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "Prompt v2",
        llmModel: "gpt-4o",
        maxTokens: 1200,
        capabilities: ["AgroToolsRegistry"],
      })
      .expect(201);

    expect(response.body.status).toBe("READY_FOR_CANARY");
    expect(promptGovernance.createChangeRequest).toHaveBeenCalledWith(
      "company-a",
      expect.objectContaining({
        role: "agronomist",
        llmModel: "gpt-4o",
      }),
      "tenant",
    );
  });

  it("GET /api/rai/agents/config отдаёт effective runtime-aware agents read model", async () => {
    agentManagement.getAgentConfigs.mockResolvedValue({
      global: [],
      tenantOverrides: [],
      agents: [
        {
          role: "agronomist",
          agentName: "AgronomAgent",
          businessRole: "Генерация DRAFT техкарт и агрономических рекомендаций",
          ownerDomain: "agro",
          runtime: {
            configId: "cfg-tenant",
            source: "tenant",
            bindingsSource: "persisted",
            llmModel: "gpt-4o",
            maxTokens: 8000,
            systemPrompt: "Prompt",
            capabilities: ["AgroToolsRegistry"],
            tools: ["generate_tech_map_draft"],
            isActive: true,
          },
          tenantAccess: {
            companyId: "company-a",
            mode: "OVERRIDE",
            source: "tenant",
            isActive: true,
          },
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/agents/config")
      .expect(200);

    expect(response.body.agents).toEqual([
      expect.objectContaining({
        role: "agronomist",
        runtime: expect.objectContaining({
          source: "tenant",
          bindingsSource: "persisted",
        }),
        tenantAccess: expect.objectContaining({
          mode: "OVERRIDE",
        }),
      }),
    ]);
  });

  it("POST /api/rai/agents/config/change-requests/:id/canary/review отражает degraded rollback outcome", async () => {
    promptGovernance.reviewCanary.mockResolvedValue({
      id: "change-1",
      role: "agronomist",
      scope: "TENANT",
      targetVersion: "version-1",
      status: "ROLLED_BACK",
      evalVerdict: "APPROVED",
      canaryStatus: "DEGRADED",
      rollbackStatus: "EXECUTED",
      productionDecision: "ROLLED_BACK",
      requestedConfig: {
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "Prompt v2",
        llmModel: "gpt-4o",
        maxTokens: 1200,
        isActive: true,
        capabilities: ["AgroToolsRegistry"],
      },
      promotedAt: null,
      rolledBackAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/agents/config/change-requests/change-1/canary/review")
      .send({
        baselineRejectionRate: 0.1,
        canaryRejectionRate: 0.2,
        sampleSize: 100,
      })
      .expect(201);

    expect(response.body.status).toBe("ROLLED_BACK");
    expect(response.body.canaryStatus).toBe("DEGRADED");
    expect(response.body.rollbackStatus).toBe("EXECUTED");
  });

  it("POST /api/rai/agents/config/change-requests/:id/promote не позволяет tenant-bypass через чужой companyId", async () => {
    promptGovernance.promoteApprovedChange.mockRejectedValue(
      new NotFoundException("Agent config change request not found."),
    );
    tenantContext.getCompanyId.mockReturnValue("company-b");

    await request(app.getHttpServer())
      .post("/api/rai/agents/config/change-requests/change-a/promote")
      .expect(404);

    expect(promptGovernance.promoteApprovedChange).toHaveBeenCalledWith("company-b", "change-a");
  });

  it("POST /api/rai/agents/config больше не выглядит как direct production write path", async () => {
    await request(app.getHttpServer())
      .post("/api/rai/agents/config")
      .send({
        name: "Agronom",
        role: "agronomist",
        systemPrompt: "Prompt v2",
        llmModel: "gpt-4o",
        maxTokens: 1200,
      })
      .expect(404);
  });

  it("PATCH /api/rai/agents/config/toggle больше не существует как legacy imperative disable path", async () => {
    await request(app.getHttpServer())
      .patch("/api/rai/agents/config/toggle")
      .send({
        role: "agronomist",
        isActive: false,
      })
      .expect(404);
  });
});
