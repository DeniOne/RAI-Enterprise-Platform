import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { RuntimeGovernanceEventType } from "@rai/prisma-client";
import {
  FallbackMode,
  FallbackReason,
  GovernanceRecommendationType,
} from "./runtime-governance-policy.types";

export interface RecordRuntimeGovernanceEventParams {
  companyId: string;
  traceId?: string | null;
  agentRole?: string | null;
  toolName?: string | null;
  eventType: RuntimeGovernanceEventType;
  fallbackReason?: FallbackReason | null;
  fallbackMode?: FallbackMode | null;
  recommendationType?: GovernanceRecommendationType | null;
  value?: number | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RuntimeGovernanceEventService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordRuntimeGovernanceEventParams): Promise<void> {
    await this.prisma.runtimeGovernanceEvent.create({
      data: {
        companyId: params.companyId,
        traceId: params.traceId ?? null,
        agentRole: params.agentRole ?? null,
        toolName: params.toolName ?? null,
        eventType: params.eventType,
        fallbackReason: params.fallbackReason ?? null,
        fallbackMode: params.fallbackMode ?? null,
        recommendationType: params.recommendationType ?? null,
        value: params.value ?? null,
        metadata: JSON.parse(JSON.stringify(params.metadata ?? {})),
      },
    });
  }

  async findRecent(params: {
    companyId: string;
    timeWindowMs: number;
    eventType?: RuntimeGovernanceEventType;
    agentRole?: string;
  }) {
    const from = new Date(Date.now() - params.timeWindowMs);
    return this.prisma.runtimeGovernanceEvent.findMany({
      where: {
        companyId: params.companyId,
        createdAt: { gte: from },
        eventType: params.eventType,
        agentRole: params.agentRole,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
