import { Test, TestingModule } from "@nestjs/testing";
import { AgentScoreCardService } from "./agent-scorecard.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

describe("AgentScoreCardService", () => {
  let service: AgentScoreCardService;
  const prisma = {
    agentScoreCard: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        AgentScoreCardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(AgentScoreCardService);
  });

  it("saveScoreCard вызывает prisma.agentScoreCard.create", async () => {
    prisma.agentScoreCard.create.mockResolvedValue({ id: "sc1" });
    const data = {
      agentName: "AgronomAgent",
      promptVersion: "abc",
      modelVersion: "gpt-4o",
      periodFrom: new Date(),
      periodTo: new Date(),
      toolFailureRate: 0.01,
      hallucinationFlagRate: 0.02,
      avgConfidence: 0.9,
      avgLatencyMs: 500,
      avgTokensUsed: 1000,
      acceptanceRate: 0.85,
    };
    await service.saveScoreCard(data);
    expect(prisma.agentScoreCard.create).toHaveBeenCalledWith({ data });
  });

  it("getScoreCardByVersion вызывает findFirst с agentName и promptVersion", async () => {
    prisma.agentScoreCard.findFirst.mockResolvedValue({ id: "sc1" });
    await service.getScoreCardByVersion("AgronomAgent", "v1");
    expect(prisma.agentScoreCard.findFirst).toHaveBeenCalledWith({
      where: { agentName: "AgronomAgent", promptVersion: "v1" },
      orderBy: { createdAt: "desc" },
    });
  });
});
