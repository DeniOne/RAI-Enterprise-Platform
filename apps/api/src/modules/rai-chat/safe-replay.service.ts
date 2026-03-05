import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { RaiChatRequestDto } from "./dto/rai-chat.dto";
import { SupervisorAgent } from "./supervisor-agent.service";
import { randomUUID } from "crypto";

export interface ReplayInputDto {
  message: string;
  workspaceContext?: unknown;
}

export interface ReplayResultDto {
  replayTraceId: string;
  response: Awaited<ReturnType<SupervisorAgent["orchestrate"]>>;
}

@Injectable()
export class SafeReplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supervisorAgent: SupervisorAgent,
  ) {}

  async runReplay(
    traceId: string,
    companyId: string,
    userId?: string,
  ): Promise<ReplayResultDto> {
    const entry = await this.prisma.aiAuditEntry.findFirst({
      where: { traceId },
      orderBy: { createdAt: "asc" },
    });

    if (!entry) {
      throw new NotFoundException("TRACE_NOT_FOUND");
    }
    if (entry.companyId !== companyId) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }

    const meta = entry.metadata as { replayInput?: ReplayInputDto } | null;
    const replayInput = meta?.replayInput;
    if (!replayInput?.message) {
      throw new BadRequestException("REPLAY_INPUT_UNAVAILABLE");
    }

    const request: RaiChatRequestDto = {
      message: replayInput.message,
      workspaceContext: replayInput.workspaceContext as RaiChatRequestDto["workspaceContext"],
      clientTraceId: `tr_replay_${randomUUID()}`,
      threadId: `th_replay_${randomUUID()}`,
    };

    const response = await this.supervisorAgent.orchestrate(
      request,
      companyId,
      userId,
      { replayMode: true },
    );

    return {
      replayTraceId: response.traceId ?? request.clientTraceId!,
      response,
    };
  }
}
