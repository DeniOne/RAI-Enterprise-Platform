// Knowledge Graph (Sprint 2)
﻿import { Test, TestingModule } from "@nestjs/testing";
import { KnowledgeGraphEventHandlerService } from "./knowledge-graph-event-handler.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("KnowledgeGraphEventHandlerService", () => {
  let service: KnowledgeGraphEventHandlerService;

  const prismaMock = {
    knowledgeNode: { createMany: jest.fn() },
    knowledgeEdge: { createMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeGraphEventHandlerService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(KnowledgeGraphEventHandlerService);
    jest.clearAllMocks();
  });

  it("should write nodes and edges", async () => {
    await service.handle({
      type: "KnowledgeGraphUpdated",
      traceId: "t1",
      companyId: "c1",
      occurredAt: new Date().toISOString(),
      nodes: [{ id: "n1", type: "CONCEPT" as any, label: "A", source: "MANUAL" as any }],
      edges: [{ fromNodeId: "n1", toNodeId: "n2", relation: "DEPENDS_ON" as any, confidence: 0.5, source: "MANUAL" as any }],
    });

    expect(prismaMock.knowledgeNode.createMany).toHaveBeenCalled();
    expect(prismaMock.knowledgeEdge.createMany).toHaveBeenCalled();
  });
});
