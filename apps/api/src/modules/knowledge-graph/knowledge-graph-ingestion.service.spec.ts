// Knowledge Graph (Sprint 2)
﻿import { Test, TestingModule } from "@nestjs/testing";
import { KnowledgeGraphIngestionService } from "./knowledge-graph-ingestion.service";
import { KnowledgeGraphEventBus } from "./knowledge-graph.event-bus";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { BadRequestException } from "@nestjs/common";
import { KnowledgeGraphIngestionDto } from "./dto/knowledge-graph.dto";

describe("KnowledgeGraphIngestionService", () => {
  let service: KnowledgeGraphIngestionService;
  const eventBus = { publish: jest.fn() };
  const integrityGate = { validateKnowledgeGraphInput: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeGraphIngestionService,
        { provide: KnowledgeGraphEventBus, useValue: eventBus },
        { provide: IntegrityGateService, useValue: integrityGate },
      ],
    }).compile();

    service = module.get(KnowledgeGraphIngestionService);
    jest.clearAllMocks();
  });

  it("should publish event when input is valid", async () => {
    integrityGate.validateKnowledgeGraphInput.mockReturnValue({ ok: true, errors: [] });

    const dto: KnowledgeGraphIngestionDto = {
      nodes: [
        { id: "n1", type: "CONCEPT" as any, label: "A", source: "MANUAL" as any },
      ],
      edges: [],
    };

    const result = await service.ingest(dto, "company-1", "trace-1");

    expect(eventBus.publish).toHaveBeenCalled();
    expect(result).toEqual({ status: "accepted", traceId: "trace-1" });
  });

  it("should throw BadRequestException when input is invalid", async () => {
    integrityGate.validateKnowledgeGraphInput.mockReturnValue({
      ok: false,
      errors: ["node.id is required"],
    });

    const dto: KnowledgeGraphIngestionDto = { nodes: [], edges: [] };

    await expect(service.ingest(dto, "company-1", "trace-1")).rejects.toThrow(
      BadRequestException,
    );
  });
});
