// Knowledge Graph (Sprint 2)
﻿import { Test, TestingModule } from "@nestjs/testing";
import { KnowledgeGraphQueryService } from "./knowledge-graph-query.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("KnowledgeGraphQueryService", () => {
  let service: KnowledgeGraphQueryService;
  const prismaMock = {
    knowledgeNode: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    knowledgeEdge: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeGraphQueryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(KnowledgeGraphQueryService);
    jest.clearAllMocks();
  });

  it("getNode should query by id", async () => {
    prismaMock.knowledgeNode.findUnique.mockResolvedValue({ id: "n1" });

    const result = await service.getNode("n1");

    expect(prismaMock.knowledgeNode.findUnique).toHaveBeenCalledWith({ where: { id: "n1" } });
    expect(result).toEqual({ id: "n1" });
  });

  it("getEdgesByNode should query edges by node id", async () => {
    prismaMock.knowledgeEdge.findMany.mockResolvedValue([{ id: "e1" }]);

    const result = await service.getEdgesByNode("n1");

    expect(prismaMock.knowledgeEdge.findMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: "e1" }]);
  });

  it("getSubgraph should return nodes and edges", async () => {
    prismaMock.knowledgeEdge.findMany.mockResolvedValue([
      { id: "e1", fromNodeId: "n1", toNodeId: "n2" },
    ]);
    prismaMock.knowledgeNode.findMany.mockResolvedValue([
      { id: "n1" },
      { id: "n2" },
    ]);

    const result = await service.getSubgraph("n1", 1);

    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
  });
});
