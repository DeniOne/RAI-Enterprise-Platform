import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgentReputationService } from "./agent-reputation.service";
import { ReputationLevel } from "@rai/prisma-client";

describe("AgentReputationService", () => {
  let service: AgentReputationService;
  const agentReputationMock = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { agentReputation: agentReputationMock } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentReputationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AgentReputationService);
  });

  it("начисление баллов 0 -> 10, уровень STABLE", async () => {
    agentReputationMock.findUnique.mockResolvedValue(null);
    agentReputationMock.create.mockResolvedValue({
      id: "ar1",
      companyId: "c1",
      agentRole: "EconomistAgent",
      points: 0,
      reputationLevel: ReputationLevel.STABLE,
    });
    agentReputationMock.update.mockResolvedValue({
      id: "ar1",
      companyId: "c1",
      agentRole: "EconomistAgent",
      points: 10,
      reputationLevel: ReputationLevel.STABLE,
    });

    const result = await service.awardPoints("c1", "EconomistAgent", 10);

    expect(result.points).toBe(10);
    expect(result.reputationLevel).toBe(ReputationLevel.STABLE);
  });

  it("переход уровня 95 -> +10 -> 105, смена на TRUSTED", async () => {
    agentReputationMock.findUnique.mockResolvedValue({
      id: "ar2",
      companyId: "c1",
      agentRole: "AgronomAgent",
      points: 95,
      reputationLevel: ReputationLevel.STABLE,
    });
    agentReputationMock.update.mockResolvedValue({
      id: "ar2",
      companyId: "c1",
      agentRole: "AgronomAgent",
      points: 105,
      reputationLevel: ReputationLevel.TRUSTED,
    });

    const result = await service.awardPoints("c1", "AgronomAgent", 10);

    expect(result.points).toBe(105);
    expect(result.reputationLevel).toBe(ReputationLevel.TRUSTED);
  });

  it("штраф за BS Drift 110 -> -50 -> 60, понижение до STABLE", async () => {
    agentReputationMock.findUnique.mockResolvedValue({
      id: "ar3",
      companyId: "c1",
      agentRole: "KnowledgeAgent",
      points: 110,
      reputationLevel: ReputationLevel.TRUSTED,
    });
    agentReputationMock.update.mockResolvedValue({
      id: "ar3",
      companyId: "c1",
      agentRole: "KnowledgeAgent",
      points: 60,
      reputationLevel: ReputationLevel.STABLE,
    });

    const result = await service.deductPoints("c1", "KnowledgeAgent", 50);

    expect(result.points).toBe(60);
    expect(result.reputationLevel).toBe(ReputationLevel.STABLE);
  });

  it("изоляция по companyId: getByCompanyAndAgent возвращает только свою запись", async () => {
    agentReputationMock.findUnique.mockResolvedValue({
      id: "ar4",
      companyId: "cA",
      agentRole: "default",
      points: 42,
      reputationLevel: ReputationLevel.STABLE,
    });

    const result = await service.getByCompanyAndAgent("cA", "default");

    expect(agentReputationMock.findUnique).toHaveBeenCalledWith({
      where: {
        agent_reputation_company_role_unique: {
          companyId: "cA",
          agentRole: "default",
        },
      },
    });
    expect(result).toEqual({ points: 42, reputationLevel: ReputationLevel.STABLE });
  });
});
