import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

const INPUT_RATE_USD_PER_1M = 2.5;
const OUTPUT_RATE_USD_PER_1M = 10.0;

function costUsd(promptTokens: number, completionTokens: number): number {
  return (promptTokens * INPUT_RATE_USD_PER_1M) / 1e6 + (completionTokens * OUTPUT_RATE_USD_PER_1M) / 1e6;
}

export interface TenantCostDto {
  totalCostUsd: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  byModel: Array<{ modelId: string; costUsd: number; promptTokens: number; completionTokens: number }>;
}

export interface HotspotItemDto {
  traceId: string;
  costUsd: number;
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  modelId: string;
  createdAt: Date;
}

export interface CostHotspotsResponseDto {
  companyId: string;
  timeWindowMs: number;
  tenantCost: TenantCostDto;
  topByCost: HotspotItemDto[];
  topByDuration: HotspotItemDto[];
}

@Injectable()
export class CostAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantCost(companyId: string, timeWindowMs: number): Promise<TenantCostDto> {
    const from = new Date(Date.now() - timeWindowMs);
    const rows = await this.prisma.traceSummary.findMany({
      where: { companyId, createdAt: { gte: from } },
    });
    let totalCostUsd = 0;
    let totalPrompt = 0;
    let totalCompletion = 0;
    const byModelMap = new Map<string, { costUsd: number; promptTokens: number; completionTokens: number }>();
    for (const r of rows) {
      const c = costUsd(r.promptTokens, r.completionTokens);
      totalCostUsd += c;
      totalPrompt += r.promptTokens;
      totalCompletion += r.completionTokens;
      const key = r.modelId ?? "unknown";
      const cur = byModelMap.get(key) ?? { costUsd: 0, promptTokens: 0, completionTokens: 0 };
      byModelMap.set(key, {
        costUsd: cur.costUsd + c,
        promptTokens: cur.promptTokens + r.promptTokens,
        completionTokens: cur.completionTokens + r.completionTokens,
      });
    }
    const byModel = Array.from(byModelMap.entries()).map(([modelId, v]) => ({
      modelId,
      costUsd: v.costUsd,
      promptTokens: v.promptTokens,
      completionTokens: v.completionTokens,
    }));
    return { totalCostUsd, totalPromptTokens: totalPrompt, totalCompletionTokens: totalCompletion, byModel };
  }

  async getHotspots(
    companyId: string,
    timeWindowMs: number,
    limit: number = 10,
  ): Promise<{ topByCost: HotspotItemDto[]; topByDuration: HotspotItemDto[] }> {
    const from = new Date(Date.now() - timeWindowMs);
    const rows = await this.prisma.traceSummary.findMany({
      where: { companyId, createdAt: { gte: from } },
    });
    const items: HotspotItemDto[] = rows.map((r) => ({
      traceId: r.traceId,
      costUsd: costUsd(r.promptTokens, r.completionTokens),
      durationMs: r.durationMs,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      modelId: r.modelId ?? "unknown",
      createdAt: r.createdAt,
    }));
    const topByCost = [...items].sort((a, b) => b.costUsd - a.costUsd).slice(0, limit);
    const topByDuration = [...items].sort((a, b) => b.durationMs - a.durationMs).slice(0, limit);
    return { topByCost, topByDuration };
  }

  async getCostHotspots(
    companyId: string,
    timeWindowMs: number,
    limit: number = 10,
  ): Promise<CostHotspotsResponseDto> {
    const [tenantCost, { topByCost, topByDuration }] = await Promise.all([
      this.getTenantCost(companyId, timeWindowMs),
      this.getHotspots(companyId, timeWindowMs, limit),
    ]);
    return {
      companyId,
      timeWindowMs,
      tenantCost,
      topByCost,
      topByDuration,
    };
  }
}
