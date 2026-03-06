import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  GoldenTestRunnerService,
  type EvalRunResult,
} from "../rai-chat/eval/golden-test-runner.service";
import type { UpsertAgentConfigDto } from "./dto/agent-config.dto";

const ROLE_TO_AGENT_NAME: Record<string, string> = {
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
    await this.assertModelNotQuarantined(companyId, dto.llmModel);
    return this.runEvalIfSupported(dto.role);
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

  private runEvalIfSupported(role: string): EvalRunResult | null {
    const agentName = ROLE_TO_AGENT_NAME[role];
    if (!agentName) {
      return null;
    }
    const goldenSet = this.goldenTestRunner.loadGoldenSet(agentName);
    if (goldenSet.length === 0) {
      return null;
    }
    const evalResult = this.goldenTestRunner.runEval(agentName, goldenSet);
    if (evalResult.verdict !== "APPROVED") {
      throw new BadRequestException({
        code: "EVAL_GATE_FAILED",
        message: `Конфиг агента ${role} не прошёл preflight eval.`,
        evalResult,
      });
    }
    return evalResult;
  }
}
