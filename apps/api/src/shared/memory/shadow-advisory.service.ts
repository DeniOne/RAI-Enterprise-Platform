import { Inject, Injectable } from "@nestjs/common";
import type { AuditService } from "../audit/audit.service";
import { aggregateEngramScore } from "./engram-rules";
import type { EpisodicRetrievalService } from "./episodic-retrieval.service";

export interface AdvisoryExplainabilityFactor {
  name: string;
  value: number;
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}

export interface AdvisoryExplainability {
  traceId: string;
  confidence: number;
  why: string;
  factors: AdvisoryExplainabilityFactor[];
}

export interface ShadowAdvisoryRequest {
  companyId: string;
  embedding: number[];
  traceId: string;
  signalType: "VISION" | "SATELLITE" | "OPERATION";
  memoryType?: string;
}

export interface ShadowAdvisoryResponse {
  traceId: string;
  companyId: string;
  signalType: "VISION" | "SATELLITE" | "OPERATION";
  recommendation: "ALLOW" | "REVIEW" | "BLOCK";
  confidence: number;
  rationale: string;
  explainability: AdvisoryExplainability;
}

interface AdvisoryThresholds {
  confidenceReview: number;
  blockScore: number;
  allowScore: number;
}

const DEFAULT_THRESHOLDS: AdvisoryThresholds = {
  confidenceReview: 0.45,
  blockScore: -0.35,
  allowScore: 0.35,
};

@Injectable()
export class ShadowAdvisoryService {
  private readonly thresholdsCache = new Map<
    string,
    { value: AdvisoryThresholds; expiresAt: number }
  >();

  constructor(
    @Inject("EPISODIC_RETRIEVAL")
    private readonly retrieval: Pick<EpisodicRetrievalService, "retrieve">,
    @Inject("AUDIT_SERVICE")
    private readonly auditService: Pick<AuditService, "log" | "findAll">,
  ) {}

  async evaluate(
    request: ShadowAdvisoryRequest,
  ): Promise<ShadowAdvisoryResponse> {
    const retrievalResult = await this.retrieval.retrieve({
      companyId: request.companyId,
      embedding: request.embedding,
      memoryType: request.memoryType,
      traceId: request.traceId,
    });

    const aggregate = aggregateEngramScore(
      retrievalResult.items.map((i) => i.outcome),
    );
    const confidence = this.computeConfidence(
      retrievalResult.items.map((i) => i.confidence),
    );
    const thresholds = await this.resolveThresholds(request.companyId);
    const recommendation = this.decide(aggregate.score, confidence, thresholds);

    const explainability = this.buildExplainability({
      traceId: request.traceId,
      confidence,
      recommendation,
      aggregate,
      totalCases: retrievalResult.total,
    });

    const response: ShadowAdvisoryResponse = {
      traceId: request.traceId,
      companyId: request.companyId,
      signalType: request.signalType,
      recommendation,
      confidence,
      rationale: this.buildRationale(aggregate, retrievalResult.total),
      explainability,
    };

    await this.auditService.log({
      action: "SHADOW_ADVISORY_EVALUATED",
      companyId: request.companyId,
      metadata: {
        traceId: request.traceId,
        companyId: request.companyId,
        signalType: request.signalType,
        recommendation: response.recommendation,
        confidence: response.confidence,
        explainability: response.explainability,
        aggregate,
        totalCases: retrievalResult.total,
      },
    });

    return response;
  }

  private computeConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 0;
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    return Number(Math.max(0, Math.min(1, avg)).toFixed(4));
  }

  private decide(
    score: number,
    confidence: number,
    thresholds: AdvisoryThresholds,
  ): "ALLOW" | "REVIEW" | "BLOCK" {
    if (confidence < thresholds.confidenceReview) return "REVIEW";
    if (score <= thresholds.blockScore) return "BLOCK";
    if (score >= thresholds.allowScore) return "ALLOW";
    return "REVIEW";
  }

  private async resolveThresholds(
    companyId: string,
  ): Promise<AdvisoryThresholds> {
    const cached = this.thresholdsCache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    let resolved = { ...DEFAULT_THRESHOLDS };
    const findAll = this.auditService.findAll;
    if (typeof findAll === "function") {
      try {
        const response = await findAll.call(
          this.auditService,
          { action: "ADVISORY_TUNING_UPDATED" },
          { page: 1, limit: 100 },
        );
        const data = Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
        for (const log of data) {
          const metadata = log?.metadata;
          if (!metadata || String(metadata.companyId ?? "") !== companyId)
            continue;
          const thresholds = metadata.thresholds;
          if (!thresholds) continue;
          const candidate: AdvisoryThresholds = {
            confidenceReview: Number(thresholds.confidenceReview),
            blockScore: Number(thresholds.blockScore),
            allowScore: Number(thresholds.allowScore),
          };
          if (this.isValidThresholds(candidate)) {
            resolved = candidate;
            break;
          }
        }
      } catch {
        resolved = { ...DEFAULT_THRESHOLDS };
      }
    }

    this.thresholdsCache.set(companyId, {
      value: resolved,
      expiresAt: Date.now() + 60_000,
    });
    return resolved;
  }

  private isValidThresholds(value: AdvisoryThresholds): boolean {
    if (
      Number.isNaN(value.confidenceReview) ||
      Number.isNaN(value.blockScore) ||
      Number.isNaN(value.allowScore)
    ) {
      return false;
    }
    if (value.confidenceReview < 0 || value.confidenceReview > 1) {
      return false;
    }
    if (value.blockScore >= value.allowScore) {
      return false;
    }
    return true;
  }

  private buildRationale(
    aggregate: {
      positive: number;
      negative: number;
      unknown: number;
      score: number;
    },
    total: number,
  ): string {
    return `cases=${total}; positive=${aggregate.positive}; negative=${aggregate.negative}; unknown=${aggregate.unknown}; score=${aggregate.score}`;
  }

  private buildExplainability(input: {
    traceId: string;
    confidence: number;
    recommendation: "ALLOW" | "REVIEW" | "BLOCK";
    aggregate: {
      positive: number;
      negative: number;
      unknown: number;
      score: number;
    };
    totalCases: number;
  }): AdvisoryExplainability {
    return {
      traceId: input.traceId,
      confidence: input.confidence,
      why: this.buildWhy(
        input.recommendation,
        input.aggregate.score,
        input.totalCases,
      ),
      factors: [
        {
          name: "positiveCases",
          value: input.aggregate.positive,
          direction: "POSITIVE",
        },
        {
          name: "negativeCases",
          value: input.aggregate.negative,
          direction: "NEGATIVE",
        },
        {
          name: "unknownCases",
          value: input.aggregate.unknown,
          direction: "NEUTRAL",
        },
        {
          name: "aggregateScore",
          value: Number(input.aggregate.score.toFixed(4)),
          direction: this.scoreDirection(input.aggregate.score),
        },
        { name: "totalCases", value: input.totalCases, direction: "NEUTRAL" },
      ],
    };
  }

  private buildWhy(
    recommendation: "ALLOW" | "REVIEW" | "BLOCK",
    score: number,
    totalCases: number,
  ): string {
    return `recommendation=${recommendation}; score=${score.toFixed(4)}; totalCases=${totalCases}`;
  }

  private scoreDirection(score: number): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
    if (score > 0) return "POSITIVE";
    if (score < 0) return "NEGATIVE";
    return "NEUTRAL";
  }
}
