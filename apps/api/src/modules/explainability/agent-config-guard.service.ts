import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  GoldenTestRunnerService,
  type AgentEvalCandidate,
  type EvalRunResult,
} from "../rai-chat/eval/golden-test-runner.service";
import type { UpsertAgentConfigDto } from "./dto/agent-config.dto";
import {
  CanonicalAgentRuntimeRole,
  isAgentRuntimeRole,
} from "../rai-chat/agent-registry.service";
import {
  buildResponsibilityBinding,
  validateResponsibilityProfileCompatibility,
} from "../rai-chat/agent-contracts/agent-interaction-contracts";

const ROLE_TO_AGENT_NAME: Record<CanonicalAgentRuntimeRole, string> = {
  agronomist: "AgronomAgent",
  economist: "EconomistAgent",
  knowledge: "KnowledgeAgent",
  monitoring: "MonitoringAgent",
  crm_agent: "CrmAgent",
};

@Injectable()
export class AgentConfigGuardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goldenTestRunner: GoldenTestRunnerService,
  ) {}

  async assertUpsertAllowed(
    companyId: string,
    dto: UpsertAgentConfigDto,
  ): Promise<EvalRunResult | null> {
    const evalResult = await this.evaluateChange(companyId, dto);
    if (evalResult && evalResult.verdict !== "APPROVED") {
      throw new BadRequestException({
        code: "EVAL_GATE_FAILED",
        message: `Конфиг агента ${dto.role} не прошёл preflight eval.`,
        evalResult,
      });
    }
    return evalResult;
  }

  async evaluateChange(
    companyId: string,
    dto: UpsertAgentConfigDto,
    options?: { changeRequestId?: string | null },
  ): Promise<EvalRunResult | null> {
    await this.assertModelNotQuarantined(companyId, dto.llmModel);
    this.assertResponsibilityCompatibility(dto);
    const evalAgentName = this.resolveEvalAgentName(dto.role, dto.runtimeProfile);
    if (!evalAgentName) {
      return null;
    }
    const candidate = {
      role: dto.role,
      promptVersion: dto.systemPrompt,
      modelName: dto.llmModel,
      maxTokens: dto.maxTokens,
      capabilities: dto.capabilities,
      tools: dto.tools,
      isActive: dto.isActive ?? true,
    };
    return this.runEvalIfSupported(companyId, dto.role, evalAgentName, candidate, options);
  }

  async assertToggleAllowed(
    companyId: string,
    role: string,
    isActive: boolean,
    llmModel?: string,
  ): Promise<void> {
    if (!isActive) {
      return;
    }
    if (llmModel) {
      await this.assertModelNotQuarantined(companyId, llmModel);
    }
  }

  private async assertModelNotQuarantined(
    companyId: string,
    llmModel: string,
  ): Promise<void> {
    const quarantined = await this.prisma.modelVersion.findFirst({
      where: {
        companyId,
        name: llmModel,
        status: "QUARANTINED",
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (quarantined) {
      throw new BadRequestException({
        code: "MODEL_QUARANTINED",
        message: `Модель ${llmModel} находится в QUARANTINED и не может быть активирована в конфиге агента.`,
      });
    }
  }

  private async runEvalIfSupported(
    companyId: string,
    role: string,
    agentName: string,
    candidate: AgentEvalCandidate,
    options?: { changeRequestId?: string | null },
  ): Promise<EvalRunResult | null> {
    const goldenSet = this.goldenTestRunner.loadGoldenSet(agentName);
    if (goldenSet.length === 0) {
      return null;
    }
    const evalRun = this.goldenTestRunner.runEval(agentName, goldenSet, candidate);
    await this.prisma.evalRun.create({
      data: {
        id: evalRun.id,
        companyId,
        changeRequestId: options?.changeRequestId ?? null,
        role,
        agentName,
        promptVersion: evalRun.promptVersion,
        modelName: evalRun.modelName,
        candidateConfig: candidate as any,
        corpusSummary: evalRun.corpusSummary as any,
        caseResults: evalRun.caseResults as any,
        verdict: evalRun.verdict,
        verdictBasis: evalRun.verdictBasis as any,
      },
    });
    return evalRun;
  }

  private resolveEvalAgentName(
    role: string,
    runtimeProfile?: UpsertAgentConfigDto["runtimeProfile"],
  ): string | null {
    if (isAgentRuntimeRole(role)) {
      return ROLE_TO_AGENT_NAME[role];
    }
    const adapterRole = runtimeProfile?.executionAdapterRole;
    if (typeof adapterRole === "string" && isAgentRuntimeRole(adapterRole)) {
      return ROLE_TO_AGENT_NAME[adapterRole];
    }
    return null;
  }

  private assertResponsibilityCompatibility(dto: UpsertAgentConfigDto): void {
    const validation = validateResponsibilityProfileCompatibility({
      role: dto.role,
      tools: dto.tools,
      runtimeAdapterRole: dto.runtimeProfile?.executionAdapterRole,
      responsibilityBinding: buildResponsibilityBinding(
        dto.role,
        dto.runtimeProfile?.executionAdapterRole,
        dto.responsibilityBinding,
      ),
    });

    if (!validation.valid) {
      throw new BadRequestException({
        code: "RESPONSIBILITY_CONTRACT_FAILED",
        message: `Конфиг агента ${dto.role} нарушает responsibility contract.`,
        responsibility: validation,
      });
    }
  }
}
