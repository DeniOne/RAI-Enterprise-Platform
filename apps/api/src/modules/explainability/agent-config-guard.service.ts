import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  GoldenTestRunnerService,
  type AgentEvalCandidate,
  type EvalRunResult,
} from "../rai-chat/eval/golden-test-runner.service";
import type { UpsertAgentConfigDto } from "./dto/agent-config.dto";
import type { AgentRuntimeRole } from "../rai-chat/agent-registry.service";

const ROLE_TO_AGENT_NAME: Record<AgentRuntimeRole, string> = {
  agronomist: "AgronomAgent",
  economist: "EconomistAgent",
  knowledge: "KnowledgeAgent",
  monitoring: "MonitoringAgent",
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
    const candidate = {
      role: dto.role,
      promptVersion: dto.systemPrompt,
      modelName: dto.llmModel,
      maxTokens: dto.maxTokens,
      capabilities: dto.capabilities,
      tools: dto.tools,
      isActive: dto.isActive ?? true,
    };
    return this.runEvalIfSupported(companyId, dto.role, candidate, options);
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
    role: AgentRuntimeRole,
    candidate: AgentEvalCandidate,
    options?: { changeRequestId?: string | null },
  ): Promise<EvalRunResult | null> {
    const agentName = ROLE_TO_AGENT_NAME[role];
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
}
