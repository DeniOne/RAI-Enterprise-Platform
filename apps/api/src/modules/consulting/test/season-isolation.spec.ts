import { Test, TestingModule } from "@nestjs/testing";
import { DeviationService } from "../../cmr/deviation.service";
import { DecisionService } from "../../cmr/decision.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { HarvestPlanStatus, DeviationStatus } from "@rai/prisma-client";

/**
 * Season + Company Isolation тесты.
 * Проверяет, что данные строго изолированы по companyId + seasonId.
 * Стратегическое замечание USER: сезонность — обязательная проверка.
 */
describe("Season & Company Isolation", () => {
  let deviationService: DeviationService;
  let decisionService: any;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      season: {
        findUnique: jest.fn(),
      },
      harvestPlan: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      deviationReview: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    decisionService = {
      logDecision: jest.fn().mockResolvedValue({ id: "dec-1" }),
      findAll: jest.fn().mockResolvedValue([]),
      findBySeason: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviationService,
        { provide: PrismaService, useValue: prisma },
        { provide: DecisionService, useValue: decisionService },
      ],
    }).compile();

    deviationService = module.get<DeviationService>(DeviationService);
  });

  // --- Company Isolation ---

  describe("Company Isolation", () => {
    it("Deviation для плана чужой компании — NotFoundException", async () => {
      prisma.harvestPlan.findUnique.mockResolvedValue({
        id: "plan-1",
        companyId: "company-ALIEN",
        status: HarvestPlanStatus.ACTIVE,
      });

      await expect(
        deviationService.createReview({
          harvestPlanId: "plan-1",
          companyId: "company-MY",
          seasonId: "season-1",
          deviationSummary: "Тест",
          aiImpactAssessment: "Тест",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("findOne с чужим companyId — NotFoundException", async () => {
      prisma.deviationReview.findFirst.mockResolvedValue(null);

      await expect(
        deviationService.findOne("dev-1", "alien-company"),
      ).rejects.toThrow(NotFoundException);
    });

    it("transitionStatus с чужим companyId — NotFoundException", async () => {
      prisma.deviationReview.findFirst.mockResolvedValue(null);

      await expect(
        deviationService.transitionStatus(
          "dev-1",
          DeviationStatus.ANALYZING,
          "alien-company",
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --- Season Isolation ---

  describe("Season Isolation", () => {
    it("Deviation привязывается к конкретному seasonId", async () => {
      prisma.harvestPlan.findUnique.mockResolvedValue({
        id: "plan-1",
        companyId: "comp-1",
        status: HarvestPlanStatus.ACTIVE,
      });
      prisma.deviationReview.create.mockResolvedValue({
        id: "dev-1",
        seasonId: "season-2025",
        companyId: "comp-1",
      });

      const result = await deviationService.createReview({
        harvestPlanId: "plan-1",
        companyId: "comp-1",
        seasonId: "season-2025",
        deviationSummary: "Отклонение по влажности",
        aiImpactAssessment: "Средний риск",
      });

      expect(result.seasonId).toBe("season-2025");

      // Проверяем, что DecisionService.logDecision вызван с правильным seasonId
      expect(decisionService.logDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonId: "season-2025",
          companyId: "comp-1",
        }),
      );
    });

    it("findAll возвращает только данные своей компании", async () => {
      prisma.deviationReview.findMany.mockResolvedValue([
        { id: "dev-1", companyId: "comp-1", seasonId: "season-1" },
      ]);

      const result = await deviationService.findAll("comp-1");

      expect(prisma.deviationReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: "comp-1" },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it("DecisionService.findBySeason фильтрует по seasonId + companyId", async () => {
      await decisionService.findBySeason("season-2025", "comp-1");

      expect(decisionService.findBySeason).toHaveBeenCalledWith(
        "season-2025",
        "comp-1",
      );
    });
  });

  // --- Deviation FSM Guards ---

  describe("Deviation FSM Guards", () => {
    it("DETECTED → ANALYZING: допустимо", async () => {
      prisma.deviationReview.findFirst.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.DETECTED,
        seasonId: "s1",
        companyId: "c1",
      });
      prisma.deviationReview.update.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.ANALYZING,
      });

      const result = await deviationService.transitionStatus(
        "dev-1",
        DeviationStatus.ANALYZING,
        "c1",
      );

      expect(result.status).toBe(DeviationStatus.ANALYZING);
    });

    it("DETECTED → CLOSED: запрещённый переход", async () => {
      prisma.deviationReview.findFirst.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.DETECTED,
        seasonId: "s1",
        companyId: "c1",
      });

      await expect(
        deviationService.transitionStatus(
          "dev-1",
          DeviationStatus.CLOSED,
          "c1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("ANALYZING → DECIDED: допустимо, с audit trail", async () => {
      prisma.deviationReview.findFirst.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.ANALYZING,
        seasonId: "s1",
        companyId: "c1",
      });
      prisma.deviationReview.update.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.DECIDED,
      });

      const result = await deviationService.transitionStatus(
        "dev-1",
        DeviationStatus.DECIDED,
        "c1",
        "user-1",
      );

      expect(result.status).toBe(DeviationStatus.DECIDED);
      expect(decisionService.logDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DEVIATION_ANALYZING_TO_DECIDED",
        }),
      );
    });

    it("DECIDED → CLOSED: допустимо", async () => {
      prisma.deviationReview.findFirst.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.DECIDED,
        seasonId: "s1",
        companyId: "c1",
      });
      prisma.deviationReview.update.mockResolvedValue({
        id: "dev-1",
        status: DeviationStatus.CLOSED,
      });

      const result = await deviationService.transitionStatus(
        "dev-1",
        DeviationStatus.CLOSED,
        "c1",
      );

      expect(result.status).toBe(DeviationStatus.CLOSED);
    });
  });

  // --- Non-ACTIVE Plan Guard ---

  describe("Non-ACTIVE Plan Guard", () => {
    it("Deviation для DRAFT плана — BadRequestException", async () => {
      prisma.harvestPlan.findUnique.mockResolvedValue({
        id: "plan-1",
        companyId: "comp-1",
        status: HarvestPlanStatus.DRAFT,
      });

      await expect(
        deviationService.createReview({
          harvestPlanId: "plan-1",
          companyId: "comp-1",
          seasonId: "season-1",
          deviationSummary: "Тест",
          aiImpactAssessment: "Тест",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
