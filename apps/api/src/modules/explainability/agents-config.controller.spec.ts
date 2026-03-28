import { CanActivate, ExecutionContext, INestApplication, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { AgentsConfigController } from "./agents-config.controller";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { AgentManagementService } from "./agent-management.service";
import { AgentPromptGovernanceService } from "./agent-prompt-governance.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { RedisService } from "../../shared/redis/redis.service";

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
    getFutureAgentTemplates: jest.fn(),
    validateFutureAgentManifest: jest.fn(),
  };

  const promptGovernance = {
    createChangeRequest: jest.fn(),
    startCanary: jest.fn(),
    reviewCanary: jest.fn(),
    promoteApprovedChange: jest.fn(),
    rollbackPromotedChange: jest.fn(),
  };

  beforeAll(async () => {
    const idempotencyInterceptor = {
      intercept: jest.fn((_: unknown, next: { handle: () => unknown }) => next.handle()),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [AgentsConfigController],
      providers: [
        { provide: TenantContextService, useValue: tenantContext },
        { provide: AgentManagementService, useValue: agentManagement },
        { provide: AgentPromptGovernanceService, useValue: promptGovernance },
        { provide: RedisService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .overrideInterceptor(IdempotencyInterceptor)
      .useValue(idempotencyInterceptor)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
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
          kernel: {
            runtimeProfile: {
              profileId: "agronomist-runtime-v1",
              modelRoutingClass: "strong",
              provider: "openrouter",
              model: "openrouter/agronom",
              maxInputTokens: 8000,
              maxOutputTokens: 4000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            outputContract: {
              contractId: "agronom-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: true,
              fallbackMode: "deterministic_summary",
            },
            memoryPolicy: {
              policyId: "agronom-memory-v1",
              allowedScopes: ["tenant", "domain"],
              retrievalPolicy: "scoped_recall",
              writePolicy: "append_summary",
              sensitiveDataPolicy: "allow_masked_only",
            },
            governancePolicy: {
              policyId: "agronom-governance-v1",
              allowedAutonomyModes: ["advisory"],
              humanGateRules: ["write_tools_require_review"],
              criticalActionRules: ["no_critical_actions"],
              auditRequirements: ["trace"],
              fallbackRules: ["use_deterministic_summary_if_llm_unavailable"],
            },
            toolBindings: [
              {
                toolName: "generate_tech_map_draft",
                isEnabled: true,
                requiresHumanGate: true,
                riskLevel: "WRITE",
              },
            ],
            connectorBindings: [],
          },
        },
        {
          role: "marketer",
          agentName: "MarketerAgent",
          businessRole: "Campaign planning and governed recommendations",
          ownerDomain: "marketing",
          runtime: {
            configId: "cfg-marketer",
            source: "tenant",
            bindingsSource: "persisted",
            llmModel: "openai/gpt-4o-mini",
            maxTokens: 8000,
            systemPrompt: "You are marketer.",
            capabilities: ["MarketingToolsRegistry"],
            tools: [],
            isActive: true,
          },
          tenantAccess: {
            companyId: "company-a",
            mode: "OVERRIDE",
            source: "tenant",
            isActive: true,
          },
          kernel: {
            runtimeProfile: {
              profileId: "marketer-runtime-v1",
              modelRoutingClass: "fast",
              provider: "openrouter",
              model: "openai/gpt-4o-mini",
              executionAdapterRole: "knowledge",
              maxInputTokens: 8000,
              maxOutputTokens: 3000,
              temperature: 0.2,
              timeoutMs: 15000,
              supportsStreaming: false,
            },
            outputContract: {
              contractId: "marketer-v1",
              responseSchemaVersion: "v1",
              sections: ["summary", "recommendations", "evidence"],
              requiresEvidence: true,
              requiresDeterministicValidation: false,
              fallbackMode: "retrieval_summary",
            },
            memoryPolicy: {
              policyId: "marketer-memory-v1",
              allowedScopes: ["tenant", "domain"],
              retrievalPolicy: "scoped_recall",
              writePolicy: "append_summary",
              sensitiveDataPolicy: "mask",
            },
            governancePolicy: {
              policyId: "marketer-governance-v1",
              allowedAutonomyModes: ["advisory"],
              humanGateRules: ["campaign_launch_requires_human_gate"],
              criticalActionRules: ["no_unreviewed_writes"],
              auditRequirements: ["trace", "evidence"],
              fallbackRules: ["use_read_model_summary_if_llm_unavailable"],
            },
            toolBindings: [],
            connectorBindings: [],
          },
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/api/rai/agents/config")
      .expect(200);

    expect(response.body.agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "agronomist",
          runtime: expect.objectContaining({
            source: "tenant",
            bindingsSource: "persisted",
          }),
          tenantAccess: expect.objectContaining({
            mode: "OVERRIDE",
          }),
          kernel: expect.objectContaining({
            runtimeProfile: expect.objectContaining({
              provider: "openrouter",
              modelRoutingClass: "strong",
            }),
            outputContract: expect.objectContaining({
              contractId: "agronom-v1",
            }),
          }),
        }),
        expect.objectContaining({
          role: "marketer",
          ownerDomain: "marketing",
          kernel: expect.objectContaining({
            runtimeProfile: expect.objectContaining({
              executionAdapterRole: "knowledge",
              provider: "openrouter",
            }),
          }),
        }),
      ]),
    );
  });

  it("GET /api/rai/agents/onboarding/templates returns future-agent manifests", async () => {
    agentManagement.getFutureAgentTemplates.mockReturnValue([
      {
        templateId: "marketer",
        label: "Marketer",
        manifest: {
          role: "marketer",
          name: "MarketerAgent",
        },
        rolloutChecklist: ["Register prompt governance entry"],
      },
    ]);

    const response = await request(app.getHttpServer())
      .get("/api/rai/agents/onboarding/templates")
      .expect(200);

    expect(response.body.templates).toEqual([
      expect.objectContaining({
        templateId: "marketer",
        manifest: expect.objectContaining({
          role: "marketer",
        }),
      }),
    ]);
  });

  it("POST /api/rai/agents/onboarding/validate validates manifest contract", async () => {
    agentManagement.validateFutureAgentManifest.mockReturnValue({
      valid: true,
      normalizedRole: "marketer",
      compatibleWithRuntimeWithoutCodeChanges: true,
      missingRequirements: [],
      warnings: [],
    });

    const response = await request(app.getHttpServer())
      .post("/api/rai/agents/onboarding/validate")
      .send({
        role: "marketer",
        name: "MarketerAgent",
        kind: "domain_advisor",
        ownerDomain: "marketing",
        description: "Campaign planning agent",
        defaultAutonomyMode: "advisory",
        runtimeProfile: {
          profileId: "marketer-runtime-v1",
          modelRoutingClass: "fast",
          provider: "openrouter",
          model: "openai/gpt-4o-mini",
          executionAdapterRole: "knowledge",
          maxInputTokens: 8000,
          maxOutputTokens: 3000,
          temperature: 0.2,
          timeoutMs: 15000,
          supportsStreaming: false,
        },
        memoryPolicy: {
          policyId: "marketer-memory-v1",
          allowedScopes: ["tenant", "domain"],
          retrievalPolicy: "scoped_recall",
          writePolicy: "append_summary",
          sensitiveDataPolicy: "mask",
        },
        capabilityPolicy: {
          capabilities: ["MarketingToolsRegistry"],
          toolAccessMode: "allowlist",
          connectorAccessMode: "allowlist",
        },
        toolBindings: [],
        connectorBindings: [],
        outputContract: {
          contractId: "marketer-v1",
          responseSchemaVersion: "v1",
          sections: ["summary", "evidence"],
          requiresEvidence: true,
          requiresDeterministicValidation: false,
          fallbackMode: "retrieval_summary",
        },
        governancePolicy: {
          policyId: "marketer-governance-v1",
          allowedAutonomyModes: ["advisory"],
          humanGateRules: ["campaign_launch_requires_human_gate"],
          criticalActionRules: ["no_unreviewed_writes"],
          auditRequirements: ["trace", "evidence"],
          fallbackRules: ["use_read_model_summary_if_llm_unavailable"],
        },
      })
      .expect(201);

    expect(response.body).toMatchObject({
      valid: true,
      normalizedRole: "marketer",
    });
    expect(agentManagement.validateFutureAgentManifest).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "marketer",
      }),
    );
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
