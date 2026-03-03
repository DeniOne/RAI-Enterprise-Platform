import { Inject, Injectable, Logger } from "@nestjs/common";
import { AuditService } from "../../shared/audit/audit.service";
import {
  MemoryAdapter,
  MemoryContext,
} from "../../shared/memory/memory-adapter.interface";
import { RaiChatMemoryPolicy } from "../../shared/memory/rai-chat-memory.policy";
import { buildTextEmbedding } from "../../shared/memory/signal-embedding.util";
import {
  SatelliteIndexType,
  SatelliteSource,
} from "../satellite/dto/satellite.dto";
import { SatelliteIngestionService } from "../satellite/satellite-ingestion.service";
import {
  ExternalAdvisoryDto,
  ExternalAdvisoryFeedbackDto,
  ExternalSignalDto,
  ExternalSignalKind,
  ExternalSignalSource,
  WeatherSignalMetric,
} from "./dto/rai-chat.dto";

interface ProcessExternalSignalsParams {
  companyId: string;
  traceId: string;
  threadId: string;
  signals?: ExternalSignalDto[];
  feedback?: ExternalAdvisoryFeedbackDto;
}

@Injectable()
export class ExternalSignalsService {
  private readonly logger = new Logger(ExternalSignalsService.name);

  constructor(
    private readonly auditService: AuditService,
    @Inject("MEMORY_ADAPTER")
    private readonly memoryAdapter: MemoryAdapter,
    private readonly satelliteIngestionService: SatelliteIngestionService,
  ) { }

  async process(params: ProcessExternalSignalsParams): Promise<{
    advisory?: ExternalAdvisoryDto;
    feedbackStored: boolean;
  }> {
    const signals = params.signals ?? [];
    let advisory: ExternalAdvisoryDto | undefined;

    if (signals.length > 0) {
      await this.ingestSignals(signals, params.companyId, params.traceId);
      advisory = this.buildAdvisory(signals, params.traceId);
      await this.auditService.log({
        action: "EXTERNAL_ADVISORY_GENERATED",
        companyId: params.companyId,
        metadata: {
          traceId: params.traceId,
          signalCount: signals.length,
          signalKinds: signals.map((signal) => signal.kind),
          advisory,
        },
      });
    }

    const feedbackStored = await this.persistFeedbackIfNeeded({
      companyId: params.companyId,
      traceId: params.traceId,
      threadId: params.threadId,
      advisory,
      feedback: params.feedback,
    });

    return { advisory, feedbackStored };
  }

  private async ingestSignals(
    signals: ExternalSignalDto[],
    companyId: string,
    traceId: string,
  ): Promise<void> {
    for (const signal of signals) {
      if (signal.kind === ExternalSignalKind.Ndvi) {
        await this.satelliteIngestionService.ingest(
          {
            id: signal.id,
            assetId: signal.entityRef,
            companyId,
            timestamp: signal.observedAt,
            indexType: SatelliteIndexType.NDVI,
            value: signal.value,
            source: this.mapSatelliteSource(signal.source),
            resolution: signal.resolution ?? 10,
            cloudCoverage: signal.cloudCoverage ?? 0,
            tileId: signal.geoRef,
            confidence: signal.confidence,
          },
          traceId,
        );
        continue;
      }

      await this.auditService.log({
        action: "EXTERNAL_SIGNAL_INGESTED",
        companyId,
        metadata: {
          traceId,
          signal: {
            id: signal.id,
            kind: signal.kind,
            source: signal.source,
            observedAt: signal.observedAt,
            entityRef: signal.entityRef,
            geoRef: signal.geoRef,
            value: signal.value,
            confidence: signal.confidence,
            provenance: signal.provenance,
            metric: signal.metric,
          },
        },
      });

      const content = this.describeSignal(signal);
      await this.memoryAdapter.appendInteraction(
        {
          companyId,
          traceId,
          metadata: {
            source: "external-signal",
            memoryType: "CONTEXT",
            signalId: signal.id,
            signalKind: signal.kind,
            provenance: signal.provenance,
            entityRef: signal.entityRef,
          },
        },
        {
          userMessage: content,
          agentResponse: "", // Сигналы не имеют ответа агента в этом контексте
          embedding: buildTextEmbedding(content),
        },
      );
    }
  }

  private async persistFeedbackIfNeeded(input: {
    companyId: string;
    traceId: string;
    threadId: string;
    advisory?: ExternalAdvisoryDto;
    feedback?: ExternalAdvisoryFeedbackDto;
  }): Promise<boolean> {
    if (!input.advisory || !input.feedback) {
      return false;
    }

    const content =
      `feedback=${input.feedback.decision}; advisory=${input.advisory.recommendation}; ` +
      `reason=${input.feedback.reason ?? "не указана"}; traceId=${input.traceId}`;

    await this.auditService.log({
      action: "EXTERNAL_ADVISORY_FEEDBACK_RECORDED",
      companyId: input.companyId,
      metadata: {
        traceId: input.traceId,
        advisoryTraceId: input.advisory.traceId,
        recommendation: input.advisory.recommendation,
        feedback: input.feedback,
      },
    });

    await this.memoryAdapter.appendInteraction(
      {
        companyId: input.companyId,
        traceId: input.traceId,
        sessionId: input.threadId,
        metadata: {
          source: "external-advisory-feedback",
          memoryType: "EPISODIC",
          advisoryTraceId: input.advisory.traceId,
          decision: input.feedback.decision,
          reason: input.feedback.reason ?? null,
          outcome:
            input.feedback.decision === "accept" ? "POSITIVE" : "NEGATIVE",
        },
      },
      {
        userMessage: content,
        agentResponse: "",
        embedding: buildTextEmbedding(content),
      },
    );

    this.logger.debug(
      `external_feedback status=stored companyId=${input.companyId} traceId=${input.traceId} decision=${input.feedback.decision}`,
    );
    return true;
  }

  private buildAdvisory(
    signals: ExternalSignalDto[],
    traceId: string,
  ): ExternalAdvisoryDto {
    let score = 0;
    const factors: ExternalAdvisoryDto["explainability"]["factors"] = [];

    for (const signal of signals) {
      if (signal.kind === ExternalSignalKind.Ndvi) {
        score += (signal.value - 0.5) * 2;
        factors.push({
          name: "ndvi",
          value: signal.value,
          direction:
            signal.value >= 0.55
              ? "POSITIVE"
              : signal.value <= 0.35
                ? "NEGATIVE"
                : "NEUTRAL",
        });
        factors.push({
          name: "ndviConfidence",
          value: signal.confidence,
          direction: "NEUTRAL",
        });
        continue;
      }

      const weatherImpact = this.computeWeatherImpact(signal);
      score += weatherImpact.scoreDelta;
      factors.push({
        name: `weather:${signal.metric ?? "generic"}`,
        value: signal.value,
        direction: weatherImpact.direction,
      });
      factors.push({
        name: "weatherConfidence",
        value: signal.confidence,
        direction: "NEUTRAL",
      });
    }

    const normalizedScore = Number(Math.max(-1, Math.min(1, score)).toFixed(4));
    const confidence = Number(
      (
        signals.reduce((acc, signal) => acc + signal.confidence, 0) /
        Math.max(signals.length, 1)
      ).toFixed(4),
    );
    const recommendation = normalizedScore >= 0.2 ? "ALLOW" : "REVIEW";

    return {
      traceId,
      recommendation,
      confidence,
      summary:
        recommendation === "ALLOW"
          ? "Внешние сигналы не требуют немедленного вмешательства."
          : "Внешние сигналы требуют проверки и подтверждения человеком.",
      explainability: {
        traceId,
        why: this.buildWhy(signals, normalizedScore),
        factors,
        sources: signals.map((signal) => ({
          kind: signal.kind,
          source: signal.source,
          observedAt: signal.observedAt,
          entityRef: signal.entityRef,
          provenance: signal.provenance,
        })),
      },
    };
  }

  private buildWhy(signals: ExternalSignalDto[], score: number): string {
    const hasNdviDrop = signals.some(
      (signal) =>
        signal.kind === ExternalSignalKind.Ndvi && Number(signal.value) <= 0.35,
    );
    const hasWeatherRisk = signals.some(
      (signal) =>
        signal.kind === ExternalSignalKind.Weather &&
        this.computeWeatherImpact(signal).direction === "NEGATIVE",
    );

    return [
      `score=${score.toFixed(4)}`,
      hasNdviDrop ? "NDVI указывает на просадку" : "критичной просадки NDVI нет",
      hasWeatherRisk ? "погода добавляет риск" : "погода без критичного риска",
    ].join("; ");
  }

  private computeWeatherImpact(signal: ExternalSignalDto): {
    scoreDelta: number;
    direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  } {
    if (signal.metric === WeatherSignalMetric.PrecipitationMm) {
      if (signal.value >= 25) {
        return { scoreDelta: -0.45, direction: "NEGATIVE" };
      }
      if (signal.value <= 5) {
        return { scoreDelta: 0.1, direction: "NEUTRAL" };
      }
    }

    if (signal.metric === WeatherSignalMetric.TemperatureC) {
      if (signal.value >= 35 || signal.value <= -5) {
        return { scoreDelta: -0.35, direction: "NEGATIVE" };
      }
      if (signal.value >= 10 && signal.value <= 26) {
        return { scoreDelta: 0.15, direction: "POSITIVE" };
      }
    }

    return { scoreDelta: -0.05, direction: "NEUTRAL" };
  }

  private mapSatelliteSource(source: ExternalSignalSource) {
    if (source === ExternalSignalSource.Landsat8) return SatelliteSource.LANDSAT8;
    if (source === ExternalSignalSource.Landsat9) return SatelliteSource.LANDSAT9;
    return SatelliteSource.SENTINEL2;
  }

  private describeSignal(signal: ExternalSignalDto): string {
    return [
      `signal=${signal.kind}`,
      `source=${signal.source}`,
      `entity=${signal.entityRef}`,
      `value=${signal.value}`,
      `confidence=${signal.confidence}`,
      `provenance=${signal.provenance}`,
    ].join("; ");
  }
}
