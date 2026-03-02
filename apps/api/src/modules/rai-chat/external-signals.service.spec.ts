import { Test, TestingModule } from "@nestjs/testing";
import { ExternalSignalsService } from "./external-signals.service";
import { AuditService } from "../../shared/audit/audit.service";
import { MemoryManager } from "../../shared/memory/memory-manager.service";
import { SatelliteIngestionService } from "../satellite/satellite-ingestion.service";
import {
  ExternalSignalKind,
  ExternalSignalSource,
  WeatherSignalMetric,
} from "./dto/rai-chat.dto";

describe("ExternalSignalsService", () => {
  let service: ExternalSignalsService;
  const auditServiceMock = {
    log: jest.fn().mockResolvedValue(undefined),
  };
  const memoryManagerMock = {
    store: jest.fn().mockResolvedValue(undefined),
  };
  const satelliteIngestionMock = {
    ingest: jest.fn().mockResolvedValue({ status: "accepted", traceId: "trace-1" }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalSignalsService,
        { provide: AuditService, useValue: auditServiceMock },
        { provide: MemoryManager, useValue: memoryManagerMock },
        { provide: SatelliteIngestionService, useValue: satelliteIngestionMock },
      ],
    }).compile();

    service = module.get(ExternalSignalsService);
  });

  it("формирует advisory с explainability из NDVI и погоды", async () => {
    const result = await service.process({
      companyId: "company-1",
      traceId: "trace-1",
      threadId: "thread-1",
      signals: [
        {
          id: "sig-ndvi-1",
          kind: ExternalSignalKind.Ndvi,
          source: ExternalSignalSource.Sentinel2,
          observedAt: "2026-03-02T10:00:00.000Z",
          entityRef: "field-1",
          value: 0.31,
          confidence: 0.82,
          provenance: "sentinel-pass",
          resolution: 10,
          cloudCoverage: 0.12,
        },
        {
          id: "sig-weather-1",
          kind: ExternalSignalKind.Weather,
          source: ExternalSignalSource.OpenWeather,
          observedAt: "2026-03-02T11:00:00.000Z",
          entityRef: "field-1",
          value: 32,
          confidence: 0.74,
          provenance: "weather-api",
          metric: WeatherSignalMetric.PrecipitationMm,
        },
      ],
    });

    expect(result.advisory).toEqual(
      expect.objectContaining({
        traceId: "trace-1",
        recommendation: "REVIEW",
      }),
    );
    expect(result.advisory?.explainability.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ndvi" }),
        expect.objectContaining({ name: "weather:precipitation_mm" }),
      ]),
    );
    expect(satelliteIngestionMock.ingest).toHaveBeenCalled();
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EXTERNAL_SIGNAL_INGESTED",
        companyId: "company-1",
      }),
    );
  });

  it("пишет feedback в audit и episodic memory", async () => {
    const result = await service.process({
      companyId: "company-1",
      traceId: "trace-2",
      threadId: "thread-2",
      signals: [
        {
          id: "sig-weather-2",
          kind: ExternalSignalKind.Weather,
          source: ExternalSignalSource.OpenWeather,
          observedAt: "2026-03-02T12:00:00.000Z",
          entityRef: "field-2",
          value: 40,
          confidence: 0.91,
          provenance: "weather-api",
          metric: WeatherSignalMetric.TemperatureC,
        },
      ],
      feedback: {
        decision: "reject",
        reason: "Проверили вручную, осадков не было",
      },
    });

    expect(result.feedbackStored).toBe(true);
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EXTERNAL_ADVISORY_FEEDBACK_RECORDED",
        companyId: "company-1",
      }),
    );
    expect(memoryManagerMock.store).toHaveBeenCalledWith(
      expect.stringContaining("feedback=reject"),
      expect.any(Array),
      expect.objectContaining({
        companyId: "company-1",
        sessionId: "thread-2",
        source: "external-advisory-feedback",
      }),
      expect.anything(),
    );
  });
});
